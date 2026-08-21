<script setup lang="ts">
import type { DemographicView } from "@/api/demographics";

const props = defineProps<{
  modelValue: DemographicView;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: DemographicView): void;
}>();

const options: { label: string; value: DemographicView }[] = [
  { label: "Matches", value: "matches" },
  { label: "All Customers", value: "all_customers" },
];
</script>

<template>
  <div class="toggle-group" role="tablist" aria-label="Demographic view">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      class="toggle-btn"
      :class="{ active: props.modelValue === opt.value }"
      :aria-selected="props.modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.toggle-group {
  display: inline-flex;
  gap: 0;
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  padding: 3px;
  box-shadow: none;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--app-card-radius, 2px);
  color: var(--app-text-muted, #8a97a8);
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.toggle-btn.active {
  background: var(--app-navy, #1c2430);
  color: #fff;
}

.toggle-btn:not(.active):hover {
  color: var(--app-text, #1c2430);
}

.toggle-btn:focus-visible {
  outline: 2px solid var(--app-focus-ring, #1c2430);
  outline-offset: 2px;
}
</style>
