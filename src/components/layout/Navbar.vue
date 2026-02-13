<!-- src/components/layout/Navbar.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
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
    showSearch?: boolean;
    modelValue?: string;
  }>(),
  {
    title: "Dashboard",
    userName: "",
    userRole: "",
    avatarUrl: "",
    showSearch: true,
    modelValue: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "search", v: string): void;
  (e: "profile-click"): void;
  (e: "settings-click"): void;
}>();

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const q = ref(props.modelValue ?? "");
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);

watch(
  () => props.modelValue,
  (v) => {
    if (v !== q.value) q.value = v ?? "";
  }
);

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
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

/*
function doSearch() {
  emit("update:modelValue", q.value);
  emit("search", q.value);
}
*/
</script>

<template>
  <!-- Same pill card as before -->
  <div
    class="mt-nav-root w-full rounded-xl bg-white shadow-[0_1px_3px_rgba(12,45,80,.08),0_10px_24px_rgba(12,45,80,.06)] px-5 py-3 flex items-center gap-4"
  >
    <!-- Left: logo -->
    <div class="flex items-center gap-3 whitespace-nowrap">
      <img
        :src="LogoUrl"
        :alt="BRAND.name"
        class="h-20 sm:h-24 w-auto object-contain cursor-pointer -my-4 sm:-my-5"
        draggable="false"
        @click="navigate('/dashboard')"
      />
    </div>

    <!-- Navigation links -->
    <nav class="flex items-center gap-6 ml-8">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="navigate(item.path)"
        :class="[
          'nav-link',
          { 'nav-link-active': isActive(item.path) }
        ]"
      >
        {{ item.label }}
      </button>
    </nav>

    <!-- Spacer -->
    <div class="grow"></div>

    <!-- 🔒 Inline search: commented out per client request -->
    <!--
    <div
      v-if="props.showSearch"
      class="hidden sm:flex items-center gap-3 rounded-xl bg-[#f4f5f7] h-12 px-4 min-w-[260px] max-w-[520px] shadow-[inset_0_1px_0_rgba(0,0,0,.04)]"
    >
      <input
        v-model="q"
        type="text"
        placeholder="Search"
        class="bg-transparent outline-none w-full text-[16px] placeholder-[#6b6b6b]"
        @keydown.enter.prevent="doSearch"
      />

      <button
        class="rounded-lg p-2 hover:bg-white/70 transition"
        @click="doSearch"
        aria-label="Search"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5">
          <path
            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
            fill="none"
            stroke="#47bfa9"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    -->

    <!-- Right: user area -->
    <div class="mt-nav-user hidden sm:flex items-center gap-3 pl-2 relative">
      <div class="leading-tight" v-if="props.userName || props.userRole">
        <!-- 👇 full name with button style like Edit Mapping -->
        <button
          v-if="props.userName"
          ref="buttonRef"
          @click.stop="toggleDropdown"
          class="mt-user-name-btn"
        >
          {{ props.userName }}
        </button>
        <div v-if="props.userRole" class="text-[14px] text-[#47bfa9]">
          {{ props.userRole }}
        </div>
      </div>
      
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
/* Navigation links */
.nav-link {
  font-size: 16px;
  font-weight: 500;
  color: #0c2d50;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: #47bfa9;
}

.nav-link-active {
  font-size: 18px;
  font-weight: 700;
  color: #0c2d50;
}

.nav-link-active:hover {
  color: #0c2d50;
}

/* User name button styled like Edit Mapping */
.mt-user-name-btn {
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  background: #e4e7eb;
  color: #243b53;
  transition: background 0.15s ease;
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

/* Search-specific sizing left here in case we re-enable it later.
   It's harmless while the block is commented out, but you can delete it if you want. */
.mt-nav-search {
  flex: 0 1 520px;
  max-width: 520px;
}

/* ⛔️ Removed max-width/ellipsis for .mt-user-name so the full name always shows */
/*
.mt-user-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 901px) and (max-width: 1100px) {
  .mt-nav-search {
    flex-basis: 360px;
    max-width: 380px;
  }

  .mt-user-name {
    max-width: 130px;
  }
}
*/
</style>
