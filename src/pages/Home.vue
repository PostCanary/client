<!-- src/pages/Home.vue -->
<script setup lang="ts">
import HomeHero from "@/components/home/HomeHero.vue";
import HomePainPoints from "@/components/home/HomePainPoints.vue";
import HomeVisualize from "@/components/home/HomeVisualize.vue";
import HomePricing from "@/components/home/HomePricing.vue";
import HomeFooter from "@/components/home/HomeFooter.vue";
</script>

<template>
  <div class="min-h-screen">
    <HomeHero />
    <HomePainPoints />
    <HomeVisualize />
    <HomePricing />
    <HomeFooter />
  </div>
</template>
