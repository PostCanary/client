<!-- src/layouts/MainLayout.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import Navbar from "@/components/layout/Navbar.vue";
import MobileNavbar from "@/components/layout/MobileNavbar.vue";
import OnboardingModal from "@/components/OnboardingModal.vue";
// import SearchBar from "@/components/layout/SearchBar.vue";
import { useAuthStore } from "@/stores/auth";
import { useUserProfile } from "@/composables/useUserProfile";

const auth = useAuthStore();
const { uploadAvatar } = useUserProfile();

const route = useRoute();
const router = useRouter();

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
            @settings-click="() => router.push('/app/settings')"
          />
        </div>

        <!-- Phone navbar -->
        <div class="nav-mobile">
          <MobileNavbar
            :title="(navbarTitle as string)"
            :user-name="(auth.userName as string)"
            :user-role="(auth.userRole as string)"
            :avatar-url="(auth.avatarUrl as string)"
            @profile-click="onAvatarClick"
            @settings-click="() => router.push('/app/settings')"
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
  background: var(--app-bg, #f0f2f5);
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
  color: #0c2d50; /* Ensure text is visible on light background */
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
</style>
