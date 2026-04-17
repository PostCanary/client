<script setup lang="ts">
import type { CardDesign, TrustBadge } from "@/types/campaign";
import PostcardPreview from "@/components/postcard/PostcardPreview.vue";

const props = defineProps<{
  cards: CardDesign[];
  activeCardIndex: number;
  brandColors?: string[];
  businessName?: string;
  // Brief #6 Phase 2 back-card props threaded through 2026-04-09.
  // PostcardPreview thumbnails are clickable and can flip to the back —
  // without these props the back would render missing rating/trust/city.
  businessAddress?: string;
  logoUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  trustBadges?: TrustBadge[];
  yearsInBusiness?: number | null;
  city?: string;
  credibilityLine?: string;
}>();

const emit = defineEmits<{
  (e: "select", index: number): void;
}>();

const LABELS: Record<string, string> = {
  offer: "The Offer",
  proof: "Social Proof",
  last_chance: "Last Chance",
};
</script>

<template>
  <div v-if="cards.length > 1" class="mb-4">
    <p class="text-xs text-gray-400 text-center mb-3">
      Your {{ cards.length }}-card sequence — same branding, different messaging
    </p>
    <div class="flex justify-center gap-3">
      <button
        v-for="(card, idx) in cards"
        :key="card.cardNumber"
        class="flex flex-col items-center gap-1 transition-all"
        :class="idx === activeCardIndex ? 'scale-105' : 'opacity-60 hover:opacity-80'"
        :data-testid="`card-select-${card.cardNumber}`"
        @click="emit('select', idx)"
      >
        <div
          class="rounded-lg overflow-hidden border-2 transition-colors"
          :class="idx === activeCardIndex ? 'border-[#47bfa9] shadow-md' : 'border-gray-200'"
          style="width: 100px"
        >
          <PostcardPreview
            :card="card"
            :layout-type="card.templateId.split('-')[0] as any"
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
            :hide-address-placeholder="true"
            size="thumbnail"
          />
        </div>
        <span
          class="text-[10px] font-medium"
          :class="idx === activeCardIndex ? 'text-[#47bfa9]' : 'text-gray-400'"
        >
          Card {{ card.cardNumber }}: {{ LABELS[card.cardPurpose] ?? card.cardPurpose }}
        </span>
      </button>
    </div>
  </div>
</template>
