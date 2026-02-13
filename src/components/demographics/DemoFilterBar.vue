<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  start?: string;
  end?: string;
}>();

const emit = defineEmits<{
  (e: "update:start", v: string | undefined): void;
  (e: "update:end", v: string | undefined): void;
}>();

type Preset = "all" | "90d" | "6m" | "1y";
const activePreset = ref<Preset>("all");
const customOpen = ref(false);
const customFrom = ref(props.start || "2024-01-01");
const customTo = ref(props.end || new Date().toISOString().split("T")[0]);

const rangeLabel = computed(() => {
  switch (activePreset.value) {
    case "90d": return "Last 90 days";
    case "6m": return "Last 6 months";
    case "1y": return "Last year";
    default: return "All uploads included";
  }
});

function selectPreset(preset: Preset) {
  activePreset.value = preset;
  customOpen.value = false;

  const today = new Date();
  const to = today.toISOString().split("T")[0];

  if (preset === "all") {
    emit("update:start", undefined);
    emit("update:end", undefined);
    return;
  }

  let from: Date;
  if (preset === "90d") {
    from = new Date(today);
    from.setDate(from.getDate() - 90);
  } else if (preset === "6m") {
    from = new Date(today);
    from.setMonth(from.getMonth() - 6);
  } else {
    from = new Date(today);
    from.setFullYear(from.getFullYear() - 1);
  }

  const fromStr = from.toISOString().split("T")[0];
  customFrom.value = fromStr;
  customTo.value = to;
  emit("update:start", fromStr);
  emit("update:end", to);
}

function applyCustom() {
  activePreset.value = "all"; // deselect presets
  emit("update:start", customFrom.value);
  emit("update:end", customTo.value);
}

const presets: { label: string; value: Preset }[] = [
  { label: "All Time", value: "all" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last Year", value: "1y" },
];
</script>

<template>
  <div class="filter-bar">
    <span class="filter-bar-label">Time Range</span>

    <div class="filter-presets">
      <button
        v-for="p in presets"
        :key="p.value"
        class="preset-btn"
        :class="{ active: activePreset === p.value }"
        @click="selectPreset(p.value)"
      >
        {{ p.label }}
      </button>
    </div>

    <div class="filter-divider"></div>

    <button
      class="filter-custom-toggle"
      :class="{ open: customOpen }"
      @click="customOpen = !customOpen"
    >
      Custom
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="customOpen" class="filter-dates">
      <label>From</label>
      <input type="date" v-model="customFrom" />
      <label>To</label>
      <input type="date" v-model="customTo" />
      <button class="filter-apply" @click="applyCustom">Apply</button>
    </div>

    <div class="filter-spacer"></div>

    <div class="filter-range-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span class="range-text">{{ rangeLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  background: var(--app-card-bg, #fff);
  border-radius: var(--app-card-radius, 12px);
  box-shadow: var(--app-card-shadow);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-bar-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text, #0c2d50);
  margin-right: 4px;
  white-space: nowrap;
}

.filter-presets { display: flex; gap: 6px; }

.preset-btn {
  padding: 6px 14px;
  border: 1px solid var(--app-border, #e2e8f0);
  background: var(--app-card-bg, #fff);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-body, #475569);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.preset-btn:hover { border-color: var(--app-border-medium, #dde3ea); background: #f8f9fa; }
.preset-btn.active { background: var(--app-navy, #0b2d50); color: #fff; border-color: var(--app-navy, #0b2d50); }

.filter-divider { width: 1px; height: 28px; background: var(--app-border, #e2e8f0); margin: 0 4px; }

.filter-custom-toggle {
  padding: 6px 14px;
  border: 1px solid var(--app-border, #e2e8f0);
  background: var(--app-card-bg, #fff);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-body, #475569);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-custom-toggle:hover { border-color: var(--app-border-medium, #dde3ea); background: #f8f9fa; }
.filter-custom-toggle.open { background: var(--app-bg, #f0f2f5); border-color: var(--app-border-medium, #dde3ea); }
.filter-custom-toggle.open svg { transform: rotate(180deg); }
.filter-custom-toggle svg { transition: transform 0.18s ease; }

.filter-dates {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-dates label { font-size: 12px; font-weight: 500; color: var(--app-text-muted, #94a3b8); }
.filter-dates input[type="date"] {
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  color: var(--app-text, #0c2d50);
  background: var(--app-card-bg, #fff);
  transition: border-color 0.15s ease;
  outline: none;
}
.filter-dates input[type="date"]:focus { border-color: var(--app-teal, #47bfa9); }

.filter-apply {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: var(--app-teal, #47bfa9);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.filter-apply:hover { background: #3aa893; }

.filter-spacer { flex: 1; }

.filter-range-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(71, 191, 169, 0.08);
  border: 1px solid rgba(71, 191, 169, 0.2);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--app-teal, #47bfa9);
}

.range-text { white-space: nowrap; }

@media (max-width: 1024px) {
  .filter-spacer { display: none; }
  .filter-range-badge { display: none; }
}

@media (max-width: 640px) {
  .filter-bar { padding: 12px 16px; }
  .filter-presets { width: 100%; overflow-x: auto; }
  .filter-divider { display: none; }
  .filter-custom-toggle { width: 100%; justify-content: center; }
}
</style>
