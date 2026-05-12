<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

type Point = { lat: number; lng: number; label?: string }

const props = defineProps<{
  points: Point[]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let clusterGroup: L.LayerGroup | null = null

type ClusterLike = L.LayerGroup & {
  clearLayers(): L.LayerGroup
  addLayer(layer: L.Layer): L.LayerGroup
}

function createClusterGroup(): ClusterLike {
  const anyL = L as any
  return (
    anyL.markerClusterGroup
      ? anyL.markerClusterGroup({
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          iconCreateFunction(group: any) {
            const count = group.getChildCount()
            let sizeClass = 'marker-cluster-small'
            if (count >= 100) sizeClass = 'marker-cluster-large'
            else if (count >= 10) sizeClass = 'marker-cluster-medium'
            return anyL.divIcon({
              html: `<div><span>${count.toLocaleString()}</span></div>`,
              className: `marker-cluster ${sizeClass}`,
              iconSize: new anyL.Point(40, 40),
            })
          },
        })
      : L.layerGroup()
  ) as ClusterLike
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderPoints(pts: Point[]) {
  if (!map || !clusterGroup) return
  clusterGroup.clearLayers()
  const bounds: L.LatLngTuple[] = []

  for (const p of pts) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue
    const marker = L.circleMarker([p.lat, p.lng], {
      radius: 6,
      fillColor: '#47bfa9',
      fillOpacity: 0.85,
      color: '#fff',
      weight: 1.5,
    })
    if (p.label) {
      marker.bindPopup(`<span style="font-size:12px;">${escapeHtml(p.label)}</span>`)
    }
    clusterGroup.addLayer(marker)
    bounds.push([p.lat, p.lng])
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40], maxZoom: 13 })
  } else {
    map.setView([37.8, -96], 4)
  }

  setTimeout(() => map?.invalidateSize(false), 100)
}

onMounted(() => {
  if (!mapEl.value) return

  map = L.map(mapEl.value, { center: [37.8, -96], zoom: 4 })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
  }).addTo(map)

  clusterGroup = createClusterGroup()
  clusterGroup.addTo(map)

  renderPoints(props.points)
})

watch(
  () => props.points,
  (pts) => renderPoints(pts),
  { deep: true }
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  clusterGroup = null
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 overflow-hidden">
    <div ref="mapEl" class="w-full h-64" role="img" aria-label="Audience address map preview" />
    <div v-if="points.length === 0" class="flex items-center justify-center h-16 text-sm text-slate-400 bg-slate-50 border-t border-slate-100">
      No address points to display
    </div>
    <div v-else class="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
      {{ points.length.toLocaleString() }} address{{ points.length === 1 ? '' : 'es' }} mapped
    </div>
  </div>
</template>
