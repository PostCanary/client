<script setup lang="ts">
import type { DemoRecommendation } from "@/api/demographics";

defineProps<{
  recommendations: DemoRecommendation[];
}>();

function barClass(strength: number): string {
  if (strength >= 70) return "high";
  if (strength >= 40) return "mid";
  if (strength >= 20) return "low";
  return "very-low";
}

function badgeClass(rec: string): string {
  switch (rec) {
    case "send_more": return "send-more";
    case "keep": return "keep";
    case "send_less": return "send-less";
    case "stop": return "stop";
    default: return "keep";
  }
}

function badgeLabel(rec: string): string {
  switch (rec) {
    case "send_more": return "Send More";
    case "keep": return "Keep As-Is";
    case "send_less": return "Send Less";
    case "stop": return "Stop Sending";
    default: return rec;
  }
}
</script>

<template>
  <div class="table-card" v-if="recommendations.length > 0">
    <div class="table-navy-header">
      <div>
        <h3>Who Should You Be Mailing?</h3>
        <div class="table-sub">Audiences ranked by how well they respond to your mailers</div>
      </div>
    </div>
    <table class="resp-table">
      <thead>
        <tr>
          <th>Audience</th>
          <th>% of Your Mailers</th>
          <th>% of Responses</th>
          <th>Response Strength</th>
          <th style="width: 160px"></th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in recommendations" :key="i">
          <td><strong>{{ row.segment }}</strong></td>
          <td>{{ row.pct_mailers }}%</td>
          <td>{{ row.pct_responses }}%</td>
          <td><strong>{{ row.strength_label }}</strong></td>
          <td>
            <div class="rate-bar-track">
              <div
                class="rate-bar-fill"
                :class="barClass(row.response_strength)"
                :style="{ width: `${row.response_strength}%` }"
              ></div>
            </div>
          </td>
          <td>
            <span class="badge" :class="badgeClass(row.recommendation)">
              {{ badgeLabel(row.recommendation) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-card {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
  overflow: hidden;
}

.table-navy-header {
  background: var(--app-navy, #0b2d50);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-navy-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.table-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
  margin-top: 2px;
}

.resp-table { width: 100%; border-collapse: collapse; }

.resp-table thead th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted, #94a3b8);
  padding: 12px 16px;
  border-bottom: 2px solid var(--app-bg, #f0f2f5);
  font-weight: 600;
  background: var(--app-card-bg, #fff);
}

.resp-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 13px;
  color: var(--app-text-body, #475569);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.resp-table tbody tr:last-child td { border-bottom: none; }
.resp-table tbody tr { transition: background 0.15s ease; }
.resp-table tbody tr:hover { background: rgba(71, 191, 169, 0.04); }
.resp-table td strong { color: var(--app-text, #0c2d50); font-weight: 600; }

.rate-bar-track {
  width: 100%;
  height: 4px;
  background: var(--app-border, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
}

.rate-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.rate-bar-fill.high { background: var(--app-teal, #47bfa9); }
.rate-bar-fill.mid { background: var(--app-text-muted, #94a3b8); }
.rate-bar-fill.low { background: #f59e0b; }
.rate-bar-fill.very-low { background: #ef4444; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge.send-more { background: rgba(71, 191, 169, 0.1); color: var(--app-teal, #47bfa9); }
.badge.keep { background: rgba(148, 163, 184, 0.1); color: var(--app-text-muted, #94a3b8); }
.badge.send-less { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.badge.stop { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

@media (max-width: 640px) {
  .resp-table { font-size: 12px; }
}
</style>
