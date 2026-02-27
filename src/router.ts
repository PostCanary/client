// src/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";
import { initMetaPixel, trackPageView, trackViewContent } from "@/composables/useMetaPixel";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/pages/Home.vue"),
    meta: {
      title: `Direct Mail Analytics & Tracking - Direct Mail ROI - ${BRAND.name}`,
      description: "See how your direct mail really performs. PostCanary tracks ROI, conversions & attribution beyond QR codes capturing the 70-90% other tracking tools miss.",
      marketing: true,
    },
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

  // Calculators
  {
    path: "/attribution-gap-calculator",
    name: "AttributionGapCalculator",
    component: () => import("@/pages/calculators/AttributionGapCalculator.vue"),
    meta: {
      title: "Direct Mail Attribution Gap Calculator | Free Tool",
      description: "See how much revenue your direct mail is missing. Most QR codes track under 10% of conversions. Calculate your real attribution gap in 60 seconds.",
      marketing: true,
    },
  },
  {
    path: "/direct-mail-roi-calculator",
    name: "DirectMailRoiCalculator",
    component: () => import("@/pages/calculators/DirectMailRoiCalculator.vue"),
    meta: {
      title: "Direct Mail ROI Calculator | Free Tool - PostCanary",
      description: "Calculate your real direct mail ROI, not just what QR codes track. Input your mail volume and see the gap between tracked and actual campaign performance.",
      marketing: true,
    },
  },
  {
    path: "/savings-calculator",
    name: "SavingsCalculator",
    component: () => import("@/pages/calculators/SavingsCalculator.vue"),
    meta: {
      title: "Direct Mail Tracking Savings Calculator | PostCanary",
      description: "See how much time and money you waste matching addresses in Excel. Calculate your savings with automated direct mail matchback tracking. Free calculator.",
      marketing: true,
    },
  },

  // Industry pages
  {
    path: "/hvac-direct-mail-tracking",
    name: "HvacMailTracking",
    component: () => import("@/pages/industries/HvacMailTracking.vue"),
    meta: {
      title: "HVAC Direct Mail Tracking | Prove Your Mail ROI",
      description: "Track which HVAC mailers actually drive service calls. Match mailed addresses to booked jobs automatically, no QR codes needed. See real campaign ROI.",
      marketing: true,
    },
  },
  {
    path: "/plumbing-direct-mail-tracking",
    name: "PlumbingMailTracking",
    component: () => import("@/pages/industries/PlumbingMailTracking.vue"),
    meta: {
      title: "Plumbing Direct Mail Tracking | Prove Your Mail ROI",
      description: "Track which mailers drive plumbing jobs. Match mailed addresses to service calls automatically without QR codes. See your real direct mail ROI.",
      marketing: true,
    },
  },
  {
    path: "/real-estate-direct-mail-tracking",
    name: "RealtorMailTracking",
    component: () => import("@/pages/industries/RealtorMailTracking.vue"),
    meta: {
      title: "Real Estate Direct Mail Tracking | Prove Farming ROI",
      description: "Track which Just Listed and farming postcards generate listings and closings. Match mailed addresses to clients automatically. No QR codes needed.",
      marketing: true,
    },
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
        path: "demographics",
        name: "Demographics",
        alias: "/demographics",
        component: () => import("@/pages/Demographics.vue"),
        meta: { title: `Demographics • ${BRAND.name}`, navbarTitle: "Demographics" },
      },
      {
        path: "analytics",
        name: "Analytics",
        alias: "/analytics",
        component: () => import("@/pages/Analytics.vue"),
        meta: { title: `AI Insights • ${BRAND.name}`, navbarTitle: "AI Insights" },
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

  const descriptionTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (descriptionTag && to.meta?.description) {
    descriptionTag.setAttribute('content', to.meta.description as string);
  }

  const canonical = document.getElementById('canonical-url') as HTMLLinkElement | null;
  if (canonical) {
    canonical.href = `https://${BRAND.domain.www}${to.path}`;
  }

  if (typeof window.vgo === 'function') {
    window.vgo('process');
  }

  // Meta Pixel tracking
  initMetaPixel();
  if (to.meta?.marketing) {
    trackViewContent({ content_name: to.meta.title as string, content_category: "marketing" });
  } else {
    trackPageView();
  }
});

export default router;