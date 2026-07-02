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
//
// S79 Phase-1 — SequenceView is now a compact toolbar row. The cards
// read left→right as the campaign sequence (small thumbnails + short
// labels) and sit inline with the Front/Back toggle in one slim toolbar
// above the canvas. `card-select-N` testids + the `scale-105` active
// class are preserved (live e2e relies on them).
withDefaults(
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
  }>(),
  {},
);

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
  <div v-if="cards.length > 1" class="flex items-center gap-2">
    <button
      v-for="(card, idx) in cards"
      :key="card.cardNumber"
      type="button"
      class="flex items-center gap-2 rounded-lg border px-2 py-1 transition-all"
      :class="idx === activeCardIndex
        ? 'scale-105 border-[#47bfa9] bg-[#47bfa9]/5 shadow-sm'
        : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'"
      :data-testid="`card-select-${card.cardNumber}`"
      @click="emit('select', idx)"
    >
      <span
        class="block shrink-0 overflow-hidden rounded border"
        :class="idx === activeCardIndex ? 'border-[#47bfa9]' : 'border-gray-200'"
        style="width: 48px; aspect-ratio: 3 / 2;"
      >
        <img
          v-if="thumbnailUrls && thumbnailUrls[idx]"
          :src="thumbnailUrls[idx] as string"
          :alt="`Card ${card.cardNumber} preview`"
          class="h-full w-full object-cover"
          draggable="false"
        />
        <span
          v-else
          class="flex h-full w-full animate-pulse items-center justify-center bg-gray-100"
        >
          <span class="text-[7px] text-gray-400">…</span>
        </span>
      </span>
      <span
        class="hidden text-left text-[11px] font-medium leading-tight sm:block"
        :class="idx === activeCardIndex ? 'text-[#0b2d50]' : 'text-gray-400'"
      >
        {{ LABELS[card.cardPurpose] ?? card.cardPurpose }}
      </span>
    </button>
  </div>
</template>
