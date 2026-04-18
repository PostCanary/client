<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { CardDesign, DesignSelection, TemplateLayoutType } from "@/types/campaign";
import { generateCards, deriveTeaser } from "@/composables/usePostcardGenerator";
import { getRecommendedTemplateSet } from "@/data/templates";
import SequenceView from "@/components/design/SequenceView.vue";
import EditPanel from "@/components/design/EditPanel.vue";
import TemplateBrowser from "@/components/design/TemplateBrowser.vue";
import { useRenderJob } from "@/composables/useRenderJob";
import { useCardPreview } from "@/composables/useCardPreview";
import { previewCard } from "@/api/renderJobs";

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
const proofImages = ref<string[]>([]);

async function handleGenerateProof() {
  if (!draftStore.draft) return;
  showProofPanel.value = true;
  await draftStore.saveNow();

  // Fetch PNG previews for ALL cards using the same preview-card endpoint
  // that the editing surface uses (ONE RENDERING RULE).
  const totalCards = cards.value.length || 1;
  proofImages.value = [];
  const urls: string[] = [];

  for (let i = 1; i <= totalCards; i++) {
    try {
      // Session 54 Codex: previewCard now returns { blob, warnings } so
      // the composable/caller can surface render warnings. Proof panel
      // just needs the blob; log warnings for QA visibility.
      const result = await previewCard(draftStore.draft.id, i);
      urls.push(URL.createObjectURL(result.blob));
      if (result.warnings.length > 0) {
        console.warn(
          `[StepDesign] proof card ${i} render warnings:`,
          result.warnings,
        );
      }
    } catch {
      urls.push("");
    }
  }
  proofImages.value = urls;

  // Also kick off the PDF render for the download link
  await startRender(draftStore.draft.id);
}

const cards = ref<CardDesign[]>([]);
const activeCardIndex = ref(0);
const showTemplateBrowser = ref(false);
const currentLayout = ref<TemplateLayoutType>("full-bleed");

const draftIdRef = computed(() => draftStore.draft?.id);
const cardNumberRef = computed(() => activeCardIndex.value + 1);
const activeCard = computed(() => cards.value[activeCardIndex.value]);
const { previewUrl, loading: previewLoading, error: previewError, refresh: refreshPreview } = useCardPreview(
  draftIdRef,
  cardNumberRef,
  activeCard,
);
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

const cardsReady = computed(() => cards.value.length > 0);

onMounted(() => {
  if (!brandKitStore.hydrated) brandKitStore.fetch();

  if (draftStore.draft?.design?.sequenceCards?.length) {
    cards.value = [...draftStore.draft.design.sequenceCards];
    currentLayout.value = draftStore.draft.design.templateLayoutType;
  }
  originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
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
    cards.value[activeCardIndex.value] = { ...(JSON.parse(JSON.stringify(orig)) as CardDesign), overrides: {} };
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

// Sync cards from store when async generation completes (fired by setGoal in Step 1)
watch(
  () => draftStore.draft?.design?.sequenceCards,
  (storeCards) => {
    if (storeCards?.length && cards.value.length === 0) {
      cards.value = [...storeCards];
      currentLayout.value = draftStore.draft?.design?.templateLayoutType ?? "full-bleed";
      originalCards = cards.value.map((c) => JSON.parse(JSON.stringify(c)) as CardDesign);
    }
  },
);

// If brand kit loads after Step 1 fired (guard skipped it), retry generation
watch(
  () => brandKitStore.hydrated,
  (hydrated) => {
    if (hydrated && cards.value.length === 0) {
      draftStore.generateCardsForDraft();
    }
  },
);
</script>

<template>
  <div class="grid grid-rows-[auto_1fr_auto_auto] min-h-full">
    <!-- No brand kit warning -->
    <div
      v-if="!brandKit"
      class="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center text-sm text-amber-700"
    >
      Brand info is loading... Postcard will be generated with placeholder content.
    </div>

    <!-- Main content: 2-column grid. SequenceView lives INSIDE the left
         column above the preview so the carousel and the preview share
         the same horizontal center axis — fixes the ~160px misalignment
         caused by SequenceView being centered on the full page width
         while the preview was centered in the left-of-sidebar column
         (Session 59 layout polish). -->
    <div class="grid grid-cols-[1fr_20rem] min-h-0">
      <!-- Left column: SequenceView (top) + Preview (fills remaining) -->
      <div class="flex flex-col min-w-0">
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
          class="px-6 pt-6 pb-4"
          @select="activeCardIndex = $event"
        />
        <div class="flex-1 min-h-0 flex items-center justify-center p-6 bg-gray-50 overflow-hidden">
          <!-- Pre-generation loading state. User reached Step 3 before
               auto-populate finished (fires from Step 1 goal commit in
               useCampaignDraftStore.setGoal → generateCardsForDraft).
               Warm treatment matches footer's "Generating your postcards…"
               copy; replaces previous "Preview unavailable" that fired
               when useCardPreview called the server before cards existed.
               S62 rehearsal fix. -->
          <div v-if="!cardsReady" class="w-full max-w-lg aspect-[3/2] bg-white border border-gray-200 rounded flex items-center justify-center">
            <div class="text-center space-y-3 px-6">
              <span class="inline-block w-8 h-8 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin" />
              <div class="text-sm text-gray-700 font-medium">Designing your postcards…</div>
              <div class="text-xs text-gray-500">This usually takes about a minute.</div>
            </div>
          </div>
          <div v-else-if="previewLoading && !previewUrl" class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center">
            <span class="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <img
            v-else-if="previewUrl"
            :src="previewUrl"
            alt="Postcard preview"
            class="max-w-full w-auto h-auto object-contain rounded shadow-sm max-h-[calc(100vh-400px)]"
            :class="{ 'opacity-60': previewLoading }"
          />
          <div v-else-if="previewError" class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
            Preview unavailable.
            <button class="ml-2 text-[#47bfa9] underline" @click="refreshPreview">Retry</button>
          </div>
          <div v-else class="w-full max-w-lg aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-400">
            Waiting for card data…
          </div>
        </div>
      </div>

      <!-- Right column: Edit panel -->
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
      class="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between gap-4"
    >
      <!-- Status strip. Empty on idle (no happy-talk per Krug's rule —
           the button label is self-explanatory). Populated with active
           state for starting/queued/rendering/done/failed. `min-w-0 flex-1`
           lets long error messages wrap or truncate without pushing the
           button offscreen at 1280×720. -->
      <div class="text-sm text-gray-500 min-w-0 flex-1">
        <template v-if="!cardsReady">
          <span class="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin align-middle mr-2" />
          Generating your postcards…
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
          <span class="text-red-600 break-words">
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
          !draftStore.draft ||
          !cardsReady
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

    <!-- Proof panel — shows PNG previews of all cards from the same
         preview-card endpoint (ONE RENDERING RULE: on-screen = PNG,
         PDF = download only). -->
    <div
      v-if="showProofPanel"
      class="border-t border-gray-200 bg-gray-50 px-6 py-4"
    >
      <div v-if="proofImages.length > 0" class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold text-[#0b2d50]">
            Print-ready proof ({{ proofImages.length }} card{{ proofImages.length > 1 ? "s" : "" }})
          </div>
          <a
            v-if="renderPhase === 'done' && renderedCards.length > 0"
            :href="renderedCards[0]?.downloadUrl"
            target="_blank"
            class="text-sm text-[#47bfa9] underline"
          >Download PDF</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(imgUrl, idx) in proofImages"
            :key="idx"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div class="text-xs text-gray-400 px-3 pt-2">Card {{ idx + 1 }}</div>
            <img
              :src="imgUrl"
              :alt="`Proof for card ${idx + 1}`"
              class="w-full"
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
