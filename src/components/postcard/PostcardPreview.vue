<script setup lang="ts">
import { ref } from "vue";
import type { CardDesign, TemplateLayoutType } from "@/types/campaign";
import PostcardFront from "./PostcardFront.vue";
import PostcardBack from "./PostcardBack.vue";
import PostcardFrontStub from "./PostcardFrontStub.vue";
import PostcardBackStub from "./PostcardBackStub.vue";

import type { TrustBadge } from "@/types/campaign";

const props = defineProps<{
  brandColors?: string[];
  size?: "thumbnail" | "large";
  card?: CardDesign;
  layoutType?: TemplateLayoutType;
  businessName?: string;
  businessAddress?: string;
  logoUrl?: string | null;
  // Brief #6 Phase 2 props (added here 2026-04-09 after Codex Pass 1 on
  // P0 #2 caught that StepDesign/ReviewSummary/StepReview never threaded
  // these through to PostcardBack — rating, reviewCount, trustBadges,
  // yearsInBusiness, city were dead props in the wizard/review flow).
  rating?: number | null;
  reviewCount?: number | null;
  trustBadges?: TrustBadge[];
  yearsInBusiness?: number | null;
  city?: string;
}>();

const showBack = ref(false);
const hasCardData = !!props.card;

function flip() {
  showBack.value = !showBack.value;
}
</script>

<template>
  <div
    class="relative cursor-pointer"
    :class="size === 'thumbnail' ? 'max-w-[240px]' : 'max-w-[480px]'"
    @click="flip"
  >
    <!-- Real postcard (when card data is provided) -->
    <template v-if="hasCardData && card">
      <PostcardFront
        v-if="!showBack"
        :card="card"
        :layout-type="layoutType ?? 'full-bleed'"
        :brand-colors="brandColors"
        :business-name="businessName"
        :logo-url="logoUrl"
      />
      <PostcardBack
        v-else
        :card="card"
        :brand-colors="brandColors"
        :business-name="businessName"
        :business-address="businessAddress"
        :rating="rating"
        :review-count="reviewCount"
        :trust-badges="trustBadges"
        :years-in-business="yearsInBusiness"
        :city="city"
      />
    </template>

    <!-- Stub fallback (no card data) -->
    <template v-else>
      <PostcardFrontStub v-if="!showBack" :brand-colors="brandColors" />
      <PostcardBackStub v-else :brand-colors="brandColors" />
    </template>

    <button
      class="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow hover:bg-white transition-colors"
      @click.stop="flip"
    >
      {{ showBack ? "Show front" : "Flip card" }}
    </button>
  </div>
</template>
