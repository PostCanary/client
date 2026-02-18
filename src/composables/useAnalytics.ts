// src/composables/useAnalytics.ts
import { ref, computed, onMounted } from "vue";
import {
  getAnalyticsInsights,
  regenerateInsights,
  type AnalyticsInsights,
} from "@/api/analytics";

export function useAnalytics() {
  const insights = ref<AnalyticsInsights | null>(null);
  const generatedAt = ref<string | null>(null);
  const loading = ref(false);
  const regenerating = ref(false);
  const error = ref<string | null>(null);

  let reqSeq = 0;

  async function refresh() {
    const mySeq = ++reqSeq;
    loading.value = true;
    error.value = null;

    try {
      const res = await getAnalyticsInsights();

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
      error.value = e instanceof Error ? e.message : String(e);
      insights.value = null;
    } finally {
      if (mySeq !== reqSeq) return;
      loading.value = false;
    }
  }

  async function regenerate() {
    regenerating.value = true;
    error.value = null;

    try {
      const res = await regenerateInsights();

      if ("insights" in res) {
        insights.value = res.insights;
        generatedAt.value = res.generated_at;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      regenerating.value = false;
    }
  }

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
