<script setup lang="ts">
import { computed } from "vue";
import type { JobReference } from "@/types/campaign";

const props = defineProps<{
  jobs: JobReference[];
  radiusMiles: number;
}>();

const emit = defineEmits<{
  (e: "toggle", jobId: string): void;
  (e: "select-all"): void;
  (e: "deselect-all"): void;
  (e: "radius-change", miles: number): void;
}>();

const selectedCount = computed(
  () => props.jobs.filter((j) => j.selected).length,
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-[#0b2d50]">Around My Jobs</h4>
      <span class="text-xs text-gray-400">
        {{ selectedCount }} of {{ jobs.length }} selected
      </span>
    </div>

    <!-- Radius slider -->
    <div>
      <label class="text-xs text-gray-500">
        Radius: {{ radiusMiles }} mile{{ radiusMiles !== 1 ? "s" : "" }}
      </label>
      <input
        type="range"
        :value="radiusMiles"
        min="0.25"
        max="2"
        step="0.25"
        class="w-full accent-[#47bfa9]"
        @input="emit('radius-change', parseFloat(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- Select/Deselect all -->
    <div class="flex gap-2 text-xs">
      <button class="text-[#47bfa9] hover:underline" @click="emit('select-all')">
        Select All
      </button>
      <button class="text-gray-400 hover:underline" @click="emit('deselect-all')">
        Deselect All
      </button>
    </div>

    <!-- Job list -->
    <div class="space-y-1 max-h-48 overflow-y-auto">
      <label
        v-for="job in jobs"
        :key="job.id"
        class="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
      >
        <input
          type="checkbox"
          :checked="job.selected"
          class="mt-0.5 accent-[#47bfa9]"
          @change="emit('toggle', job.id)"
        />
        <div class="flex-1 min-w-0">
          <div class="text-[#0b2d50] truncate" :title="job.address">{{ job.address }}</div>
          <div class="text-xs text-gray-400">
            {{ job.serviceType }} · {{ formatDate(job.jobDate) }}
          </div>
        </div>
      </label>
    </div>
  </div>
</template>
