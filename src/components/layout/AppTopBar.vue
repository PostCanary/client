<!-- src/components/layout/AppTopBar.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/useCampaignStore'
import { useSidebar } from '@/composables/useSidebar'
import { captureEvent } from '@/composables/usePostHog'
import CampaignManageModal from '@/components/CampaignManageModal.vue'
import OrgSwitcher from '@/components/OrgSwitcher.vue'

/* Icons */
import {
  MenuOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  NotificationsOutline,
  SettingsOutline,
  LogOutOutline,
} from '@vicons/ionicons5'

/* ── Props ──────────────────────────────────────────────── */
const props = defineProps<{
  title: string
  showCampaignFilter: boolean
}>()

const router = useRouter()
const auth = useAuthStore()
const { toggle, toggleMobile, isMobile, isCollapsed } = useSidebar()

/* ── Campaign store hydration (moved from Navbar.vue) ──── */
const campaignStore = useCampaignStore()
campaignStore.hydrate()
campaignStore.fetchCampaigns()

/* ── Campaign inline creation (logic from Navbar.vue) ──── */
const showNewCampaignInput = ref(false)
const newCampaignName = ref('')
const newCampaignInput = ref<HTMLInputElement | null>(null)
const showManageCampaigns = ref(false)

function onCampaignChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  if (val === '__new__') {
    showNewCampaignInput.value = true
    nextTick(() => newCampaignInput.value?.focus())
    ;(event.target as HTMLSelectElement).value = campaignStore.activeCampaignId ?? ''
    return
  }
  if (val === '__manage__') {
    showManageCampaigns.value = true
    ;(event.target as HTMLSelectElement).value = campaignStore.activeCampaignId ?? ''
    return
  }
  campaignStore.setActiveCampaign(val || null)
  captureEvent('topbar_campaign_filter_changed', { campaignId: val || null })
  window.dispatchEvent(new CustomEvent('mt:campaign-changed', { detail: { campaignId: val || null } }))
}

async function createNewCampaign() {
  const name = newCampaignName.value.trim()
  if (!name) {
    showNewCampaignInput.value = false
    return
  }
  try {
    const campaign = await campaignStore.createCampaign(name)
    campaignStore.setActiveCampaign(campaign.id)
    window.dispatchEvent(new CustomEvent('mt:campaign-changed', { detail: { campaignId: campaign.id } }))
  } catch (e) {
    console.error('Failed to create campaign', e)
  }
  newCampaignName.value = ''
  showNewCampaignInput.value = false
}

function cancelNewCampaign() {
  newCampaignName.value = ''
  showNewCampaignInput.value = false
}

/* ── Avatar dropdown ───────────────────────────────────── */
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const avatarBtnRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    captureEvent('topbar_user_dropdown_opened', {})
  }
}

function closeDropdown() {
  dropdownOpen.value = false
}

function handleSettingsClick() {
  router.push('/app/settings')
  closeDropdown()
}

async function handleLogoutClick() {
  await auth.logout()
  closeDropdown()
  window.location.href = '/'
}

function handleClickOutside(event: MouseEvent) {
  if (
    dropdownRef.value &&
    avatarBtnRef.value &&
    !dropdownRef.value.contains(event.target as Node) &&
    !avatarBtnRef.value.contains(event.target as Node)
  ) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

/* ── Notification placeholder ──────────────────────────── */
const notificationCount = ref(0)

/* ── Avatar initials ───────────────────────────────────── */
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name[0].toUpperCase()
}

/* ── Sidebar toggle handler ────────────────────────────── */
function onToggleClick() {
  if (isMobile.value) {
    toggleMobile()
  } else {
    toggle()
  }
}
</script>

<template>
  <div class="topbar" data-tour="topbar">
    <!-- Left: sidebar toggle -->
    <button class="topbar-toggle" @click="onToggleClick" type="button" aria-label="Toggle sidebar" :aria-expanded="!isCollapsed">
      <component :is="isMobile ? MenuOutline : (isCollapsed ? ChevronForwardOutline : ChevronBackOutline)" class="toggle-icon" />
    </button>

    <!-- Page title -->
    <h1 class="topbar-title">{{ title }}</h1>

    <!-- Campaign filter (Results pages only) -->
    <div v-if="showCampaignFilter" class="campaign-filter hidden sm:flex">
      <template v-if="showNewCampaignInput">
        <input
          ref="newCampaignInput"
          v-model="newCampaignName"
          type="text"
          placeholder="Campaign name…"
          class="campaign-input"
          @keydown.enter.prevent="createNewCampaign"
          @keydown.escape.prevent="cancelNewCampaign"
          @blur="createNewCampaign"
        />
      </template>
      <template v-else>
        <select
          class="campaign-select"
          :value="campaignStore.activeCampaignId ?? ''"
          @change="onCampaignChange"
        >
          <option value="">All Campaigns</option>
          <option
            v-for="c in campaignStore.campaigns"
            :key="c.id"
            :value="c.id"
          >
            {{ c.name }}
          </option>
          <option disabled>───────────</option>
          <option value="__new__">+ New Campaign</option>
          <option value="__manage__">Manage Campaigns</option>
        </select>
      </template>
    </div>

    <!-- Spacer -->
    <div class="topbar-spacer"></div>

    <!-- Org switcher -->
    <OrgSwitcher v-if="auth.hasMultipleOrgs" class="hidden sm:block ml-2" />

    <!-- Notification bell -->
    <button class="topbar-icon-btn" type="button" aria-label="Notifications" title="Notifications" @click="captureEvent('topbar_notification_bell_clicked', {})">
      <component :is="NotificationsOutline" class="topbar-icon" />
      <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
    </button>

    <!-- Avatar + user dropdown -->
    <div class="avatar-wrap">
      <button
        ref="avatarBtnRef"
        class="avatar-btn"
        @click="toggleDropdown"
        type="button"
        :aria-expanded="dropdownOpen"
      >
        <img
          v-if="auth.avatarUrl"
          :src="auth.avatarUrl"
          alt=""
          class="avatar-img"
        />
        <span v-else class="avatar-initials">{{ getInitials(auth.userName) }}</span>
        <span class="avatar-name hidden sm:inline">{{ auth.userName }}</span>
      </button>

      <!-- Dropdown -->
      <div v-if="dropdownOpen" ref="dropdownRef" class="avatar-dropdown">
        <button class="dropdown-item" @click="handleSettingsClick" type="button">
          <component :is="SettingsOutline" class="dropdown-icon" />
          <span>Settings</span>
        </button>
        <button class="dropdown-item" @click="handleLogoutClick" type="button">
          <component :is="LogOutOutline" class="dropdown-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>

    <!-- Campaign manage modal -->
    <CampaignManageModal :open="showManageCampaigns" @close="showManageCampaigns = false" />
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--topbar-height, 56px);
  padding: 0 16px;
  background: var(--app-card-bg, #ffffff);
  border-bottom: 1px solid var(--app-border, #e2e8f0);
}

/* ── Toggle button ────────────────────────────────────── */
.topbar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: var(--app-text-secondary, #64748b);
  transition: background 0.12s ease;
}

.topbar-toggle:hover {
  background: var(--sidebar-item-hover, #f4f5f7);
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

/* ── Page title ───────────────────────────────────────── */
.topbar-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin: 0;
  white-space: nowrap;
}

/* ── Campaign filter ──────────────────────────────────── */
.campaign-filter {
  align-items: center;
  margin-left: 8px;
}

.campaign-select {
  height: 36px;
  padding: 0 32px 0 12px;
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 8px;
  background: var(--app-card-bg, #ffffff);
  font-size: 13px;
  color: var(--app-text, #0c2d50);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.campaign-select:focus {
  outline: 2px solid var(--app-teal, #47bfa9);
  outline-offset: -1px;
}

.campaign-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--app-teal, #47bfa9);
  border-radius: 8px;
  font-size: 13px;
  color: var(--app-text, #0c2d50);
  width: 200px;
}

.campaign-input:focus {
  outline: 2px solid var(--app-teal, #47bfa9);
  outline-offset: -1px;
}

/* ── Spacer ───────────────────────────────────────────── */
.topbar-spacer {
  flex: 1;
}

/* ── Icon buttons ─────────────────────────────────────── */
.topbar-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: var(--app-text-secondary, #64748b);
  transition: background 0.12s ease;
}

.topbar-icon-btn:hover {
  background: var(--sidebar-item-hover, #f4f5f7);
}

.topbar-icon {
  width: 20px;
  height: 20px;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #dc2626;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  border-radius: 999px;
}

/* ── Avatar ───────────────────────────────────────────── */
.avatar-wrap {
  position: relative;
}

.avatar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  transition: background 0.12s ease;
}

.avatar-btn:hover {
  background: var(--sidebar-item-hover, #f4f5f7);
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.avatar-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text, #0c2d50);
  white-space: nowrap;
}

/* ── Avatar dropdown ──────────────────────────────────── */
.avatar-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 180px;
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(12, 45, 80, 0.12);
  padding: 4px;
  z-index: 200;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  color: var(--app-text, #0c2d50);
  text-align: left;
  transition: background 0.12s ease;
}

.dropdown-item:hover {
  background: var(--sidebar-item-hover, #f4f5f7);
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  color: var(--app-text-secondary, #64748b);
}

/* ── Mobile adjustments ───────────────────────────────── */
@media (max-width: 639px) {
  .topbar {
    padding: 0 12px;
    gap: 8px;
  }

  .topbar-title {
    font-size: 16px;
  }
}
</style>
