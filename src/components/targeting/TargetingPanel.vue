<script setup lang="ts">
import { ref } from "vue";
import type { JobReference, TargetingFilters } from "@/types/campaign";
import PanelTabTarget from "./PanelTabTarget.vue";
import PanelTabFilters from "./PanelTabFilters.vue";
import PanelTabSummary from "./PanelTabSummary.vue";
import TargetingSummaryBar from "./TargetingSummaryBar.vue";

defineProps<{
  jobs: JobReference[];
  isNeighborGoal: boolean;
  radiusMiles: number;
  zips: string[];
  filters: TargetingFilters;
  excludePastCustomers: boolean;
  excludeMailedWithinDays: number | null;
  doNotMailCount: number;
  totalHouseholds: number;
  excludedPastCustomers: number;
  excludedRecentlyMailed: number;
  excludedDoNotMail: number;
  finalHouseholdCount: number;
  estimatedCostSequence: number;
  sequenceLength: number;
}>();

const emit = defineEmits<{
  (e: "toggle-job", jobId: string): void;
  (e: "select-all-jobs"): void;
  (e: "deselect-all-jobs"): void;
  (e: "radius-change", miles: number): void;
  (e: "add-zips", zips: string[]): void;
  (e: "remove-zip", zip: string): void;
  (e: "update:filters", filters: TargetingFilters): void;
  (e: "update:excludePastCustomers", val: boolean): void;
  (e: "update:excludeMailedWithinDays", val: number | null): void;
}>();

const collapsed = ref(false);
const activeTab = ref<"target" | "filters" | "summary">("target");

const tabs = [
  { key: "target" as const, label: "Select Area" },
  { key: "filters" as const, label: "Refine" },
  { key: "summary" as const, label: "Count & Cost" },
];
</script>

<template>
  <div
    class="relative bg-white border-l border-gray-200 transition-all duration-200 overflow-hidden flex flex-col"
    :style="{ width: collapsed ? '0px' : '360px' }"
  >
    <!-- Collapse toggle -->
    <button
      class="absolute -left-8 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-l-lg px-1.5 py-3 text-gray-400 hover:text-gray-600 shadow-sm"
      @click="collapsed = !collapsed"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 transition-transform"
        :class="collapsed ? 'rotate-180' : ''"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex-1 py-2.5 text-xs font-medium text-center transition-colors"
        :class="
          activeTab === tab.key
            ? 'text-[#47bfa9] border-b-2 border-[#47bfa9]'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="flex-1 overflow-y-auto">
      <PanelTabTarget
        v-if="activeTab === 'target'"
        :jobs="jobs"
        :is-neighbor-goal="isNeighborGoal"
        :radius-miles="radiusMiles"
        :zips="zips"
        @toggle-job="emit('toggle-job', $event)"
        @select-all-jobs="emit('select-all-jobs')"
        @deselect-all-jobs="emit('deselect-all-jobs')"
        @radius-change="emit('radius-change', $event)"
        @add-zips="emit('add-zips', $event)"
        @remove-zip="emit('remove-zip', $event)"
      />
      <PanelTabFilters
        v-if="activeTab === 'filters'"
        :filters="filters"
        :exclude-past-customers="excludePastCustomers"
        :exclude-mailed-within-days="excludeMailedWithinDays"
        :do-not-mail-count="doNotMailCount"
        @update:filters="emit('update:filters', $event)"
        @update:exclude-past-customers="emit('update:excludePastCustomers', $event)"
        @update:exclude-mailed-within-days="emit('update:excludeMailedWithinDays', $event)"
      />
      <PanelTabSummary
        v-if="activeTab === 'summary'"
        :total-households="totalHouseholds"
        :excluded-past-customers="excludedPastCustomers"
        :excluded-recently-mailed="excludedRecentlyMailed"
        :excluded-do-not-mail="excludedDoNotMail"
        :final-household-count="finalHouseholdCount"
      />
    </div>

    <!-- Always-visible summary bar (Knaflic: data at the decision point) -->
    <TargetingSummaryBar
      :final-household-count="finalHouseholdCount"
      :estimated-cost-sequence="estimatedCostSequence"
      :sequence-length="sequenceLength"
    />
  </div>
</template>
