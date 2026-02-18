// src/stores/auth.ts
import { defineStore } from "pinia";
import {
  fetchUserProfile,
  type UserProfile,
  type AuthMeResponse,
} from "@/api/users";
import { api } from "@/api/http";

import {
  authMe,
  authLoginJson,
  authRegisterJson,
  authCheckEmailExists,
  authForgotPassword,
  authLogout,
} from "@/api/auth";

type LoginMode = "login" | "signup";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // /auth/me response shape (canonical)
    me: null as AuthMeResponse | null,

    loading: false,
    initialized: false,

    // De-dupe concurrent fetchMe() calls
    _fetchMePromise: null as Promise<AuthMeResponse> | null,

    // Full user profile from /api/users/me
    profile: null as UserProfile | null,

    // Onboarding modal state (hard-gated)
    onboardingOpen: false as boolean,

    // Login modal UI state
    loginModalOpen: false,
    loginRedirectTo: "/dashboard" as string,
    loginLoading: false,
    loginError: "" as string,
    loginMode: "login" as LoginMode,
    resetEmailSent: false,
  }),

  getters: {
    isAuthenticated: (state) => state.me?.authenticated === true,

    userEmail: (state) =>
      state.me?.authenticated === true ? state.me.email ?? null : null,

    userName: (state) => {
      if (state.me?.authenticated !== true) return "User";
      return state.me.full_name || state.me.email?.split("@")[0] || "User";
    },

    userRole: (state) =>
      state.me?.authenticated === true ? state.me.role ?? "" : "",

    avatarUrl: (state) =>
      state.me?.authenticated === true ? state.me.avatar_url ?? "" : "",

    billing: (state) =>
      state.me?.authenticated === true ? state.me.billing ?? null : null,

    isSubscribed(): boolean {
      return !!this.billing?.is_subscribed;
    },

    needsPaywall(): boolean {
      return !!this.billing?.needs_paywall;
    },

    profileComplete: (state): boolean => !!state.profile?.profile_complete,
  },

  actions: {
    openLoginModal(next: string = "/dashboard", mode: LoginMode = "login") {
      this.loginRedirectTo = next;
      this.loginMode = mode;
      this.loginModalOpen = true;
      this.loginError = "";
    },

    closeLoginModal() {
      this.loginModalOpen = false;
      this.loginError = "";
      this.loginMode = "login";
      this.resetEmailSent = false;
    },

    openOnboarding() {
      if (this.isAuthenticated && !this.profileComplete) {
        this.onboardingOpen = true;
      }
    },

    closeOnboarding() {
      if (this.profileComplete) {
        this.onboardingOpen = false;
      }
    },

    // ----------------------------
    // Forgot password
    // ----------------------------
    async requestPasswordReset(email: string): Promise<boolean> {
      this.loginLoading = true;
      this.loginError = "";

      const trimmed = (email || "").trim().toLowerCase();
      if (!trimmed) {
        this.loginError = "Please enter your email address first.";
        this.loginLoading = false;
        return false;
      }

      try {
        const res = await authForgotPassword(trimmed);
        if (!res.ok) {
          this.loginError = "Something went wrong. Please try again.";
          return false;
        }
        this.resetEmailSent = true;
        return true;
      } catch (err) {
        console.error("[auth] requestPasswordReset failed", err);
        this.loginError =
          "Unable to reach the server. Please check your connection and try again.";
        return false;
      } finally {
        this.loginLoading = false;
      }
    },

    // ----------------------------
    // Login via /auth/login-json
    // ----------------------------
    async loginWithPassword(email: string, password: string): Promise<boolean> {
      this.loginLoading = true;
      this.loginError = "";

      const trimmedEmail = (email || "").trim().toLowerCase();
      if (!trimmedEmail || !password) {
        this.loginError = "Please enter both email and password.";
        this.loginLoading = false;
        return false;
      }

      try {
        const res = await authLoginJson(trimmedEmail, password);

        if (!res.ok) {
          let message = "Login failed. Please check your credentials.";
          try {
            const payload = (await res.json()) as any;
            // Prioritize the message field from API if it exists (human-readable)
            if (payload?.message && typeof payload.message === "string") {
              message = payload.message;
            } else if (payload?.error === "invalid_credentials") {
              message = "Incorrect email or password.";
            } else if (payload?.error === "missing_credentials") {
              message = "Please enter both email and password.";
            } else if (typeof payload?.error === "string") {
              // Fallback: show error code only if no message is available
              message = payload.error;
            }
          } catch {
            // ignore parse errors
          }
          this.loginError = message;
          return false;
        }

        // ✅ Critical: only “succeed” if /auth/me confirms the session
        await this.fetchMe();

        if (!this.isAuthenticated) {
          this.loginError =
            "Login succeeded but the session was not established. (Session cookie not present.)";
          return false;
        }

        this.loginError = "";
        this.closeLoginModal();
        return true;
      } catch (err) {
        console.error("[auth] loginWithPassword failed", err);
        this.loginError =
          "Unable to reach the server. Please check your connection and try again.";
        return false;
      } finally {
        this.loginLoading = false;
      }
    },

    // ----------------------------
    // Signup via /auth/register-json
    // ----------------------------
    async registerWithPassword(email: string, password: string): Promise<boolean> {
      this.loginLoading = true;
      this.loginError = "";

      const trimmedEmail = (email || "").trim().toLowerCase();
      if (!trimmedEmail || !password) {
        this.loginError = "Please enter both email and password.";
        this.loginLoading = false;
        return false;
      }

      try {
        const exists = await this.checkEmailExists(trimmedEmail);
        if (exists) {
          this.loginMode = "login";
          this.loginError =
            "Looks like you already have an account with that email. Please sign in instead.";
          return false;
        }

        const res = await authRegisterJson(trimmedEmail, password);

        if (!res.ok) {
          let message = "Sign up failed. Please check your details and try again.";
          try {
            const payload = (await res.json()) as any;
            // Prioritize the message field from API if it exists (human-readable)
            if (payload?.message && typeof payload.message === "string") {
              message = payload.message;
            } else if (payload?.error === "email_exists" || res.status === 409) {
              this.loginMode = "login";
              message =
                "An account with that email already exists. Please sign in instead.";
            } else if (payload?.error === "password_policy_violation" || payload?.error === "password_too_weak") {
              message =
                "Password does not meet requirements. Please use at least 8 characters with a mix of letters, numbers, and special characters.";
            } else if (payload?.error === "missing_credentials") {
              message = "Please enter both email and password.";
            } else if (payload?.error === "invalid_signup") {
              // Use the message from API if available, otherwise show generic message
              message = payload?.message || "Invalid signup information. Please check your email and password.";
            } else if (typeof payload?.error === "string") {
              // Fallback: show error code only if no message is available
              message = payload.error;
            }
          } catch {
            // ignore parse errors
          }
          this.loginError = message;
          return false;
        }

        // ✅ Confirm session really exists
        await this.fetchMe();

        if (!this.isAuthenticated) {
          this.loginError =
            "Sign up succeeded but the session was not established. (Session cookie not present.)";
          return false;
        }

        this.loginError = "";
        this.loginMode = "login";
        this.closeLoginModal();
        return true;
      } catch (err) {
        console.error("[auth] registerWithPassword failed", err);
        this.loginError =
          "Unable to reach the server. Please check your connection and try again.";
        return false;
      } finally {
        this.loginLoading = false;
      }
    },

    async checkEmailExists(email: string): Promise<boolean> {
      const trimmed = (email || "").trim().toLowerCase();
      if (!trimmed) return false;

      try {
        return await authCheckEmailExists(trimmed);
      } catch (err) {
        console.error("[auth] checkEmailExists failed", err);
        return false;
      }
    },

    // ----------------------------
    // Session + profile load
    // ----------------------------
    async fetchMe(): Promise<AuthMeResponse> {
      // De-dupe concurrent calls
      if (this._fetchMePromise) return this._fetchMePromise;

      this.loading = true;

      this._fetchMePromise = (async () => {
        try {
          const me = await authMe();
          this.me = me;

          if (me.authenticated) {
            try {
              const profile = await fetchUserProfile();
              this.profile = profile;
              this.onboardingOpen = !profile.profile_complete;
            } catch (err) {
              console.error("[auth] fetchUserProfile failed", err);
              this.profile = null;
              this.onboardingOpen = false;
            }
          } else {
            this.profile = null;
            this.onboardingOpen = false;
          }

          return me;
        } catch (err) {
          console.error("[auth] fetchMe failed", err);
          const fallback: AuthMeResponse = { authenticated: false };
          this.me = fallback;
          this.profile = null;
          this.onboardingOpen = false;
          return fallback;
        } finally {
          this.loading = false;
          this.initialized = true;
          this._fetchMePromise = null;
        }
      })();

      return this._fetchMePromise;
    },

    async logout(): Promise<void> {
      try {
        await authLogout();
      } catch (err) {
        console.error("[auth] logout failed", err);
      }

      this.me = { authenticated: false };
      this.profile = null;
      this.onboardingOpen = false;
      this.loginModalOpen = false;
      this.loginError = "";
      this.loginMode = "login";
      this.initialized = true; // we now *know* they're logged out
    },

    async deleteAccount(): Promise<boolean> {
      try {
        await api<unknown>("/api/users/me", { method: "DELETE" });
      } catch (err) {
        console.error("[auth] deleteAccount failed", err);
      }

      await this.logout();
      return true;
    },
  },
});