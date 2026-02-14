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
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow, 0 1px 3px rgba(12,45,80,.06), 0 8px 24px rgba(12,45,80,.04));
  padding: 24px;
  border-left: 4px solid var(--app-teal, #47bfa9);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(71, 191, 169, 0.1);
  color: var(--app-teal, #47bfa9);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.summary-date {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.summary-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--app-text-body, #475569);
  margin: 0;
}

/* Data context metadata */
.data-context {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border, #e2e8f0);
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.data-context span {
  white-space: nowrap;
}

.data-context span:not(:last-child)::after {
  content: "|";
  margin-left: 16px;
  color: var(--app-border, #e2e8f0);
}

/* Sufficiency banners */
.sufficiency-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--app-card-radius, 12px);
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.sufficiency-banner.limited {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
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
  color: var(--app-text-muted, #94a3b8);
  margin-bottom: 8px;
  font-style: italic;
}
</style>
