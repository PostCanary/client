<!-- src/components/tour/TourManager.vue -->
<script setup lang="ts">
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useTour } from "@/composables/useTour";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { startTour } = useTour();

// Watcher 1: Auto-start tour after onboarding modal closes
watch(
  () => auth.onboardingOpen,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false && !auth.tourCompleted) {
      // Delay for modal exit animation
      setTimeout(() => {
        startTour();
      }, 600);
    }
  }
);

// Watcher 2: Start tour from query param (for replay from Help page)
watch(
  () => route.query.tour,
  (val) => {
    if (val === "1") {
      // Clear the query param
      router.replace({ ...route, query: { ...route.query, tour: undefined } });
      setTimeout(() => {
        startTour();
      }, 500);
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- Invisible orchestrator — no DOM output -->
</template>
