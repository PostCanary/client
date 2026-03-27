<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { GOAL_DEFAULTS, PRICING } from "@/types/campaign";
import type { TargetingSelection, TargetingFilters, JobReference } from "@/types/campaign";
import TargetingMap from "@/components/targeting/TargetingMap.vue";
import TargetingPanel from "@/components/targeting/TargetingPanel.vue";
import {
  MOCK_JOBS,
  estimateHouseholds,
  circleAreaSqMiles,
  zipAreaSqMiles,
  applyFilterReductions,
  mockPastCustomersInArea,
  mockRecipientBreakdown,
} from "@/data/mockTargetingData";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const mapRef = ref<InstanceType<typeof TargetingMap> | null>(null);

// Initialize from draft or defaults
const goalType = computed(() => draftStore.draft?.goal?.goalType ?? "neighbor_marketing");
const goalDefaults = computed(() => GOAL_DEFAULTS[goalType.value]);

// State
const jobs = ref<JobReference[]>(
  draftStore.draft?.targeting?.jobsUsed ?? [...MOCK_JOBS],
);
const radiusMiles = ref(draftStore.draft?.targeting?.jobRadiusMiles ?? 0.5);
const zips = ref<string[]>([]);
const filters = ref<TargetingFilters>(
  draftStore.draft?.targeting?.filters ?? {
    homeowner: null,
    homeValueMin: null,
    homeValueMax: null,
    yearBuiltMin: null,
    yearBuiltMax: null,
    propertyTypes: [],
  },
);
const excludePastCustomers = ref(
  draftStore.draft?.targeting?.excludePastCustomers ?? goalDefaults.value.includePastCustomers === false,
);
const excludeMailedWithinDays = ref<number | null>(
  draftStore.draft?.targeting?.excludeMailedWithinDays ?? goalDefaults.value.frequencyExclusionDays,
);
const doNotMailCount = 7; // mock

// Computed counts
const selectedJobs = computed(() => jobs.value.filter((j) => j.selected));

const rawArea = computed(() => {
  let area = 0;
  // Job radii areas
  area += selectedJobs.value.length * circleAreaSqMiles(radiusMiles.value);
  // ZIP areas
  area += zips.value.length * zipAreaSqMiles();
  // Drawn areas from map (approximate from composable)
  const mapAreas = mapRef.value?.areas ?? [];
  for (const a of mapAreas) {
    if (a.type === "circle" && a.radiusMiles) {
      area += circleAreaSqMiles(a.radiusMiles);
    } else if (a.type === "zip") {
      area += zipAreaSqMiles();
    } else {
      area += 2; // rough estimate for drawn shapes
    }
  }
  return area;
});

const totalHouseholds = computed(() => estimateHouseholds(rawArea.value));
const filteredHouseholds = computed(() =>
  applyFilterReductions(totalHouseholds.value, filters.value),
);
const pastInArea = computed(() => mockPastCustomersInArea(filteredHouseholds.value));
const excludedPast = computed(() => excludePastCustomers.value ? pastInArea.value : 0);
const excludedRecent = computed(() => Math.round(filteredHouseholds.value * 0.03));
const finalHouseholdCount = computed(() =>
  Math.max(filteredHouseholds.value - excludedPast.value - excludedRecent.value - doNotMailCount, 0),
);

// Debounced commit to draft store
let commitTimer: ReturnType<typeof setTimeout> | null = null;

function commitTargeting() {
  if (commitTimer) clearTimeout(commitTimer);
  commitTimer = setTimeout(() => {
    const seqLen = draftStore.draft?.goal?.sequenceLength ?? 3;
    const perCard = PRICING.payPerSend;

    const targeting: TargetingSelection = {
      campaignGoal: goalType.value,
      serviceType: draftStore.draft?.goal?.serviceType ?? null,
      sequenceLength: seqLen,
      sequenceSpacingDays: draftStore.draft?.goal?.sequenceSpacingDays ?? 14,
      areas: mapRef.value?.areas ?? [],
      method: determineMethod(),
      filters: { ...filters.value },
      jobsUsed: selectedJobs.value.length > 0 ? selectedJobs.value : null,
      jobRadiusMiles: selectedJobs.value.length > 0 ? radiusMiles.value : null,
      excludePastCustomers: excludePastCustomers.value,
      excludeMailedWithinDays: excludeMailedWithinDays.value,
      doNotMailCount,
      totalHouseholds: totalHouseholds.value,
      excludedPastCustomers: excludedPast.value,
      excludedRecentlyMailed: excludedRecent.value,
      excludedDoNotMail: doNotMailCount,
      finalHouseholdCount: finalHouseholdCount.value,
      pastCustomersInArea: pastInArea.value,
      recipientBreakdown: mockRecipientBreakdown(
        finalHouseholdCount.value,
        excludePastCustomers.value,
      ),
      estimatedCostSingle: finalHouseholdCount.value * perCard,
      estimatedCostSequence: finalHouseholdCount.value * perCard * seqLen,
      savedAudienceName: null,
    };
    draftStore.setTargeting(targeting);
  }, 1000);
}

function determineMethod(): "draw" | "zip" | "around_jobs" | "combined" {
  const hasJobs = selectedJobs.value.length > 0;
  const hasZips = zips.value.length > 0;
  const hasDrawn = (mapRef.value?.areas ?? []).length > 0;
  const count = [hasJobs, hasZips, hasDrawn].filter(Boolean).length;
  if (count > 1) return "combined";
  if (hasJobs) return "around_jobs";
  if (hasZips) return "zip";
  return "draw";
}

// Watch for changes and auto-commit
watch(
  [selectedJobs, radiusMiles, zips, filters, excludePastCustomers, excludeMailedWithinDays],
  commitTargeting,
  { deep: true },
);

// Job actions
function toggleJob(jobId: string) {
  const job = jobs.value.find((j) => j.id === jobId);
  if (job) {
    job.selected = !job.selected;
    updateMapJobs();
  }
}

function selectAllJobs() {
  jobs.value.forEach((j) => (j.selected = true));
  updateMapJobs();
}

function deselectAllJobs() {
  jobs.value.forEach((j) => (j.selected = false));
  updateMapJobs();
}

function updateMapJobs() {
  const selected = selectedJobs.value;
  mapRef.value?.addJobRadii(selected, radiusMiles.value);
}

function addZips(newZips: string[]) {
  zips.value.push(...newZips);
  mapRef.value?.highlightZips(zips.value);
}

function removeZip(zip: string) {
  zips.value = zips.value.filter((z) => z !== zip);
  mapRef.value?.highlightZips(zips.value);
}

function onRadiusChange(miles: number) {
  radiusMiles.value = miles;
  updateMapJobs();
}

onMounted(() => {
  if (!brandKitStore.hydrated) brandKitStore.fetch();
  // Initial commit if resuming with data
  if (draftStore.draft?.targeting) {
    // Already have targeting data — don't overwrite on mount
  }
});
</script>

<template>
  <div class="flex h-full">
    <!-- Map (takes remaining space) -->
    <div class="flex-1 relative">
      <TargetingMap
        ref="mapRef"
        @areas-changed="commitTargeting"
      />
    </div>

    <!-- Panel -->
    <TargetingPanel
      :jobs="jobs"
      :radius-miles="radiusMiles"
      :zips="zips"
      :filters="filters"
      :exclude-past-customers="excludePastCustomers"
      :exclude-mailed-within-days="excludeMailedWithinDays"
      :do-not-mail-count="doNotMailCount"
      :total-households="totalHouseholds"
      :excluded-past-customers="excludedPast"
      :excluded-recently-mailed="excludedRecent"
      :excluded-do-not-mail="doNotMailCount"
      :final-household-count="finalHouseholdCount"
      @toggle-job="toggleJob"
      @select-all-jobs="selectAllJobs"
      @deselect-all-jobs="deselectAllJobs"
      @radius-change="onRadiusChange"
      @add-zips="addZips"
      @remove-zip="removeZip"
      @update:filters="filters = $event"
      @update:exclude-past-customers="excludePastCustomers = $event"
      @update:exclude-mailed-within-days="excludeMailedWithinDays = $event"
    />
  </div>
</template>
