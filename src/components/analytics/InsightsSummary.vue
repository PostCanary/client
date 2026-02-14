<!-- src/components/analytics/InsightsSummary.vue -->
<script setup lang="ts">
defineProps<{
  summary: string;
  generatedAt: string | null;
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
</script>

<template>
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
</style>
