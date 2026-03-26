<template>
  <div class="preview-banner" role="status" aria-live="polite">
    <div class="preview-banner__copy">
      <p class="preview-banner__eyebrow">Preview ready</p>
      <h2 class="preview-banner__title">View Your Analytics - Select a Plan Now!</h2>
      <p class="preview-banner__body">
        Your upload is ready. Pick a plan to unlock the dashboard, AI insights,
        demographics, and heatmap for the mail you just ran.
      </p>
    </div>

    <button
      type="button"
      class="preview-banner__cta"
      @click="$emit('select-plan')"
    >
      Select a Plan Now
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: "select-plan"): void;
}>();
</script>

<style scoped>
.preview-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto 16px;
  padding: 16px 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(71, 191, 169, 0.12), rgba(11, 45, 80, 0.08)),
    #ffffff;
  box-shadow: 0 18px 48px rgba(11, 45, 80, 0.08);
}

.preview-banner__copy {
  min-width: 0;
}

.preview-banner__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
}

.preview-banner__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
  color: #0b2d50;
}

.preview-banner__body {
  margin: 8px 0 0;
  max-width: 720px;
  font-size: 14px;
  line-height: 1.55;
  color: #475569;
}

.preview-banner__cta {
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: #0b2d50;
  box-shadow: 0 10px 24px rgba(11, 45, 80, 0.18);
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  cursor: pointer;
}

.preview-banner__cta:hover {
  background: #113a67;
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(11, 45, 80, 0.22);
}

.preview-banner__cta:focus-visible {
  outline: 3px solid rgba(71, 191, 169, 0.45);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .preview-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
  }

  .preview-banner__title {
    font-size: 18px;
  }

  .preview-banner__cta {
    width: 100%;
    justify-content: center;
  }
}
</style>
