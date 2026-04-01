<!-- src/components/app-home/HomeSkeleton.vue -->
<script setup lang="ts">
</script>

<template>
  <div class="skeleton-wrap">
    <!-- Greeting skeleton -->
    <div class="skeleton-line skeleton-line--lg" style="width: 280px"></div>
    <div class="skeleton-line" style="width: 200px; margin-top: 6px"></div>

    <!-- Recommendation card skeleton -->
    <div class="skeleton-card skeleton-card--large">
      <div class="skeleton-line skeleton-line--sm" style="width: 80px"></div>
      <div class="skeleton-line skeleton-line--lg" style="width: 240px; margin-top: 8px"></div>
      <div class="skeleton-line" style="width: 100%; margin-top: 12px"></div>
      <div class="skeleton-line" style="width: 85%; margin-top: 6px"></div>
      <div class="skeleton-stats">
        <div class="skeleton-stat">
          <div class="skeleton-line skeleton-line--lg" style="width: 60px"></div>
          <div class="skeleton-line skeleton-line--sm" style="width: 80px; margin-top: 4px"></div>
        </div>
        <div class="skeleton-stat">
          <div class="skeleton-line skeleton-line--lg" style="width: 50px"></div>
          <div class="skeleton-line skeleton-line--sm" style="width: 90px; margin-top: 4px"></div>
        </div>
      </div>
      <div class="skeleton-line skeleton-line--btn" style="width: 160px; margin-top: 12px"></div>
    </div>

    <!-- Quick actions skeleton -->
    <div class="skeleton-actions">
      <div class="skeleton-card skeleton-card--action" v-for="n in 4" :key="n">
        <div class="skeleton-circle"></div>
        <div class="skeleton-line" style="width: 80px; margin-top: 6px"></div>
      </div>
    </div>

    <!-- Campaign card skeleton -->
    <div class="skeleton-card">
      <div class="skeleton-line" style="width: 60%"></div>
      <div class="skeleton-bar"></div>
      <div class="skeleton-line skeleton-line--sm" style="width: 40%"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line--sm {
  height: 10px;
}

.skeleton-line--lg {
  height: 20px;
}

.skeleton-line--btn {
  height: 36px;
  border-radius: 8px;
}

.skeleton-card {
  background: var(--app-card-bg, #ffffff);
  border: 1px solid var(--app-border, #e2e8f0);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-card--large {
  padding: 24px;
}

.skeleton-card--action {
  align-items: center;
  padding: 16px 12px;
}

.skeleton-stats {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.skeleton-stat {
  display: flex;
  flex-direction: column;
}

.skeleton-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.skeleton-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-bar {
  height: 6px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  border-radius: 999px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
