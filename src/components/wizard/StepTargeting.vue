<script setup lang="ts">
import { ref, computed, watch, provide, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { GOAL_DEFAULTS } from "@/types/campaign";
import { usePricing } from "@/composables/usePricing";
import type { TargetingSelection, TargetingFilters, JobReference, EddmSelection } from "@/types/campaign";
import TargetingMap from "@/components/targeting/TargetingMap.vue";
import TargetingPanel from "@/components/targeting/TargetingPanel.vue";
import EddmTargetingPanel from "@/components/targeting/EddmTargetingPanel.vue";
import { useHouseholdCount } from "@/composables/useHouseholdCount";
import { loadTargetingCapabilities } from "@/composables/useTargetingCapabilities";
import {
  businessTargetingFiltersAreSupported,
  normalizeBusinessTargetingFilters,
  normalizeTargetingFilters,
  queryPlanMatchesTargetingState,
  targetingFiltersAreSupported,
} from "@/utils/targetingCapabilities";
import { HOUSEHOLD_COUNT_KEY } from "@/injection-keys";
import type { BusinessTargetingFilterSupport, TargetingCapabilities } from "@/types/targeting";

const emit = defineEmits<{
  (e: "targeting-validity", valid: boolean): void;
}>();

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const mapRef = ref<InstanceType<typeof TargetingMap> | null>(null);

const isEddmMode = computed(() => draftStore.draft?.campaignType === 'eddm');
const audienceType = ref<'consumer' | 'business'>(
  draftStore.draft?.targeting?.audienceType ?? 'consumer',
);

// Household count composable — replaces mock area-based estimation
const {
  count: apiCount,
  totalCount: apiTotalCount,
  filteredCount: apiFilteredCount,
  exclusions: apiExclusions,
  loading: countLoading,
  error: countError,
  source: countSource,
  ready: countReady,
  queryPlan: apiQueryPlan,
  invalidate: invalidateCount,
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
// Rehydrate ZIP chips from the persisted draft, same as jobs/filters/drawn
// shapes above/below. Without this, remounting Step 2 (e.g. Back then
// Next) showed an empty ZIP list while `draft.targeting.areas` still
// carried the zip entries — targeting/billing kept applying silently
// while the UI looked cleared (POS-116 Bug A).
const zips = ref<string[]>(
  (draftStore.draft?.targeting?.areas ?? [])
    .filter((a) => a.type === "zip" && a.zipCode)
    .map((a) => a.zipCode!),
);
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
  squareFootageMin: null,
  squareFootageMax: null,
  hasEmail: null,
  businessSicCodes: [],
  businessNaicsCodes: [],
  businessJobTitles: [],
  businessManagementLevels: [],
  businessEmployeeMin: null,
  businessEmployeeMax: null,
  businessSalesMin: null,
  businessSalesMax: null,
  businessHasEmail: null,
  businessWorkAtHome: null,
};

const EMPTY_BUSINESS_FILTERS: TargetingFilters = {
  homeowner: null,
  homeValueMin: null,
  homeValueMax: null,
  yearBuiltMin: null,
  yearBuiltMax: null,
  propertyTypes: [],
  hhageMin: null,
  hhageMax: null,
  incomeMin: null,
  loresMin: null,
  loresMax: null,
  squareFootageMin: null,
  squareFootageMax: null,
  hasEmail: null,
  businessSicCodes: [],
  businessNaicsCodes: [],
  businessJobTitles: [],
  businessManagementLevels: [],
  businessEmployeeMin: null,
  businessEmployeeMax: null,
  businessSalesMin: null,
  businessSalesMax: null,
  businessHasEmail: null,
  businessWorkAtHome: null,
};

function filtersAreUntouched(f: TargetingFilters | undefined): boolean {
  if (!f) return true;
  return (
    f.homeowner === null &&
    f.homeValueMin === null &&
    f.homeValueMax === null &&
    f.yearBuiltMin === null &&
    f.yearBuiltMax === null &&
    (Array.isArray(f.propertyTypes) ? f.propertyTypes.length : 0) === 0 &&
    (f.hhageMin ?? null) === null &&
    (f.hhageMax ?? null) === null &&
    (f.incomeMin ?? null) === null &&
    (f.loresMin ?? null) === null &&
    (f.loresMax ?? null) === null
    && (f.squareFootageMin ?? null) === null
    && (f.squareFootageMax ?? null) === null
    && (f.hasEmail ?? null) === null
  );
}

const filters = ref<TargetingFilters>(
  audienceType.value === 'business'
    ? { ...EMPTY_BUSINESS_FILTERS, ...(draftStore.draft?.targeting?.filters ?? {}) }
    : filtersAreUntouched(draftStore.draft?.targeting?.filters)
    ? { ...HVAC_PRESET_FILTERS, propertyTypes: [...HVAC_PRESET_FILTERS.propertyTypes] }
    : draftStore.draft!.targeting!.filters!,
);

const targetingCapabilities = ref<TargetingCapabilities | null>(null);
const capabilitiesResolved = ref(false);
const capabilitiesLoading = ref(false);
const capabilitiesError = ref<string | null>(null);
const lastTargetingValidity = ref<boolean | null>(null);
const capabilitiesAbortController = new AbortController();

const filterCapabilities = computed(
  () => targetingCapabilities.value?.audienceFilters?.consumer ?? targetingCapabilities.value?.filters ?? null,
);
const businessFilterCapabilities = computed<BusinessTargetingFilterSupport | null>(
  () => targetingCapabilities.value?.audienceFilters?.business ?? null,
);
const businessEnabled = computed(() =>
  targetingCapabilities.value?.products?.some(
    (product) => product.id === 'data_retriever_business' && product.enabled && product.implemented,
  ) ?? false,
);
const targetingProvider = computed(
  () => targetingCapabilities.value?.provider ?? null,
);

function setTargetingValidity(valid: boolean) {
  if (lastTargetingValidity.value === valid) return;
  lastTargetingValidity.value = valid;
  emit("targeting-validity", valid);
}

async function resolveTargetingCapabilities() {
  if (capabilitiesLoading.value) return;
  capabilitiesLoading.value = true;
  capabilitiesError.value = null;
  capabilitiesResolved.value = false;
  targetingCapabilities.value = null;
  invalidateCount();
  setTargetingValidity(false);
  const result = await loadTargetingCapabilities(capabilitiesAbortController.signal);
  if (capabilitiesAbortController.signal.aborted) return;

  if (result.capabilities) {
    // Normalize before exposing the support map and before releasing the
    // count watcher. This prevents the HVAC preset or a resumed draft from
    // producing a transient unsupported count or draft snapshot.
    if (audienceType.value === 'consumer') {
      filters.value = normalizeTargetingFilters(
        filters.value,
        result.capabilities.audienceFilters?.consumer ?? result.capabilities.filters,
      );
    } else {
      const businessProductEnabled = result.capabilities.products?.some(
        (product) => product.id === 'data_retriever_business' && product.enabled && product.implemented,
      ) ?? false;
      const support = result.capabilities.audienceFilters?.business;
      if (!businessProductEnabled || !support) {
        audienceType.value = 'consumer';
        filters.value = normalizeTargetingFilters(
          { ...HVAC_PRESET_FILTERS, propertyTypes: [...HVAC_PRESET_FILTERS.propertyTypes] },
          result.capabilities.audienceFilters?.consumer ?? result.capabilities.filters,
        );
      } else {
        filters.value = normalizeBusinessTargetingFilters(filters.value, support);
      }
    }
    targetingCapabilities.value = result.capabilities;
    capabilitiesResolved.value = true;
  } else {
    capabilitiesError.value =
      "Audience targeting is unavailable because provider capabilities could not be verified.";
  }
  capabilitiesLoading.value = false;
}

void resolveTargetingCapabilities();
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

// The server applies the selected suppression policy and attests the result.
// The approved quantity must be the exact server final count.
const totalHouseholds = computed(() => apiTotalCount.value || apiFilteredCount.value || apiCount.value);
const excludedPast = computed(() =>
  excludePastCustomers.value ? apiExclusions.value.pastCustomers : 0
);
const excludedRecent = computed(() => apiExclusions.value.recentlyMailed);
const finalHouseholdCount = computed(() => apiCount.value);
const pastInArea = computed(() => apiExclusions.value.pastCustomers);
const sequenceLength = computed(() => 1);
const pricing = usePricing();
const estimatedCostSequence = computed(
  () => finalHouseholdCount.value * pricing.payPerSend * sequenceLength.value,
);

// Watch areas + filters and trigger API fetch
watch(
  [allAreas, filters, audienceType, capabilitiesResolved, excludePastCustomers, excludeMailedWithinDays],
  () => {
    if (!capabilitiesResolved.value) return;
    invalidateCount();
    setTargetingValidity(false);
    fetchCount(allAreas.value, filters.value, {
      excludePastCustomers: excludePastCustomers.value,
      excludeMailedWithinDays: excludeMailedWithinDays.value,
    }, audienceType.value);
  },
  { deep: true, flush: "sync" },
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
    audienceType: 'consumer',
    filters: { homeowner: null, homeValueMin: null, homeValueMax: null, yearBuiltMin: null, yearBuiltMax: null, propertyTypes: [], hhageMin: null, hhageMax: null, incomeMin: null, loresMin: null, loresMax: null, squareFootageMin: null, squareFootageMax: null, hasEmail: null },
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
    estimatedCostSingle: sel.totalHouseholds * pricing.payPerSend,
    estimatedCostSequence: sel.totalHouseholds * pricing.payPerSend * (draftStore.draft?.goal?.sequenceLength ?? 1),
    countSource: 'mock',
    queryPlan: null,
    savedAudienceName: null,
    eddmSelection: sel,
  };
  draftStore.setTargeting(targeting);
  setTargetingValidity(true);
}

// Debounced commit to draft store
let commitTimer: ReturnType<typeof setTimeout> | null = null;

function commitTargeting() {
  if (commitTimer) clearTimeout(commitTimer);
  commitTimer = setTimeout(() => {
    if (!capabilitiesResolved.value) return;
    if (
      audienceType.value === 'consumer' && targetingCapabilities.value &&
      !targetingFiltersAreSupported(
        filters.value,
        filterCapabilities.value ?? targetingCapabilities.value.filters,
      )
    ) {
      return;
    }
    if (
      audienceType.value === 'business' &&
      (!businessFilterCapabilities.value ||
        !businessTargetingFiltersAreSupported(filters.value, businessFilterCapabilities.value))
    ) {
      return;
    }
    // Persist only a positive live result. Rejected, zero, stale, or
    // unattested results must keep this step invalid.
    if (!countReady.value || countLoading.value || countError.value || apiCount.value < 1) return;
    const suppressionPolicy = {
      excludePastCustomers: excludePastCustomers.value,
      excludeMailedWithinDays: excludeMailedWithinDays.value,
    };
    if (!queryPlanMatchesTargetingState(apiQueryPlan.value, {
      audienceType: audienceType.value,
      areas: allAreas.value,
      filters: filters.value,
      suppressionPolicy,
      finalCount: apiCount.value,
      exclusions: apiExclusions.value,
      source: countSource.value,
    })) return;
    const seqLen = 1;
    const perCard = pricing.payPerSend;

    const targeting: TargetingSelection = {
      campaignGoal: goalType.value,
      serviceType: draftStore.draft?.goal?.serviceType ?? null,
      sequenceLength: seqLen,
      sequenceSpacingDays: draftStore.draft?.goal?.sequenceSpacingDays ?? 14,
      areas: allAreas.value,
      audienceType: audienceType.value,
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
      queryPlan: apiQueryPlan.value,
      savedAudienceName: null,
      eddmSelection: null,
    };
    draftStore.setTargeting(targeting);
    setTargetingValidity(true);
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
// Include finalHouseholdCount + countReady so that when the async
// household-count API resolves AFTER the first commit attempt (user clicked
// Next quickly, or countReady was still false), a follow-up commit persists
// the real number (POS-135). countReady is needed on its own because it can
// flip true without finalHouseholdCount's value changing (e.g. a genuine
// zero-area count), which wouldn't otherwise re-trigger this watcher.
watch(
  [selectedJobs, radiusMiles, zips, filters, audienceType, excludePastCustomers, excludeMailedWithinDays, finalHouseholdCount, countReady],
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

function setAudienceType(value: 'consumer' | 'business') {
  if (value === audienceType.value || (value === 'business' && !businessEnabled.value)) return;
  invalidateCount();
  setTargetingValidity(false);
  audienceType.value = value;
  if (value === 'business') {
    filters.value = businessFilterCapabilities.value
      ? normalizeBusinessTargetingFilters(EMPTY_BUSINESS_FILTERS, businessFilterCapabilities.value)
      : { ...EMPTY_BUSINESS_FILTERS };
  } else {
    const consumerDefaults = {
      ...HVAC_PRESET_FILTERS,
      propertyTypes: [...HVAC_PRESET_FILTERS.propertyTypes],
    };
    filters.value = filterCapabilities.value
      ? normalizeTargetingFilters(consumerDefaults, filterCapabilities.value)
      : consumerDefaults;
  }
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
      if (zips.value.length > 0) {
        mapRef.value?.highlightZips(zips.value);
      }
    });
  } else if (anyJobSelected) {
    // First mount with pre-selected jobs — render radii and commit
    nextTick(() => updateMapJobs());
    commitTargeting();
  }
});

onBeforeUnmount(() => {
  capabilitiesAbortController.abort();
  if (commitTimer) clearTimeout(commitTimer);
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

    <aside
      v-else-if="capabilitiesLoading"
      class="flex w-[360px] shrink-0 items-center justify-center border-l border-gray-200 bg-white p-6"
      role="status"
      data-testid="targeting-capabilities-loading"
    >
      <p class="text-sm text-gray-500">Checking available audience filters...</p>
    </aside>

    <aside
      v-else-if="capabilitiesError"
      class="flex w-[360px] shrink-0 flex-col items-start justify-center border-l border-gray-200 bg-white p-6"
      role="alert"
      data-testid="targeting-capabilities-error"
    >
      <h3 class="text-sm font-semibold text-[#0b2d50]">Audience filters could not be verified</h3>
      <p class="mt-2 text-sm text-gray-600">{{ capabilitiesError }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-[#47bfa9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3aa893]"
        data-testid="retry-targeting-capabilities"
        @click="resolveTargetingCapabilities"
      >
        Try again
      </button>
    </aside>

    <!-- Targeted panel -->
    <TargetingPanel
      v-else
      :jobs="jobs"
      :is-neighbor-goal="isNeighborGoal"
      :radius-miles="radiusMiles"
      :zips="zips"
      :filters="filters"
      :audience-type="audienceType"
      :business-enabled="businessEnabled"
      :filter-capabilities="filterCapabilities"
      :business-filter-capabilities="businessFilterCapabilities"
      :targeting-provider="targetingProvider"
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
      @update:audience-type="setAudienceType"
      @update:exclude-past-customers="excludePastCustomers = $event"
      @update:exclude-mailed-within-days="excludeMailedWithinDays = $event"
    />
  </div>
</template>
