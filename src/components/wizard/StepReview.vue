<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { PRICING } from "@/types/campaign";
import type { CardSchedule, ReviewSelection } from "@/types/campaign";
import ReviewSummary from "@/components/review/ReviewSummary.vue";
import ScheduleEditor from "@/components/review/ScheduleEditor.vue";
import CostBreakdown from "@/components/review/CostBreakdown.vue";
import { approveMailCampaign } from "@/api/mailCampaigns";

const router = useRouter();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();

const approving = ref(false);
const approved = ref(false);

// Brief #6 P0 #4: Consolidated accuracy + rights confirmation before
// Approve is enabled. V1 spec line 989: "Mandatory confirmation checkboxes
// before approval: accuracy of info, image rights, PostCanary not
// responsible for accuracy". Consolidated into one checkbox per Krug —
// multiple checkboxes fragment attention and users click them without
// reading. One checkbox with a clear combined statement has more weight.
//
// INTENTIONAL: this ref is NOT hydrated from draftStore.draft.review on
// mount, even though every other Step 4 field is. An acknowledgement is
// a point-in-time act, not persisted state. If the customer resumes a
// draft 3 days later they should re-read and re-check. `agreedToTerms`
// in the persisted review schema remains the value captured at the
// moment the customer actually clicks Approve.
//
// SPEC DEVIATION: V1 spec also has per-asset checkboxes (lines 763-764:
// "Confirm you have rights to use this image in print" and "Confirm this
// is a real customer review") near the photo/review pickers. Drake's
// explicit direction for P0 #4 was consolidation per Krug. Per-asset
// confirmations are deferred to V1.1 — tracked in postcanary-todo.md.
const acknowledgedAccuracy = ref(false);

// Data from earlier steps
const goal = computed(() => draftStore.draft?.goal);
const targeting = computed(() => draftStore.draft?.targeting);
const designCards = computed(() => draftStore.draft?.design?.sequenceCards ?? []);
const householdCount = computed(() => targeting.value?.finalHouseholdCount ?? 0);
const seqLen = computed(() => goal.value?.sequenceLength ?? 3);
// City extracted from brandKit.location ("City, ST") — used for
// PostcardBack's "Serving {city} since {year}" local-proof line.
const brandKitCity = computed(() => {
  const loc = brandKitStore.brandKit?.location ?? "";
  return loc.split(",")[0]?.trim() ?? "";
});

// Campaign name — auto-generated, editable
const campaignName = ref("");
onMounted(() => {
  if (draftStore.draft?.review?.campaignName) {
    campaignName.value = draftStore.draft.review.campaignName;
  } else {
    const goalLabel = goal.value?.goalLabel ?? "Campaign";
    const date = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    // Format: [Goal] — [Primary Area] — [Date]
    const area = targeting.value?.areas?.[0]?.zipCode
      ?? brandKitStore.brandKit?.location
      ?? "";
    const areaStr = area ? ` — ${area}` : "";
    campaignName.value = `${goalLabel}${areaStr} — ${date}`;
  }
});

// Targeting method label
const targetingMethodLabel = computed(() => {
  const method = targeting.value?.method;
  if (method === "around_jobs") return "Around recent jobs";
  if (method === "zip") return "By ZIP code";
  if (method === "draw") return "Custom area on map";
  return "Custom targeting";
});

// Schedule — pre-fill from Step 1 spacing
const schedules = ref<CardSchedule[]>([]);
onMounted(() => {
  if (draftStore.draft?.review?.schedules?.length) {
    schedules.value = draftStore.draft.review.schedules;
  } else {
    const today = new Date();
    const spacing = goal.value?.sequenceSpacingDays ?? 14;
    schedules.value = Array.from({ length: seqLen.value }, (_, i) => {
      const send = new Date(today);
      send.setDate(send.getDate() + 5 + i * spacing);
      const deliver = new Date(send);
      deliver.setDate(deliver.getDate() + 5);
      return {
        cardNumber: i + 1,
        scheduledDate: send.toISOString().split("T")[0] ?? "",
        estimatedDeliveryDate: deliver.toISOString().split("T")[0] ?? "",
      };
    });
  }
});

function updateSchedule(updated: CardSchedule[]) {
  schedules.value = updated;
}

// Cost
const perCardRate = PRICING.payPerSend; // Round 1: flat rate
const totalCost = computed(() => householdCount.value * perCardRate * seqLen.value);

// Seeding
const sendSeedCopy = ref(draftStore.draft?.review?.sendSeedCopy ?? true);
const seedAddress = computed(
  () => brandKitStore.brandKit?.address ?? "Your address on file",
);

// Approve — gated on P0 #4 consolidated confirmation
const canApprove = computed(
  () =>
    !approving.value &&
    campaignName.value.trim() &&
    schedules.value.length > 0 &&
    acknowledgedAccuracy.value,
);

async function approve() {
  if (!canApprove.value || approving.value) return;
  approving.value = true;

  // Commit review data to store
  const review: ReviewSelection = {
    campaignName: campaignName.value.trim(),
    schedules: schedules.value,
    sendSeedCopy: sendSeedCopy.value,
    seedAddress: seedAddress.value,
    additionalSeeds: [],
    paymentMethodId: null,
    paymentMethodLabel: "Visa ending in 4242",
    totalCost: totalCost.value,
    perCardCosts: Array(seqLen.value).fill(
      householdCount.value * perCardRate,
    ),
    agreedToTerms: acknowledgedAccuracy.value,
  };
  draftStore.setReview(review);
  await draftStore.saveNow();

  try {
    // Create MailCampaign from draft (server deletes draft on success)
    await approveMailCampaign(draftStore.draft!.id);
    approved.value = true;
  } catch (e: any) {
    draftStore.error = "Failed to approve campaign. Please try again.";
  } finally {
    approving.value = false;
  }
}
</script>

<template>
  <!-- Confirmation screen -->
  <div
    v-if="approved"
    class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
  >
    <div class="text-5xl mb-4">🎉</div>
    <h2 class="text-2xl font-bold text-[#0b2d50] mb-2">
      Your campaign is live!
    </h2>
    <p class="text-gray-500 mb-6 max-w-md">
      Card 1 is in production and will mail in about 5 business days.
      <template v-if="seqLen > 1">
        Cards 2{{ seqLen > 2 ? `-${seqLen}` : "" }} will follow on
        schedule unless you pause.
      </template>
    </p>
    <p class="text-xs text-gray-400 mb-6">
      You can cancel within 1 hour if you change your mind.
    </p>
    <div class="flex gap-3">
      <button
        class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors"
        @click="router.push('/app/campaigns')"
      >
        View Campaign
      </button>
      <button
        class="border border-gray-200 text-[#0b2d50] font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        @click="router.push('/app/send')"
      >
        Send More Mail
      </button>
    </div>
  </div>

  <!-- Review screen -->
  <div v-else class="flex h-full">
    <!-- Left: Postcard previews -->
    <div class="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <ReviewSummary
        :cards="designCards"
        :brand-colors="brandKitStore.brandKit?.brandColors"
        :business-name="brandKitStore.brandKit?.businessName"
        :business-address="brandKitStore.brandKit?.address ?? ''"
        :logo-url="brandKitStore.brandKit?.logoUrl"
        :rating="brandKitStore.brandKit?.googleRating ?? null"
        :review-count="brandKitStore.brandKit?.reviewCount ?? null"
        :trust-badges="brandKitStore.brandKit?.trustBadges ?? []"
        :years-in-business="brandKitStore.brandKit?.yearsInBusiness ?? null"
        :city="brandKitCity"
      />
    </div>

    <!-- Right: Details panel -->
    <div class="w-96 border-l border-gray-200 p-6 overflow-y-auto">
      <!-- Campaign name -->
      <div class="mb-5">
        <label class="text-xs text-gray-400 uppercase tracking-wider">
          Campaign Name
        </label>
        <input
          v-model="campaignName"
          class="w-full text-lg font-semibold text-[#0b2d50] border-b border-gray-200 pb-1 focus:border-[#47bfa9] outline-none mt-1"
        />
      </div>

      <!-- Targeting summary -->
      <div class="mb-5 p-3 bg-white rounded-lg border border-gray-200">
        <div class="text-sm text-gray-500">Sending to</div>
        <div class="text-lg font-semibold text-[#0b2d50]">
          {{ householdCount.toLocaleString() }} households
        </div>
        <div class="text-xs text-gray-400">
          {{ targetingMethodLabel }}
        </div>
      </div>

      <!-- Schedule -->
      <ScheduleEditor
        :schedules="schedules"
        :sequence-spacing-days="goal?.sequenceSpacingDays ?? 14"
        @update="updateSchedule"
      />

      <!-- Cost -->
      <CostBreakdown
        :household-count="householdCount"
        :sequence-length="seqLen"
        class="mt-5"
      />

      <!-- Campaign seeding -->
      <div class="mt-5 flex items-center gap-2">
        <input
          id="seed"
          v-model="sendSeedCopy"
          type="checkbox"
          class="accent-[#47bfa9]"
        />
        <label for="seed" class="text-sm text-gray-500">
          Send a copy to yourself (free)
        </label>
      </div>
      <p v-if="sendSeedCopy" class="text-xs text-gray-400 ml-6">
        Mailing to: {{ seedAddress }}
      </p>

      <!-- Payment method (mock) -->
      <div class="mt-5 p-3 bg-white rounded-lg border border-gray-200">
        <div class="text-xs text-gray-400">Payment method</div>
        <div class="text-sm text-[#0b2d50]">💳 Visa ending in 4242</div>
        <button class="text-xs text-[#47bfa9] mt-1">Change</button>
      </div>

      <!-- P0 #4: consolidated accuracy + rights acknowledgement.
           Blocks Approve until checked. Single combined statement per Krug —
           multiple checkboxes fragment attention; one high-weight checkbox
           is more likely to be read. -->
      <div
        class="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg"
      >
        <label class="flex items-start gap-2 cursor-pointer">
          <input
            id="accuracy-ack"
            v-model="acknowledgedAccuracy"
            type="checkbox"
            class="accent-[#47bfa9] mt-0.5 flex-shrink-0"
          />
          <span class="text-xs text-[#0b2d50] leading-snug">
            I confirm all information on this postcard is accurate and
            I have the rights to use the photos, logos, and reviews
            shown. PostCanary is not responsible for the accuracy of
            customer-supplied content.
          </span>
        </label>
      </div>

      <!-- Approve button -->
      <button
        class="mt-3 w-full py-3 bg-[#47bfa9] text-white font-semibold rounded-xl hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors"
        :disabled="!canApprove"
        @click="approve"
      >
        <template v-if="approving">
          <span
            class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin align-middle mr-2"
          />
          Approving...
        </template>
        <template v-else> Approve & Send Card 1 </template>
      </button>
      <p v-if="seqLen > 1" class="text-xs text-gray-400 text-center mt-2">
        Cards {{ seqLen > 2 ? `2-${seqLen}` : "2" }} send on schedule
        unless you pause. You can cancel within 1 hour.
      </p>
      <p v-else class="text-xs text-gray-400 text-center mt-2">
        You can cancel within 1 hour.
      </p>
    </div>
  </div>
</template>
