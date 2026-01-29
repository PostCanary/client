// src/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/pages/Home.vue"),
    meta: { title: "Home • MailTrace", marketing: true },
  },
  { path: "/home", redirect: "/" },

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
        meta: { title: "Dashboard • MailTrace", navbarTitle: "Dashboard" },
      },
      {
        path: "map",
        name: "Heatmap",
        alias: "/map", // ✅ clean URL
        component: () => import("@/pages/Heatmap.vue"),
        meta: { title: "Heatmap • MailTrace", navbarTitle: "Heatmap" },
      },
      {
        path: "settings",
        name: "Settings",
        alias: "/settings", // ✅ clean URL
        component: () => import("@/pages/Settings.vue"),
        meta: { title: "Settings • MailTrace", navbarTitle: "Settings" },
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
  document.title = (to.meta?.title as string) || "MailTrace";
});

export default router;