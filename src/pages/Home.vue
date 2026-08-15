<!-- src/pages/Home.vue -->
<script setup lang="ts">
import HomeHero from "@/components/home/HomeHero.vue";
import HomePainPoints from "@/components/home/HomePainPoints.vue";
import HomeVisualize from "@/components/home/HomeVisualize.vue";
import HomeHowItWorks from "@/components/home/HomeHowItWorks.vue";
import HomePricing from "@/components/home/HomePricing.vue";
import HomeCTA from "@/components/home/HomeCTA.vue";
</script>

<template>
  <div>
    <HomeHero />
    <HomePainPoints />
    <HomeVisualize />
    <HomeHowItWorks />
    <HomePricing />
    <HomeCTA />
  </div>
</template>
