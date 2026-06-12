<script setup lang="ts">
// BackEditPanel — the right-column editor for the postcard BACK (S76 Phase-5).
//
// Scope this pass: the customer edits the GUARANTEE text only. Everything else
// on the back (return address, license, website, certifications) is sourced
// from Business Info and shown here read-only with a link to edit it there —
// mirrors EditPanel's "single source of truth" stance for brand data.

import { ref, watch, computed } from "vue";
import type { BrandKit } from "@/types/campaign";

const props = defineProps<{
  guarantee: string;
  brandKit: BrandKit | null;
}>();

const emit = defineEmits<{
  (e: "update-guarantee", value: string): void;
}>();

// Local mirror so typing is smooth; the parent persists (debounced render).
const localGuarantee = ref(props.guarantee);
watch(
  () => props.guarantee,
  (val) => {
    if (val !== localGuarantee.value) localGuarantee.value = val;
  },
);

const GUARANTEE_MAX = 180;

function onInput(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value.slice(0, GUARANTEE_MAX);
  localGuarantee.value = value;
  emit("update-guarantee", value);
}

const remaining = computed(() => GUARANTEE_MAX - localGuarantee.value.length);

// Read-only Business-Info-sourced fields shown on the back.
const companyAddress = computed(() => props.brandKit?.address || "");
const licenseNumber = computed(() => props.brandKit?.licenseNumber || "");
const websiteUrl = computed(() => props.brandKit?.websiteUrl || "");
const certifications = computed(() => props.brandKit?.certifications ?? []);
</script>

<template>
  <div class="w-80 border-l border-gray-200 p-4 overflow-y-auto bg-white">
    <h3 class="text-sm font-semibold text-[#0b2d50] mb-1">Edit Back</h3>
    <p class="text-[11px] text-gray-500 mb-4">
      One back is printed for every card in this campaign.
    </p>

    <!-- Guarantee (the only editable back field this pass) -->
    <div class="mb-5">
      <label
        class="text-[10px] uppercase tracking-wide text-gray-400 block mb-1"
        for="back-guarantee"
      >
        Guarantee
      </label>
      <textarea
        id="back-guarantee"
        data-testid="back-guarantee-input"
        :value="localGuarantee"
        rows="3"
        :maxlength="GUARANTEE_MAX"
        placeholder="100% Satisfaction Guaranteed"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#47bfa9]"
        @input="onInput"
      />
      <div class="text-[10px] text-gray-400 mt-1 text-right">
        {{ remaining }} characters left
      </div>
    </div>

    <!-- Read-only Business Info block -->
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[10px] uppercase tracking-wide text-gray-400">
          From Business Info
        </span>
        <RouterLink
          :to="{ name: 'Settings' }"
          data-testid="back-edit-in-business-info"
          class="text-[11px] text-[#47bfa9] underline hover:text-[#3aa893]"
        >
          Edit in Business Info
        </RouterLink>
      </div>

      <div class="space-y-1.5 text-xs text-gray-700">
        <div data-testid="back-info-address">
          <span class="text-gray-400">Return address: </span>
          <span v-if="companyAddress">{{ companyAddress }}</span>
          <span v-else class="text-amber-600">Add your business address</span>
        </div>
        <div data-testid="back-info-website">
          <span class="text-gray-400">Website: </span>
          <span v-if="websiteUrl">{{ websiteUrl }}</span>
          <span v-else class="text-gray-400">—</span>
        </div>
        <div data-testid="back-info-license">
          <span class="text-gray-400">License: </span>
          <span v-if="licenseNumber">{{ licenseNumber }}</span>
          <span v-else class="text-gray-400">—</span>
        </div>
        <div data-testid="back-info-certs">
          <span class="text-gray-400">Certifications: </span>
          <span v-if="certifications.length">{{ certifications.join(", ") }}</span>
          <span v-else class="text-gray-400">—</span>
        </div>
      </div>
    </div>
  </div>
</template>
