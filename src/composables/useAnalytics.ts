// src/composables/useAnalytics.ts
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  getAnalyticsInsights,
  regenerateInsights,
  type AnalyticsInsights,
} from "@/api/analytics";
import { useCampaignStore } from "@/stores/useCampaignStore";

/** Gemini regenerate is sync on the request; allow longer than the default 60s. */
export const REGENERATE_TIMEOUT_MS = 180_000;

function errorMessage(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const code = (e as Error & { code?: string }).code;
  if (code === "ECONNABORTED" || /timeout/i.test(e.message)) {
    return "Insight generation timed out. Please try again.";
  }
  return e.message;
}

export function useAnalytics() {
  const insights = ref<AnalyticsInsights | null>(null);
  const generatedAt = ref<string | null>(null);
  const loading = ref(false);
  const regenerating = ref(false);
  const error = ref<string | null>(null);

  const campaignStore = useCampaignStore();
  campaignStore.hydrate();

  let reqSeq = 0;

  async function refresh() {
    const mySeq = ++reqSeq;
    loading.value = true;
    error.value = null;

    try {
      const res = await getAnalyticsInsights(campaignStore.activeCampaignId);

      if (mySeq !== reqSeq) return;

      if ("data" in res && res.data === null) {
        insights.value = null;
        generatedAt.value = null;
      } else if ("insights" in res) {
        insights.value = res.insights;
        generatedAt.value = res.generated_at;
      }
    } catch (e) {
      if (mySeq !== reqSeq) return;
      error.value = errorMessage(e);
      insights.value = null;
      generatedAt.value = null;
    } finally {
      if (mySeq !== reqSeq) return;
      loading.value = false;
    }
  }

  async function regenerate() {
    // Invalidate in-flight refresh so a stale GET cannot clear a fresh POST.
    const mySeq = ++reqSeq;
    regenerating.value = true;
    loading.value = false;
    error.value = null;

    try {
      const res = await regenerateInsights(campaignStore.activeCampaignId, {
        timeout: REGENERATE_TIMEOUT_MS,
      });

      if (mySeq !== reqSeq) return;

      if ("insights" in res) {
        insights.value = res.insights;
        generatedAt.value = res.generated_at;
        error.value = null;
      } else if ("data" in res && res.data === null) {
        error.value =
          res.message || "Failed to generate insights. Please try again.";
      } else {
        error.value = "Failed to generate insights. Please try again.";
      }
    } catch (e) {
      if (mySeq !== reqSeq) return;
      error.value = errorMessage(e);
    } finally {
      if (mySeq !== reqSeq) return;
      regenerating.value = false;
    }
  }

  function onCampaignChanged() {
    void refresh();
  }
  window.addEventListener("mt:campaign-changed", onCampaignChanged);
  onBeforeUnmount(() => {
    window.removeEventListener("mt:campaign-changed", onCampaignChanged);
  });

  onMounted(refresh);

  const hasData = computed(() => insights.value !== null);
  const sections = computed(() => insights.value?.sections ?? []);
  const executiveSummary = computed(() => insights.value?.executive_summary ?? "");
  const recommendations = computed(() => insights.value?.top_recommendations ?? []);
  const dataContext = computed(() => insights.value?.data_context ?? null);

  return {
    insights,
    generatedAt,
    loading,
    regenerating,
    error,
    hasData,
    sections,
    executiveSummary,
    recommendations,
    dataContext,
    refresh,
    regenerate,
  };
}
