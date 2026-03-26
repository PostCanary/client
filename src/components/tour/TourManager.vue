<!-- src/components/tour/TourManager.vue -->
<script setup lang="ts">
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTour } from "@/composables/useTour";

const route = useRoute();
const router = useRouter();
const { startTour } = useTour();

// Start tour only from an explicit replay trigger.
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
