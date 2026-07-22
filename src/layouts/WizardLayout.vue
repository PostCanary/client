<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRouter } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useMessage } from "naive-ui";
import LogoUrl from "@/assets/source-logo-02.png";
import WizardProgress from "@/components/wizard/WizardProgress.vue";
import type { WizardStep } from "@/types/campaign";

const router = useRouter();
const draftStore = useCampaignDraftStore();
const message = useMessage();
const currentStep = computed(() => draftStore.currentStep as WizardStep);
const completedSteps = computed(
  () => (draftStore.draft?.completedSteps ?? []) as WizardStep[],
);

function goToStep(step: WizardStep) {
  draftStore.goToStep(step);
}

async function handleClose() {
  try {
    await draftStore.saveNow();
    message.success("Your progress is saved");
  } catch {
    // Save failed — still allow exit
  }
  router.push("/app/home");
}
</script>

<template>
  <div class="h-screen bg-white flex flex-col">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <!-- Logo -->
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#47bfa9]"
        aria-label="PostCanary home"
        data-testid="wizard-logo"
        @click="handleClose"
      >
        <img :src="LogoUrl" alt="PostCanary" class="h-20 sm:h-24 w-auto object-contain -my-4 sm:-my-5" />
      </button>

      <!-- Progress remains in the shared header for every wizard route. -->
      <div id="wizard-progress-slot" class="flex-1 max-w-2xl mx-8">
        <WizardProgress
          :current-step="currentStep"
          :completed-steps="completedSteps"
          @goto="goToStep"
        />
      </div>

      <!-- Close button -->
      <button
        class="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
        title="Save and exit"
        @click="handleClose"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
