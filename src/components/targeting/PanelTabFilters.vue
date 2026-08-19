<script setup lang="ts">
import { computed } from "vue";
import type { TargetingFilters } from "@/types/campaign";
import type { TargetingFilterKey, TargetingFilterSupport, TargetingProvider } from "@/types/targeting";
import { unsupportedTargetingFilterLabels } from "@/utils/targetingCapabilities";
import { countActiveConsumerFilters } from "@/utils/targetingFilterCount";
import {
  applyIndustryFilterPreset,
  industryFilterPresetAvailable,
  industryFilterPresetChipLabel,
  resolveIndustryFilterPreset,
} from "@/utils/targetingPresets";
import ExclusionToggles from "./ExclusionToggles.vue";

const filters = defineModel<TargetingFilters>("filters", {
  required: true,
});
const excludePast = defineModel<boolean>("excludePastCustomers", {
  default: true,
});
const frequencyDays = defineModel<number | null>("excludeMailedWithinDays", {
  default: 30,
});
const props = defineProps<{
  doNotMailCount: number;
  hasNonZipAreas?: boolean;
  filterCapabilities: TargetingFilterSupport | null;
  targetingProvider: TargetingProvider | null;
  /** Brand-kit / setup industry slug — drives suggested filter pack (POS-293). */
  industry?: string | null;
}>();

const PROPERTY_TYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Apartment",
  "Mobile Home",
];

function supportsFilter(key: TargetingFilterKey): boolean {
  return props.filterCapabilities?.[key] ?? false;
}

const unavailableFilters = computed(() =>
  props.filterCapabilities
    ? unsupportedTargetingFilterLabels(props.filterCapabilities)
    : [],
);
const providerLabel = computed(() =>
  props.targetingProvider === "planner"
    ? "The Melissa audience planner"
    : props.targetingProvider === "data_retriever"
      ? "Data Retriever"
      : "The current audience provider",
);

const activeFilterCount = computed(() =>
  countActiveConsumerFilters(filters.value, props.filterCapabilities),
);

// POS-293: industry LeadGen/property pack — opt-in chip only (never auto-apply).
const industryPreset = computed(() =>
  resolveIndustryFilterPreset(props.industry),
);
const presetChipLabel = computed(() =>
  industryFilterPresetChipLabel(industryPreset.value),
);
const presetAvailable = computed(() =>
  industryFilterPresetAvailable(props.filterCapabilities),
);

function applyPreset() {
  filters.value = applyIndustryFilterPreset(
    filters.value,
    props.industry,
    props.filterCapabilities,
  );
}

function togglePropertyType(pt: string) {
  const idx = filters.value.propertyTypes.indexOf(pt);
  if (idx >= 0) {
    filters.value.propertyTypes.splice(idx, 1);
  } else {
    filters.value.propertyTypes.push(pt);
  }
}

// S69 — home-value inputs display with comma separators + $ prefix.
// Underlying storage stays a raw number; the input is type=text with
// inputmode=numeric so mobile keyboards still surface digits only.
function formatDollar(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("en-US");
}

function parseDollar(s: string): number | null {
  const cleaned = s.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

defineExpose({ activeFilterCount });
</script>

<template>
  <div class="space-y-5 p-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-[#0b2d50]">Filters</h4>
      <span v-if="activeFilterCount > 0" class="text-xs text-[#47bfa9] font-medium">
        {{ activeFilterCount }} applied
      </span>
    </div>

    <button
      v-if="presetAvailable"
      type="button"
      data-testid="industry-filter-preset"
      class="inline-flex items-center gap-1.5 rounded-full border border-[#47bfa9]/40 bg-[#47bfa9]/5 px-3 py-1.5 text-xs font-medium text-[#2b8d7c] hover:bg-[#47bfa9]/10 transition-colors"
      @click="applyPreset"
    >
      <span aria-hidden="true">+</span>
      {{ presetChipLabel }}
    </button>

    <div
      v-if="unavailableFilters.length > 0"
      class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
      role="status"
      data-testid="targeting-capability-notice"
    >
      {{ providerLabel }} does not support {{ unavailableFilters.join(", ") }} targeting.
      These controls are disabled and existing selections are cleared before counting.
    </div>

    <!-- Homeowner -->
    <div data-testid="filter-homeowner" :class="{ 'opacity-60': !supportsFilter('homeowner') }">
      <label class="text-xs text-gray-500">Homeowner status</label>
      <select
        data-testid="filter-control-homeowner"
        :value="filters.homeowner ?? ''"
        :disabled="!supportsFilter('homeowner')"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @change="filters.homeowner = (($event.target as HTMLSelectElement).value || null) as TargetingFilters['homeowner']"
      >
        <option value="">Any</option>
        <option value="homeowner">Homeowners</option>
        <option value="all">All Residents</option>
        <option value="investor">Property Investors</option>
      </select>
    </div>

    <!-- Homeowner age (provider hhage, brackets 1-7) -->
    <div data-testid="filter-household-age" :class="{ 'opacity-60': !supportsFilter('hhageMin') || !supportsFilter('hhageMax') }">
      <label class="text-xs text-gray-500">Homeowner age</label>
      <div class="flex gap-2 mt-1">
        <select
          data-testid="filter-control-hhage-min"
          :value="filters.hhageMin ?? ''"
          :disabled="!supportsFilter('hhageMin')"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @change="filters.hhageMin = (($event.target as HTMLSelectElement).value ? parseInt(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Min age</option>
          <option value="1">18-24</option>
          <option value="2">25-34</option>
          <option value="3">35-44</option>
          <option value="4">45-54</option>
          <option value="5">55-64</option>
          <option value="6">65-74</option>
          <option value="7">75+</option>
        </select>
        <select
          data-testid="filter-control-hhage-max"
          :value="filters.hhageMax ?? ''"
          :disabled="!supportsFilter('hhageMax')"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @change="filters.hhageMax = (($event.target as HTMLSelectElement).value ? parseInt(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Max age</option>
          <option value="1">18-24</option>
          <option value="2">25-34</option>
          <option value="3">35-44</option>
          <option value="4">45-54</option>
          <option value="5">55-64</option>
          <option value="6">65-74</option>
          <option value="7">75+</option>
        </select>
      </div>
    </div>

    <!-- Length of residence (provider lores, brackets 0-15) -->
    <div data-testid="filter-length-of-residence" :class="{ 'opacity-60': !supportsFilter('loresMin') || !supportsFilter('loresMax') }">
      <label class="text-xs text-gray-500">Length of residence</label>
      <div class="flex gap-2 mt-1">
        <select
          data-testid="filter-control-lores-min"
          :value="filters.loresMin !== null ? filters.loresMin : ''"
          :disabled="!supportsFilter('loresMin')"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @change="filters.loresMin = (($event.target as HTMLSelectElement).value !== '' ? parseInt(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Min years</option>
          <option value="0">&lt; 1 year</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="4">4 years</option>
          <option value="5">5 years</option>
          <option value="6">6 years</option>
          <option value="7">7 years</option>
          <option value="8">8 years</option>
          <option value="9">9 years</option>
          <option value="10">10 years</option>
          <option value="11">11 years</option>
          <option value="12">12 years</option>
          <option value="13">13 years</option>
          <option value="14">14 years</option>
          <option value="15">&gt; 14 years</option>
        </select>
        <select
          data-testid="filter-control-lores-max"
          :value="filters.loresMax !== null ? filters.loresMax : ''"
          :disabled="!supportsFilter('loresMax')"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @change="filters.loresMax = (($event.target as HTMLSelectElement).value !== '' ? parseInt(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Max years</option>
          <option value="0">&lt; 1 year</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="4">4 years</option>
          <option value="5">5 years</option>
          <option value="6">6 years</option>
          <option value="7">7 years</option>
          <option value="8">8 years</option>
          <option value="9">9 years</option>
          <option value="10">10 years</option>
          <option value="11">11 years</option>
          <option value="12">12 years</option>
          <option value="13">13 years</option>
          <option value="14">14 years</option>
          <option value="15">&gt; 14 years</option>
        </select>
      </div>
    </div>

    <!-- Children in household (provider kids, brackets 1-8). Only show when
         LeadGen Property entitles the filter — never as a disabled stub. -->
    <div
      v-if="supportsFilter('kidsMin') && supportsFilter('kidsMax')"
      data-testid="filter-kids"
    >
      <label class="text-xs text-gray-500">Children in household</label>
      <div class="flex gap-2 mt-1">
        <select
          data-testid="filter-control-kids-min"
          :value="filters.kidsMin ?? ''"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @change="filters.kidsMin = (($event.target as HTMLSelectElement).value ? parseInt(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Min children</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8+</option>
        </select>
        <select
          data-testid="filter-control-kids-max"
          :value="filters.kidsMax ?? ''"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @change="filters.kidsMax = (($event.target as HTMLSelectElement).value ? parseInt(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Max children</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8+</option>
        </select>
      </div>
      <p class="mt-1 text-[11px] text-gray-400">
        Melissa has no “zero children” code. Min 1 = has children. A max with no min still requires at least one child.
      </p>
    </div>

    <!-- Household income (minimum bracket) -->
    <div data-testid="filter-income" :class="{ 'opacity-60': !supportsFilter('incomeMin') }">
      <label class="text-xs text-gray-500">Household income (min)</label>
      <select
        data-testid="filter-control-income"
        :value="filters.incomeMin ?? ''"
        :disabled="!supportsFilter('incomeMin')"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @change="filters.incomeMin = (($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Any income</option>
        <option value="A">$60K+</option>
        <option value="B">$75K+</option>
        <option value="C">$100K+</option>
        <option value="D">$125K+</option>
        <option value="E">$150K+</option>
        <option value="F">$175K+</option>
        <option value="G">$200K+</option>
        <option value="H">$225K+</option>
        <option value="I">$250K+</option>
        <option value="J">$275K+</option>
      </select>
    </div>

    <!-- Home value range -->
    <div data-testid="filter-home-value" :class="{ 'opacity-60': !supportsFilter('homeValueMin') || !supportsFilter('homeValueMax') }">
      <label class="text-xs text-gray-500">Home value range</label>
      <div class="flex gap-2 mt-1">
        <div class="relative w-1/2">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
          <input
            data-testid="filter-control-home-value-min"
            :value="formatDollar(filters.homeValueMin)"
            :disabled="!supportsFilter('homeValueMin')"
            type="text"
            inputmode="numeric"
            placeholder="Min"
            class="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm"
            @input="filters.homeValueMin = parseDollar(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="relative w-1/2">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
          <input
            data-testid="filter-control-home-value-max"
            :value="formatDollar(filters.homeValueMax)"
            :disabled="!supportsFilter('homeValueMax')"
            type="text"
            inputmode="numeric"
            placeholder="Max"
            class="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm"
            @input="filters.homeValueMax = parseDollar(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- Year built range -->
    <div data-testid="filter-year-built" :class="{ 'opacity-60': !supportsFilter('yearBuiltMin') || !supportsFilter('yearBuiltMax') }">
      <label class="text-xs text-gray-500">Year built</label>
      <div class="flex gap-2 mt-1">
        <input
          data-testid="filter-control-year-built-min"
          :value="filters.yearBuiltMin ?? ''"
          :disabled="!supportsFilter('yearBuiltMin')"
          type="number"
          placeholder="From"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.yearBuiltMin = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
        <input
          data-testid="filter-control-year-built-max"
          :value="filters.yearBuiltMax ?? ''"
          :disabled="!supportsFilter('yearBuiltMax')"
          type="number"
          placeholder="To"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.yearBuiltMax = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
      </div>
    </div>

    <!-- Living area square footage -->
    <div data-testid="filter-square-footage" :class="{ 'opacity-60': !supportsFilter('squareFootageMin') || !supportsFilter('squareFootageMax') }">
      <label class="text-xs text-gray-500">Home square footage</label>
      <div class="flex gap-2 mt-1">
        <input
          data-testid="filter-control-square-footage-min"
          :value="filters.squareFootageMin ?? ''"
          :disabled="!supportsFilter('squareFootageMin')"
          type="number"
          min="0"
          placeholder="Min sq ft"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.squareFootageMin = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
        <input
          data-testid="filter-control-square-footage-max"
          :value="filters.squareFootageMax ?? ''"
          :disabled="!supportsFilter('squareFootageMax')"
          type="number"
          min="0"
          placeholder="Max sq ft"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.squareFootageMax = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
      </div>
    </div>

    <!-- Email availability only. Email values are not exposed to print. -->
    <div data-testid="filter-email-availability" :class="{ 'opacity-60': !supportsFilter('hasEmail') }">
      <label class="text-xs text-gray-500">Email availability</label>
      <select
        data-testid="filter-control-email-availability"
        :value="filters.hasEmail === null || filters.hasEmail === undefined ? '' : String(filters.hasEmail)"
        :disabled="!supportsFilter('hasEmail')"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @change="filters.hasEmail = ($event.target as HTMLSelectElement).value === '' ? null : ($event.target as HTMLSelectElement).value === 'true'"
      >
        <option value="">Any</option>
        <option value="true">Has email</option>
        <option value="false">No email</option>
      </select>
      <p class="mt-1 text-[11px] text-gray-400">This narrows the mailing audience. Email addresses are not sent to the print partner.</p>
    </div>

    <!-- Property type -->
    <div data-testid="filter-property-types" :class="{ 'opacity-60': !supportsFilter('propertyTypes') }">
      <label class="text-xs text-gray-500">Property type</label>
      <div class="space-y-1.5 mt-1">
        <label
          v-for="pt in PROPERTY_TYPES"
          :key="pt"
          class="flex items-center gap-2 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
            :disabled="!supportsFilter('propertyTypes')"
            :checked="filters.propertyTypes.includes(pt)"
            class="accent-[#47bfa9]"
            @change="togglePropertyType(pt)"
          />
          {{ pt }}
        </label>
      </div>
    </div>

    <hr class="border-gray-100" />

    <!-- Exclusions -->
    <ExclusionToggles
      v-model:exclude-past-customers="excludePast"
      v-model:exclude-mailed-within-days="frequencyDays"
      :do-not-mail-count="doNotMailCount"
      :has-non-zip-areas="props.hasNonZipAreas"
    />
  </div>
</template>
