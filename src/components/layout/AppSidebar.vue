<!-- src/components/layout/AppSidebar.vue -->
<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCampaignDraftListStore } from '@/stores/useCampaignDraftListStore'
import { useSidebar } from '@/composables/useSidebar'
import { BRAND } from '@/config/brand'
import { captureEvent } from '@/composables/usePostHog'
import { logoutAndLeave } from '@/utils/sessionLogout'

/* Logo — dark-shell wordmark; bird crop when collapsed */
import LogoDarkUrl from '@/assets/brand/logo-webheader-dark.png'
import LogoMarkUrl from '@/assets/brand/mark-512.png'

/* Sidebar icons — all sourced from @vicons/ionicons5 so they share a single
 * CSS color variable (currentColor via inline SVG rendering). Mixing
 * inline-svg components with <img src="*.svg"> baked-in-fill SVGs produced
 * the teal-vs-navy inconsistency Drake caught in S69 — some items rendered
 * teal (via CSS), others stayed navy (fill="#0C2D50" hardcoded in the SVG).
 * Using one icon source (Ionicons components) eliminates the class. */
import {
  HomeOutline,
  DocumentTextOutline,
  ColorPaletteOutline,
  BarChartOutline,
  PeopleOutline,
  AddOutline,
  StatsChartOutline,
  MapOutline,
  TimeOutline,
  SettingsOutline,
  LogOutOutline,
  BanOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const draftListStore = useCampaignDraftListStore()
const { count: draftCount } = storeToRefs(draftListStore)
const { isCollapsed, isMobile, closeMobile } = useSidebar()

watch(
  () => auth.orgId,
  (orgId) => {
    draftListStore.setActiveOrg(orgId)
    if (orgId) void draftListStore.refresh(orgId)
  },
  { immediate: true },
)

/* ── Navigation items ────────────────────────────────────── */
interface SidebarItem {
  to: string
  routeName: string
  label: string
  component: any
  section: 'home' | 'send' | 'analytics' | 'account'
}

const sidebarItems: SidebarItem[] = [
  { to: '/app/home', routeName: 'AppHome', label: 'Home', component: HomeOutline, section: 'home' },

  { to: '/app/campaigns', routeName: 'Campaigns', label: 'Campaigns', component: DocumentTextOutline, section: 'send' },
  { to: '/app/designs', routeName: 'Designs', label: 'Designs', component: ColorPaletteOutline, section: 'send' },

  { to: '/app/dashboard', routeName: 'Dashboard', label: 'Dashboard', component: StatsChartOutline, section: 'analytics' },
  { to: '/app/map', routeName: 'Heatmap', label: 'Map', component: MapOutline, section: 'analytics' },
  { to: '/app/analytics', routeName: 'Analytics', label: 'Analysis', component: BarChartOutline, section: 'analytics' },
  { to: '/app/demographics', routeName: 'Demographics', label: 'Audience', component: PeopleOutline, section: 'analytics' },
  { to: '/app/history', routeName: 'History', label: 'Upload History', component: TimeOutline, section: 'analytics' },

  { to: '/app/audience/do-not-mail', routeName: 'DoNotMail', label: 'Do Not Mail', component: BanOutline, section: 'account' },
  { to: '/app/team', routeName: 'Team', label: 'Team', component: PeopleOutline, section: 'account' },
  { to: '/app/settings', routeName: 'Settings', label: 'Settings', component: SettingsOutline, section: 'account' },
]

/* ── Section grouping ──────────────────────────────────── */
const homeItems = sidebarItems.filter(i => i.section === 'home')
const sendItems = sidebarItems.filter(i => i.section === 'send')
const analyticsItems = sidebarItems.filter(i => i.section === 'analytics')
const accountItems = sidebarItems.filter(i => i.section === 'account')
const analyticsRouteNames = new Set(analyticsItems.map(item => item.routeName))

/* ── Active detection (use route.name, not path — handles aliases) ── */
function isActive(routeName: string): boolean {
  return route.name === routeName
}

function isAnalyticsRoute(): boolean {
  return analyticsRouteNames.has(String(route.name ?? ''))
}

function itemAccessibleLabel(item: SidebarItem): string {
  if (
    item.routeName === 'Campaigns' &&
    draftCount.value !== null &&
    draftCount.value > 0
  ) {
    return `${item.label}, ${draftCount.value} campaign ${
      draftCount.value === 1 ? 'draft' : 'drafts'
    }`
  }
  return item.label
}

/* ── Navigation ────────────────────────────────────────── */
function navigate(path: string, label?: string, section?: string) {
  if (label) captureEvent('sidebar_item_clicked', { item: label, section: section || '', collapsed: isCollapsed.value })
  router.push(path)
  if (isMobile.value) closeMobile('navigation')
}

function onSendPostcardsClick() {
  captureEvent('sidebar_send_postcards_clicked', { collapsed: isCollapsed.value })
  router.push('/app/send')
  if (isMobile.value) closeMobile('navigation')
}

function onAnalyticsClick() {
  captureEvent('sidebar_item_clicked', { item: 'Analytics', section: 'analytics', collapsed: isCollapsed.value })
  router.push('/app/dashboard')
  if (isMobile.value) closeMobile('navigation')
}

/* ── Sign out (same as existing Sidebar.vue) ────────────── */
async function onSignOut() {
  await logoutAndLeave()
}
</script>

<template>
  <nav
    class="sidebar"
    :class="{ collapsed: isCollapsed }"
    data-tour="sidebar"
    aria-label="Main navigation"
  >
    <!-- Logo -->
    <div class="sidebar-logo">
      <button class="logo-btn" @click="navigate('/app/home')" type="button" :title="BRAND.name">
        <img
          v-if="isCollapsed"
          :src="LogoMarkUrl"
          :alt="BRAND.name"
          class="logo-img logo-img--mark"
          draggable="false"
        />
        <img
          v-else
          :src="LogoDarkUrl"
          :alt="BRAND.name"
          class="logo-img"
          draggable="false"
        />
      </button>
    </div>

    <p v-if="!isCollapsed" class="nav-label">Home</p>
    <ul class="nav-section">
      <li v-for="item in homeItems" :key="item.routeName">
        <button
          class="sidebar-item"
          :class="{ active: isActive(item.routeName) }"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          :title="isCollapsed ? item.label : undefined"
          :aria-label="item.label"
          @click="navigate(item.to, item.label, item.section)"
          type="button"
        >
          <component :is="item.component" class="item-icon item-icon--component" />
          <span class="sidebar-label">{{ item.label }}</span>
        </button>
      </li>
    </ul>

    <p v-if="!isCollapsed" class="nav-label">Send</p>
    <!-- "+ Send Postcards" button -->
    <div class="sidebar-cta">
      <button
        v-if="isCollapsed"
        class="cta-collapsed"
        @click="onSendPostcardsClick"
        title="Send Postcards"
        type="button"
      >
        <component :is="AddOutline" class="cta-icon" />
      </button>
      <button
        v-else
        class="cta-expanded"
        @click="onSendPostcardsClick"
        type="button"
      >
        <component :is="AddOutline" class="cta-icon-sm" />
        <span class="sidebar-label">Send Postcards</span>
      </button>
    </div>

    <ul class="nav-section">
      <li v-for="item in sendItems" :key="item.routeName">
        <button
          class="sidebar-item"
          :class="{ active: isActive(item.routeName) }"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          :title="isCollapsed ? itemAccessibleLabel(item) : undefined"
          :aria-label="itemAccessibleLabel(item)"
          @click="navigate(item.to, item.label, item.section)"
          type="button"
        >
          <component :is="item.component" class="item-icon item-icon--component" />
          <span class="sidebar-label">{{ item.label }}</span>
          <span
            v-if="
              item.routeName === 'Campaigns' &&
              draftCount !== null &&
              draftCount > 0
            "
            class="draft-count-badge"
            data-testid="sidebar-draft-count"
            aria-hidden="true"
          >
            {{ draftCount }}
          </span>
        </button>
      </li>
    </ul>

    <p v-if="!isCollapsed" class="nav-label">Analytics</p>
    <!-- Analytics is a destination and the parent of the existing result pages.
         Route-derived expansion handles aliases, direct links, and refreshes. -->
    <ul class="nav-section">
      <li>
        <button
          class="sidebar-item analytics-parent"
          :class="{ active: isAnalyticsRoute() }"
          :title="isCollapsed ? 'Analytics' : undefined"
          aria-label="Analytics"
          aria-controls="analytics-submenu"
          :aria-expanded="isAnalyticsRoute()"
          @click="onAnalyticsClick"
          type="button"
        >
          <component :is="BarChartOutline" class="item-icon item-icon--component" />
          <span class="sidebar-label">Analytics</span>
        </button>

        <ul v-if="isAnalyticsRoute()" id="analytics-submenu" class="analytics-submenu">
          <li v-for="item in analyticsItems" :key="item.routeName">
            <button
              class="sidebar-item analytics-submenu-item"
              :class="{ active: isActive(item.routeName) }"
              :aria-current="isActive(item.routeName) ? 'page' : undefined"
              :title="isCollapsed ? item.label : undefined"
              :aria-label="item.label"
              @click="navigate(item.to, item.label, item.section)"
              type="button"
            >
              <component :is="item.component" class="item-icon item-icon--component" />
              <span class="sidebar-label">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </li>
    </ul>

    <!-- Spacer to push account to bottom -->
    <div class="sidebar-spacer"></div>

    <p v-if="!isCollapsed" class="nav-label nav-label--account">Account</p>
    <ul class="nav-section nav-section--bottom">
      <li v-for="item in accountItems" :key="item.routeName">
        <button
          class="sidebar-item"
          :class="{ active: isActive(item.routeName) }"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          :title="isCollapsed ? item.label : undefined"
          :aria-label="item.label"
          @click="navigate(item.to, item.label, item.section)"
          type="button"
        >
          <component :is="item.component" class="item-icon item-icon--component" />
          <span class="sidebar-label">{{ item.label }}</span>
        </button>
      </li>
      <li>
        <button
          class="sidebar-item"
          :title="isCollapsed ? 'Sign Out' : undefined"
          @click="onSignOut"
          type="button"
        >
          <component :is="LogOutOutline" class="item-icon item-icon--component" />
          <span class="sidebar-label">Sign Out</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width, 240px);
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg, var(--pc-navy, #1c2430));
  border-right: 1px solid var(--sidebar-border, rgba(255, 255, 255, 0.08));
  padding: 16px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--sidebar-transition, 0.2s ease-out);
  color: var(--sidebar-item-text, #aeb8c4);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width, 64px);
  padding: 16px 8px;
}

/* ── Logo ─────────────────────────────────────────────── */
.sidebar-logo {
  padding: 4px 8px 14px;
  display: flex;
  justify-content: flex-start;
  border-bottom: 1px solid var(--sidebar-border, rgba(255, 255, 255, 0.08));
  margin-bottom: 12px;
}

.sidebar.collapsed .sidebar-logo {
  justify-content: center;
  padding: 4px 0 14px;
}

.logo-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.logo-img {
  height: 36px;
  width: auto;
  max-width: 168px;
  object-fit: contain;
}

.logo-img--mark {
  height: 32px;
  width: 32px;
  object-fit: contain;
}

.nav-label {
  margin: 10px 10px 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sidebar-section-text, #8a96a4);
}

.nav-label--account {
  margin-top: 0;
}

/* ── CTA Button ("+ Send Postcards") ─────────────────── */
.sidebar-cta {
  padding: 4px 0 10px;
}

.cta-expanded {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  background: var(--pc-canary, #facf41);
  color: var(--pc-navy, #1c2430);
  font-weight: 700;
  font-size: 13.5px;
  border: none;
  border-radius: var(--app-card-radius, 2px);
  cursor: pointer;
  transition: filter 0.15s ease, background 0.15s ease;
}

.cta-expanded:hover {
  filter: brightness(0.96);
}

.cta-expanded:focus-visible,
.cta-collapsed:focus-visible {
  outline: 2px solid var(--pc-canary, #facf41);
  outline-offset: 2px;
}

.cta-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  background: var(--pc-canary, #facf41);
  color: var(--pc-navy, #1c2430);
  border: none;
  border-radius: var(--app-card-radius, 2px);
  cursor: pointer;
  transition: filter 0.15s ease;
}

.cta-collapsed:hover {
  filter: brightness(0.96);
}

.cta-icon {
  width: 20px;
  height: 20px;
}

.cta-icon-sm {
  width: 16px;
  height: 16px;
}

/* ── Section headers ──────────────────────────────────── */
.section-header {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--sidebar-section-text, #8a96a4);
  padding: 4px 12px 4px;
  white-space: nowrap;
}

.section-divider {
  height: 1px;
  background: var(--sidebar-border, rgba(255, 255, 255, 0.08));
  margin: 8px 8px 10px;
}

.sidebar.collapsed .section-divider {
  margin: 8px 4px;
}

/* ── Nav sections ─────────────────────────────────────── */
.nav-section {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-section--bottom {
  padding-bottom: 4px;
}

.analytics-submenu {
  list-style: none;
  margin: 2px 0 0;
  padding: 0 0 0 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  margin-left: 18px;
}

.analytics-submenu-item {
  font-size: 13px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.analytics-submenu-item .item-icon {
  width: 18px;
  height: 18px;
}

.sidebar.collapsed .analytics-submenu {
  padding-left: 0;
  margin-left: 0;
  border-left: none;
}

/* ── Sidebar items ────────────────────────────────────── */
.sidebar-item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--app-card-radius, 2px);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--sidebar-item-text, #aeb8c4);
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
  font-family: inherit;
}

.sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: 10px 8px;
}

.sidebar-item:hover {
  background: var(--sidebar-item-hover, rgba(255, 255, 255, 0.06));
  color: #fff;
}

.sidebar-item:focus-visible {
  outline: 2px solid var(--pc-canary, #facf41);
  outline-offset: 1px;
}

.sidebar-item.active {
  background: var(--sidebar-item-active-bg, rgba(250, 207, 65, 0.14));
  color: var(--sidebar-item-active-text, var(--pc-canary, #facf41));
  font-weight: 600;
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--pc-canary, #facf41);
  border-radius: 0 2px 2px 0;
}

.item-icon {
  flex-shrink: 0;
}

.item-icon--svg {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.item-icon--component {
  width: 22px;
  height: 22px;
  color: var(--sidebar-icon, #8a96a8);
}

.sidebar-item:hover .item-icon--component {
  color: #fff;
}

.sidebar-item.active .item-icon--component {
  color: var(--sidebar-icon-active, var(--pc-canary, #facf41));
}

.sidebar-label {
  transition: opacity 0.15s ease-out;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .sidebar-label {
  opacity: 0;
  width: 0;
  pointer-events: none;
}

.draft-count-badge {
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #dc2626;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.sidebar.collapsed .draft-count-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  font-size: 10px;
}

.sidebar-spacer {
  flex: 1;
  min-height: 12px;
}
</style>
