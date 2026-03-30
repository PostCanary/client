<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import WizardShell from "@/components/wizard/WizardShell.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();

const isMobile = ref(false);
const initError = ref(false);
const initializing = ref(true);

function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);

  if (isMobile.value) {
    initializing.value = false;
    return;
  }

  // MOCK MODE: skip auth + API when VITE_SKIP_AUTH is set
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === "true";

  if (skipAuth) {
    // Create a local mock draft without API call
    draftStore.$patch({
      draft: {
        id: "mock-draft-001",
        orgId: "mock-org",
        currentStep: 1 as 1,
        completedSteps: [] as (1 | 2 | 3 | 4)[],
        needsReviewSteps: [] as (1 | 2 | 3 | 4)[],
        goal: null,
        targeting: null,
        design: null,
        review: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      },
      loading: false,
      error: null,
    });
    // Hydrate brand kit with mock data so setup screen is skipped
    await brandKitStore.fetch();
    initializing.value = false;
    return;
  }

  // Onboarding gate: WizardLayout doesn't render OnboardingModal
  if (!auth.profileComplete) {
    router.replace("/app/dashboard");
    return;
  }

  // Org gate: API calls need a valid org
  if (!auth.orgId) {
    initError.value = true;
    initializing.value = false;
    return;
  }

  try {
    const draftId = route.params.draftId as string | undefined;
    if (draftId) {
      await draftStore.resume(draftId);
    } else {
      await draftStore.startNew();
      // Update URL with draft ID without adding history entry
      if (draftStore.draft) {
        router.replace(`/app/send/${draftStore.draft.id}`);
      }
    }
    // Hydrate brand kit for design step
    if (!brandKitStore.hydrated) {
      await brandKitStore.fetch();
    }
    brandKitStore.setupOrgWatcher();
  } catch {
    initError.value = true;
  } finally {
    initializing.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<template>
  <!-- Mobile gate -->
  <div
    v-if="isMobile"
    class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
  >
    <div class="text-4xl mb-4">💻</div>
    <h2 class="text-lg font-semibold text-[#0b2d50] mb-2">
      Works best on a computer
    </h2>
    <p class="text-sm text-gray-500 mb-6">
      The campaign builder needs a larger screen for the targeting map and
      postcard designer. Open PostCanary on your computer to get started.
    </p>
    <button
      class="text-sm text-[#47bfa9] font-medium hover:underline"
      @click="router.push('/app/dashboard')"
    >
      ← Go back to dashboard
    </button>
  </div>

  <!-- Loading -->
  <div
    v-else-if="initializing"
    class="flex items-center justify-center min-h-[60vh]"
  >
    <div class="text-center">
      <div
        class="w-8 h-8 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin mx-auto mb-3"
      />
      <p class="text-sm text-gray-400">Setting up your campaign...</p>
    </div>
  </div>

  <!-- Error -->
  <div
    v-else-if="initError"
    class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
  >
    <h2 class="text-lg font-semibold text-[#0b2d50] mb-2">
      Something went wrong
    </h2>
    <p class="text-sm text-gray-500 mb-4">
      We couldn't load your campaign. Please try again.
    </p>
    <button
      class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors"
      @click="router.go(0)"
    >
      Try Again
    </button>
  </div>

  <!-- Wizard -->
  <WizardShell v-else />
</template>
