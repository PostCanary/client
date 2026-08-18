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

/**
 * POST /auth/logout + clear client/CSRF, then hard-reload marketing home
 * on the current app origin. Never navigate to {AUTH_BASE}/auth/logout —
 * that endpoint is POST-only (GET 405s).
 */
export async function logoutAndLeave(): Promise<void> {
  const auth = useAuthStore();
  try {
    await auth.logout();
  } catch {
    // Client state is still cleared inside auth.logout(); leave anyway.
  }
  window.location.replace("/");
}
