<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { usePricing } from "@/composables/usePricing";
import type { CardSchedule, DesignSource, MailCampaign, ReviewSelection } from "@/types/campaign";
import ReviewSummary from "@/components/review/ReviewSummary.vue";
import ScheduleEditor from "@/components/review/ScheduleEditor.vue";
import CostBreakdown from "@/components/review/CostBreakdown.vue";
import {
  approveMailCampaign,
  createApprovalArtifact,
  purchaseCampaignRecords,
} from "@/api/mailCampaigns";
import { useRenderJob } from "@/composables/useRenderJob";
import { mediaSrc } from "@/utils/mediaSrc";

const router = useRouter();
const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();

// Phase 4D task 29: print-ready PDF preview at the final review step.
// Customer clicks "View Print Proof" to see the actual rendered output
// before approval. NOT auto-triggered on mount — every render burns a
// rate-limit slot (10/hr/org) and may collide with a job customer
// kicked off in StepDesign that's still in flight.
const { phase: renderPhase, progress: renderProgress, cards: renderedCards,
        error: renderError, start: startRender } = useRenderJob();
const showProofPanel = ref(false);

async function handleGenerateProof() {
  if (!draftStore.draft) return;
  showProofPanel.value = true;
  await draftStore.saveNow();
  await startRender(draftStore.draft.id);
}

const approving = ref(false);
const approved = ref(false);
const approvedCampaign = ref<MailCampaign | null>(null);
const APPROVAL_TERMS_VERSION = "accuracy-rights-v1";

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
// POS-149: Flow v2 checkout deltas. Absent designSource (pre-Flow-v2 drafts,
// or a draft that never touched the new design-request/upload paths) keeps
// today's generated-cards behavior exactly — see DesignSelection.designSource.
const designSource = computed<DesignSource | undefined>(
  () => draftStore.draft?.design?.designSource,
);
const uploadedFrontUrl = computed(
  () => draftStore.draft?.design?.uploadedAsset?.frontDataUrl ?? null,
);
const isCustomDesignRequest = computed(() => designSource.value === "requested");
const householdCount = computed(() => targeting.value?.finalHouseholdCount ?? 0);
const seqLen = computed(() => goal.value?.sequenceLength ?? 3);
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
const pricing = usePricing();
const perCardRate = computed(() => pricing.payPerSend); // Round 1: flat rate
const customDesignFee = computed(() =>
  isCustomDesignRequest.value ? pricing.customDesignFee : 0,
);
const totalCost = computed(
  () =>
    householdCount.value * perCardRate.value * seqLen.value +
    customDesignFee.value,
);

// Seeding
const sendSeedCopy = ref(draftStore.draft?.review?.sendSeedCopy ?? true);
const seedAddress = computed(
  () => brandKitStore.brandKit?.address ?? "Your address on file",
);

// Approve — gated on P0 #4 consolidated confirmation, AND on a non-empty
// audience: an empty custom-area draw used to sail through to an active
// Approve at "0 households / $0.00" (S82 QA fleet — 2 of 7 walks hit it
// independently). A campaign to nobody is never approvable; the free
// send-to-yourself copy alone doesn't make it one.
const canApprove = computed(
  () =>
    !approving.value &&
    Boolean(draftStore.draft?.id) &&
    campaignName.value.trim() &&
    schedules.value.length > 0 &&
    householdCount.value > 0 &&
    acknowledgedAccuracy.value,
);

async function approve() {
  if (!canApprove.value || approving.value) return;
  approving.value = true;
  draftStore.error = null;

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
      householdCount.value * perCardRate.value,
    ),
    agreedToTerms: acknowledgedAccuracy.value,
  };

  try {
    // Create MailCampaign from draft once; the server deletes the draft on success,
    // so same-screen retries after artifact/purchase errors must reuse this id.
    let campaign = approvedCampaign.value;
    if (!campaign) {
      // Commit review data to the draft only before the first approval. After
      // the campaign exists, retry clicks must not dirty a draft the server
      // has already consumed and deleted.
      draftStore.setReview(review);
      await draftStore.saveNow();
      campaign = await approveMailCampaign(draftStore.draft!.id);
    }
    approvedCampaign.value = campaign;

    try {
      await createApprovalArtifact(campaign.id, {
        acknowledgedAt: new Date().toISOString(),
        termsVersion: APPROVAL_TERMS_VERSION,
      });
    } catch (artifactErr: any) {
      draftStore.error =
        "Campaign approved, but we couldn't save the approval proof. " +
        "Tap Approve again to retry before the mailing list is purchased.";
      approving.value = false;
      return;
    }

    // Buy-on-Approve (Drake decision 2026-05-05, mem 984): trigger data-partner
    // list purchase synchronously. Trial-era qty cap = 100; clamp household
    // count at 100 until paid contract lands and the cap is raised.
    const qty = Math.max(1, Math.min(householdCount.value, 100));
    try {
      await purchaseCampaignRecords(campaign.id, qty);
    } catch (purchaseErr: any) {
      // Campaign exists at status='approved' (server rolled back from
      // 'purchasing_records' on failure). Show actionable error so customer
      // can retry. The endpoint is idempotent — re-clicking Approve is safe.
      draftStore.error =
        "Campaign approved and proof saved, but we couldn't purchase the mailing list. " +
        "Tap Approve again to retry, or check your data filters.";
      approving.value = false;
      return;
    }

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
    <!-- Left: Postcard previews + print-proof panel -->
    <div class="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      <div class="flex-1 flex items-center justify-center p-8">
        <ReviewSummary
          :draft-id="draftStore.draft?.id"
          :cards="designCards"
          :design-source="designSource"
          :uploaded-front-url="uploadedFrontUrl"
        />
      </div>

      <!-- Print proof bar — Phase 4D task 29. Same flow as StepDesign's
           Generate Proof but framed as final pre-approval verification.
           Hidden for uploaded/requested designs: the render pipeline only
           knows sequenceCards, so a proof here would show AI cards that
           contradict the preview above (cross-phase review finding). -->
      <div
        v-if="designSource !== 'uploaded' && designSource !== 'requested'"
        class="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between"
      >
        <div class="text-sm text-gray-500">
          <template v-if="renderPhase === 'idle'">
            Want to see exactly what the printer will produce?
          </template>
          <template v-else-if="renderPhase === 'starting' || renderPhase === 'queued'">
            Queueing render…
          </template>
          <template v-else-if="renderPhase === 'rendering'">
            Rendering print-ready PDF…
            <span v-if="renderProgress" class="text-gray-400">
              ({{ renderProgress.completed }}/{{ renderProgress.total }})
            </span>
          </template>
          <template v-else-if="renderPhase === 'done'">
            Print proof ready below.
          </template>
          <template v-else-if="renderPhase === 'failed'">
            <span class="text-red-600">
              {{ renderError?.message }}
            </span>
          </template>
        </div>
        <button
          class="border border-[#47bfa9] text-[#47bfa9] font-semibold px-4 py-2 rounded-lg hover:bg-[#47bfa9] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="
            renderPhase === 'starting' ||
            renderPhase === 'queued' ||
            renderPhase === 'rendering' ||
            !draftStore.draft
          "
          @click="handleGenerateProof"
        >
          <template v-if="renderPhase === 'starting' || renderPhase === 'queued' || renderPhase === 'rendering'">
            Generating…
          </template>
          <template v-else-if="renderPhase === 'done'">
            Regenerate Print Proof
          </template>
          <template v-else>
            View Print Proof
          </template>
        </button>
      </div>

      <div
        v-if="showProofPanel"
        class="border-t border-gray-200 bg-gray-50 px-6 py-4"
      >
        <div v-if="renderPhase === 'done' && renderedCards.length > 0" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="card in renderedCards"
              :key="card.cardNumber"
              class="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div class="text-xs text-gray-400 px-3 pt-2">
                Card {{ card.cardNumber }} — print PDF
              </div>
              <iframe
                :src="mediaSrc(card.downloadUrl)"
                class="w-full"
                style="height: 380px; border: 0;"
                :title="`Print proof for card ${card.cardNumber}`"
              />
            </div>
          </div>
        </div>
        <div v-else-if="renderPhase === 'failed'" class="text-sm text-red-600">
          {{ renderError?.message }}
          <button
            class="ml-2 text-[#47bfa9] underline"
            @click="handleGenerateProof"
          >
            Retry
          </button>
        </div>
      </div>
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
        <!-- Empty-audience rescue: explains WHY Approve is disabled and
             points back at Step 2 (an empty custom draw is easy to do
             without noticing). -->
        <div
          v-if="householdCount === 0"
          data-testid="zero-households-warning"
          class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800"
        >
          Your target area has no households, so this campaign can't be
          approved yet.
          <button
            class="font-semibold underline"
            @click="draftStore.goToStep(2)"
          >
            Go back to Pick Your Neighborhood
          </button>
          and choose an area with at least one household.
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
        :include-custom-design-fee="isCustomDesignRequest"
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
        <div class="text-sm text-[#0b2d50]">Visa ending in 4242</div>
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
