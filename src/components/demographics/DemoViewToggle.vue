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
  <div class="toggle-group">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="toggle-btn"
      :class="{ active: props.modelValue === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.toggle-group {
  display: inline-flex;
  background: var(--app-card-bg, #fff);
  border-radius: 10px;
  padding: 4px;
  box-shadow: var(--app-card-shadow);
}

.toggle-btn {
  padding: 8px 18px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  color: var(--app-text-muted, #94a3b8);
  font-family: inherit;
  transition: all 0.18s ease-out;
}

.toggle-btn.active {
  background: var(--app-navy, #0b2d50);
  color: #fff;
  box-shadow: 0 2px 6px rgba(11, 45, 80, 0.25);
}

.toggle-btn:not(.active):hover {
  color: var(--app-text-secondary, #64748b);
}
</style>
