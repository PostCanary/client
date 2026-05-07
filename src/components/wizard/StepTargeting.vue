<script setup lang="ts">
import { ref, computed, watch, provide, onMounted, nextTick } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { GOAL_DEFAULTS, PRICING } from "@/types/campaign";
import type { TargetingSelection, TargetingFilters, JobReference, EddmSelection } from "@/types/campaign";
import TargetingMap from "@/components/targeting/TargetingMap.vue";
import TargetingPanel from "@/components/targeting/TargetingPanel.vue";
import EddmTargetingPanel from "@/components/targeting/EddmTargetingPanel.vue";
import { useHouseholdCount } from "@/composables/useHouseholdCount";
import { HOUSEHOLD_COUNT_KEY } from "@/injection-keys";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const mapRef = ref<InstanceType<typeof TargetingMap> | null>(null);

const isEddmMode = computed(() => draftStore.draft?.campaignType === 'eddm');

// Household count composable — replaces mock area-based estimation
const {
  count: apiCount,
  totalCount: apiTotalCount,
  filteredCount: apiFilteredCount,
  exclusions: apiExclusions,
  loading: countLoading,
  error: countError,
  source: countSource,
  fetchCount,
  fetchTotalIfNeeded,
} = useHouseholdCount();

// Provide loading/error/source for child components via inject
provide(HOUSEHOLD_COUNT_KEY, {
  loading: countLoading,
  error: countError,
  source: countSource,
  fetchTotalIfNeeded,
});

// Initialize from draft or defaults
const goalType = computed(() => draftStore.draft?.goal?.goalType ?? "neighbor_marketing");
const goalDefaults = computed(() => GOAL_DEFAULTS[goalType.value]);

// State — only pre-select jobs for neighbor marketing goal
const isNeighborGoal = computed(() => goalType.value === "neighbor_marketing");
const jobs = ref<JobReference[]>(draftStore.draft?.targeting?.jobsUsed ?? []);
const radiusMiles = ref(draftStore.draft?.targeting?.jobRadiusMiles ?? 0.5);
const zips = ref<string[]>([]);
// S69 demo prep: HVAC default presets. Applied when the draft has no
// filters yet OR filters exist but every field is null/empty (the
// "untouched-new-draft" signature). Once any field is customized, the
// stored filters win. Post-demo: replace with industry->preset mapping
// keyed off brandKit.industry (mem 562).
const HVAC_PRESET_FILTERS: TargetingFilters = {
  homeowner: "homeowner",
  homeValueMin: 150000,
  homeValueMax: 800000,
  yearBuiltMin: null,
  yearBuiltMax: 2010,
  propertyTypes: ["Single Family"],
  hhageMin: null,
  hhageMax: null,
  incomeMin: null,
  loresMin: null,
  loresMax: null,
};

function filtersAreUntouched(f: TargetingFilters | undefined): boolean {
  if (!f) return true;
  return (
    f.homeowner === null &&
    f.homeValueMin === null &&
    f.homeValueMax === null &&
    f.yearBuiltMin === null &&
    f.yearBuiltMax === null &&
    f.propertyTypes.length === 0 &&
    (f.hhageMin ?? null) === null &&
    (f.hhageMax ?? null) === null &&
    (f.incomeMin ?? null) === null &&
    (f.loresMin ?? null) === null &&
    (f.loresMax ?? null) === null
  );
}

const filters = ref<TargetingFilters>(
  filtersAreUntouched(draftStore.draft?.targeting?.filters)
    ? { ...HVAC_PRESET_FILTERS, propertyTypes: [...HVAC_PRESET_FILTERS.propertyTypes] }
    : draftStore.draft!.targeting!.filters!,
);
const excludePastCustomers = ref(
  draftStore.draft?.targeting?.excludePastCustomers ?? goalDefaults.value.includePastCustomers === false,
);
const excludeMailedWithinDays = ref<number | null>(
  draftStore.draft?.targeting?.excludeMailedWithinDays ?? goalDefaults.value.frequencyExclusionDays,
);
// S131: read from server response (still a placeholder server-side until
// real DNM-list table lands in Sprint 1.5 — see postcanary-todo.md).
const doNotMailCount = computed(() => apiExclusions.value.doNotMail);

// Computed counts — only count jobs toward targeting for neighbor marketing
const selectedJobs = computed(() =>
  isNeighborGoal.value ? jobs.value.filter((j) => j.selected) : [],
);

// Collect all targeting areas (drawn + job radii + ZIPs) for API calls
const allAreas = computed(() => {
  const areas = [...(mapRef.value?.areas ?? [])];
  // Add job radii as circle areas
  for (const job of selectedJobs.value) {
    areas.push({
      type: 'job_radius' as const,
      coordinates: [[job.lat, job.lng]],
      radiusMiles: radiusMiles.value,
    });
  }
  // Add ZIPs
  for (const zip of zips.value) {
    areas.push({
      type: 'zip' as const,
      coordinates: [],
      zipCode: zip,
    });
  }
  return areas;
});

const hasNonZipAreas = computed(() => allAreas.value.some((a) => a.type !== 'zip'));

// Use API count as the final household count.
// S131: exclusion numbers come from the server response (apiExclusions) so
// the breakdown line items match the math. The "Past customers" toggle
// gates whether the server-supplied past-customer count is subtracted from
// the displayed final (composable's `count` already nets all three out;
// when the toggle is OFF we add `pastCustomers` back to surface a higher
// final count). Until the toggle wires through to the API request itself
// (Sprint 1.5 follow-up — see postcanary-todo.md), this is a client-side
// approximation but uses real server numbers, not made-up percentages.
const totalHouseholds = computed(() => apiTotalCount.value || apiFilteredCount.value || apiCount.value);
const excludedPast = computed(() =>
  excludePastCustomers.value ? apiExclusions.value.pastCustomers : 0
);
const excludedRecent = computed(() => apiExclusions.value.recentlyMailed);
const finalHouseholdCount = computed(() =>
  excludePastCustomers.value
    ? apiCount.value
    : apiCount.value + apiExclusions.value.pastCustomers
);
const pastInArea = computed(() => apiExclusions.value.pastCustomers);
const sequenceLength = computed(() => draftStore.draft?.goal?.sequenceLength ?? 3);
const estimatedCostSequence = computed(
  () => finalHouseholdCount.value * PRICING.payPerSend * sequenceLength.value,
);

// Watch areas + filters and trigger API fetch
watch(
  [allAreas, filters],
  () => {
    fetchCount(allAreas.value, filters.value);
  },
  { deep: true },
);

// EDDM route actions
function onLoadEddmRoutes(zip5: string) {
  mapRef.value?.loadEddmRoutes(zip5);
}

function onToggleEddmRoute(crrt: string) {
  mapRef.value?.toggleEddmRoute(crrt);
  commitEddmTargeting();
}

function onClearEddmRoutes() {
  const map = mapRef.value;
  if (!map) return;
  for (const crrt of map.selectedCrrt) {
    map.toggleEddmRoute(crrt);
  }
  commitEddmTargeting();
}

function commitEddmTargeting() {
  const map = mapRef.value;
  if (!map) return;
  const sel: EddmSelection = {
    zip5: map.eddmZip ?? '',
    selectedCrrt: [...map.selectedCrrt],
    totalHouseholds: map.selectedEddmHouseholds,
  };
  const targeting: TargetingSelection = {
    campaignGoal: goalType.value,
    serviceType: null,
    sequenceLength: draftStore.draft?.goal?.sequenceLength ?? 1,
    sequenceSpacingDays: 0,
    areas: [],
    method: 'draw',
    filters: { homeowner: null, homeValueMin: null, homeValueMax: null, yearBuiltMin: null, yearBuiltMax: null, propertyTypes: [], hhageMin: null, hhageMax: null, incomeMin: null, loresMin: null, loresMax: null },
    jobsUsed: null,
    jobRadiusMiles: null,
    excludePastCustomers: false,
    excludeMailedWithinDays: null,
    doNotMailCount: 0,
    totalHouseholds: sel.totalHouseholds,
    excludedPastCustomers: 0,
    excludedRecentlyMailed: 0,
    excludedDoNotMail: 0,
    finalHouseholdCount: sel.totalHouseholds,
    pastCustomersInArea: 0,
    recipientBreakdown: { newProspects: sel.totalHouseholds, pastCustomers: 0, pastCustomersIncluded: false },
    estimatedCostSingle: sel.totalHouseholds * PRICING.payPerSend,
    estimatedCostSequence: sel.totalHouseholds * PRICING.payPerSend * (draftStore.draft?.goal?.sequenceLength ?? 1),
    countSource: 'mock',
    savedAudienceName: null,
    eddmSelection: sel,
  };
  draftStore.setTargeting(targeting);
}

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
      doNotMailCount: doNotMailCount.value,
      totalHouseholds: totalHouseholds.value,
      excludedPastCustomers: excludedPast.value,
      excludedRecentlyMailed: excludedRecent.value,
      excludedDoNotMail: doNotMailCount.value,
      finalHouseholdCount: finalHouseholdCount.value,
      pastCustomersInArea: pastInArea.value,
      recipientBreakdown: {
        newProspects: excludePastCustomers.value
          ? finalHouseholdCount.value
          : finalHouseholdCount.value - apiExclusions.value.pastCustomers,
        pastCustomers: apiExclusions.value.pastCustomers,
        pastCustomersIncluded: !excludePastCustomers.value,
      },
      estimatedCostSingle: finalHouseholdCount.value * perCard,
      estimatedCostSequence: finalHouseholdCount.value * perCard * seqLen,
      countSource: countSource.value,
      savedAudienceName: null,
      eddmSelection: null,
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

// Watch for changes and auto-commit.
// S70 demo-fix: include finalHouseholdCount so that when the async
// household-count API resolves AFTER the first commit (user clicked
// Next quickly), a second commit persists the API-accurate number
// instead of leaving the draft with the client-mock fallback.
watch(
  [selectedJobs, radiusMiles, zips, filters, excludePastCustomers, excludeMailedWithinDays, finalHouseholdCount],
  commitTargeting,
  { deep: true },
);

// Watch map areas so drawing shapes triggers commitTargeting
watch(
  () => mapRef.value?.areas,
  (newAreas) => {
    if (newAreas !== undefined) commitTargeting();
  },
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
  // For neighbor goals: show selected jobs with targeting radii
  // For other goals: show toggled-on jobs as markers (no radii — context only)
  const visibleJobs = jobs.value.filter((j) => j.selected);
  mapRef.value?.addJobRadii(visibleJobs, isNeighborGoal.value ? radiusMiles.value : 0);
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

function handleMethodChosen(method: "draw" | "zip" | "around_jobs") {
  if (method === "draw") {
    nextTick(() => mapRef.value?.startDrawing("circle"));
  }
  // "around_jobs" — panel already shows jobs tab by default
  // "zip" — panel shows target tab with ZIP input visible
}

onMounted(() => {
  if (!brandKitStore.hydrated) brandKitStore.fetch();
  // S69: gate on jobs.value.some(j => j.selected), NOT selectedJobs.
  // selectedJobs is a computed that returns [] when goal !== neighbor_marketing
  // (it's only used for neighbor_marketing's radius render path). The raw
  // `jobs.value` is what updateMapJobs reads. Previous gate caused Bug B
  // — pre-selected jobs didn't render on mount for non-neighbor goals
  // because the gate saw selectedJobs.length === 0.
  const anyJobSelected = jobs.value.some((j) => j.selected);
  if (draftStore.draft?.targeting) {
    // Restore map state from draft (shapes + job radii lost on remount)
    nextTick(() => {
      if (draftStore.draft?.targeting?.areas?.length) {
        mapRef.value?.restoreAreas(draftStore.draft.targeting.areas);
      }
      if (anyJobSelected) {
        updateMapJobs();
      }
    });
  } else if (anyJobSelected) {
    // First mount with pre-selected jobs — render radii and commit
    nextTick(() => updateMapJobs());
    commitTargeting();
  }
});
</script>

<template>
  <div class="flex flex-col sm:flex-row h-full">
    <!-- Map (takes remaining space) -->
    <div class="flex-1 relative">
      <TargetingMap
        ref="mapRef"
        :campaign-type="draftStore.draft?.campaignType"
        @areas-changed="commitTargeting"
        @method-chosen="handleMethodChosen"
      />
    </div>

    <!-- EDDM panel -->
    <EddmTargetingPanel
      v-if="isEddmMode"
      :routes="mapRef?.eddmRoutes ?? []"
      :selected-crrt="mapRef?.selectedCrrt ?? new Set()"
      :selected-households="mapRef?.selectedEddmHouseholds ?? 0"
      @load-routes="onLoadEddmRoutes"
      @toggle-route="onToggleEddmRoute"
      @clear="onClearEddmRoutes"
    />

    <!-- Targeted panel -->
    <TargetingPanel
      v-else
      :jobs="jobs"
      :is-neighbor-goal="isNeighborGoal"
      :radius-miles="radiusMiles"
      :zips="zips"
      :filters="filters"
      :exclude-past-customers="excludePastCustomers"
      :exclude-mailed-within-days="excludeMailedWithinDays"
      :do-not-mail-count="doNotMailCount"
      :has-non-zip-areas="hasNonZipAreas"
      :excluded-past-customers="excludedPast"
      :excluded-recently-mailed="excludedRecent"
      :excluded-do-not-mail="doNotMailCount"
      :final-household-count="finalHouseholdCount"
      :estimated-cost-sequence="estimatedCostSequence"
      :sequence-length="sequenceLength"
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
