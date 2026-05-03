<script setup lang="ts">
import { computed } from "vue";
import type { TargetingFilters } from "@/types/campaign";
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
}>();

const PROPERTY_TYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Apartment",
  "Mobile Home",
];

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.homeowner !== null) count++;
  if (filters.value.homeValueMin !== null || filters.value.homeValueMax !== null)
    count++;
  if (filters.value.yearBuiltMin !== null || filters.value.yearBuiltMax !== null)
    count++;
  if (filters.value.propertyTypes.length > 0) count++;
  if (filters.value.hhageMin !== null || filters.value.hhageMax !== null) count++;
  if (filters.value.incomeMin !== null) count++;
  return count;
});

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

    <!-- Homeowner -->
    <div>
      <label class="text-xs text-gray-500">Homeowner status</label>
      <select
        :value="filters.homeowner ?? ''"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @change="filters.homeowner = (($event.target as HTMLSelectElement).value || null) as TargetingFilters['homeowner']"
      >
        <option value="">Any</option>
        <option value="homeowner">Homeowners</option>
        <option value="all">All Residents</option>
        <option value="investor">Property Investors</option>
      </select>
    </div>

    <!-- Homeowner age (Melissa hhage, brackets 1-7) -->
    <div>
      <label class="text-xs text-gray-500">Homeowner age</label>
      <div class="flex gap-2 mt-1">
        <select
          :value="filters.hhageMin ?? ''"
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
          :value="filters.hhageMax ?? ''"
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

    <!-- Household income (minimum bracket) -->
    <div>
      <label class="text-xs text-gray-500">Household income (min)</label>
      <select
        :value="filters.incomeMin ?? ''"
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
    <div>
      <label class="text-xs text-gray-500">Home value range</label>
      <div class="flex gap-2 mt-1">
        <div class="relative w-1/2">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
          <input
            :value="formatDollar(filters.homeValueMin)"
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
            :value="formatDollar(filters.homeValueMax)"
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
    <div>
      <label class="text-xs text-gray-500">Year built</label>
      <div class="flex gap-2 mt-1">
        <input
          :value="filters.yearBuiltMin ?? ''"
          type="number"
          placeholder="From"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.yearBuiltMin = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
        <input
          :value="filters.yearBuiltMax ?? ''"
          type="number"
          placeholder="To"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.yearBuiltMax = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
      </div>
    </div>

    <!-- Property type -->
    <div>
      <label class="text-xs text-gray-500">Property type</label>
      <div class="space-y-1.5 mt-1">
        <label
          v-for="pt in PROPERTY_TYPES"
          :key="pt"
          class="flex items-center gap-2 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
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
