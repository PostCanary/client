// client/src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { MotionPlugin } from "@vueuse/motion";
import * as Sentry from "@sentry/vue";
import App from "./App.vue";
import router from "./router";
import "@/styles/tour.css";
import "@/styles/print-scale.css";

import { initPostHog } from "@/composables/usePostHog";
import { useAuthStore } from "@/stores/auth";
import {
  HTTP_EVENT_AUTH_REQUIRED,
  HTTP_EVENT_SUBSCRIPTION_REQUIRED,
  type HttpGateEventDetail,
} from "@/api/http";
import { shouldReloadForChunkError } from "@/utils/chunkReload";

// POS-126: we deploy many times a day and Vercel serves /assets/* as
// immutable, so a tab open across a deploy will fail to preload a lazy
// chunk (Vite fires this event instead of throwing into app code). Recover
// with a one-time hard reload rather than leaving the tab silently stuck.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault?.();
  if (shouldReloadForChunkError(window.sessionStorage)) {
    window.location.reload();
  } else {
    console.error("[POS-126] repeated vite:preloadError, not reloading again", event);
  }
});

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(MotionPlugin);

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    app,
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_GIT_COMMIT_SHA as string | undefined,
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration({ router })],
  });
}

initPostHog();

// Fetch server-side feature flags before mounting so window.__POSTCANARY_CONFIG__
// is populated before any route component is rendered. Non-fatal — defaults to off.
try {
  const _cfgBase = (import.meta.env.VITE_API_BASE as string | undefined ?? '').trim();
  const _cfgRes = await fetch(`${_cfgBase}/api/config`, { credentials: 'include' });
  if (_cfgRes.ok) {
    const _cfgData = await _cfgRes.json();
    (window as any).__POSTCANARY_CONFIG__ = { eddmEnabled: Boolean(_cfgData.eddm_enabled) };
  }
} catch { /* non-fatal — feature flags default off */ }

// Initialize auth once at boot (so billing flags are available)
const auth = useAuthStore(pinia);
auth.fetchMe();

// 401 => prompt login
window.addEventListener(HTTP_EVENT_AUTH_REQUIRED, () => {
  const next = router.currentRoute.value.fullPath || "/app/home";
  auth.openLoginModal(next, "login");
});

// 402 => open paywall (or route to pricing if you prefer)
window.addEventListener(
  HTTP_EVENT_SUBSCRIPTION_REQUIRED,
  async (ev: Event) => {
    const detail = (ev as CustomEvent<HttpGateEventDetail>).detail;

    // Refresh /auth/me so auth.me.billing gets updated (needs_paywall, etc.)
    await auth.fetchMe();
    console.log("subscription required", detail);
  }
);

app.mount("#app");
