<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { CampaignGoalType, GoalSelection, Industry } from "@/types/campaign";
import { INDUSTRY_LABELS } from "@/types/campaign";
import { updateOrg } from "@/api/orgs";
import { useAuthStore } from "@/stores/auth";
import GoalCard from "@/components/goal/GoalCard.vue";
import SequenceConfig from "@/components/goal/SequenceConfig.vue";
import {
  getGoalsForDisplay,
  type GoalDefinition,
} from "@/data/campaignGoals";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const auth = useAuthStore();

// Existing user inline setup (missing location/industry)
const needsSetup = computed(
  () => !brandKitStore.brandKit?.location || !brandKitStore.brandKit?.industry,
);
const setupLocation = ref("");
const setupIndustry = ref<Industry | "">("");
const savingSetup = ref(false);

const industries = Object.entries(INDUSTRY_LABELS) as [Industry, string][];

async function completeSetup() {
  if (!setupLocation.value.trim() || !setupIndustry.value) return;
  savingSetup.value = true;
  try {
    if (auth.orgId) {
      await updateOrg(auth.orgId, {
        location: setupLocation.value.trim(),
      });
    }
    if (setupIndustry.value) {
      await brandKitStore.update({ industry: setupIndustry.value });
    }
    await brandKitStore.fetch();
  } catch {
    // API failed — that's fine, local patch below handles it
  } finally {
    // Always patch locally so needsSetup resolves even if server
    // didn't persist the data (backend columns may not exist yet)
    brandKitStore.$patch({
      brandKit: {
        ...brandKitStore.brandKit,
        location: setupLocation.value.trim() || brandKitStore.brandKit?.location,
        industry: setupIndustry.value || brandKitStore.brandKit?.industry,
      },
    });
    savingSetup.value = false;
  }
}

// Goal selection
const selectedGoalType = ref<CampaignGoalType | null>(
  draftStore.draft?.goal?.goalType ?? null,
);
const showMore = ref(false);

const { primary, more } = getGoalsForDisplay();

const selectedGoal = computed(
  () =>
    [...primary, ...more].find((g) => g.type === selectedGoalType.value) ??
    null,
);

// Sequence config state
const sequenceConfig = ref({
  sequenceLength: draftStore.draft?.goal?.sequenceLength ?? 3,
  spacingWeeks: Math.round(
    (draftStore.draft?.goal?.sequenceSpacingDays ?? 14) / 7,
  ),
  serviceType: draftStore.draft?.goal?.serviceType ?? null,
  otherGoalText: draftStore.draft?.goal?.otherGoalText ?? null,
});

function selectGoal(goal: GoalDefinition) {
  selectedGoalType.value = goal.type;
  // Auto-apply defaults for the new goal
  sequenceConfig.value = {
    sequenceLength: goal.defaults.defaultPostcards,
    spacingWeeks: goal.defaults.spacingWeeks,
    serviceType: null,
    otherGoalText: null,
  };
  commitGoal();
}

function onConfigUpdate(config: typeof sequenceConfig.value) {
  sequenceConfig.value = config;
  commitGoal();
}

function commitGoal() {
  if (!selectedGoalType.value || !selectedGoal.value) return;
  const goal: GoalSelection = {
    goalType: selectedGoalType.value,
    goalLabel: selectedGoal.value.label,
    serviceType: sequenceConfig.value.serviceType,
    sequenceLength: sequenceConfig.value.sequenceLength,
    sequenceSpacingDays: sequenceConfig.value.spacingWeeks * 7,
    otherGoalText: sequenceConfig.value.otherGoalText,
  };
  draftStore.setGoal(goal);
}

onMounted(() => {
  if (!brandKitStore.hydrated) {
    brandKitStore.fetch();
  }

  // S69 demo prep: pre-select Neighbor Marketing for untouched drafts.
  // Matches the Home page Recommendation CTA + auto-populate philosophy
  // (mem 425). Once the customer picks a different goal, that selection
  // persists via draft.goal.goalType and this block is skipped.
  // Post-demo: replace hardcoded default with industry/context-aware
  // recommendation keyed off brandKit.industry + recent-job signal.
  if (!selectedGoalType.value) {
    const defaultGoal = [...primary, ...more].find(
      (g) => g.type === "neighbor_marketing",
    );
    if (defaultGoal) selectGoal(defaultGoal);
  }
});
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <!-- Existing user missing fields -->
    <div
      v-if="needsSetup && !savingSetup"
      class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8"
    >
      <h3 class="text-base font-semibold text-[#0b2d50] mb-1">
        To send postcards, we need a couple things first:
      </h3>
      <p class="text-sm text-gray-500 mb-4">
        This helps us target the right neighborhoods and generate your postcards.
      </p>

      <div class="space-y-3">
        <div v-if="!brandKitStore.brandKit?.location" class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Where's your business?
          </label>
          <input
            v-model="setupLocation"
            type="text"
            placeholder="Scottsdale, AZ"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-sm"
          />
        </div>

        <div v-if="!brandKitStore.brandKit?.industry" class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            What industry are you in?
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="[key, label] in industries"
              :key="key"
              type="button"
              class="px-3 py-1.5 rounded-lg border text-sm transition-all"
              :class="
                setupIndustry === key
                  ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              "
              @click="setupIndustry = key"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <button
          class="bg-[#47bfa9] text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-[#3aa893] transition-colors mt-2"
          :disabled="!setupLocation.trim() && !brandKitStore.brandKit?.location"
          @click="completeSetup"
        >
          Continue
        </button>
      </div>
    </div>

    <!-- Loading setup -->
    <div
      v-else-if="savingSetup"
      class="flex items-center justify-center py-12"
    >
      <div
        class="w-6 h-6 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin"
      />
    </div>

    <!-- Goal selection (shown after setup is complete or not needed) -->
    <template v-if="!needsSetup">
      <h2 class="text-xl font-semibold text-[#0b2d50] mb-1">
        What's the goal of this campaign?
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        Pick a goal and we'll set up smart defaults for targeting, timing, and
        messaging.
      </p>

      <!-- Primary goals -->
      <div class="grid grid-cols-1 gap-3 mb-4">
        <GoalCard
          v-for="goal in primary"
          :key="goal.type"
          :goal="goal"
          :selected="selectedGoalType === goal.type"
          size="primary"
          @select="selectGoal(goal)"
        />
      </div>

      <!-- More options -->
      <button
        v-if="!showMore && more.length > 0"
        class="text-sm text-[#47bfa9] font-medium hover:underline mb-4"
        @click="showMore = true"
      >
        More options ({{ more.length }})
      </button>

      <div v-if="showMore" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <GoalCard
          v-for="goal in more"
          :key="goal.type"
          :goal="goal"
          :selected="selectedGoalType === goal.type"
          size="more"
          @select="selectGoal(goal)"
        />
      </div>

      <!-- Sequence config (shown after goal selected) -->
      <SequenceConfig
        v-if="selectedGoal"
        :defaults="selectedGoal.defaults"
        :goal-type="selectedGoal.type"
        :initial-sequence-length="sequenceConfig.sequenceLength"
        :initial-spacing-weeks="sequenceConfig.spacingWeeks"
        :initial-service-type="sequenceConfig.serviceType"
        :initial-other-goal-text="sequenceConfig.otherGoalText"
        @update="onConfigUpdate"
      />
    </template>
  </div>
</template>
