<!-- src/layouts/MainLayout.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import AppTopBar from "@/components/layout/AppTopBar.vue";
import MobileSidebarDrawer from "@/components/layout/MobileSidebarDrawer.vue";
import OnboardingModal from "@/components/OnboardingModal.vue";
import TourManager from "@/components/tour/TourManager.vue";
import { useAuthStore } from "@/stores/auth";
import { useSidebar } from "@/composables/useSidebar";

const auth = useAuthStore();
const { sidebarWidth, isMobile } = useSidebar();

const route = useRoute();

/* Page title from route meta */
const navbarTitle = computed(
  () =>
    (route.meta?.navbarTitle as string) ||
    (route.meta?.title as string) ||
    "Home"
);

/* Campaign filter visibility — only on Results pages */
const RESULTS_PAGES = ["Dashboard", "Heatmap", "Analytics", "Demographics", "History"];
const showCampaignFilter = computed(() => {
  const routeName = route.name as string;
  return RESULTS_PAGES.includes(routeName);
});
</script>

<template>
  <div class="app-shell" :style="{ '--current-sidebar-width': sidebarWidth + 'px' }">
    <!-- Sidebar is OUTSIDE the blur wrapper so it stays crisp during onboarding.
         The sidebar is persistent chrome, not content. Onboarding modal blurs content only. -->
    <aside class="app-sidebar hidden sm:block">
      <AppSidebar />
    </aside>

    <div
      class="app-shell-inner"
      :class="{ 'app-shell-inner--blurred': auth.onboardingOpen }"
    >
      <!-- Top Bar -->
      <header class="app-topbar">
        <AppTopBar
          :title="(navbarTitle as string)"
          :show-campaign-filter="showCampaignFilter"
        />
      </header>

      <!-- Main Content -->
      <main class="app-main">
        <RouterView />
      </main>

    </div>

    <!-- Mobile Sidebar Drawer -->
    <MobileSidebarDrawer v-if="isMobile" />

    <TourManager />

    <!-- Hard-gated onboarding modal, lives above blurred content -->
    <OnboardingModal
      v-if="auth.onboardingOpen && auth.isAuthenticated"
      @completed="auth.closeOnboarding()"
    />
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: var(--current-sidebar-width, 240px) 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  background: var(--app-bg, #f0f2f5);
  position: relative;
  z-index: 1;
}

.app-sidebar {
  grid-row: 1 / -1;
  grid-column: 1;
}

.app-shell-inner {
  grid-row: 1 / -1;
  grid-column: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: filter 0.18s ease-out, opacity 0.18s ease-out;
}

/* When onboarding modal is open, blur + dim background */
.app-shell-inner--blurred {
  filter: blur(10px);
  opacity: 0.4;
  pointer-events: none;
}

.app-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 24px 24px;
  color: var(--app-text, #0c2d50);
  overflow-y: auto;
}

/* ── Mobile: sidebar is drawer, content spans full width ── */
@media (max-width: 639px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    display: none;
  }

  .app-main {
    padding: 12px 16px 16px;
  }
}
</style>
