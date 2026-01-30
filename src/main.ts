// client/src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

import { useAuthStore } from "@/stores/auth";
import {
  HTTP_EVENT_AUTH_REQUIRED,
  HTTP_EVENT_SUBSCRIPTION_REQUIRED,
  type HttpGateEventDetail,
} from "@/api/http";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

// Initialize auth once at boot (so billing flags are available)
const auth = useAuthStore(pinia);
auth.fetchMe();

// 401 => prompt login
window.addEventListener(HTTP_EVENT_AUTH_REQUIRED, () => {
  const next = router.currentRoute.value.fullPath || "/dashboard";
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
