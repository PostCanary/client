// src/config/auth.ts
/**
 * URL rules (IMPORTANT — prevents drift):
 *
 * - "API" routes are under /api/* and are called via axios in src/api/*.
 *   In dev we proxy /api -> Flask; in prod API_BASE is the Railway backend.
 *
 * - "AUTH" routes are under /auth/* (NOT /api/auth/*) because Auth0 callbacks + session flows
 *   are served by the backend auth blueprint with url_prefix="/auth".
 *
 * To avoid accidental /api/auth/* calls, all /auth/* calls must go through src/api/auth.ts.
 */

// Production backend - using subdomain for cookie sharing
// NOTE: Do NOT append /api here — API paths already include the /api/ prefix.
const PROD_API_BASE = "https://api.postcanary.com";

const rawBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
export const API_BASE = rawBase.trim().length
  ? rawBase.trim()
  : import.meta.env.PROD
    ? PROD_API_BASE
    : "";

/**
 * AUTH_BASE should normally be:
 *   - dev: "" (same-origin, Vite/Nginx proxies /auth)
 *   - prod: "https://api.mailtrace.ai" (no trailing /api)
 *
 * If you ever need to override explicitly, set VITE_AUTH_BASE.
 */
export const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE || API_BASE.replace(/\/api\/?$/, "");
