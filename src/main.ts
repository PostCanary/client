// client/src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
// import router from "./router"; // Commented out for Coming Soon mode

import { useAuthStore } from "@/stores/auth";
import {
  HTTP_EVENT_AUTH_REQUIRED,
  HTTP_EVENT_SUBSCRIPTION_REQUIRED,
  type HttpGateEventDetail,
} from "@/api/http";

// Coming Soon is the default. Set VITE_COMING_SOON=false to show full app
const isComingSoon = import.meta.env.VITE_COMING_SOON !== "false";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
// app.use(router); // Commented out for Coming Soon mode

// Initialize auth once at boot (so billing flags are available)
const auth = useAuthStore(pinia);
if (!isComingSoon) {
  auth.fetchMe();
}

// 401 => prompt login
if (!isComingSoon) {
  window.addEventListener(HTTP_EVENT_AUTH_REQUIRED, () => {
    // const next = router.currentRoute.value.fullPath || "/dashboard"; // Commented out for Coming Soon mode
    const next = "/dashboard";
    auth.openLoginModal(next, "login");
  });
}

// 402 => open paywall (or route to pricing if you prefer)
if (!isComingSoon) {
  window.addEventListener(
    HTTP_EVENT_SUBSCRIPTION_REQUIRED,
    async (ev: Event) => {
      const detail = (ev as CustomEvent<HttpGateEventDetail>).detail;

      // Refresh /auth/me so auth.me.billing gets updated (needs_paywall, etc.)
      await auth.fetchMe();
      console.log("subscription required", detail);
    }
  );
}

app.mount("#app");
