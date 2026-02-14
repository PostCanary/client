<script setup lang="ts">
import type { DemoRecommendation, ConfidenceTier } from "@/api/demographics";

defineProps<{
  recommendations: DemoRecommendation[];
  confidenceTier: ConfidenceTier;
}>();

function strengthColor(label: string): string {
  switch (label) {
    case "Strong": return "strong";
    case "Above Average": return "above-avg";
    case "Average": return "average";
    case "Below Average": return "below-avg";
    case "Weak": return "weak";
    case "Low Confidence": return "low-conf";
    default: return "average";
  }
}

function recClass(rec: string): string {
  switch (rec) {
    case "Increase Volume": return "increase";
    case "Keep As-Is": return "keep";
    case "Decrease Volume": return "decrease";
    default: return "keep";
  }
}
</script>

<template>
  <div class="table-card" v-if="recommendations.length > 0 && confidenceTier !== 'insufficient'">
    <div class="table-navy-header">
      <div>
        <h3>Who Should You Be Mailing?</h3>
        <div class="table-sub">Audiences ranked by how well they convert from your mailers</div>
      </div>
    </div>

    <!-- Desktop Table -->
    <table class="resp-table desktop-table">
      <thead>
        <tr>
          <th>Audience</th>
          <th>% of Your Mailers</th>
          <th>% of Matches</th>
          <th>Segment Match Rate</th>
          <th>Response Strength</th>
          <th>Lift</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in recommendations" :key="i">
          <td><strong>{{ row.segment }}</strong></td>
          <td>{{ row.pct_mailers }}%</td>
          <td>{{ row.pct_matches }}%</td>
          <td>{{ row.segment_match_rate != null ? `${row.segment_match_rate}%` : '—' }}</td>
          <td>
            <span class="strength-badge" :class="strengthColor(row.response_strength)">
              {{ row.response_strength }}
            </span>
          </td>
          <td><strong>{{ row.lift_text }}</strong></td>
          <td>
            <span
              v-if="row.recommendation !== '—'"
              class="badge"
              :class="recClass(row.recommendation)"
            >
              {{ row.recommendation }}
            </span>
            <span v-else class="muted">—</span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile Cards -->
    <div class="mobile-cards">
      <div v-for="(row, i) in recommendations" :key="i" class="mobile-card">
        <div class="mobile-card-header">
          <strong>{{ row.segment }}</strong>
          <span
            v-if="row.recommendation !== '—'"
            class="badge"
            :class="recClass(row.recommendation)"
          >
            {{ row.recommendation }}
          </span>
        </div>
        <div class="mobile-card-stats">
          <div class="mobile-stat">
            <span class="mobile-stat-label">% of Mailers</span>
            <span class="mobile-stat-value">{{ row.pct_mailers }}%</span>
          </div>
          <div class="mobile-stat">
            <span class="mobile-stat-label">% of Matches</span>
            <span class="mobile-stat-value">{{ row.pct_matches }}%</span>
          </div>
          <div class="mobile-stat">
            <span class="mobile-stat-label">Match Rate</span>
            <span class="mobile-stat-value">{{ row.segment_match_rate != null ? `${row.segment_match_rate}%` : '—' }}</span>
          </div>
          <div class="mobile-stat">
            <span class="mobile-stat-label">Lift</span>
            <span class="mobile-stat-value"><strong>{{ row.lift_text }}</strong></span>
          </div>
          <div class="mobile-stat">
            <span class="mobile-stat-label">Strength</span>
            <span class="strength-badge" :class="strengthColor(row.response_strength)">
              {{ row.response_strength }}
            </span>
          </div>
        </div>
      </div>
    </div>
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

/* Desktop Table */
.resp-table { width: 100%; border-collapse: collapse; }

.resp-table thead th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted, #94a3b8);
  padding: 12px 14px;
  border-bottom: 2px solid var(--app-bg, #f0f2f5);
  font-weight: 600;
  background: var(--app-card-bg, #fff);
}

.resp-table tbody td {
  padding: 12px 14px;
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

/* Strength badges */
.strength-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.strength-badge.strong { background: rgba(16, 185, 129, 0.1); color: #059669; }
.strength-badge.above-avg { background: rgba(16, 185, 129, 0.06); color: #34d399; }
.strength-badge.average { background: rgba(148, 163, 184, 0.1); color: var(--app-text-muted, #94a3b8); }
.strength-badge.below-avg { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.strength-badge.weak { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
.strength-badge.low-conf { background: rgba(148, 163, 184, 0.08); color: var(--app-text-muted, #94a3b8); font-style: italic; }

/* Recommendation badges */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge.increase { background: rgba(71, 191, 169, 0.1); color: var(--app-teal, #47bfa9); }
.badge.keep { background: rgba(148, 163, 184, 0.1); color: var(--app-text-muted, #94a3b8); }
.badge.decrease { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

.muted { color: var(--app-text-muted, #94a3b8); }

/* Mobile Cards */
.mobile-cards { display: none; }

.mobile-card {
  padding: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.mobile-card:last-child { border-bottom: none; }

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mobile-card-header strong {
  font-size: 14px;
  color: var(--app-text, #0c2d50);
}

.mobile-card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mobile-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted, #94a3b8);
  font-weight: 600;
}

.mobile-stat-value {
  font-size: 13px;
  color: var(--app-text-body, #475569);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .desktop-table { display: none; }
  .mobile-cards { display: block; }
}
</style>
