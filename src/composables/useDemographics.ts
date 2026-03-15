// src/composables/useDemographics.ts
import { ref, watch, computed, onBeforeUnmount } from "vue";
import {
  getDemographicsPayload,
  type DemographicsPayload,
  type DemographicView,
} from "@/api/demographics";
import { useCampaignStore } from "@/stores/useCampaignStore";

export function useDemographics() {
  const view = ref<DemographicView>("matches");
  const start = ref<string | undefined>(undefined);
  const end = ref<string | undefined>(undefined);

  const campaignStore = useCampaignStore();
  campaignStore.hydrate();

  const data = ref<DemographicsPayload | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let reqSeq = 0;

  async function refresh() {
    const mySeq = ++reqSeq;
    loading.value = true;
    error.value = null;

    try {
      const res = await getDemographicsPayload({
        view: view.value,
        start: start.value,
        end: end.value,
        campaignId: campaignStore.activeCampaignId,
      });

      if (mySeq !== reqSeq) return;
      data.value = res;
    } catch (e) {
      if (mySeq !== reqSeq) return;
      error.value = e instanceof Error ? e.message : String(e);
      data.value = null;
    } finally {
      if (mySeq !== reqSeq) return;
      loading.value = false;
    }
  }

  watch([view, start, end], refresh, { immediate: true });

  // Re-fetch when campaign changes
  function onCampaignChanged() {
    void refresh();
  }
  window.addEventListener("mt:campaign-changed", onCampaignChanged);
  onBeforeUnmount(() => {
    window.removeEventListener("mt:campaign-changed", onCampaignChanged);
  });

  const hero = computed(() => data.value?.hero ?? null);
  const charts = computed(() => data.value?.charts ?? null);
  const insightMessage = computed(() => data.value?.insight_message ?? null);
  const recommendations = computed(() => data.value?.recommendations ?? []);
  const coverage = computed(() => data.value?.coverage ?? null);
  const dataNote = computed(() => data.value?.data_note ?? "");
  const matchCount = computed(() => data.value?.match_count ?? 0);
  const confidenceTier = computed(() => data.value?.confidence_tier ?? "sufficient");
  const hasData = computed(() => !!data.value && (coverage.value?.total_zips ?? 0) > 0);

  return {
    view,
    start,
    end,
    data,
    loading,
    error,
    hero,
    charts,
    insightMessage,
    recommendations,
    coverage,
    dataNote,
    matchCount,
    confidenceTier,
    hasData,
    refresh,
  };
}
