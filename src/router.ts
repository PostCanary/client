// src/router.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";
import { capturePageview } from "@/composables/usePostHog";
import { getSeoData, SITE_URL } from "@/config/seo";
import { loadMetaPixelScript } from "@/composables/loadMetaPixelScript";
import { initMetaPixel } from "@/composables/useMetaPixel";
import { isChunkLoadError, shouldReloadForChunkError } from "@/utils/chunkReload";
import { humanizeAuth0LoginError } from "@/utils/firstRunSetup";
import { hasSignedOutQuery } from "@/utils/sessionLogout";

/** Build route meta from the shared SEO data module */
function seoMeta(path: string) {
  const seo = getSeoData(path);
  return {
    title: seo?.title ?? BRAND.name,
    description: seo?.description ?? "",
    marketing: true,
  };
}

// QA routes are part of local development by default. A protected preview
// build must opt in with VITE_ENABLE_QA_ROUTES=1. Production builds do not
// include these route records or their lazy-loaded page modules.
const qaRoutesEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_QA_ROUTES === "1";

const appQaRoutes: RouteRecordRaw[] = qaRoutesEnabled
  ? [
      {
        path: "dev/step-review-approval-flow",
        name: "DevAppStepReviewApprovalFlow",
        component: () => import("@/pages/dev/StepReviewApprovalFlow.vue"),
        meta: {
          title: "Step Review Approval Flow (dev)",
          navbarTitle: "Review",
          skipFirstRunGuard: true,
        },
      },
    ]
  : [];

const qaRoutes: RouteRecordRaw[] = qaRoutesEnabled
  ? [
      {
        path: "/dev/sttl-step2-preview",
        name: "DevSttLStep2Preview",
        component: () => import("@/pages/dev/SttLStep2Preview.vue"),
        meta: {
          title: "SttL Step 2 Preview (dev)",
          marketing: false,
          skipFirstRunGuard: true,
        },
      },
      {
        path: "/dev/step-review-approval-flow",
        name: "DevStepReviewApprovalFlow",
        component: () => import("@/pages/dev/StepReviewApprovalFlow.vue"),
        meta: {
          title: "Step Review Approval Flow (dev)",
          marketing: false,
          skipFirstRunGuard: true,
        },
      },
      {
        path: "/dev/step-design-fold",
        name: "DevStepDesignFold",
        component: () => import("@/pages/dev/StepDesignFold.vue"),
        meta: {
          title: "Step Design Fold (dev)",
          marketing: false,
          skipFirstRunGuard: true,
        },
      },
      {
        path: "/dev/wizard-shell-strips",
        name: "DevWizardShellStrips",
        component: () => import("@/pages/dev/WizardShellStrips.vue"),
        meta: {
          title: "Wizard Shell Strips (dev)",
          marketing: false,
          skipFirstRunGuard: true,
        },
      },
    ]
  : [];

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
      // Auth0 SSO errors land on /login?error=… — there is no hosted
      // signup page. This route opens the in-app LoginModal on Home.
      {
        path: "login",
        name: "Login",
        component: () => import("@/pages/Home.vue"),
        meta: { ...seoMeta("/"), marketing: true },
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
      {
        path: "home-services-direct-mail-tracking",
        name: "HomeServicesMailTracking",
        component: () => import("@/pages/industries/HomeServicesMailTracking.vue"),
        meta: seoMeta("/home-services-direct-mail-tracking"),
      },
    ],
  },

  { path: "/home", redirect: "/" },

  // First-run industry + return address. Full page, not OnboardingModal.
  {
    path: "/app/setup",
    name: "FirstRunSetup",
    component: () => import("@/pages/FirstRunSetup.vue"),
    meta: {
      title: `Set up • ${BRAND.name}`,
      skipFirstRunGuard: true,
    },
  },

  // ── App pages (wrapped in MainLayout) ──────────────────
  {
    path: "/app",
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "home",
        name: "AppHome",
        component: () => import("@/pages/AppHome.vue"),
        meta: { title: `Home • ${BRAND.name}`, navbarTitle: "Home" },
      },
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
        meta: { title: `Audience • ${BRAND.name}`, navbarTitle: "Audience" },
      },
      {
        path: "analytics",
        name: "Analytics",
        alias: "/analytics",
        component: () => import("@/pages/Analytics.vue"),
        meta: { title: `Analysis • ${BRAND.name}`, navbarTitle: "Analysis" },
      },
      {
        path: "map",
        name: "Heatmap",
        alias: "/map", // ✅ clean URL
        component: () => import("@/pages/Heatmap.vue"),
        meta: { title: `Map • ${BRAND.name}`, navbarTitle: "Map" },
      },
      {
        path: "settings",
        name: "Settings",
        alias: "/settings", // ✅ clean URL
        component: () => import("@/pages/Settings.vue"),
        meta: { title: `Settings • ${BRAND.name}`, navbarTitle: "Settings" },
      },
      {
        path: "audience/do-not-mail",
        name: "DoNotMail",
        component: () => import("@/pages/DoNotMail.vue"),
        meta: { title: `Do Not Mail • ${BRAND.name}`, navbarTitle: "Do Not Mail" },
      },
      {
        path: "history",
        name: "History",
        alias: "/history", // ✅ clean URL
        component: () => import("@/pages/History.vue"),
        meta: { title: `Upload History • ${BRAND.name}`, navbarTitle: "Upload History" },
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
      ...appQaRoutes,
      {
        path: "print-jobs/:id",
        name: "PrintJobStatus",
        component: () => import("@/pages/PrintJobStatus.vue"),
        meta: { title: `Print Job • ${BRAND.name}`, navbarTitle: "Print Job" },
      },
      // Designs page
      {
        path: "designs",
        name: "Designs",
        component: () => import("@/pages/Designs.vue"),
        meta: { title: `Designs • ${BRAND.name}`, navbarTitle: "Designs" },
      },
      // /app -> /app/home
      { path: "", redirect: { name: "AppHome" } },
    ],
  },

  // ── Send-to-a-List Step 2 route (POS-95) ─────────────────
  {
    path: "/app/send-to-a-list/:audienceId",
    name: "SttLStep2ExistingAudience",
    component: () => import("@/layouts/WizardLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("@/pages/SttLStep2Route.vue"),
      },
    ],
    meta: { title: `Send to a List • ${BRAND.name}` },
  },
  {
    path: "/app/send/:draftId/sttl-step-2",
    name: "SttLStep2",
    component: () => import("@/layouts/WizardLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("@/pages/SttLStep2Route.vue"),
      },
    ],
    meta: { title: `Send to a List • ${BRAND.name}` },
  },
  {
    path: "/app/send/sttl-step-2",
    name: "SttLStep2NewDraft",
    component: () => import("@/layouts/WizardLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("@/pages/SttLStep2Route.vue"),
      },
    ],
    meta: { title: `Send to a List • ${BRAND.name}` },
  },

  // ── Campaign wizard (uses WizardLayout, NOT MainLayout — no sidebar) ──
  {
    path: "/app/send/:draftId?",
    component: () => import("@/layouts/WizardLayout.vue"),
    children: [
      {
        path: "",
        name: "SendWizard",
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

  // Not linked from navigation. Used for visual verification in local or
  // explicitly protected QA builds only.
  ...qaRoutes,

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
    if (to.hash) {
      return new Promise((resolve) => {
        const tryScroll = (attempt = 0) => {
          const el = document.querySelector(to.hash);
          if (el || attempt > 20) {
            resolve({ el: to.hash, behavior: "smooth" });
            // Move focus to the anchor target so keyboard/screen-reader users
            // land where the page jumped (sections carry tabindex="-1").
            if (el instanceof HTMLElement) el.focus({ preventScroll: true });
            return;
          }
          requestAnimationFrame(() => tryScroll(attempt + 1));
        };
        tryScroll();
      });
    }
    if (saved) return saved;
    return { top: 0 };
  },
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  // Skip authentication if SKIP_AUTH is enabled (for development/testing)
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === "true";
  if (skipAuth) {
    return next();
  }

  if (to.name === "Login" || to.path === "/login") {
    if (!auth.initialized) {
      await auth.fetchMe();
    }

    const applyLoginError = () => {
      const rawError = to.query.error;
      const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
      if (typeof errorCode === "string" && errorCode.trim()) {
        auth.loginError = humanizeAuth0LoginError(errorCode);
      }
    };

    // Explicit sign-out: never send this navigation to AppHome / setup,
    // even if a cookie survived POST /auth/logout and fetchMe reminted.
    if (hasSignedOutQuery(to.query)) {
      if (auth.isAuthenticated) {
        await auth.logout();
      }
      auth.openLoginModal("/app/home", "login");
      applyLoginError();
      return next();
    }

    if (auth.isAuthenticated) {
      // First-run users who type /login must be able to switch accounts.
      // next(AppHome) would hit the first-run guard and bounce to setup.
      if (await auth.needsFirstRunSetup()) {
        auth.openLoginModal("/app/home", "login");
        applyLoginError();
        return next();
      }
      return next({ name: "AppHome" });
    }

    const nextPath =
      typeof to.query.next === "string" && to.query.next
        ? to.query.next
        : "/app/home";
    auth.openLoginModal(nextPath, "login");
    applyLoginError();
    return next();
  }

  if (to.meta?.marketing) return next();

  if (!auth.initialized) {
    await auth.fetchMe();
  }

  if (!auth.isAuthenticated) {
    auth.openLoginModal(to.fullPath || "/");
    return next(false);
  }

  // Collect industry + return address once, before any other app surface.
  // Skip when both are already set (invited teammates, QA fixtures).
  // /dev/* harnesses are not a first-run surface.
  const skipFirstRun =
    to.matched.some((r) => r.meta?.skipFirstRunGuard) ||
    to.path.includes("/dev/");
  if (!skipFirstRun) {
    const needed = await auth.needsFirstRunSetup();
    if (needed) {
      return next({ name: "FirstRunSetup" });
    }
  } else if (to.name === "FirstRunSetup") {
    const needed = await auth.needsFirstRunSetup();
    if (!needed) {
      return next({ name: "AppHome" });
    }
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

  // Meta Pixel: load fbevents.js + initialize ONLY on marketing routes.
  // S125 Sprint 1.0.3 — closes privacy gap from 1.0.2 partial fix. App routes
  // never load fbevents.js → all useMetaPixel.ts callers gracefully no-op
  // there via the typeof-window.fbq guard at useMetaPixel.ts:33.
  if (to.meta?.marketing === true) {
    loadMetaPixelScript();
    initMetaPixel();
  }
});

// POS-126: we deploy many times a day and Vercel serves /assets/* as
// immutable, so a tab that's been open across a deploy 404s the first time
// it lazily imports a route chunk (e.g. clicking "Designs"). Recover with a
// hard navigation to the intended destination instead of leaving the click
// silently doing nothing.
router.onError((error, to) => {
  if (!isChunkLoadError(error)) return;

  if (!shouldReloadForChunkError(window.sessionStorage)) {
    console.error("[POS-126] repeated chunk load error, not reloading again", error);
    return;
  }

  if (to?.fullPath) {
    window.location.assign(to.fullPath);
  } else {
    window.location.reload();
  }
});

export default router;
