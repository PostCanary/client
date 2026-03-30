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
        :value="filters.homeowner === null ? '' : String(filters.homeowner)"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @change="filters.homeowner = ($event.target as HTMLSelectElement).value === '' ? null : ($event.target as HTMLSelectElement).value === 'true'"
      >
        <option value="">Any</option>
        <option value="true">Homeowners only</option>
        <option value="false">Renters only</option>
      </select>
    </div>

    <!-- Homeowner age (coming soon — needs data integration) -->
    <div class="opacity-50">
      <label class="text-xs text-gray-500">Homeowner age</label>
      <select
        disabled
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
      >
        <option>Coming soon</option>
      </select>
      <p class="text-[11px] text-gray-400 mt-1">Age targeting available after data integration</p>
    </div>

    <!-- Home value range -->
    <div>
      <label class="text-xs text-gray-500">Home value range</label>
      <div class="flex gap-2 mt-1">
        <input
          :value="filters.homeValueMin ?? ''"
          type="number"
          placeholder="Min ($)"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.homeValueMin = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
        <input
          :value="filters.homeValueMax ?? ''"
          type="number"
          placeholder="Max ($)"
          class="w-1/2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="filters.homeValueMax = ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null"
        />
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
    />
  </div>
</template>
