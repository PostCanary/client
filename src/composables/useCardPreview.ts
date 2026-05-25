// src/composables/useCardPreview.ts
//
// Server-rendered card preview — the editing surface shows a PNG of the
// actual print template so what the customer sees IS what gets printed.
// Fetches on mount + re-fetches on card data changes (debounced).

import { ref, watch, onBeforeUnmount, type Ref } from "vue";
import { previewCard } from "@/api/renderJobs";

const DEBOUNCE_MS = 1500;

export function useCardPreview(
  draftId: Ref<string | undefined>,
  cardNumber: Ref<number>,
  cardData: Ref<unknown>,
) {
  const previewUrl = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;
  let currentObjectUrl: string | null = null;

  function cleanup() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryCount = 0;

  async function fetchPreview() {
    const id = draftId.value;
    const num = cardNumber.value;
    if (!id || num < 1) return;
    // S62 rehearsal fix: skip fetch when no card data exists yet (user
    // reached Step 3 before auto-populate finished). Previously we fired
    // the fetch anyway, got a 400 from the server, and fell through to
    // error.value = "Preview unavailable" because the 400-retry branch
    // below requires cardData.value to be present. The watch on cardData
    // re-fires this fetch once cards arrive.
    if (!cardData.value) return;

    if (abortController) abortController.abort();
    abortController = new AbortController();
    const thisController = abortController;
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }

    loading.value = true;
    error.value = null;

    try {
      // S70 fix: pass abort signal AND capture the card number at fetch
      // start. On response, discard if EITHER the abort fired OR the
      // card number changed mid-flight. Prior code had neither guard —
      // a late-returning blob for card=2 could overwrite the on-screen
      // card=3 preview.
      const fetchedCardNum = num;
      const result = await previewCard(id, num, thisController.signal);
      if (thisController.signal.aborted || fetchedCardNum !== cardNumber.value) {
        return;
      }
      cleanup();
      currentObjectUrl = URL.createObjectURL(result.blob);
      previewUrl.value = currentObjectUrl;
      retryCount = 0; // reset on success
      // Session 54 Codex CRITICAL 2: surface worker render warnings.
      // For now we log them — post-demo these drive a regenerate-on-
      // overlong UI prompt. CONTENT_OVERLONG_REGENERATE signals the AI
      // ignored its per-slot char budgets and the cascade hit ladder
      // floor; PHOTO_UNREACHABLE signals upstream brand-photo 404.
      if (result.warnings.length > 0) {
        console.warn(
          `[useCardPreview] card ${num} render warnings:`,
          result.warnings,
        );
      }
    } catch (e: any) {
      // Aborted by a subsequent fetch — the new fetch will populate the
      // UI, so do nothing here. Check multiple shapes axios/fetch can use.
      if (
        e?.name === "CanceledError" ||
        e?.name === "AbortError" ||
        e?.code === "ERR_CANCELED" ||
        e?.message === "canceled"
      ) return;
      // Transient error retry. Covers:
      //   - 400 race with auto-populate (cards exist client-side but
      //     server hasn't finished persisting yet; original reason for this branch)
      //   - 5xx/network blips during initial Step 3 mount
      //   - abort-mid-flight shapes that don't match the canceled-check above
      // One retry only; reset on success. Session 62 fix: Drake observed
      // "Preview unavailable. Retry" firing even though server logs showed
      // 200 responses — this is the fallback that catches the race the
      // 400-only branch missed.
      if (cardData.value && retryCount < 1) {
        retryCount++;
        retryTimer = setTimeout(fetchPreview, 2000);
        return;
      }
      error.value = e?.message || "Preview unavailable";
      console.error("Card preview failed:", e);
    } finally {
      loading.value = false;
    }
  }

  function debouncedFetch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchPreview, DEBOUNCE_MS);
  }

  // When card data arrives (auto-populate completes), clear any stale error
  // and schedule a fetch — gives the server time to persist the cards.
  watch(cardData, (newVal) => {
    if (newVal && error.value) error.value = null;
    debouncedFetch();
  }, { deep: true });

  // Watch cardNumber separately so we can clear the stale previewUrl
  // BEFORE a new fetch resolves. S70 fix: StepDesign mirrors previewUrl
  // into the thumbnail slot of the active card on every watcher tick.
  // Without this clear, clicking Card 3 while previewUrl still held the
  // Card 1 blob would briefly paint Card 1's image into Card 3's
  // thumbnail before the Card 3 fetch returned.
  watch(cardNumber, () => {
    cleanup();
    previewUrl.value = null;
  });

  watch(
    [draftId, cardNumber],
    () => {
      if (draftId.value) fetchPreview();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (abortController) abortController.abort();
    cleanup();
  });

  return {
    previewUrl,
    loading,
    error,
    refresh: fetchPreview,
  };
}
