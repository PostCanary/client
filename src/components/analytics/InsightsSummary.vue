<!-- src/components/analytics/InsightsSummary.vue -->
<script setup lang="ts">
import type { DataContext } from "@/api/analytics";

defineProps<{
  summary: string;
  generatedAt: string | null;
  dataContext: DataContext | null;
}>();

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDateRange(dr: DataContext["date_range"]): string {
  if (!dr) return "";
  const fmt = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    } catch { return s; }
  };
  return `${fmt(dr.earliest_mail)} – ${fmt(dr.latest_job)}`;
}
</script>

<template>
  <div>
    <!-- Sufficiency warning -->
    <div v-if="dataContext?.sufficiency === 'limited'" class="sufficiency-banner limited">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <strong>Limited data available</strong>
        <span v-for="w in dataContext.warnings" :key="w"> — {{ w }}</span>
      </div>
    </div>

    <div v-else-if="dataContext?.sufficiency === 'moderate'" class="sufficiency-note">
      Moderate dataset — some patterns may strengthen with more data.
    </div>

    <div class="summary-card">
      <div class="summary-header">
        <div class="summary-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h3>AI Analysis</h3>
          <span class="summary-date" v-if="generatedAt">
            Generated {{ formatDate(generatedAt) }}
          </span>
        </div>
      </div>
      <p class="summary-text">{{ summary }}</p>

      <!-- Data context metadata -->
      <div v-if="dataContext" class="data-context">
        <span v-if="dataContext.total_matches">{{ dataContext.total_matches }} matches</span>
        <span v-if="dataContext.total_mail">{{ dataContext.total_mail }} mailers</span>
        <span v-if="dataContext.unique_addresses">{{ dataContext.unique_addresses }} addresses</span>
        <span v-if="dataContext.date_range">{{ formatDateRange(dataContext.date_range) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  box-shadow: none;
  padding: 22px 24px;
  border-left: 3px solid var(--pc-canary, #facf41);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--app-card-radius, 2px);
  background: rgba(250, 207, 65, 0.16);
  color: var(--pc-navy, #1c2430);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-header h3 {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
  margin: 0;
}

.summary-date {
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
}

.summary-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--app-text-body, #3d4a5c);
  margin: 0;
}

/* Data context metadata */
.data-context {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border, #c8d0db);
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
}

.data-context span {
  white-space: nowrap;
}

.data-context span:not(:last-child)::after {
  content: "|";
  margin-left: 16px;
  color: var(--app-border, #c8d0db);
}

/* Sufficiency banners */
.sufficiency-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--app-card-radius, 2px);
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.sufficiency-banner.limited {
  background: rgba(250, 207, 65, 0.18);
  color: var(--pc-navy, #1c2430);
  border: 1px solid rgba(250, 207, 65, 0.45);
}

.sufficiency-banner svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.sufficiency-banner strong {
  font-weight: 600;
}

.sufficiency-note {
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
  margin-bottom: 8px;
}
</style>
