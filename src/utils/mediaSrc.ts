import { API_BASE } from "@/api/http";

// Server-returned media/download URLs are root-relative (e.g.
// `/api/render-jobs/{job}/cards/{n}?sig=...`). Axios requests prepend
// API_BASE automatically, but iframe `src`, anchor `href`, `window.open`,
// and CSS `url()` bindings do NOT go through axios — the browser resolves
// them against the current page origin. In prod that's postcanary.com,
// not api.postcanary.com, so a raw binding silently hits the SPA fallback
// instead of the API. Any binding of a server-provided URL outside of an
// axios call must be passed through this helper first.
// Same-origin deployments have API_BASE === "" (no-op).
export function mediaSrc(url: string): string {
  return url && url.startsWith("/") ? `${API_BASE}${url}` : url;
}
