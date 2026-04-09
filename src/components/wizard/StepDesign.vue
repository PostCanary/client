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

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();

const cards = ref<CardDesign[]>([]);
const activeCardIndex = ref(0);
const showTemplateBrowser = ref(false);
const currentLayout = ref<TemplateLayoutType>("full-bleed");

const activeCard = computed(() => cards.value[activeCardIndex.value]);
const goalType = computed(() => draftStore.draft?.goal?.goalType ?? "neighbor_marketing");
const brandKit = computed(() => brandKitStore.brandKit);

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
