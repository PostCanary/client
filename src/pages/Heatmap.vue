<!-- src/pages/Heatmap.vue -->
<template>
  <section class="min-h-dvh flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center gap-4 px-4 py-3 border-b">
      <label class="font-semibold flex items-center gap-2">
        <input type="checkbox" v-model="kinds.mail" /> Mail addresses
      </label>
      <label class="font-semibold flex items-center gap-2">
        <input type="checkbox" v-model="kinds.crm" /> CRM addresses
      </label>
      <label class="font-semibold flex items-center gap-2">
        <input type="checkbox" v-model="kinds.matched" /> Matched
      </label>

      <span class="ml-4 flex items-center gap-2">
        From
        <input type="date" v-model="from" class="border rounded px-2 py-1" />
        To
        <input type="date" v-model="to" class="border rounded px-2 py-1" />
      </span>

      <button
        class="ml-2 px-3 py-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition"
        :disabled="loading"
        @click="draw"
      >
        {{ loading ? "Loading…" : "Apply" }}
      </button>

      <span class="ml-auto opacity-70 text-xs">{{ enginePill }}</span>
    </div>

    <div v-if="error" class="px-4 py-2 text-sm border-b text-red-600">
      {{ error }}
    </div>

    <div ref="mapEl" class="flex-1 min-h-[360px]" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import { getHeatmapPoints, type HeatmapKind } from "@/api/geocodes";

type Point = {
  lat: number;
  lon: number;
  kind: HeatmapKind;
  label?: string | null;
  address?: string | null;
  event_date?: string | null;
  event_count?: number | null;
};

type ClusterLike = L.LayerGroup & {
  clearLayers(): L.LayerGroup;
  addLayer(layer: L.Layer): L.LayerGroup;
};

const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let cluster: ClusterLike | null = null;

const loading = ref(false);
const error = ref<string | null>(null);

const enginePill = ref("Engine: Leaflet (clustered markers)");

// UI toggles (mail + crm + matched)
const kinds = reactive<{ mail: boolean; crm: boolean; matched: boolean }>({
  mail: true,
  crm: true,
  matched: false,
});

const from = ref<string>("");
const to = ref<string>("");

// ✅ Explicit icon fixes “broken marker” icons in prod builds
const defaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function selectedKinds(): HeatmapKind[] {
  const out: HeatmapKind[] = [];
  if (kinds.mail) out.push("mail");
  if (kinds.crm) out.push("crm");
  if (kinds.matched) out.push("matched");
  return out;
}

function ensureMapSized() {
  map?.invalidateSize(false);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createCluster(): ClusterLike {
  const anyL = L as any;
  return (
    anyL.markerClusterGroup
      ? anyL.markerClusterGroup({
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
        })
      : L.layerGroup()
  ) as ClusterLike;
}

/**
 * Backend-driven selection rules:
 * - If user selects ONE kind, send kind=<that>
 * - If user selects ALL kinds, OMIT kind (backend returns all)
 * - If user selects MULTIPLE but not all, we issue multiple requests and merge client-side
 * - If user selects NONE, return []
 *
 * NOTE:
 * Your HeatmapParams currently only supports a single `kind`, not an array,
 * so “two out of three” needs fan-out requests.
 */
async function loadPoints(): Promise<Point[]> {
  const sel = selectedKinds();
  if (!sel.length) return [];

  const base = {
    start: from.value || undefined,
    end: to.value || undefined,
    limit: 20000,
  } as const;

  // If all 3 are selected, omit kind to let backend return “all kinds”
  if (sel.length === 3) {
    const res = await getHeatmapPoints({ ...base, kind: undefined });
    return (res.points ?? [])
      .filter((p): p is NonNullable<typeof p> => !!p)
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
      .map((p) => ({
        lat: p.lat as number,
        lon: p.lon as number,
        kind: p.kind,
        label: p.label ?? null,
        address: p.address ?? null,
        event_date: p.event_date ?? null,
        event_count: p.event_count ?? null,
      }));
  }

  // If exactly 1 selected, request that kind
  if (sel.length === 1) {
    const res = await getHeatmapPoints({ ...base, kind: sel[0] });
    return (res.points ?? [])
      .filter((p): p is NonNullable<typeof p> => !!p)
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
      .map((p) => ({
        lat: p.lat as number,
        lon: p.lon as number,
        kind: p.kind,
        label: p.label ?? null,
        address: p.address ?? null,
        event_date: p.event_date ?? null,
        event_count: p.event_count ?? null,
      }));
  }

  // If 2 of 3 selected, fan-out 2 requests and merge results
  const responses = await Promise.all(
    sel.map((k) => getHeatmapPoints({ ...base, kind: k }))
  );

  const out: Point[] = [];
  for (const res of responses) {
    for (const p of res.points ?? []) {
      if (!p) continue;
      if (typeof p.lat === "number" && typeof p.lon === "number") {
        out.push({
          lat: p.lat,
          lon: p.lon,
          kind: p.kind,
          label: p.label ?? null,
          address: p.address ?? null,
          event_date: p.event_date ?? null,
          event_count: p.event_count ?? null,
        });
      }
    }
  }

  return out;
}

async function draw() {
  if (!map || !cluster) return;

  loading.value = true;
  error.value = null;

  try {
    const points = await loadPoints();

    cluster.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    for (const p of points) {
      const title = escapeHtml((p.kind || "").toUpperCase());
      const addr = escapeHtml(p.address || p.label || "");
      const dt = escapeHtml(p.event_date || "");

      const marker = L.marker([p.lat, p.lon], { icon: defaultIcon }).bindPopup(
        `<b>${title}</b><br>${addr}${dt ? `<br>${dt}` : ""}`
      );

      cluster.addLayer(marker);
      bounds.push([p.lat, p.lon]);
    }

    if (bounds.length) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40] });
    } else {
      map.setView([37.8, -96], 4);
    }

    await nextTick();
    requestAnimationFrame(() => map?.invalidateSize(false));
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

async function initMap() {
  if (!mapEl.value) return;

  map = L.map(mapEl.value, { center: [37.8, -96], zoom: 4 });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  cluster = createCluster();
  cluster.addTo(map);

  await nextTick();
  requestAnimationFrame(() => map?.invalidateSize(false));

  window.addEventListener("resize", ensureMapSized);
}

onMounted(async () => {
  await initMap();
  await draw();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", ensureMapSized);
  map?.remove();
  map = null;
  cluster = null;
});
</script>

<style scoped>
:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
}
</style>
