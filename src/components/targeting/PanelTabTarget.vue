<script setup lang="ts">
import type { JobReference } from "@/types/campaign";
import JobSelector from "./JobSelector.vue";
import ZipInput from "./ZipInput.vue";

const props = defineProps<{
  jobs: JobReference[];
  radiusMiles: number;
  zips: string[];
}>();

const emit = defineEmits<{
  (e: "toggle-job", jobId: string): void;
  (e: "select-all-jobs"): void;
  (e: "deselect-all-jobs"): void;
  (e: "radius-change", miles: number): void;
  (e: "add-zips", zips: string[]): void;
  (e: "remove-zip", zip: string): void;
}>();
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- Around My Jobs -->
    <JobSelector
      :jobs="jobs"
      :radius-miles="radiusMiles"
      @toggle="emit('toggle-job', $event)"
      @select-all="emit('select-all-jobs')"
      @deselect-all="emit('deselect-all-jobs')"
      @radius-change="emit('radius-change', $event)"
    />

    <hr class="border-gray-100" />

    <!-- Draw on Map -->
    <div>
      <h4 class="text-sm font-semibold text-[#0b2d50] mb-2">
        Draw on Map
      </h4>
      <p class="text-xs text-gray-500">
        Use the drawing tools on the map to draw circles, rectangles, or
        polygons. Drawn shapes combine with jobs and ZIP codes.
      </p>
    </div>

    <hr class="border-gray-100" />

    <!-- Enter ZIP Codes -->
    <div>
      <h4 class="text-sm font-semibold text-[#0b2d50] mb-2">
        Enter ZIP Codes
      </h4>
      <ZipInput
        :zips="zips"
        @add="emit('add-zips', $event)"
        @remove="emit('remove-zip', $event)"
      />
    </div>
  </div>
</template>
