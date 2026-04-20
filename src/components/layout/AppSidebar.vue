<!-- src/components/layout/AppSidebar.vue -->
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebar } from '@/composables/useSidebar'
import { BRAND } from '@/config/brand'
import { captureEvent } from '@/composables/usePostHog'

/* Logo — cropped version for sidebar, bird portion for collapsed */
import LogoUrl from '@/assets/postcanary-logo.png'

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
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { isCollapsed } = useSidebar()

/* ── Navigation items ────────────────────────────────────── */
interface SidebarItem {
  to: string
  routeName: string
  label: string
  icon: 'svg' | 'component'
  svgSrc?: string
  component?: any
  section: 'home' | 'send' | 'results' | 'account'
}

const sidebarItems: SidebarItem[] = [
  // HOME (standalone, above sections)
  { to: '/app/home', routeName: 'AppHome', label: 'Home', icon: 'component', component: HomeOutline, section: 'home' },

  // SEND MAIL section
  { to: '/app/campaigns', routeName: 'Campaigns', label: 'Campaigns', icon: 'component', component: DocumentTextOutline, section: 'send' },
  { to: '/app/designs', routeName: 'Designs', label: 'Designs', icon: 'component', component: ColorPaletteOutline, section: 'send' },

  // RESULTS section
  { to: '/app/dashboard', routeName: 'Dashboard', label: 'Dashboard', icon: 'component', component: StatsChartOutline, section: 'results' },
  { to: '/app/map', routeName: 'Heatmap', label: 'Map', icon: 'component', component: MapOutline, section: 'results' },
  { to: '/app/analytics', routeName: 'Analytics', label: 'Analysis', icon: 'component', component: BarChartOutline, section: 'results' },
  { to: '/app/demographics', routeName: 'Demographics', label: 'Audience', icon: 'component', component: PeopleOutline, section: 'results' },
  { to: '/app/history', routeName: 'History', label: 'History', icon: 'component', component: TimeOutline, section: 'results' },

  // ACCOUNT section (pinned to bottom)
  { to: '/app/settings', routeName: 'Settings', label: 'Settings', icon: 'component', component: SettingsOutline, section: 'account' },
]

/* ── Section grouping ──────────────────────────────────── */
const homeItems = sidebarItems.filter(i => i.section === 'home')
const sendItems = sidebarItems.filter(i => i.section === 'send')
const resultsItems = sidebarItems.filter(i => i.section === 'results')
const accountItems = sidebarItems.filter(i => i.section === 'account')

/* ── Active detection (use route.name, not path — handles aliases) ── */
function isActive(routeName: string): boolean {
  return route.name === routeName
}

/* ── Navigation ────────────────────────────────────────── */
function navigate(path: string, label?: string, section?: string) {
  if (label) captureEvent('sidebar_item_clicked', { item: label, section: section || '', collapsed: isCollapsed.value })
  router.push(path)
}

function onSendPostcardsClick() {
  captureEvent('sidebar_send_postcards_clicked', { collapsed: isCollapsed.value })
  router.push('/app/send')
}

/* ── Sign out (same as existing Sidebar.vue) ────────────── */
async function onSignOut() {
  await auth.logout()
  window.location.href = '/'
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
          :src="LogoUrl"
          :alt="BRAND.name"
          class="logo-img"
          :class="{ 'logo-img--collapsed': isCollapsed }"
          draggable="false"
        />
      </button>
    </div>

    <!-- Home (standalone item, no section header) -->
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
          <component v-if="item.icon === 'component'" :is="item.component" class="item-icon item-icon--component" />
          <img v-else :src="item.svgSrc" alt="" class="item-icon item-icon--svg" draggable="false" />
          <span class="sidebar-label">{{ item.label }}</span>
        </button>
      </li>
    </ul>

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

    <!-- SEND MAIL section -->
    <div class="section-divider"></div>
    <span v-if="!isCollapsed" class="section-header">SEND MAIL</span>
    <ul class="nav-section">
      <li v-for="item in sendItems" :key="item.routeName">
        <button
          class="sidebar-item"
          :class="{ active: isActive(item.routeName) }"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          :title="isCollapsed ? item.label : undefined"
          :aria-label="item.label"
          @click="navigate(item.to, item.label, item.section)"
          type="button"
        >
          <component v-if="item.icon === 'component'" :is="item.component" class="item-icon item-icon--component" />
          <img v-else :src="item.svgSrc" alt="" class="item-icon item-icon--svg" draggable="false" />
          <span class="sidebar-label">{{ item.label }}</span>
        </button>
      </li>
    </ul>

    <!-- RESULTS section -->
    <div class="section-divider"></div>
    <span v-if="!isCollapsed" class="section-header">RESULTS</span>
    <ul class="nav-section">
      <li v-for="item in resultsItems" :key="item.routeName">
        <button
          class="sidebar-item"
          :class="{ active: isActive(item.routeName) }"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          :title="isCollapsed ? item.label : undefined"
          :aria-label="item.label"
          @click="navigate(item.to, item.label, item.section)"
          type="button"
        >
          <component v-if="item.icon === 'component'" :is="item.component" class="item-icon item-icon--component" />
          <img v-else :src="item.svgSrc" alt="" class="item-icon item-icon--svg" draggable="false" />
          <span class="sidebar-label">{{ item.label }}</span>
        </button>
      </li>
    </ul>

    <!-- Spacer to push account to bottom -->
    <div class="sidebar-spacer"></div>

    <!-- ACCOUNT section (bottom-pinned) -->
    <div class="section-divider"></div>
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
          <component v-if="item.icon === 'component'" :is="item.component" class="item-icon item-icon--component" />
          <img v-else :src="item.svgSrc" alt="" class="item-icon item-icon--svg" draggable="false" />
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
  background: var(--app-card-bg, #ffffff);
  border-right: 1px solid var(--app-border, #e2e8f0);
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--sidebar-transition, 0.2s ease-out);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width, 64px);
  padding: 12px 8px;
}

/* ── Logo ─────────────────────────────────────────────── */
.sidebar-logo {
  padding: 4px 4px 8px;
  display: flex;
  justify-content: center;
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
  height: 44px;
  width: auto;
  object-fit: contain;
  transition: all 0.2s ease-out;
}

.logo-img--collapsed {
  height: 44px;
  width: 36px;
  object-fit: cover;
  object-position: 0% center;
  clip-path: inset(0 0 0 0);
}

/* ── CTA Button ("+ Send Postcards") ─────────────────── */
.sidebar-cta {
  padding: 4px 0 8px;
}

.cta-expanded {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.cta-expanded:hover {
  background: var(--app-teal-hover, #3aa893);
}

.cta-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease;
}

.cta-collapsed:hover {
  background: var(--app-teal-hover, #3aa893);
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
  color: var(--sidebar-section-text, var(--app-text-muted, #94a3b8));
  padding: 4px 12px 4px;
  white-space: nowrap;
}

.section-divider {
  height: 1px;
  background: var(--sidebar-border, var(--app-border, #e2e8f0));
  margin: 4px 8px;
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

/* ── Sidebar items ────────────────────────────────────── */
.sidebar-item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text, #0c2d50);
  transition: background 0.12s ease;
  white-space: nowrap;
}

.sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: 10px 8px;
}

.sidebar-item:hover {
  background: var(--sidebar-item-hover, #f4f5f7);
}

/* Active state */
.sidebar-item.active {
  background: var(--sidebar-item-active-bg, rgba(71, 191, 169, 0.08));
  color: var(--sidebar-item-active-text, var(--app-teal, #47bfa9));
  font-weight: 600;
}

/* Active indicator bar */
.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--app-teal, #47bfa9);
  border-radius: 0 2px 2px 0;
}

/* ── Icons ────────────────────────────────────────────── */
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
  color: var(--app-teal, #47bfa9);
}

.sidebar-item.active .item-icon--component {
  color: var(--sidebar-item-active-text, var(--app-teal, #47bfa9));
}

/* ── Labels (hidden when collapsed) ───────────────────── */
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

/* ── Spacer ───────────────────────────────────────────── */
.sidebar-spacer {
  flex: 1;
}
</style>
