<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useMessage } from "naive-ui";
import LogoUrl from "@/assets/brand/logo-hz-800.png";
import WizardProgress from "@/components/wizard/WizardProgress.vue";
import type { WizardStep } from "@/types/campaign";

const route = useRoute();
const router = useRouter();
const draftStore = useCampaignDraftStore();
const message = useMessage();
const currentStep = computed(() => draftStore.currentStep as WizardStep);
const completedSteps = computed(
  () => (draftStore.draft?.completedSteps ?? []) as WizardStep[],
);

function isSttlStep2Route() {
  return (
    route.path.includes("/sttl-step-2") ||
    route.path.includes("/send-to-a-list")
  );
}

async function goToStep(step: WizardStep) {
  // The dedicated list route always renders Step 2. Leaving it must
  // change the URL or the progress control appears to do nothing.
  if (!isSttlStep2Route() || step === 2) {
    draftStore.goToStep(step);
    return;
  }
  if (step === 1) {
    const returned = await draftStore.returnToGoalSelection();
    if (!returned) return;
  } else {
    draftStore.goToStep(step);
    if (draftStore.currentStep !== step) return;
    draftStore.markPreserveDraftOnWizardRemount();
    if (draftStore.isPersisted) {
      try {
        await draftStore.saveNow();
      } catch {
        // Still leave the list route so the customer is not stuck.
      }
    }
  }
  await router.push(draftStore.mainWizardPath());
}

async function handleClose() {
  if (
    !draftStore.isPersisted &&
    !window.confirm(
      "Do you want to exit? Campaigns are only saved once you've arrived at step 3.",
    )
  ) {
    return;
  }
  if (!draftStore.isPersisted) {
    router.push("/app/home");
    return;
  }
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
    <header class="flex shrink-0 items-center justify-between px-6 py-4 sm:py-5 border-b border-gray-100">
      <!-- Logo -->
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2d50]"
        aria-label="PostCanary home"
        data-testid="wizard-logo"
        @click="handleClose"
      >
        <img :src="LogoUrl" alt="PostCanary" class="h-16 sm:h-20 w-auto object-contain" />
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
