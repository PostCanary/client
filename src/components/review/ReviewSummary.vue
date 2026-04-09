<script setup lang="ts">
import { ref, computed } from "vue";
import PostcardPreview from "@/components/postcard/PostcardPreview.vue";
import type { CardDesign, TemplateLayoutType, TrustBadge } from "@/types/campaign";

const props = defineProps<{
  cards: CardDesign[];
  brandColors?: string[];
  businessName?: string;
  businessAddress?: string;
  logoUrl?: string | null;
  // Brief #6 Phase 2 props threaded through 2026-04-09 — without these
  // the wizard/review flow would render PostcardBack without rating,
  // reviewCount, trustBadges, yearsInBusiness, city (dead-prop bug
  // caught by Codex Pass 1 on P0 #2).
  rating?: number | null;
  reviewCount?: number | null;
  trustBadges?: TrustBadge[];
  yearsInBusiness?: number | null;
  city?: string;
  credibilityLine?: string;
}>();

const currentCardIndex = ref(0);

const currentCard = computed(() => props.cards[currentCardIndex.value]);
const totalCards = computed(() => props.cards.length);

const currentLayout = computed((): TemplateLayoutType => {
  const id = currentCard.value?.templateId ?? "";
  // Template IDs are formatted as "layoutType-cardPurpose"
  const layout = id.split("-")[0] as TemplateLayoutType;
  return layout || "full-bleed";
});

function prevCard() {
  if (currentCardIndex.value > 0) currentCardIndex.value--;
}

function nextCard() {
  if (currentCardIndex.value < totalCards.value - 1) currentCardIndex.value++;
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Card switcher (only if multiple cards) -->
    <div
      v-if="totalCards > 1"
      class="flex items-center gap-3"
    >
      <button
        class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
        :disabled="currentCardIndex === 0"
        @click="prevCard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      <span class="text-sm text-gray-500 font-medium">
        Card {{ currentCardIndex + 1 }} of {{ totalCards }}
      </span>
      <button
        class="text-gray-400 hover:text-gray-600 disabled:opacity-30"
        :disabled="currentCardIndex === totalCards - 1"
        @click="nextCard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Postcard preview (real card data, not stubs) -->
    <PostcardPreview
      v-if="currentCard"
      :card="currentCard"
      :layout-type="currentLayout"
      :brand-colors="brandColors"
      :business-name="businessName"
      :business-address="businessAddress"
      :logo-url="logoUrl"
      :rating="rating"
      :review-count="reviewCount"
      :trust-badges="trustBadges"
      :years-in-business="yearsInBusiness"
      :city="city"
      :credibility-line="credibilityLine"
      size="large"
    />

    <!-- Card purpose label -->
    <span
      v-if="currentCard"
      class="text-xs text-gray-400 uppercase tracking-wider"
    >
      {{ currentCard.cardPurpose === 'offer' ? 'Offer Card' :
         currentCard.cardPurpose === 'proof' ? 'Social Proof Card' :
         'Last Chance Card' }}
    </span>
  </div>
</template>
