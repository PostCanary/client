<script setup lang="ts">
import { computed, inject } from "vue";
import { formatCurrency, formatNumber } from "@/utils/format";
import { HOUSEHOLD_COUNT_KEY } from "@/injection-keys";

const props = defineProps<{
  finalHouseholdCount: number;
  estimatedCostSequence: number;
  sequenceLength: number;
  audienceType?: 'consumer' | 'business';
  // POS-213: active filters constrain the count from any tab — disclose
  // them next to the number so a filtered count never masquerades as the
  // area total.
  activeFilterCount?: number;
  recipientCapWarning?: string | null;
}>();

const hc = inject(HOUSEHOLD_COUNT_KEY)!;
const hasTargeting = computed(() => props.finalHouseholdCount > 0 || hc.loading.value);
</script>

<template>
  <div class="bg-[#f8fafb] border-t border-gray-200 px-4 py-3 shrink-0">
    <template v-if="hc.loading.value">
      <div class="text-sm font-semibold text-[var(--pc-navy,#1c2430)] animate-pulse">
        Counting {{ audienceType === 'business' ? 'businesses' : 'households' }}...
      </div>
    </template>
    <!-- POS-133: an area was selected but rejected (e.g. server's 25-mile
         radius cap) — show why instead of a frozen last-good count. -->
    <template v-else-if="hc.error.value && !hasTargeting">
      <div class="text-xs font-medium text-amber-700 bg-amber-50 rounded px-2 py-1.5">
        {{ hc.error.value }}
      </div>
    </template>
    <template v-else-if="hasTargeting">
      <div class="flex items-center gap-1.5">
        <div class="text-sm font-semibold text-[var(--pc-navy,#1c2430)]">
          {{ formatNumber(finalHouseholdCount) }} {{ audienceType === 'business' ? 'businesses' : 'households' }}
        </div>
        <span
          v-if="hc.source.value === 'mock'"
          class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium"
        >(demo data)</span>
        <span
          v-if="(props.activeFilterCount ?? 0) > 0"
          data-testid="summary-filter-badge"
          class="text-[10px] bg-[rgba(250,207,65,0.16)] text-[#2b8d7c] px-1.5 py-0.5 rounded font-medium"
        >{{ props.activeFilterCount }} {{ props.activeFilterCount === 1 ? 'filter' : 'filters' }}</span>
      </div>
      <div class="text-xs text-gray-500 mt-0.5">
        Est. {{ formatCurrency(estimatedCostSequence) }} · {{ sequenceLength }} {{ sequenceLength === 1 ? 'card' : 'cards' }}
      </div>
      <div
        v-if="recipientCapWarning"
        data-testid="over-recipient-cap-warning"
        role="alert"
        class="mt-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5"
      >
        {{ recipientCapWarning }}
      </div>
    </template>
    <div v-else class="text-xs text-gray-400">
      Select an area to see targeting estimates
    </div>
  </div>
</template>
