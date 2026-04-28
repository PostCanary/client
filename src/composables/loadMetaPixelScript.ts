// src/composables/loadMetaPixelScript.ts
// Dynamically loads Meta Pixel fbevents.js. Replaces the static <script> IIFE
// previously hard-coded in index.html (removed in S125 Sprint 1.0.3 to scope
// Pixel to marketing routes only).
//
// Called from router.afterEach when `to.meta.marketing === true`. The
// composable's existing typeof-window.fbq guard in useMetaPixel.ts:33 makes
// callers gracefully no-op on app routes where this loader never runs.
//
// Faithful translation of the original IIFE from index.html:27-35; same
// shim-then-async-load behavior.

let scriptInjected = false;

export function loadMetaPixelScript(): void {
  if (scriptInjected) return;
  if (typeof window === "undefined") return;

  const f = window as any;
  if (f.fbq) {
    scriptInjected = true;
    return;
  }

  const n: any = function () {
    n.callMethod
      // eslint-disable-next-line prefer-rest-params
      ? n.callMethod.apply(n, arguments)
      // eslint-disable-next-line prefer-rest-params
      : n.queue.push(arguments);
  };
  f.fbq = n;
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const t = document.createElement("script") as HTMLScriptElement;
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  const s = document.getElementsByTagName("script")[0];
  s.parentNode!.insertBefore(t, s);

  scriptInjected = true;
}
