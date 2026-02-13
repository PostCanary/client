<!-- src/components/layout/MobileNavbar.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import LogoUrl from "@/assets/source-logo-02.png";
import { BRAND } from "@/config/brand";

const props = withDefaults(
  defineProps<{
    title?: string;
    userName?: string;
    userRole?: string;
    avatarUrl?: string;
  }>(),
  {
    title: "Dashboard",
    userName: "",
    userRole: "",
    avatarUrl: "",
  }
);

const emit = defineEmits<{
  (e: "profile-click"): void;
  (e: "settings-click"): void;
}>();

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Demographics", path: "/demographics" },
  { label: "Heatmap", path: "/map" },
  { label: "History", path: "/history" },
];

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/");
}

function navigate(path: string) {
  router.push(path);
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function closeDropdown() {
  dropdownOpen.value = false;
}

function handleSettingsClick() {
  router.push("/app/settings");
  closeDropdown();
}

async function handleLogoutClick() {
  await auth.logout();
  closeDropdown();
  // Hard redirect to clear any in-memory state and reload
  window.location.href = "/";
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (
    dropdownRef.value &&
    buttonRef.value &&
    !dropdownRef.value.contains(event.target as Node) &&
    !buttonRef.value.contains(event.target as Node)
  ) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="mt-mnav-root">
    <div class="mt-mnav-left">
      <img 
        :src="LogoUrl" 
        :alt="BRAND.name" 
        class="mt-logo" 
        draggable="false"
        @click="navigate('/dashboard')"
        style="cursor: pointer;"
      />
      
      <!-- Navigation links -->
      <nav class="mt-nav-links">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="navigate(item.path)"
          :class="[
            'nav-link-mobile',
            { 'nav-link-mobile-active': isActive(item.path) }
          ]"
        >
          {{ item.label }}
        </button>
      </nav>
    </div>

    <div class="mt-mnav-right relative">
      <button
        v-if="props.userName"
        ref="buttonRef"
        @click.stop="toggleDropdown"
        class="mt-user-name-btn"
      >
        {{ props.userName }}
      </button>
      
      <!-- Dropdown menu -->
      <div
        v-if="dropdownOpen"
        ref="dropdownRef"
        class="user-dropdown"
        @click.stop
      >
        <button
          class="dropdown-item"
          @click="handleSettingsClick"
        >
          Settings
        </button>
        <button
          class="dropdown-item"
          @click="handleLogoutClick"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mt-mnav-root {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  /* ribbon instead of pill */
  border-radius: 0;
  background: #ffffff;
  padding: 10px 16px;
  box-shadow: 0 1px 0 rgba(12, 45, 80, 0.06); /* subtle bottom edge */
}

/* layout pieces stay the same */
.mt-mnav-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.mt-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.mt-nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: 16px;
}

.nav-link-mobile {
  font-size: 14px;
  font-weight: 500;
  color: #0c2d50;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.nav-link-mobile:hover {
  color: #47bfa9;
}

.nav-link-mobile-active {
  font-size: 16px;
  font-weight: 700;
  color: #0c2d50;
}

.nav-link-mobile-active:hover {
  color: #0c2d50;
}

.mt-mnav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* User name button styled like Edit Mapping */
.mt-user-name-btn {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  background: #e4e7eb;
  color: #243b53;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.mt-user-name-btn:hover {
  background: #d1d5db;
}

/* User dropdown menu */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(12, 45, 80, 0.12),
    0 4px 16px rgba(12, 45, 80, 0.08);
  border: 1px solid #e2e8f0;
  min-width: 160px;
  padding: 6px;
  z-index: 1000;
}

.dropdown-item {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #0c2d50;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-item:hover {
  background: #f4f5f7;
}

.dropdown-item:active {
  background: #e4e7eb;
}
</style>
