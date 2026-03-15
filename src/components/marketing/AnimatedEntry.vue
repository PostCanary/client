<!-- src/components/marketing/AnimatedEntry.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    animation?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scaleIn";
    delay?: number;
    duration?: number;
    once?: boolean;
  }>(),
  {
    animation: "fadeUp",
    delay: 0,
    duration: 600,
    once: true,
  },
);

const motionVariants = {
  fadeUp: {
    initial: { opacity: 0, y: 30 },
    visibleOnce: { opacity: 1, y: 0 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    visibleOnce: { opacity: 1 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -40 },
    visibleOnce: { opacity: 1, x: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: 40 },
    visibleOnce: { opacity: 1, x: 0 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    visibleOnce: { opacity: 1, scale: 1 },
  },
};
</script>

<template>
  <div
    v-motion
    :initial="motionVariants[animation].initial"
    :visible-once="{
      ...motionVariants[animation].visibleOnce,
      transition: { duration: duration, delay: delay },
    }"
  >
    <slot />
  </div>
</template>
