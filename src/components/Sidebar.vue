<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";

/* Assets */
import LogoUrl from "@/assets/source-logo-02.png";
import OverviewIcon from "@/assets/sidebar/overview-icon.svg?url";
/*import RoiIcon from "@/assets/sidebar/roi-icon.svg?url";
import MatchIcon from "@/assets/sidebar/match-performance-icon.svg?url";
import CampaignIcon from "@/assets/sidebar/campaign-insights-icon.svg?url";*/
import HeatmapIcon from "@/assets/sidebar/heatmap-icon.svg?url";
/*import UploadsIcon from "@/assets/sidebar/uploads-mapping-icon.svg?url";
import ReportsIcon from "@/assets/sidebar/reports-exports-icon.svg?url";*/
import HistoryIcon from "@/assets/sidebar/history-icon.svg?url";
import SettingsIcon from "@/assets/sidebar/settings-icon.svg?url";
import LogoutIcon from "@/assets/sidebar/logout-icon.svg?url";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const emit = defineEmits<{
  (e: "navigate", path: string): void;
}>();

const items = [
  // ✅ /app/* because these routes live under MainLayout
  { to: "/dashboard", label: "Overview", icon: OverviewIcon },
  /*{ to: "/", label: "ROI Analytics", icon: RoiIcon },
  { to: "/", label: "Match Performance", icon: MatchIcon },
  { to: "/", label: "Campaign Insights", icon: CampaignIcon },*/
  { to: "/map", label: "Address Heatmap", icon: HeatmapIcon },
  { to: "/history", label: "History", icon: HistoryIcon },
  /*{ to: "/", label: "Uploads & Mapping", icon: UploadsIcon },
  { to: "/", label: "Reports & Exports", icon: ReportsIcon },*/
];

// ✅ make active state resilient (queries, future nested subroutes)
function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + "/");
}

function go(path: string) {
  router.push(path);
  emit("navigate", path); // lets the drawer know to close
}

// Tooltip helper: allow Overview + Heatmap + History, keep roadmap items "Coming Soon"
function getTooltip(label: string) {
  return label === "Overview" || label === "Address Heatmap" || label === "History"
    ? ""
    : "Coming Soon";
}

async function onLogoutClick() {
  await auth.logout();
  // Hard redirect to clear any in-memory state and reload
  window.location.href = "/";
}
</script>

<template>
  <aside class="sidebar-wrap">
    <nav class="sidebar-card">
      <div class="logo-row">
        <button class="logo-btn" @click="go('/')" type="button">
          <img :src="LogoUrl" :alt="BRAND.name" class="logo" draggable="false" />
        </button>
      </div>

      <hr class="sep" />

      <ul class="nav-list">
        <li v-for="i in items" :key="i.to">
          <button
            class="nav-btn cursor-pointer"
            :class="{ active: isActive(i.to) }"
            @click="go(i.to)"
            :title="getTooltip(i.label)"
            type="button"
          >
            <img class="icon" :src="i.icon" :alt="i.label" draggable="false" />
            <span class="label">{{ i.label }}</span>
          </button>
        </li>
      </ul>

      <hr class="sep sep-bottom" />

      <div class="bottom">
        <!-- ✅ /app/settings (Settings is also under MainLayout) -->
        <button
          class="nav-btn ghost"
          @click="go('/app/settings')"
          type="button"
        >
          <img class="icon" :src="SettingsIcon" alt="" draggable="false" />
          <span class="label">Settings</span>
        </button>

        <button class="nav-btn ghost" @click="onLogoutClick" type="button">
          <img class="icon" :src="LogoutIcon" alt="" draggable="false" />
          <span class="label">Sign Out</span>
        </button>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
/* In drawer mode we want it to just fill the drawer, not be sticky */
.sidebar-wrap {
  height: 100%;
}

/* Card container – let the parent (drawer) control width */
.sidebar-card {
  width: 100%;
  max-width: 318px; /* optional: keeps Figma width on wider drawers */
  height: 100%;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(12, 45, 80, 0.08);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.logo-row {
  padding: 2px 8px 4px;
}

/* Clickable logo */
.logo-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.logo {
  height: 64px;
  width: auto;
  object-fit: contain;
}

.sep {
  border: none;
  height: 1px;
  background: #47bfa9;
  margin: 6px 8px 8px;
  border-radius: 1px;
}
.sep-bottom {
  margin-top: 8px;
}

.nav-list {
  display: grid;
  row-gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav-btn {
  width: 100%;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 10px;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
  transition: background 120ms ease;
}
.nav-btn:hover {
  background: #f4f5f7;
}
.nav-btn.active {
  background: #f4f5f7;
  box-shadow: 0 1px 2px rgba(12, 45, 80, 0.06);
}

.icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}
.label {
  font-family: "Instrument Sans", system-ui, -apple-system, Segoe UI, Roboto,
    sans-serif;
  font-size: 16px;
  line-height: 19.5px;
  font-weight: 500;
  color: #47bfa9;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Bottom group pinned to the end */
.bottom {
  margin-top: auto;
  display: grid;
  row-gap: 6px;
  padding: 2px 0 2px;
}
.ghost .label {
  color: #47bfa9;
}
</style>
