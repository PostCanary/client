<script setup lang="ts">
import type { TopAreaRanking } from "@/composables/useRunData";

const props = defineProps<{
  modelValue: TopAreaRanking;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: TopAreaRanking): void;
}>();

const options: { label: string; value: TopAreaRanking }[] = [
  { label: "Total Matches", value: "matches" },
  { label: "Conversion Rate", value: "match_rate" },
];
</script>

<template>
  <div class="toggle-group" aria-label="Top area ranking mode">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
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
  background: #fff;
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  padding: 3px;
  box-shadow: none;
}

.toggle-btn {
  padding: 7px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: var(--app-card-radius, 2px);
  color: var(--app-text-muted, #8a97a8);
  font-family: inherit;
  transition: background 0.15s ease, color 0.15s ease;
}

.toggle-btn.active {
  background: var(--app-navy, #1c2430);
  color: #fff;
  box-shadow: none;
}

.toggle-btn:not(.active):hover {
  color: var(--app-text, #1c2430);
}

.toggle-btn:focus-visible {
  outline: 2px solid var(--app-focus-ring, #1c2430);
  outline-offset: 1px;
}
</style>
