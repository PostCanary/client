<!-- src/components/analytics/RegenerateButton.vue -->
<script setup lang="ts">
defineProps<{
  regenerating: boolean;
}>();

const emit = defineEmits<{
  (e: "regenerate"): void;
}>();
</script>

<template>
  <div class="regen-container">
    <button
      class="regen-btn"
      :disabled="regenerating"
      @click="emit('regenerate')"
    >
      <svg
        v-if="regenerating"
        class="regen-spinner"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <svg
        v-else
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
      <span>{{ regenerating ? "Regenerating..." : "Regenerate Insights" }}</span>
    </button>
  </div>
</template>

<style scoped>
.regen-container {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.regen-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid var(--app-border, #e2e8f0);
  background: var(--app-card-bg, #fff);
  color: var(--app-text-secondary, #64748b);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.regen-btn:hover:not(:disabled) {
  border-color: var(--app-teal, #47bfa9);
  color: var(--app-teal, #47bfa9);
}

.regen-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.regen-spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
