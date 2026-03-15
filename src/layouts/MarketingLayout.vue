<!-- src/layouts/MarketingLayout.vue -->
<script setup lang="ts">
import MarketingNavbar from "@/components/marketing/MarketingNavbar.vue";
import MarketingFooter from "@/components/marketing/MarketingFooter.vue";
</script>

<template>
  <div class="mkt-page min-h-screen flex flex-col bg-[var(--mkt-bg)] text-[var(--mkt-text)]">
    <MarketingNavbar />
    <main class="flex-1">
      <RouterView />
    </main>
    <MarketingFooter />
  </div>
</template>
