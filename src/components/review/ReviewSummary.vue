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

type CardStatus = "pending" | "loading" | "ready" | "failed";

const currentCardIndex = ref(0);
const cardUrls = ref<(string | null)[]>([]);
const cardStatus = ref<CardStatus[]>([]);
let revokeList: string[] = [];

const totalCards = computed(() => props.cards.length);
const currentCard = computed(() => props.cards[currentCardIndex.value]);
const currentUrl = computed(() => cardUrls.value[currentCardIndex.value] ?? null);
const currentStatus = computed<CardStatus>(
  () => cardStatus.value[currentCardIndex.value] ?? "pending",
);

function revokeAll() {
  for (const u of revokeList) URL.revokeObjectURL(u);
  revokeList = [];
}

// S69 — per-card retry mirrors useCardPreview.ts pattern (mem 482/491).
// Server renders Card 3 successfully (API logs show 200), but client blob
// handling under Promise.all occasionally drops a fetch. One retry with
// a short delay reliably recovers. Retry count matches useCardPreview's
// two-attempt total (initial + 1 retry).
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

async function fetchOne(
  draftId: string,
  cardN: number,
  idx: number,
  attempt = 0,
): Promise<string | null> {
  cardStatus.value[idx] = "loading";
  try {
    const result = await previewCard(draftId, cardN);
    if (result.warnings.length > 0) {
      console.warn(
        `[ReviewSummary] card ${cardN} render warnings:`,
        result.warnings,
      );
    }
    const url = URL.createObjectURL(result.blob);
    cardStatus.value[idx] = "ready";
    return url;
  } catch (e) {
    console.error(
      `[ReviewSummary] card ${cardN} preview attempt ${attempt + 1} failed:`,
      e,
    );
    if (attempt + 1 < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return fetchOne(draftId, cardN, idx, attempt + 1);
    }
    cardStatus.value[idx] = "failed";
    return null;
  }
}

async function fetchAll() {
  if (!props.draftId || props.cards.length === 0) {
    cardUrls.value = [];
    cardStatus.value = [];
    return;
  }
  const id = props.draftId;
  const n = props.cards.length;
  cardStatus.value = Array<CardStatus>(n).fill("pending");
  const next = await Promise.all(
    props.cards.map((_, idx) => fetchOne(id, idx + 1, idx)),
  );
  revokeAll();
  revokeList = next.filter((u): u is string => !!u);
  cardUrls.value = next;
}

async function retryCurrent() {
  const idx = currentCardIndex.value;
  if (!props.draftId) return;
  const url = await fetchOne(props.draftId, idx + 1, idx);
  if (url) {
    const existing = cardUrls.value[idx];
    if (existing) URL.revokeObjectURL(existing);
    revokeList = revokeList.filter((u) => u !== existing);
    revokeList.push(url);
    cardUrls.value[idx] = url;
  }
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
          v-if="currentUrl && currentStatus === 'ready'"
          :src="currentUrl"
          :alt="`Card ${currentCardIndex + 1} preview`"
          class="w-full h-full object-contain"
        />
        <div
          v-else-if="currentStatus === 'loading' || currentStatus === 'pending'"
          class="text-sm text-gray-400"
        >
          Loading preview…
        </div>
        <div
          v-else
          class="flex flex-col items-center gap-3 px-4 text-center"
        >
          <span class="text-sm text-gray-500">
            Preview couldn't load.
          </span>
          <button
            class="text-sm text-[#47bfa9] underline hover:text-[#3aa893]"
            @click="retryCurrent"
          >
            Retry
          </button>
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
