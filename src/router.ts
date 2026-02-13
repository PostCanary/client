// src/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/pages/Home.vue"),
    meta: { title: `Home • ${BRAND.name}`, marketing: true },
  },
  { path: "/home", redirect: "/" },
  {
    path: "/terms",
    name: "TermsOfService",
    component: () => import("@/pages/TermsOfService.vue"),
    meta: { title: `Terms of Service • ${BRAND.name}`, marketing: true },
  },
  {
    path: "/privacy",
    name: "PrivacyPolicy",
    component: () => import("@/pages/PrivacyPolicy.vue"),
    meta: { title: `Privacy Policy • ${BRAND.name}`, marketing: true },
  },
  {
    path: "/help",
    name: "Help",
    component: () => import("@/pages/Help.vue"),
    meta: { title: `Help • ${BRAND.name}`, marketing: true },
  },

  // ✅ Layout ONLY for app pages
  {
    path: "/app",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        alias: "/dashboard", // ✅ clean URL
        component: () => import("@/pages/Dashboard.vue"),
        meta: { title: `Dashboard • ${BRAND.name}`, navbarTitle: "Dashboard" },
      },
      {
        path: "map",
        name: "Heatmap",
        alias: "/map", // ✅ clean URL
        component: () => import("@/pages/Heatmap.vue"),
        meta: { title: `Heatmap • ${BRAND.name}`, navbarTitle: "Heatmap" },
      },
      {
        path: "settings",
        name: "Settings",
        alias: "/settings", // ✅ clean URL
        component: () => import("@/pages/Settings.vue"),
        meta: { title: `Settings • ${BRAND.name}`, navbarTitle: "Settings" },
      },
      {
        path: "history",
        name: "History",
        alias: "/history", // ✅ clean URL
        component: () => import("@/pages/History.vue"),
        meta: { title: `History • ${BRAND.name}`, navbarTitle: "History" },
      },

      // /app -> /dashboard
      { path: "", redirect: { name: "Dashboard" } },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, saved) {
    if (to.hash) return { el: to.hash, behavior: "smooth" };
    if (saved) return saved;
    return { top: 0 };
  },
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta?.marketing) return next();

  // Skip authentication if SKIP_AUTH is enabled (for development/testing)
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === "true";
  if (skipAuth) {
    return next();
  }

  if (!auth.initialized) {
    await auth.fetchMe();
  }

  if (!auth.isAuthenticated) {
    auth.openLoginModal(to.fullPath || "/");
    return next(false);
  }

  return next();
});

router.afterEach((to) => {
  document.title = (to.meta?.title as string) || BRAND.name;
  if (typeof window.vgo === 'function') {
    window.vgo('process');
  }
});

export default router;