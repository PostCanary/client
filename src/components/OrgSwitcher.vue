<!-- src/components/OrgSwitcher.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useOrgStore } from "@/stores/org";

const auth = useAuthStore();
const orgStore = useOrgStore();

const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const switching = ref<string | null>(null);

const currentOrgName = computed(() => auth.orgName || "Organization");
const orgs = computed(() => auth.orgs);
const currentOrgId = computed(() => auth.orgId);

async function onSwitch(orgId: string) {
  if (orgId === currentOrgId.value || switching.value) return;

  switching.value = orgId;
  try {
    await orgStore.switchOrg(orgId);
    open.value = false;
    // Hard reload to refresh all data for the new org context
    window.location.reload();
  } catch (err) {
    console.error("[OrgSwitcher] switchOrg failed", err);
    switching.value = null;
  }
}

function toggle() {
  open.value = !open.value;
}

function handleClickOutside(event: MouseEvent) {
  if (
    dropdownRef.value &&
    triggerRef.value &&
    !dropdownRef.value.contains(event.target as Node) &&
    !triggerRef.value.contains(event.target as Node)
  ) {
    open.value = false;
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
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="org-switcher-btn"
      @click.stop="toggle"
    >
      <svg
        class="h-4 w-4 shrink-0 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
      <span class="truncate max-w-[120px]">{{ currentOrgName }}</span>
      <svg
        class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform"
        :class="{ 'rotate-180': open }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Dropdown -->
    <div v-if="open" ref="dropdownRef" class="org-switcher-dropdown" @click.stop>
      <div class="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
        Organizations
      </div>
      <div class="py-1">
        <button
          v-for="org in orgs"
          :key="org.id"
          type="button"
          class="org-switcher-item"
          :class="{
            'org-switcher-item-active': org.id === currentOrgId,
          }"
          :disabled="switching !== null"
          @click="onSwitch(org.id)"
        >
          <span class="truncate">{{ org.name }}</span>
          <svg
            v-if="org.id === currentOrgId"
            class="h-4 w-4 shrink-0 text-[#47bfa9]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span
            v-if="switching === org.id"
            class="text-xs text-slate-400"
          >
            Switching...
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.org-switcher-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #0c2d50;
  cursor: pointer;
  transition: border-color 0.15s ease;
  white-space: nowrap;
}

.org-switcher-btn:hover {
  border-color: #47bfa9;
}

.org-switcher-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 200px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(12, 45, 80, 0.12),
    0 4px 16px rgba(12, 45, 80, 0.08);
  z-index: 1000;
  overflow: hidden;
}

.org-switcher-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 14px;
  text-align: left;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #0c2d50;
  cursor: pointer;
  transition: background 0.15s ease;
}

.org-switcher-item:hover {
  background: #f4f5f7;
}

.org-switcher-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.org-switcher-item-active {
  background: #f0fdf9;
}
</style>
