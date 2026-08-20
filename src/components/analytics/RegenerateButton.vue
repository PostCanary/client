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
  padding: 10px 16px;
  border-radius: var(--app-card-radius, 2px);
  border: 1px solid var(--app-border, #c8d0db);
  background: var(--app-card-bg, #f7f9fb);
  color: var(--app-text-secondary, #5a6b7d);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
  font-family: inherit;
}

.regen-btn:hover:not(:disabled) {
  border-color: var(--pc-navy, #1c2430);
  color: var(--pc-navy, #1c2430);
  background: #fff;
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
