<!-- src/components/layout/MobileNavbar.vue -->
<script setup lang="ts">
import { computed } from "vue";
import LogoUrl from "@/assets/source-logo-02.png";
import profileIcon from "@/assets/profile-icon.svg?url";
import { hashUsernameToGradient } from "@/utils/avatar-gradient";

const props = withDefaults(
  defineProps<{
    title?: string;
    userName?: string;
    userRole?: string;
    avatarUrl?: string;
    sidebarOpen?: boolean;
  }>(),
  {
    title: "Dashboard",
    userName: "",
    userRole: "",
    avatarUrl: "",
    sidebarOpen: false,
  }
);

const emit = defineEmits<{
  (e: "toggle-sidebar"): void;
  (e: "profile-click"): void;
}>();

const avatarGradientStyle = computed(() => {
  const [from, to] = hashUsernameToGradient(props.userName ?? "");
  return {
    background: `linear-gradient(135deg, ${from}, ${to})`,
  };
});
</script>

<template>
  <div class="mt-mnav-root">
    <div class="mt-mnav-left">
      <button
        type="button"
        class="mt-hamburger"
        @click="emit('toggle-sidebar')"
        :aria-label="props.sidebarOpen ? 'Close navigation' : 'Open navigation'"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <img :src="LogoUrl" alt="MailTrace" class="mt-logo" draggable="false" />
      <span class="mt-title" title="Dashboard">
        {{ props.title }}
      </span>
    </div>

    <div class="mt-mnav-right">
      <button
        class="mt-avatar"
        :style="avatarGradientStyle"
        @click="emit('profile-click')"
        aria-label="Open profile"
      >
        <img
          v-if="props.avatarUrl"
          :src="props.avatarUrl"
          alt=""
          class="mt-avatar-img"
        />
        <img v-else :src="profileIcon" alt="" class="mt-avatar-icon" />
      </button>

      <button class="mt-bell" aria-label="Notifications">
        <svg viewBox="0 0 24 24" class="w-5 h-5">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0"
            fill="none"
            stroke="#47bfa9"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
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
  gap: 8px;
  min-width: 0;
}

.mt-logo {
  height: 28px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.mt-title {
  font-size: 18px;
  line-height: 1.3;
  font-weight: 500;
  color: #0c2d50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mt-mnav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Hamburger */
.mt-hamburger {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.mt-hamburger span {
  display: block;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: #0f172a;
}

/* Avatar */
.mt-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: none;
  padding: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mt-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mt-avatar-icon {
  width: 65%;
  height: 65%;
  object-fit: contain;
}

/* Bell */
.mt-bell {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: none;
  background: #f4f5f7;
  display: grid;
  place-items: center;
  cursor: pointer;
}
</style>
