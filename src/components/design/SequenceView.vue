<script setup lang="ts">
import type { CardDesign, TrustBadge } from "@/types/campaign";

// S67 — Thumbnails render via server-PNG <img>, NOT the Vue-side
// PostcardPreview component. Previously we used PostcardPreview at
// size="thumbnail" which generated a completely different-looking
// template than the render-worker output the customer sees in the main
// preview below. Drake caught the mismatch (S67 mem). ONE RENDERING
// RULE (mems 429/430) — on-screen = preview-card PNG. Parent
// (StepDesign.vue) owns the per-card PNG URL list and passes it in.
// Back-card trust-signal props remain for legacy callers that may flip
// the thumbnail; current UI uses disable-flip + PNG front-only.
defineProps<{
  cards: CardDesign[];
  activeCardIndex: number;
  thumbnailUrls?: (string | null)[];
  brandColors?: string[];
  businessName?: string;
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
          style="width: 100px; aspect-ratio: 3 / 2;"
        >
          <img
            v-if="thumbnailUrls && thumbnailUrls[idx]"
            :src="thumbnailUrls[idx] as string"
            :alt="`Card ${card.cardNumber} preview`"
            class="w-full h-full object-cover"
            draggable="false"
          />
          <div
            v-else
            class="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center"
          >
            <span class="text-[8px] text-gray-400">Loading…</span>
          </div>
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
