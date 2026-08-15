<!-- src/components/marketing/Reveal.vue -->
<script setup lang="ts">
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";

withDefaults(
  defineProps<{
    animation?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scaleIn";
    delay?: number;
    duration?: number;
  }>(),
  { animation: "fadeUp", delay: 0, duration: 600 },
);
</script>

<template>
  <AnimatedEntry
    :animation="animation"
    :delay="delay"
    :duration="duration"
    :once="true"
  >
    <slot />
  </AnimatedEntry>
</template>
