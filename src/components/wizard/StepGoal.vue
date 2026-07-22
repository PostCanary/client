<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { GoalSelection, Industry } from "@/types/campaign";
import { INDUSTRY_LABELS } from "@/types/campaign";
import { updateOrg } from "@/api/orgs";
import { useAuthStore } from "@/stores/auth";
import { MapOutline, ListOutline } from "@vicons/ionicons5";
import {
  getGoalsForDisplay,
  type GoalDefinition,
} from "@/data/campaignGoals";
import { EDDM_ENABLED } from "@/config/featureFlags";

const route = useRoute();
const router = useRouter();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();
const auth = useAuthStore();

// Existing user inline setup (missing location/industry)
const missingSetupLocation = computed(() => !brandKitStore.brandKit?.location);
const missingSetupIndustry = computed(() => !brandKitStore.brandKit?.industry);
const needsSetup = computed(
  () => missingSetupLocation.value || missingSetupIndustry.value,
);
const setupLocation = ref("");
const setupIndustry = ref<Industry | "">("");
const savingSetup = ref(false);
const canCompleteSetup = computed(
  () =>
    (!missingSetupLocation.value || !!setupLocation.value.trim()) &&
    (!missingSetupIndustry.value || !!setupIndustry.value),
);

const industries = Object.entries(INDUSTRY_LABELS) as [Industry, string][];

async function completeSetup() {
  if (!canCompleteSetup.value) return;
  savingSetup.value = true;
  try {
    if (auth.orgId && setupLocation.value.trim()) {
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
        location: missingSetupLocation.value
          ? setupLocation.value.trim()
          : brandKitStore.brandKit?.location,
        industry: missingSetupIndustry.value
          ? setupIndustry.value
          : brandKitStore.brandKit?.industry,
      },
    });
    savingSetup.value = false;
  }
}

// Campaign type toggle (EDDM_ENABLED feature flag)
const campaignType = ref<'targeted' | 'eddm'>(
  draftStore.draft?.campaignType ?? 'targeted',
);

function selectCampaignType(type: 'targeted' | 'eddm') {
  campaignType.value = type;
  draftStore.setCampaignType(type);
}

/* ── Dashboard Flow v2 (POS-146): the visible choice is Target an Area vs
 * Send to a List, per the wireframe. The goal system stays underneath —
 * each option maps to an existing goal type (target_area / send_to_list)
 * with its defaults, so campaign naming, sequence defaults, and AI copy
 * grounding keep working. The full goal picker is gone from the UI, not
 * from the data model. ── */
const { primary, more } = getGoalsForDisplay();
const allGoals = [...primary, ...more];
const targetAreaGoal = allGoals.find((g) => g.type === "target_area") ?? null;
const sendToListGoal = allGoals.find((g) => g.type === "send_to_list") ?? null;

const selectedGoalType = ref(draftStore.draft?.goal?.goalType ?? null);

function commitGoal(goal: GoalDefinition) {
  selectedGoalType.value = goal.type;
  const selection: GoalSelection = {
    goalType: goal.type,
    goalLabel: goal.label,
    serviceType: draftStore.draft?.goal?.serviceType ?? null,
    sequenceLength: 1,
    sequenceSpacingDays: goal.defaults.spacingWeeks * 7,
    otherGoalText: null,
  };
  draftStore.setGoal(selection);
}

async function chooseTargetArea() {
  if (!targetAreaGoal) return;
  commitGoal(targetAreaGoal);
  await nextTick();
  if (draftStore.isStepComplete(1)) {
    draftStore.goToStep(2);
  }
}

async function chooseSendToList() {
  if (!sendToListGoal) return;
  commitGoal(sendToListGoal);
  draftStore.goToStep(2);
  await router.push(
    draftStore.draft?.id
      ? `/app/send/${draftStore.draft.id}/sttl-step-2`
      : "/app/send/sttl-step-2",
  );
}

onMounted(async () => {
  if (!brandKitStore.hydrated) {
    brandKitStore.fetch();
  }

  // S69: arriving from the Home page Recommendation card means the goal was
  // already expressed by that click — auto-apply the recommended goal and
  // skip ahead to Step 2. Direct visits get the explicit two-option choice
  // (Flow v2) with no auto-selection, so card generation fires once, on the
  // user's actual pick.
  if (
    !selectedGoalType.value &&
    route.query.from === "recommendation" &&
    !needsSetup.value
  ) {
    const recommended =
      allGoals.find((g) => g.type === "neighbor_marketing") ?? targetAreaGoal;
    if (recommended) {
      commitGoal(recommended);
      await nextTick();
      if (draftStore.isStepComplete(1)) {
        draftStore.goToStep(2);
      }
    }
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
        <div v-if="missingSetupLocation" class="field">
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

        <div v-if="missingSetupIndustry" class="field">
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
          :disabled="!canCompleteSetup"
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

    <!-- EDDM campaign-type toggle (feature flag OFF by default) -->
    <div
      v-if="EDDM_ENABLED && !needsSetup"
      class="flex gap-2 mb-6"
    >
      <button
        type="button"
        class="flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all"
        :class="campaignType === 'targeted'
          ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'"
        @click="selectCampaignType('targeted')"
      >
        Targeted Mailing
      </button>
      <button
        type="button"
        class="flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all"
        :class="campaignType === 'eddm'
          ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'"
        @click="selectCampaignType('eddm')"
      >
        EDDM (Every Door Direct Mail)
      </button>
    </div>

    <!-- Audience choice (Flow v2 wireframe: two large options) -->
    <div
      v-if="!needsSetup"
      class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6"
    >
      <button
        type="button"
        class="audience-option audience-option--primary"
        data-testid="choose-target-area"
        @click="chooseTargetArea"
      >
        <MapOutline class="w-9 h-9" aria-hidden="true" />
        <span class="text-lg font-bold">Target an Area</span>
        <span class="text-sm opacity-90">Pick any Neighborhood on the map.</span>
      </button>

      <button
        type="button"
        class="audience-option"
        data-testid="choose-send-to-list"
        @click="chooseSendToList"
      >
        <ListOutline class="w-9 h-9" aria-hidden="true" />
        <span class="text-lg font-bold">Send to a List</span>
        <span class="text-sm opacity-75">Mail to a list you already have.</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.audience-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 200px;
  padding: 32px 24px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #0b2d50;
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s ease-out, background 0.15s ease-out,
    color 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out;
}

/* Both choices share the same hover treatment; neither is highlighted until
 * the customer points at it. */
.audience-option:hover,
.audience-option:focus-visible {
  background: var(--app-teal, #47bfa9);
  border-color: var(--app-teal, #47bfa9);
  color: #fff;
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(71, 191, 169, 0.35);
}

.audience-option:focus-visible {
  outline: 2px solid var(--app-teal-hover, #3aa893);
  outline-offset: 2px;
}
</style>
