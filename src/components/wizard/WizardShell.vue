<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import WizardProgress from "./WizardProgress.vue";
import StepGoal from "./StepGoal.vue";
import StepTargeting from "./StepTargeting.vue";
import StepDesign from "./StepDesign.vue";
import StepReview from "./StepReview.vue";
import type { WizardStep } from "@/types/campaign";

const draftStore = useCampaignDraftStore();

const step = computed(() => draftStore.currentStep);
const completedSteps = computed(() => draftStore.draft?.completedSteps ?? []);

function goToStep(s: WizardStep) {
  draftStore.goToStep(s);
}

function goBack() {
  if (step.value > 1) {
    draftStore.goToStep((step.value - 1) as WizardStep);
  }
}

function goNext() {
  if (step.value < 4 && draftStore.isStepComplete(step.value as WizardStep)) {
    draftStore.goToStep((step.value + 1) as WizardStep);
  }
}

// Force-save on browser close/refresh
function handleBeforeUnload(e: BeforeUnloadEvent) {
  // Always show "are you sure?" if draft has data — gives debounce timer
  // a chance to fire while the user reads the prompt
  if (draftStore.draft && draftStore.draft.completedSteps.length > 0) {
    e.preventDefault();
  }
  draftStore.saveNow();
}

// Intercept browser back — go to previous wizard step instead of leaving
function handlePopstate() {
  if (step.value > 1) {
    // Push state back so we stay in the wizard
    window.history.pushState(null, "", window.location.href);
    goBack();
  }
}

window.addEventListener("beforeunload", handleBeforeUnload);
window.addEventListener("popstate", handlePopstate);
// Push initial state so first back press triggers popstate instead of leaving
window.history.pushState(null, "", window.location.href);

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("popstate", handlePopstate);
});

// Save on route leave
onBeforeRouteLeave(async () => {
  await draftStore.saveNow();
  return true;
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Progress bar (teleported into WizardLayout header) -->
    <Teleport to="#wizard-progress-slot">
      <WizardProgress
        :current-step="step as WizardStep"
        :completed-steps="completedSteps as WizardStep[]"
        @goto="goToStep"
      />
    </Teleport>

    <!-- Save indicator -->
    <div
      v-if="draftStore.error"
      class="bg-red-50 text-red-600 text-xs text-center py-1.5 px-4"
    >
      {{ draftStore.error }}
    </div>
    <div
      v-else-if="draftStore.saving"
      class="bg-gray-50 text-gray-400 text-xs text-center py-1.5"
    >
      Saving...
    </div>

    <!-- Step content -->
    <div class="flex-1 overflow-y-auto">
      <StepGoal v-if="step === 1" />
      <StepTargeting v-else-if="step === 2" />
      <StepDesign v-else-if="step === 3" />
      <StepReview v-else-if="step === 4" />
    </div>

    <!-- Navigation buttons -->
    <div class="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
      <button
        v-if="step > 1"
        class="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
        @click="goBack"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Back
      </button>
      <div v-else />

      <button
        v-if="step < 4"
        class="text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
        :class="
          draftStore.isStepComplete(step as WizardStep)
            ? 'bg-[#47bfa9] text-white hover:bg-[#3aa893]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        "
        :disabled="!draftStore.isStepComplete(step as WizardStep)"
        @click="goNext"
      >
        Next
      </button>
    </div>
  </div>
</template>
