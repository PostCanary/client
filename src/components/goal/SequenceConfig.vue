<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { CampaignGoalDefaults } from "@/types/campaign";
import { useBrandKitStore } from "@/stores/useBrandKitStore";

const props = defineProps<{
  defaults: CampaignGoalDefaults;
  goalType: string;
  // Initial values from draft (take priority over defaults on mount)
  initialSequenceLength?: number;
  initialSpacingWeeks?: number;
  initialServiceType?: string | null;
  initialOtherGoalText?: string | null;
}>();

const emit = defineEmits<{
  (e: "update", config: {
    sequenceLength: number;
    spacingWeeks: number;
    serviceType: string | null;
    otherGoalText: string | null;
  }): void;
}>();

const brandKitStore = useBrandKitStore();

// Prefer draft values over goal defaults (prevents reset on Step 1 revisit)
// Campaign creation is now one mailing. Keep the config value for the
// legacy component contract, but do not resurrect the retired sequence UI.
const sequenceLength = ref(1);
const spacingWeeks = ref(props.initialSpacingWeeks ?? props.defaults.spacingWeeks);
const serviceType = ref<string | null>(props.initialServiceType ?? null);
const otherGoalText = ref(props.initialOtherGoalText ?? "");

const showServicePicker = computed(
  () => props.goalType === "seasonal_tuneup" || props.goalType === "cross_service_promo",
);
const showOtherText = computed(() => props.goalType === "other");

const serviceOptions = computed(() => {
  return brandKitStore.brandKit?.serviceTypes ?? [];
});

// Reset when defaults change (new goal selected)
watch(
  () => props.defaults,
  (d) => {
    sequenceLength.value = 1;
    spacingWeeks.value = d.spacingWeeks;
  },
);

// Emit on any change
watch(
  [sequenceLength, spacingWeeks, serviceType, otherGoalText],
  () => {
    emit("update", {
      sequenceLength: sequenceLength.value,
      spacingWeeks: spacingWeeks.value,
      serviceType: serviceType.value,
      otherGoalText: showOtherText.value ? otherGoalText.value : null,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-5 pt-4 border-t border-gray-100">
    <p class="text-sm text-gray-500">
      Your campaign includes one postcard mailing.
    </p>

    <!-- Spacing -->
    <div>
      <label class="block text-sm font-medium text-[#0b2d50] mb-2">
        Weeks between each card
      </label>
      <select
        v-model.number="spacingWeeks"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-[200px]"
      >
        <option :value="1">1 week</option>
        <option :value="2">2 weeks</option>
        <option :value="3">3 weeks</option>
        <option :value="4">4 weeks</option>
      </select>
    </div>

    <!-- Service type (for seasonal/cross-service) -->
    <div v-if="showServicePicker">
      <label class="block text-sm font-medium text-[#0b2d50] mb-2">
        Which service?
      </label>
      <select
        v-model="serviceType"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-[300px]"
      >
        <option :value="null" disabled>Select a service</option>
        <option v-for="svc in serviceOptions" :key="svc" :value="svc">
          {{ svc }}
        </option>
      </select>
      <p v-if="serviceOptions.length === 0" class="text-xs text-amber-500 mt-1">
        No services found. Add them in Settings.
      </p>
    </div>

    <!-- "Something Else" text -->
    <div v-if="showOtherText">
      <label class="block text-sm font-medium text-[#0b2d50] mb-2">
        What do you want to accomplish?
      </label>
      <textarea
        v-model="otherGoalText"
        rows="3"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full resize-none"
        placeholder="Tell us your goal and we'll help set up the best campaign..."
      />
    </div>
  </div>
</template>
