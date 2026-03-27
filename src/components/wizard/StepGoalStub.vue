<script setup lang="ts">
import { ref } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { GOAL_DEFAULTS } from "@/types/campaign";
import type { CampaignGoalType, GoalSelection } from "@/types/campaign";

const draftStore = useCampaignDraftStore();

const goalType = ref<CampaignGoalType>(
  draftStore.draft?.goal?.goalType ?? "neighbor_marketing",
);
const sequenceLength = ref(draftStore.draft?.goal?.sequenceLength ?? 3);

const goals: { type: CampaignGoalType; label: string }[] = [
  { type: "neighbor_marketing", label: "Neighbor Marketing" },
  { type: "seasonal_tuneup", label: "Seasonal Tune-Up" },
  { type: "target_area", label: "Target an Area" },
  { type: "storm_response", label: "Storm Response" },
  { type: "win_back", label: "Win Back" },
  { type: "cross_service_promo", label: "Cross-Service Promo" },
  { type: "other", label: "Other" },
];

function apply() {
  const defaults = GOAL_DEFAULTS[goalType.value];
  const goal: GoalSelection = {
    goalType: goalType.value,
    goalLabel: goals.find((g) => g.type === goalType.value)?.label ?? "",
    serviceType: null,
    sequenceLength: sequenceLength.value,
    sequenceSpacingDays: defaults.spacingWeeks * 7,
    otherGoalText: null,
  };
  draftStore.setGoal(goal);
}
</script>

<template>
  <div class="max-w-lg mx-auto py-8 px-4">
    <h2 class="text-xl font-semibold text-[#0b2d50] mb-4">
      Choose Your Goal
    </h2>
    <p class="text-sm text-gray-500 mb-6">
      Stub — Terminal 3 replaces this with the real goal selection UI
    </p>

    <div class="space-y-2 mb-6">
      <label
        v-for="g in goals"
        :key="g.type"
        class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
        :class="
          goalType === g.type
            ? 'border-[#47bfa9] bg-[#47bfa9]/5'
            : 'border-gray-200 hover:border-gray-300'
        "
      >
        <input
          v-model="goalType"
          type="radio"
          :value="g.type"
          class="accent-[#47bfa9]"
        />
        <span class="text-sm font-medium text-[#0b2d50]">{{ g.label }}</span>
      </label>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Cards in sequence
      </label>
      <select
        v-model.number="sequenceLength"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
      >
        <option :value="1">1 card</option>
        <option :value="2">2 cards</option>
        <option :value="3">3 cards</option>
        <option :value="4">4 cards</option>
        <option :value="5">5 cards</option>
      </select>
    </div>

    <button
      class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors w-full"
      @click="apply"
    >
      Set Goal
    </button>
  </div>
</template>
