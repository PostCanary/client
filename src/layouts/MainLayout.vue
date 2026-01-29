<!-- src/layouts/MainLayout.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import Navbar from "@/components/layout/Navbar.vue";
import MobileNavbar from "@/components/layout/MobileNavbar.vue";
import OnboardingModal from "@/components/OnboardingModal.vue";
// import SearchBar from "@/components/layout/SearchBar.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserProfile } from "@/composables/useUserProfile";

const auth = useAuthStore();
const { uploadAvatar } = useUserProfile();

const route = useRoute();

const isSidebarOpen = ref(false);
const openSidebar = () => (isSidebarOpen.value = true);
const closeSidebar = () => (isSidebarOpen.value = false);

const search = ref("");

const navbarTitle = computed(
  () =>
    (route.meta?.navbarTitle as string) ||
    (route.meta?.title as string) ||
    "Dashboard"
);

/* avatar upload */
const fileInput = ref<HTMLInputElement | null>(null);
const onAvatarClick = () => fileInput.value?.click();

async function onAvatarFileChanged(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  await uploadAvatar(file);
  input.value = "";
}
</script>

<template>
  <div class="app-shell">
    <!-- Everything that should blur/dim when onboarding is open -->
    <div
      class="app-shell-inner"
      :class="{ 'app-shell-inner--blurred': auth.onboardingOpen }"
    >
      <!-- Sidebar edge (tablet / desktop only) -->
      <div v-if="!isSidebarOpen" class="sidebar-edge" @click="openSidebar">
        <div class="sidebar-chevron">›</div>
      </div>

      <transition name="sidebar-drawer-transition">
        <div
          v-if="isSidebarOpen"
          class="sidebar-overlay"
          @click.self="closeSidebar"
        >
          <div class="sidebar-drawer">
            <Sidebar active="overview" @navigate="closeSidebar" />
          </div>
        </div>
      </transition>

      <header class="app-topbar">
        <!-- Desktop / tablet navbar -->
        <div class="nav-desktop">
          <Navbar
            :title="(navbarTitle as string)"
            :user-name="(auth.userName as string)"
            :user-role="(auth.userRole as string)"
            :avatar-url="(auth.avatarUrl as string)"
            v-model="(search as string)"
            @search="(v: string) => (search = v)"
            @profile-click="onAvatarClick"
          />
        </div>

        <!-- Phone navbar -->
        <div class="nav-mobile">
          <MobileNavbar
            :title="(navbarTitle as string)"
            :user-name="(auth.userName as string)"
            :user-role="(auth.userRole as string)"
            :avatar-url="(auth.avatarUrl as string)"
            :sidebar-open="isSidebarOpen"
            @toggle-sidebar="openSidebar"
            @profile-click="onAvatarClick"
          />
        </div>
      </header>

      <!-- Phone-only search pill (<640px) not using for now
      <div class="app-search-row">
        <div class="app-search-card">
          <SearchBar v-model="search" @search="(v) => (search = v)" />
        </div>
      </div>
      -->

      <main class="app-main">
        <RouterView />
      </main>

      <!-- shared hidden file input for avatar upload -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onAvatarFileChanged"
      />
    </div>

    <!-- Hard-gated onboarding modal, lives above blurred content -->
    <OnboardingModal
      v-if="auth.onboardingOpen && auth.isAuthenticated"
      @completed="auth.closeOnboarding()"
    />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f4f5f7;
  padding: 16px 16px 20px;
  position: relative;
  z-index: 1;
}

/* Wraps the whole “normal app” chrome */
.app-shell-inner {
  transition: filter 0.18s ease-out, opacity 0.18s ease-out;
}

/* When onboarding modal is open, blur + dim background */
.app-shell-inner--blurred {
  filter: blur(3px);
  opacity: 0.6;
  pointer-events: none; /* prevent clicks behind the modal */
}

.app-topbar {
  margin-bottom: 16px;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

/* ---- nav breakpoint: desktop vs mobile ---- */
.nav-desktop {
  display: none;
}
.nav-mobile {
  display: block;
}

@media (min-width: 640px) {
  .nav-desktop {
    display: block;
  }
  .nav-mobile {
    display: none;
  }
}

/* ---------- Mobile layout tweaks (<640px) ---------- */

@media (max-width: 639px) {
  .app-shell {
    padding: 0 0 16px;
  }

  .app-topbar {
    margin-bottom: 12px;
  }

  .app-main {
    padding: 0 16px;
  }

  .app-search-row {
    padding: 0 16px;
  }
}

/* ---------- Mobile search row (<640px) ---------- */

.app-search-row {
  display: none;
  margin-bottom: 12px;
}

.app-search-card {
  border-radius: 12px;
  background: #ffffff;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.06);
}

@media (max-width: 639px) {
  .app-search-row is {
    display: block;
  }
}

/* ---------- Sidebar edge + drawer ---------- */

.sidebar-edge {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 40px; /* Wider for easier clicking */
  z-index: 9999; /* always above content */
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  background: transparent;
  opacity: 0.5; /* More visible so users know the menu exists */
  transition: opacity 0.15s ease, background 0.15s ease;
}

/* hide edge on phones only */
@media (max-width: 639px) {
  .sidebar-edge {
    display: none;
  }
}
@media (min-width: 640px) {
  .sidebar-edge {
    display: flex;
  }
}

.sidebar-edge:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1); /* Subtle background on hover */
}

.sidebar-chevron {
  width: 36px; /* Wider chevron button */
  height: 100%;
  border-radius: 0 999px 999px 0;
  background: #ffffff;
  box-shadow: 2px 0 8px rgba(12, 45, 80, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px; /* Slightly larger icon */
  font-weight: 600;
  color: #0f172a;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.sidebar-edge:hover .sidebar-chevron {
  box-shadow: 2px 0 12px rgba(12, 45, 80, 0.24); /* More prominent shadow on hover */
  transform: translateX(2px); /* Slight slide effect */
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  align-items: stretch;

  /* ✅ MUST be higher than Leaflet panes/controls */
  z-index: 10050;

  display: flex;
}

.sidebar-drawer {
  width: 280px;
  max-width: 80%;
  height: 100%;
  background: #ffffff;
  box-shadow: 4px 0 16px rgba(12, 45, 80, 0.25);

  /* ✅ make z-index actually apply */
  position: relative;
  z-index: 10051;
}

.sidebar-drawer-transition-enter-active,
.sidebar-drawer-transition-leave-active {
  transition: transform 0.18s ease-out, opacity 0.18s ease-out;
}
.sidebar-drawer-transition-enter-from,
.sidebar-drawer-transition-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
