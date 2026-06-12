// src/composables/useBackPreview.ts
//
// Server-rendered preview of the postcard BACK (S76 Phase-5). ONE back per
// draft — backs don't vary by card position — so this composable is keyed on
// the draft, not a card number. It re-fetches when the back-editable data
// (the guarantee) or the active state changes, debounced like useCardPreview.
//
// Mirrors useCardPreview's blob lifecycle (object-URL revoke, abort-on-
// supersede, single transient retry) but without the card-switch race since
// there is exactly one back.

import { ref, watch, onBeforeUnmount, type Ref } from "vue";
import { previewBack } from "@/api/renderJobs";

const DEBOUNCE_MS = 600;

export function useBackPreview(
  draftId: Ref<string | undefined>,
  // Re-fetch trigger: anything that changes the rendered back (the guarantee
  // text today; Business Info edits flow through draft re-load too).
  backData: Ref<unknown>,
  // Only fetch while the back tab is showing — avoids a wasted render on every
  // front edit when the customer never opens the back.
  active: Ref<boolean>,
) {
  const previewUrl = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const warnings = ref<string[]>([]);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryCount = 0;
  let abortController: AbortController | null = null;
  let currentObjectUrl: string | null = null;

  function cleanup() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  async function fetchPreview() {
    const id = draftId.value;
    if (!id || !active.value) return;

    if (abortController) abortController.abort();
    abortController = new AbortController();
    const thisController = abortController;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await previewBack(id, thisController.signal);
      if (thisController.signal.aborted) return;
      cleanup();
      currentObjectUrl = URL.createObjectURL(result.blob);
      previewUrl.value = currentObjectUrl;
      warnings.value = result.warnings;
      retryCount = 0;
      if (result.warnings.length > 0) {
        console.warn("[useBackPreview] back render warnings:", result.warnings);
      }
    } catch (e: any) {
      if (
        e?.name === "CanceledError" ||
        e?.name === "AbortError" ||
        e?.code === "ERR_CANCELED" ||
        e?.message === "canceled"
      )
        return;
      if (retryCount < 1) {
        retryCount++;
        retryTimer = setTimeout(fetchPreview, 2000);
        return;
      }
      error.value = e?.message || "Back preview unavailable";
      console.error("Back preview failed:", e);
    } finally {
      loading.value = false;
    }
  }

  function debouncedFetch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchPreview, DEBOUNCE_MS);
  }

  // Fetch when the back tab becomes active (and hasn't loaded yet), and when
  // the back-editable data changes while it's active.
  watch(active, (isActive) => {
    if (isActive) debouncedFetch();
  });
  watch(
    backData,
    () => {
      if (active.value) debouncedFetch();
    },
    { deep: true },
  );

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (retryTimer) clearTimeout(retryTimer);
    if (abortController) abortController.abort();
    cleanup();
  });

  return {
    previewUrl,
    loading,
    error,
    warnings,
    refresh: fetchPreview,
  };
}
