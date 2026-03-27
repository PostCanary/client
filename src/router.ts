// src/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";
import { initMetaPixel, trackPageView, trackViewContent } from "@/composables/useMetaPixel";
import { capturePageview } from "@/composables/usePostHog";
import { getSeoData, SITE_URL } from "@/config/seo";

/** Build route meta from the shared SEO data module */
function seoMeta(path: string) {
  const seo = getSeoData(path);
  return {
    title: seo?.title ?? BRAND.name,
    description: seo?.description ?? "",
    marketing: true,
  };
}

const routes: RouteRecordRaw[] = [
  // ── Marketing pages (wrapped in MarketingLayout) ───────
  {
    path: "/",
    component: () => import("@/layouts/MarketingLayout.vue"),
    children: [
      {
        path: "",
        name: "Home",
        component: () => import("@/pages/Home.vue"),
        meta: seoMeta("/"),
      },
      {
        path: "terms",
        name: "TermsOfService",
        component: () => import("@/pages/TermsOfService.vue"),
        meta: seoMeta("/terms"),
      },
      {
        path: "privacy",
        name: "PrivacyPolicy",
        component: () => import("@/pages/PrivacyPolicy.vue"),
        meta: seoMeta("/privacy"),
      },
      {
        path: "help",
        name: "Help",
        component: () => import("@/pages/Help.vue"),
        meta: seoMeta("/help"),
      },

      // Calculators
      {
        path: "attribution-gap-calculator",
        name: "AttributionGapCalculator",
        component: () => import("@/pages/calculators/AttributionGapCalculator.vue"),
        meta: seoMeta("/attribution-gap-calculator"),
      },
      {
        path: "direct-mail-roi-calculator",
        name: "DirectMailRoiCalculator",
        component: () => import("@/pages/calculators/DirectMailRoiCalculator.vue"),
        meta: seoMeta("/direct-mail-roi-calculator"),
      },
      {
        path: "savings-calculator",
        name: "SavingsCalculator",
        component: () => import("@/pages/calculators/SavingsCalculator.vue"),
        meta: seoMeta("/savings-calculator"),
      },

      // Industry pages
      {
        path: "hvac-direct-mail-tracking",
        name: "HvacMailTracking",
        component: () => import("@/pages/industries/HvacMailTracking.vue"),
        meta: seoMeta("/hvac-direct-mail-tracking"),
      },
      {
        path: "plumbing-direct-mail-tracking",
        name: "PlumbingMailTracking",
        component: () => import("@/pages/industries/PlumbingMailTracking.vue"),
        meta: seoMeta("/plumbing-direct-mail-tracking"),
      },
      {
        path: "real-estate-direct-mail-tracking",
        name: "RealtorMailTracking",
        component: () => import("@/pages/industries/RealtorMailTracking.vue"),
        meta: seoMeta("/real-estate-direct-mail-tracking"),
      },
    ],
  },

  { path: "/home", redirect: "/" },

  // ── App pages (wrapped in MainLayout) ──────────────────
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
      {
        path: "team",
        name: "Team",
        alias: "/team",
        component: () => import("@/pages/Team.vue"),
        meta: { title: `Team • ${BRAND.name}`, navbarTitle: "Team" },
      },

      // Campaign pages (stubs until Terminal 3 builds real pages)
      {
        path: "campaigns",
        name: "Campaigns",
        component: () => import("@/pages/Campaigns.vue"),
        meta: { title: `Campaigns • ${BRAND.name}`, navbarTitle: "Campaigns" },
      },
      {
        path: "campaigns/:id",
        name: "CampaignDetail",
        component: () => import("@/pages/CampaignDetail.vue"),
        meta: { title: `Campaign Detail • ${BRAND.name}`, navbarTitle: "Campaign" },
      },

      // /app -> /dashboard
      { path: "", redirect: { name: "Dashboard" } },
    ],
  },

  // ── Campaign wizard (uses WizardLayout, NOT MainLayout — no sidebar) ──
  {
    path: "/app/send/:draftId?",
    name: "SendWizard",
    component: () => import("@/layouts/WizardLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("@/pages/SendWizard.vue"),
      },
    ],
    meta: { title: `Send Postcards • ${BRAND.name}` },
  },

  // ── Invitation accept page (marketing layout, no auth check initially) ──
  {
    path: "/app/invite/:token",
    name: "AcceptInvite",
    alias: "/invite/:token",
    component: () => import("@/pages/AcceptInvite.vue"),
    meta: { title: `Accept Invitation • ${BRAND.name}`, marketing: true },
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

function setMetaContent(selector: string, content: string) {
  const el = document.querySelector(selector) as HTMLMetaElement | null;
  if (el) el.setAttribute("content", content);
}

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
  const title = (to.meta?.title as string) || BRAND.name;
  const description = (to.meta?.description as string) || "";
  const url = `${SITE_URL}${to.path}`;

  document.title = title;

  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[property="og:url"]', url);
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', description);

  const canonical = document.getElementById('canonical-url') as HTMLLinkElement | null;
  if (canonical) {
    canonical.href = url;
  }

  if (typeof window.vgo === 'function') {
    window.vgo('process');
  }

  // PostHog pageview
  capturePageview();

  // Meta Pixel tracking
  initMetaPixel();
  if (to.meta?.marketing) {
    trackViewContent({ content_name: to.meta.title as string, content_category: "marketing" });
  } else {
    trackPageView();
  }
});

export default router;
