<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { CardDesign, DesignSelection, TemplateLayoutType } from "@/types/campaign";
import { generateCards, deriveTeaser } from "@/composables/usePostcardGenerator";
import { getRecommendedTemplateSet } from "@/data/templates";
import PostcardPreview from "@/components/postcard/PostcardPreview.vue";
import SequenceView from "@/components/design/SequenceView.vue";
import EditPanel from "@/components/design/EditPanel.vue";
import TemplateBrowser from "@/components/design/TemplateBrowser.vue";
import { useRenderJob } from "@/composables/useRenderJob";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();

// Phase 4D task 28: Generate Proof PDF via render-worker pipeline.
// Triggered after the customer is happy with the Vue preview — shows
// the actual print-ready PDF the renderer will produce. Lives below the
// editing surface so the iterate→preview→commit→render cycle stays in
// one screen.
const { phase: renderPhase, progress: renderProgress, cards: renderedCards,
        error: renderError, start: startRender } = useRenderJob();
const showProofPanel = ref(false);

async function handleGenerateProof() {
  // Persist any unsaved edits BEFORE kicking off the render — the
  // server reads from `draft.data.design.sequenceCards`, not from a
  // request payload. Without this, the render uses the last
  // debounced-saved version and the customer's recent tweaks don't
  // appear.
  if (!draftStore.draft) return;
  showProofPanel.value = true;
  await draftStore.saveNow();
  await startRender(draftStore.draft.id);
}

const cards = ref<CardDesign[]>([]);
const activeCardIndex = ref(0);
const showTemplateBrowser = ref(false);
const currentLayout = ref<TemplateLayoutType>("full-bleed");

const activeCard = computed(() => cards.value[activeCardIndex.value]);
const goalType = computed(() => draftStore.draft?.goal?.goalType ?? "neighbor_marketing");
const brandKit = computed(() => brandKitStore.brandKit);
// City is derived from brandKit.location which is "City, ST" — split on
// comma and take the first part. Used by PostcardBack for the "Serving
// {city} since {year}" local-proof line in the return-address strip.
const brandKitCity = computed(() => {
  const loc = brandKit.value?.location ?? "";
  return loc.split(",")[0]?.trim() ?? "";
});

// Credibility line for the front of the card. Prefers "Serving {city}
// since {year}" when we have both, falls back to certifications[0], then
// to a neutral default. Kept short so the top-row badge truncation
// (P0 #4) rarely needs to fire.
const brandKitCredibility = computed(() => {
  const bk = brandKit.value;
  if (!bk) return "Licensed & Insured";
  if (brandKitCity.value && bk.yearsInBusiness && bk.yearsInBusiness > 0) {
    const year = new Date().getFullYear() - bk.yearsInBusiness;
    return `Serving ${brandKitCity.value} since ${year}`;
  }
  if (bk.certifications && bk.certifications.length > 0) {
    return bk.certifications[0]!;
  }
  return "Licensed & Insured";
});

// Original cards for reset
let originalCards: CardDesign[] = [];

onMounted(() => {
  if (!brandKitStore.hydrated) brandKitStore.fetch();

  // Load existing design or generate new cards
  if (draftStore.draft?.design?.sequenceCards?.length) {
    cards.value = [...draftStore.draft.design.sequenceCards];
    currentLayout.value = draftStore.draft.design.templateLayoutType;
  } else {
    generateNewCards();
  }
  originalCards = cards.value.map((c) => ({ ...c }));
});

async function generateNewCards() {
  if (!brandKit.value) return;
  const seqLen = draftStore.draft?.goal?.sequenceLength ?? 3;
  const breakdown = draftStore.draft?.targeting?.recipientBreakdown ?? {
    newProspects: 400,
    pastCustomers: 30,
    pastCustomersIncluded: false,
  };

  cards.value = await generateCards(
    brandKit.value,
    goalType.value,
    seqLen,
    breakdown,
  );

  const templates = getRecommendedTemplateSet(goalType.value);
  currentLayout.value = templates[0]?.layoutType ?? "full-bleed";
  commitDesign();
}

function updateCardField(field: string, value: string) {
  if (!activeCard.value) return;
  // Set as override
  (activeCard.value.overrides as Record<string, string>)[field] = value;
  // Update resolved content
  (activeCard.value.resolvedContent as Record<string, any>)[field] = value;
  // When offerText changes, keep offerTeaser in sync so the front-of-card
  // badge doesn't show a stale teaser after the user edits the back offer.
  // (Fixes Codex Pass 2 HIGH finding — demo-visible contradiction.)
  if (field === "offerText") {
    activeCard.value.resolvedContent.offerTeaser = deriveTeaser(
      value,
      goalType.value,
    );
  }
  commitDesign();
}

function updatePhoto(url: string) {
  if (!activeCard.value) return;
  activeCard.value.overrides.photoUrl = url;
  activeCard.value.resolvedContent.photoUrl = url;
  commitDesign();
}

function selectTemplate(layout: TemplateLayoutType) {
  currentLayout.value = layout;
  // Regenerate cards with new template but keep overrides
  const overrides = cards.value.map((c) => ({ ...c.overrides }));
  generateNewCards();
  // Re-apply overrides
  cards.value.forEach((card, i) => {
    if (overrides[i]) {
      Object.assign(card.overrides, overrides[i]);
      Object.assign(card.resolvedContent, overrides[i]);
    }
  });
  showTemplateBrowser.value = false;
  commitDesign();
}

function resetCard() {
  const orig = originalCards[activeCardIndex.value];
  if (orig) {
    cards.value[activeCardIndex.value] = { ...orig, overrides: {} };
    commitDesign();
  }
}

function commitDesign() {
  const design: DesignSelection = {
    templateId: cards.value[0]?.templateId ?? "",
    templateLayoutType: currentLayout.value,
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: cards.value,
  };
  draftStore.setDesign(design);
}

// Regenerate if brand kit loads after mount
watch(
  () => brandKitStore.hydrated,
  (hydrated) => {
    if (hydrated && cards.value.length === 0) {
      generateNewCards();
    }
  },
);
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- No brand kit warning -->
    <div
      v-if="!brandKit"
      class="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center text-sm text-amber-700"
    >
      Brand info is loading... Postcard will be generated with placeholder content.
    </div>

    <!-- Sequence view (top) -->
    <SequenceView
      v-if="cards.length > 1"
      :cards="cards"
      :active-card-index="activeCardIndex"
      :brand-colors="brandKit?.brandColors"
      :business-name="brandKit?.businessName"
      :business-address="brandKit?.address ?? ''"
      :logo-url="brandKit?.logoUrl"
      :rating="brandKit?.googleRating ?? null"
      :review-count="brandKit?.reviewCount ?? null"
      :trust-badges="brandKit?.trustBadges ?? []"
      :years-in-business="brandKit?.yearsInBusiness ?? null"
      :city="brandKitCity"
      :credibility-line="brandKitCredibility"
      class="px-4 pt-4"
      @select="activeCardIndex = $event"
    />

    <!-- Main content: preview + edit panel -->
    <div class="flex flex-1 min-h-0">
      <!-- Left: Postcard preview -->
      <div class="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div class="max-w-lg w-full">
          <PostcardPreview
            v-if="activeCard"
            :card="activeCard"
            :layout-type="currentLayout"
            :brand-colors="brandKit?.brandColors"
            :business-name="brandKit?.businessName"
            :business-address="brandKit?.address ?? ''"
            :logo-url="brandKit?.logoUrl"
            :rating="brandKit?.googleRating ?? null"
            :review-count="brandKit?.reviewCount ?? null"
            :trust-badges="brandKit?.trustBadges ?? []"
            :years-in-business="brandKit?.yearsInBusiness ?? null"
            :city="brandKitCity"
            :credibility-line="brandKitCredibility"
            :hide-address-placeholder="true"
            size="large"
          />
        </div>
      </div>

      <!-- Right: Edit panel -->
      <EditPanel
        v-if="activeCard"
        :card="activeCard"
        :brand-kit="brandKit"
        @update-field="updateCardField"
        @update-photo="updatePhoto"
        @open-template-browser="showTemplateBrowser = true"
        @reset="resetCard"
      />
    </div>

    <!-- Generate Proof bar (Phase 4D task 28) — sits between the
         editing surface and the render panel so it's visible after the
         customer has done their pass on the Vue preview. -->
    <div
      class="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between"
    >
      <div class="text-sm text-gray-500">
        <template v-if="renderPhase === 'idle'">
          Happy with the design? See the print-ready proof.
        </template>
        <template v-else-if="renderPhase === 'starting' || renderPhase === 'queued'">
          Queueing render…
        </template>
        <template v-else-if="renderPhase === 'rendering'">
          Rendering postcard{{ renderProgress && renderProgress.total > 1 ? "s" : "" }}…
          <span v-if="renderProgress" class="text-gray-400">
            ({{ renderProgress.completed }}/{{ renderProgress.total }})
          </span>
        </template>
        <template v-else-if="renderPhase === 'done'">
          Proof ready — review below.
        </template>
        <template v-else-if="renderPhase === 'failed'">
          <span class="text-red-600">
            Render failed: {{ renderError?.message }}
          </span>
        </template>
      </div>
      <button
        class="bg-[#47bfa9] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#3aa893] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="
          renderPhase === 'starting' ||
          renderPhase === 'queued' ||
          renderPhase === 'rendering' ||
          !draftStore.draft
        "
        @click="handleGenerateProof"
      >
        <template v-if="renderPhase === 'starting' || renderPhase === 'queued' || renderPhase === 'rendering'">
          <span
            class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin align-middle mr-2"
          />
          Generating…
        </template>
        <template v-else-if="renderPhase === 'done'">
          Regenerate Proof
        </template>
        <template v-else>
          Generate Proof
        </template>
      </button>
    </div>

    <!-- Proof panel — collapses until first render attempt. PDF embedded
         via <iframe> with the signed download URL (10-min TTL); cookie
         auth on the iframe request is automatic for same-origin. -->
    <div
      v-if="showProofPanel"
      class="border-t border-gray-200 bg-gray-50 px-6 py-4"
    >
      <div v-if="renderPhase === 'done' && renderedCards.length > 0" class="space-y-3">
        <div class="text-sm font-semibold text-[#0b2d50]">
          Print-ready proof ({{ renderedCards.length }} card{{ renderedCards.length > 1 ? "s" : "" }})
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="card in renderedCards"
            :key="card.cardNumber"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div class="text-xs text-gray-400 px-3 pt-2">Card {{ card.cardNumber }}</div>
            <iframe
              :src="card.downloadUrl"
              class="w-full"
              style="height: 360px; border: 0;"
              :title="`Proof for card ${card.cardNumber}`"
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
      <div v-else class="text-sm text-gray-400">
        Proof will appear here once rendering finishes.
      </div>
    </div>

    <!-- Template browser overlay -->
    <TemplateBrowser
      v-if="showTemplateBrowser"
      :goal-type="goalType"
      :current-layout="currentLayout"
      @select="selectTemplate"
      @close="showTemplateBrowser = false"
    />
  </div>
</template>
