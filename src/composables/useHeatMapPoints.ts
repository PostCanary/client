// src/composables/useHeatmapPoints.ts
import { computed, ref, watch } from "vue";
import { getHeatmapPoints, type HeatmapPoint, type HeatmapKind } from "@/api/geocodes";

export function useHeatmapPoints() {
  // UI filters
  const kind = ref<HeatmapKind | undefined>(undefined); // undefined => backend default (mail+crm)
  const start = ref<string | undefined>(undefined);
  const end = ref<string | undefined>(undefined);
  const limit = ref<number>(20000);

  const loading = ref(false);
  const error = ref<string | null>(null);
  const points = ref<HeatmapPoint[]>([]);

  let reqSeq = 0;

  async function refresh() {
    const mySeq = ++reqSeq;
    loading.value = true;
    error.value = null;

    try {
      const res = await getHeatmapPoints({
        kind: kind.value, // ✅
        start: start.value,
        end: end.value,
        limit: limit.value,
      });

      if (mySeq !== reqSeq) return;
      points.value = res.points ?? [];
    } catch (e) {
      if (mySeq !== reqSeq) return;
      error.value = e instanceof Error ? e.message : String(e);
      points.value = [];
    } finally {
      if (mySeq !== reqSeq) return;
      loading.value = false;
    }
  }

  watch([kind, start, end, limit], refresh, { immediate: true });

  const heatTriples = computed(() =>
    points.value
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
      .map((p) => [p.lat as number, p.lon as number, p.event_count ?? 1] as const)
  );

  return {
    kind,
    start,
    end,
    limit,
    loading,
    error,
    points,
    heatTriples,
    refresh,
  };
}