<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import type { CardDesign } from "@/types/campaign";
import { previewCard } from "@/api/renderJobs";

// S69 — Step 4 (Review & Send) previews render via server-rendered
// preview-card PNG, NOT the client-side PostcardPreview.vue Vue mockup.
// Previously ReviewSummary used PostcardPreview which produced a
// completely different-looking layout (full-bleed overlay headline +
// corner badge + fabricated testimonial) than the real HAC-1000 template
// Step 3 shows. Drake caught the mismatch at T-1 to demo. ONE RENDERING
// RULE (mems 429/430): on-screen = preview-card PNG everywhere in the
// wizard. Same pattern as SequenceView thumbnails (S67 mems 546/547).
const props = defineProps<{
  draftId: string | undefined;
  cards: CardDesign[];
}>();

const currentCardIndex = ref(0);
const cardUrls = ref<(string | null)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let revokeList: string[] = [];

const totalCards = computed(() => props.cards.length);
const currentCard = computed(() => props.cards[currentCardIndex.value]);
const currentUrl = computed(() => cardUrls.value[currentCardIndex.value] ?? null);

function revokeAll() {
  for (const u of revokeList) URL.revokeObjectURL(u);
  revokeList = [];
}

async function fetchAll() {
  if (!props.draftId || props.cards.length === 0) {
    cardUrls.value = [];
    return;
  }
  loading.value = true;
  error.value = null;
  const id = props.draftId;
  const n = props.cards.length;
  const next = new Array<string | null>(n).fill(null);
  await Promise.all(
    props.cards.map(async (_, idx) => {
      try {
        const result = await previewCard(id, idx + 1);
        next[idx] = URL.createObjectURL(result.blob);
        if (result.warnings.length > 0) {
          console.warn(
            `[ReviewSummary] card ${idx + 1} render warnings:`,
            result.warnings,
          );
        }
      } catch (e) {
        console.error(`[ReviewSummary] card ${idx + 1} preview failed:`, e);
        next[idx] = null;
        error.value = "Some previews failed to load. Refresh to retry.";
      }
    }),
  );
  revokeAll();
  revokeList = next.filter((u): u is string => !!u);
  cardUrls.value = next;
  loading.value = false;
}

onMounted(fetchAll);
onBeforeUnmount(revokeAll);

// Refetch if draftId changes mid-session (e.g., resume flow)
watch(
  () => props.draftId,
  () => fetchAll(),
);

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
    <div v-if="totalCards > 1" class="flex items-center gap-3">
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

    <!-- Server-rendered postcard PNG (matches Step 3 exactly) -->
    <div
      class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
      style="width: 600px; max-width: 100%;"
    >
      <div
        class="flex items-center justify-center bg-gray-50"
        style="aspect-ratio: 9 / 6;"
      >
        <img
          v-if="currentUrl"
          :src="currentUrl"
          :alt="`Card ${currentCardIndex + 1} preview`"
          class="w-full h-full object-contain"
        />
        <div
          v-else-if="loading"
          class="text-sm text-gray-400"
        >
          Loading preview…
        </div>
        <div
          v-else
          class="text-sm text-red-500 px-4 text-center"
        >
          {{ error ?? "Preview unavailable." }}
        </div>
      </div>
    </div>

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
