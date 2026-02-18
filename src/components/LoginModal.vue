<!-- src/components/auth/LoginModal.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import landingLogo from "@/assets/source-logo-02.png";
import { AUTH_BASE } from "@/config/auth";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";

// Brand icons
import appleIcon from "@/assets/auth/apple-brands-solid-full.svg?url";
import googleIcon from "@/assets/auth/google-brands-solid-full.svg?url";
import microsoftIcon from "@/assets/auth/microsoft-brands-solid-full.svg?url";
import twitterIcon from "@/assets/auth/square-x-twitter-brands-solid-full.svg?url";

const auth = useAuthStore();
const router = useRouter();

const base = AUTH_BASE || "";

const email = ref("");
const password = ref("");
const showPassword = ref(false);

const localError = computed(() => auth.loginError || "");
const isOpen = computed(() => auth.loginModalOpen);
const loading = computed(() => auth.loginLoading);
const resetEmailSent = computed(() => auth.resetEmailSent);

// Mode comes from the store; we both *read* and *update* it
const mode = computed(() => auth.loginMode || "login");
const isSignup = computed(() => mode.value === "signup");

const borderColor = "#0b2d4f";

const socialProviders = [
  { id: "apple", label: "Apple", connection: "Apple", icon: appleIcon },
  {
    id: "google",
    label: "Google",
    connection: "google-oauth2",
    icon: googleIcon,
  },
  {
    id: "microsoft",
    label: "Microsoft",
    connection: "Microsoft",
    icon: microsoftIcon,
  },
  { id: "twitter", label: "Twitter", connection: "Twitter", icon: twitterIcon },
];

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && auth.loginModalOpen) {
    auth.closeLoginModal();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});

const close = () => {
  if (!loading.value) {
    auth.closeLoginModal();
  }
};

// Auto-detect mode based on whether the email already exists in our DB
const onEmailBlur = async () => {
  const trimmed = email.value.trim().toLowerCase();
  if (!trimmed) return;

  const exists = await auth.checkEmailExists(trimmed);
  auth.loginMode = exists ? "login" : "signup";
};

// Explicit toggles
const switchToSignup = () => {
  auth.loginMode = "signup";
  auth.loginError = "";
};

const switchToLogin = () => {
  auth.loginMode = "login";
  auth.loginError = "";
  auth.resetEmailSent = false;
};

const forgotPassword = async () => {
  await auth.requestPasswordReset(email.value);
};

const backToSignIn = () => {
  auth.resetEmailSent = false;
  auth.loginError = "";
};

const submit = async () => {
  if (!email.value || !password.value) {
    auth.loginError = "Please enter both email and password.";
    return;
  }

  let ok = false;

  if (isSignup.value) {
    ok = await auth.registerWithPassword(email.value, password.value);
  } else {
    ok = await auth.loginWithPassword(email.value, password.value);
  }

  if (!ok) return;

  const target = auth.loginRedirectTo || "/dashboard";
  auth.closeLoginModal();
  router.push(target);
};

// SSO via Auth0: send user to /auth/login with connection + next
const startSso = (connection: string) => {
  const next = auth.loginRedirectTo || "/dashboard";
  const params = new URLSearchParams({ next, connection });
  window.location.href = `${base}/auth/login?${params.toString()}`;
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <!-- Click outside to close -->
      <div class="absolute inset-0" @click="close" />

      <div
        class="relative z-10 w-full max-w-md rounded-2xl bg-white px-6 py-6 sm:px-8 sm:py-8 shadow-[0_24px_70px_rgba(11,45,80,0.18)]"
      >
        <!-- Header: centered logo -->
        <div class="relative flex items-center justify-center">
          <img :src="landingLogo" :alt="`${BRAND.name} logo`" class="h-20 sm:h-24 md:h-28 w-auto" />
        </div>

        <!-- Title -->
        <div class="mt-5 flex w-full items-center justify-center">
          <p class="text-[24px] font-semibold text-[#0b2d4f]">
            {{ isSignup ? "Create your account" : "Sign in" }}
          </p>
        </div>

        <!-- Social login section -->
        <div class="mt-6 flex w-full justify-center">
          <div class="flex w-full max-w-[260px] items-center justify-between">
            <button
              v-for="p in socialProviders"
              :key="p.id"
              type="button"
              class="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white shadow-sm hover:bg-slate-50 cursor-pointer"
              :style="{ borderColor: borderColor }"
              @click="startSso(p.connection)"
            >
              <img :src="p.icon" :alt="p.label" class="h-9 w-9" />
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div class="mt-5 flex items-center gap-3 text-xs text-slate-400">
          <div class="h-px flex-1 bg-slate-200" />
          <span>OR</span>
          <div class="h-px flex-1 bg-slate-200" />
        </div>

        <!-- Reset email sent confirmation -->
        <div v-if="resetEmailSent" class="mt-6 text-center space-y-4">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#24b39b]/10">
            <svg class="h-6 w-6 text-[#24b39b]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p class="text-sm font-medium text-[#0b2d4f]">Check your email</p>
          <p class="text-xs text-slate-500">
            If an account exists for that email, we've sent a link to reset your password.
          </p>
          <button
            type="button"
            class="mt-2 text-sm font-semibold text-[#24b39b] hover:text-[#1a8b78] cursor-pointer"
            @click="backToSignIn"
          >
            Back to sign in
          </button>
        </div>

        <!-- Email/password form -->
        <form v-else class="mt-4 space-y-4" @submit.prevent="submit">
          <div>
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0b2d4f] shadow-sm placeholder:text-slate-400 focus:border-[#24b39b] focus:outline-none focus:ring-2 focus:ring-[#24b39b]/30"
              placeholder="Email address"
              @blur="onEmailBlur"
            />
          </div>

          <div>
            <div
              class="mt-1.5 flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-[#24b39b] focus-within:ring-2 focus-within:ring-[#24b39b]/30"
            >
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="flex-1 border-none bg-transparent text-sm text-[#0b2d4f] outline-none"
                placeholder="Password"
              />
              <button
                type="button"
                class="ml-2 text-xs font-medium text-[#24b39b] hover:text-[#1a8b78]"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>

            <!-- Forgot password link (login mode only) -->
            <div v-if="!isSignup" class="mt-1.5 flex justify-end">
              <button
                type="button"
                class="text-xs text-[#24b39b] hover:text-[#1a8b78] cursor-pointer"
                @click="forgotPassword"
                :disabled="loading"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <!-- Error -->
          <p
            v-if="localError"
            class="text-xs text-[#b3261e] bg-[#fde7e7] border border-[#f7b1ac] rounded-md px-3 py-2"
          >
            {{ localError }}
          </p>

          <!-- Submit -->
          <button
            type="submit"
            class="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-[#24b39b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a8b78] disabled:opacity-60 cursor-pointer"
            :disabled="loading"
          >
            <span v-if="!loading">
              {{ isSignup ? "Sign up" : "Sign in" }}
            </span>
            <span v-else>
              {{ isSignup ? "Creating account…" : "Signing in…" }}
            </span>
          </button>

          <!-- Mode switch link -->
          <p class="mt-3 text-xs text-slate-500 text-center">
            <span v-if="isSignup">
              Already have an account?
              <button
                type="button"
                class="ml-1 font-semibold text-[#24b39b] hover:text-[#1a8b78] underline cursor-pointer"
                @click="switchToLogin"
              >
                Sign in
              </button>
            </span>
            <span v-else>
              New to {{ BRAND.name }}?
              <button
                type="button"
                class="ml-1 font-semibold text-[#24b39b] hover:text-[#1a8b78] underline cursor-pointer"
                @click="switchToSignup"
              >
                Create an account
              </button>
            </span>
          </p>

          <p class="mt-2 text-[11px] text-slate-400">
            By continuing, you agree to the {{ BRAND.name }}
            <a href="/terms" target="_blank" class="underline hover:text-slate-600">Terms</a> and
            <a href="/privacy" target="_blank" class="underline hover:text-slate-600">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  </Teleport>
</template>
