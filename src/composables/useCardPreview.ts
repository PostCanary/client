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
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }

    loading.value = true;
    error.value = null;

    try {
      const result = await previewCard(id, num);
      cleanup();
      currentObjectUrl = URL.createObjectURL(result.blob);
      previewUrl.value = currentObjectUrl;
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
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      // 400 typically means cards not yet saved to server (race with auto-populate).
      // Auto-retry after a short delay instead of showing error state.
      if (e?.status === 400 && cardData.value) {
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
