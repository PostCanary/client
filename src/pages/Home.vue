<!-- src/pages/Home.vue -->
<!-- SEO title/description stay on the Home route meta in router.ts (seoMeta("/")). -->
<script setup lang="ts">
import HeroSection from "@/components/marketing/sections/HeroSection.vue";
import StorySection from "@/components/marketing/sections/StorySection.vue";
import StatsSection from "@/components/marketing/sections/StatsSection.vue";
import FeaturesSection from "@/components/marketing/sections/FeaturesSection.vue";
import EddmSection from "@/components/marketing/sections/EddmSection.vue";
import TargetedMailSection from "@/components/marketing/sections/TargetedMailSection.vue";
import AnalyticsSection from "@/components/marketing/sections/AnalyticsSection.vue";
import PricingSection from "@/components/marketing/sections/PricingSection.vue";
import ClosingCta from "@/components/marketing/sections/ClosingCta.vue";
</script>

<template>
  <div>
    <HeroSection />
    <StorySection />
    <StatsSection />
    <FeaturesSection />
    <EddmSection />
    <TargetedMailSection />
    <AnalyticsSection />
    <PricingSection />
    <ClosingCta />
  </div>
</template>
