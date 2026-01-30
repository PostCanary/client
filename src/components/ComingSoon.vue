<template>
  <div class="coming-soon-container">
    <h1 class="coming-soon-title">Coming Soon</h1>
  </div>
</template>

<script setup lang="ts">
// Simple Coming Soon component
</script>

<style scoped>
.coming-soon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: #f4f5f7;
}

.coming-soon-title {
  font-size: 4rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

@media (max-width: 640px) {
  .coming-soon-title {
    font-size: 2.5rem;
  }
}
</style>
