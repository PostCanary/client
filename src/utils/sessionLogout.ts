import { AUTH_BASE } from "@/config/auth";
import { useAuthStore } from "@/stores/auth";

export const SIGNED_OUT_QUERY = "signed_out";

export function signedOutLoginPath(): string {
  return `/login?${SIGNED_OUT_QUERY}=1`;
}

export function hasSignedOutQuery(query: {
  signed_out?: string | string[] | null;
}): boolean {
  const raw = query.signed_out;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "1" || value === "true";
}

/** Top-level logout URL so the API host can Set-Cookie-clear the session. */
export function logoutRedirectUrl(origin = window.location.origin): string {
  const next = `${origin.replace(/\/+$/, "")}/`;
  const base = (AUTH_BASE || "").replace(/\/+$/, "");
  return `${base}/auth/logout?next=${encodeURIComponent(next)}`;
}

/**
 * POST /auth/logout (best effort), then hard-navigate to GET /auth/logout
 * so the browser applies the cookie clear on the API host — XHR Set-Cookie
 * from a Vercel preview does not reliably end the Auth0/session cookie.
 * Lands on marketing home (`next=/`). /login then stays on the login modal.
 */
export async function logoutAndLeave(): Promise<void> {
  const auth = useAuthStore();
  try {
    await auth.logout();
  } catch {
    // Still leave via top-level logout so a failed POST cannot trap QA.
  }
  window.location.replace(logoutRedirectUrl());
}
