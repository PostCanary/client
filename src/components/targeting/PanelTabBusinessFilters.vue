<script setup lang="ts">
import { computed } from 'vue'
import type { TargetingFilters } from '@/types/campaign'
import type { BusinessTargetingFilterSupport } from '@/types/targeting'
import { countActiveBusinessFilters } from '@/utils/targetingFilterCount'
import ExclusionToggles from './ExclusionToggles.vue'

const filters = defineModel<TargetingFilters>('filters', { required: true })
const excludePast = defineModel<boolean>('excludePastCustomers', { default: true })
const frequencyDays = defineModel<number | null>('excludeMailedWithinDays', { default: 30 })
const props = defineProps<{
  doNotMailCount: number
  hasNonZipAreas?: boolean
  filterCapabilities: BusinessTargetingFilterSupport | null
}>()

function supported(key: keyof BusinessTargetingFilterSupport): boolean {
  return props.filterCapabilities?.[key] ?? false
}

function parseList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

function setNumber(
  key: 'businessEmployeeMin' | 'businessEmployeeMax' | 'businessSalesMin' | 'businessSalesMax',
  value: string,
) {
  const parsed = value === '' ? null : Number.parseInt(value, 10)
  const normalized = Number.isFinite(parsed) ? parsed : null
  if (key === 'businessEmployeeMin') filters.value.businessEmployeeMin = normalized
  else if (key === 'businessEmployeeMax') filters.value.businessEmployeeMax = normalized
  else if (key === 'businessSalesMin') filters.value.businessSalesMin = normalized
  else filters.value.businessSalesMax = normalized
}

const activeFilterCount = computed(() => countActiveBusinessFilters(filters.value))
</script>

<template>
  <div class="space-y-5 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-sm font-semibold text-[#0b2d50]">Business filters</h4>
        <p class="mt-1 text-[11px] text-gray-400">Targets business locations. Contact email and phone values are not purchased.</p>
      </div>
      <span v-if="activeFilterCount" class="text-xs font-medium text-[#47bfa9]">{{ activeFilterCount }} applied</span>
    </div>

    <div>
      <label class="text-xs text-gray-500">Primary SIC codes</label>
      <input
        data-testid="filter-business-sic"
        :value="(filters.businessSicCodes ?? []).join(', ')"
        :disabled="!supported('businessSicCodes')"
        class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="171102, 176109"
        @change="filters.businessSicCodes = parseList(($event.target as HTMLInputElement).value)"
      />
      <p class="mt-1 text-[11px] text-gray-400">Use comma-separated Melissa SIC codes.</p>
    </div>

    <div>
      <label class="text-xs text-gray-500">Primary NAICS codes</label>
      <input
        data-testid="filter-business-naics"
        :value="(filters.businessNaicsCodes ?? []).join(', ')"
        :disabled="!supported('businessNaicsCodes')"
        class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="238220, 238160"
        @change="filters.businessNaicsCodes = parseList(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div>
      <label class="text-xs text-gray-500">Job titles</label>
      <input
        data-testid="filter-business-job-titles"
        :value="(filters.businessJobTitles ?? []).join(', ')"
        :disabled="!supported('businessJobTitles')"
        class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="Owner, Engineer"
        @change="filters.businessJobTitles = parseList(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div>
      <label class="text-xs text-gray-500">Management levels</label>
      <input
        data-testid="filter-business-management-levels"
        :value="(filters.businessManagementLevels ?? []).join(', ')"
        :disabled="!supported('businessManagementLevels')"
        class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="C-Level"
        @change="filters.businessManagementLevels = parseList(($event.target as HTMLInputElement).value)"
      />
      <p class="mt-1 text-[11px] text-gray-400">Use comma-separated Melissa management-level labels.</p>
    </div>

    <div>
      <label class="text-xs text-gray-500">Employees at location</label>
      <div class="mt-1 flex gap-2">
        <input
          data-testid="filter-business-employees-min"
          :value="filters.businessEmployeeMin ?? ''"
          :disabled="!supported('businessEmployeeMin')"
          type="number"
          min="0"
          placeholder="Min"
          class="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          @input="setNumber('businessEmployeeMin', ($event.target as HTMLInputElement).value)"
        />
        <input
          data-testid="filter-business-employees-max"
          :value="filters.businessEmployeeMax ?? ''"
          :disabled="!supported('businessEmployeeMax')"
          type="number"
          min="0"
          placeholder="Max"
          class="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          @input="setNumber('businessEmployeeMax', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div>
      <label class="text-xs text-gray-500">Estimated location sales</label>
      <div class="mt-1 flex gap-2">
        <input
          data-testid="filter-business-sales-min"
          :value="filters.businessSalesMin ?? ''"
          :disabled="!supported('businessSalesMin')"
          type="number"
          min="0"
          placeholder="Min $"
          class="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          @input="setNumber('businessSalesMin', ($event.target as HTMLInputElement).value)"
        />
        <input
          data-testid="filter-business-sales-max"
          :value="filters.businessSalesMax ?? ''"
          :disabled="!supported('businessSalesMax')"
          type="number"
          min="0"
          placeholder="Max $"
          class="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          @input="setNumber('businessSalesMax', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <label class="flex items-start gap-2 text-sm">
      <input
        data-testid="filter-business-has-email"
        :checked="filters.businessHasEmail === true"
        :disabled="!supported('businessHasEmail')"
        type="checkbox"
        class="mt-0.5 accent-[#47bfa9]"
        @change="filters.businessHasEmail = ($event.target as HTMLInputElement).checked ? true : null"
      />
      <span>Require a deliverable business email <span class="block text-[11px] text-gray-400">Only availability is used. The address is not purchased.</span></span>
    </label>

    <div>
      <label class="text-xs text-gray-500">Work-at-home business</label>
      <select
        data-testid="filter-business-work-at-home"
        :value="filters.businessWorkAtHome === null || filters.businessWorkAtHome === undefined ? '' : String(filters.businessWorkAtHome)"
        :disabled="!supported('businessWorkAtHome')"
        class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        @change="filters.businessWorkAtHome = ($event.target as HTMLSelectElement).value === '' ? null : ($event.target as HTMLSelectElement).value === 'true'"
      >
        <option value="">Any</option>
        <option value="false">Exclude work-at-home businesses</option>
        <option value="true">Only work-at-home businesses</option>
      </select>
    </div>

    <hr class="border-gray-100" />
    <ExclusionToggles
      v-model:exclude-past-customers="excludePast"
      v-model:exclude-mailed-within-days="frequencyDays"
      :do-not-mail-count="doNotMailCount"
      :has-non-zip-areas="hasNonZipAreas"
    />
  </div>
</template>
