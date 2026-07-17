<script setup lang="ts">
// POS-151: read-only "your campaign's targeted area" preview for the
// Campaign view modal. Renders the drawn circle/rectangle/polygon shapes
// from a campaign's targeting snapshot in brand teal — modeled on
// AudienceMapPreview.vue's Leaflet lifecycle, but draws shapes instead of
// address point pins.
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TargetingArea } from '@/types/campaign'

const props = defineProps<{
  areas: TargetingArea[]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let shapeLayer: L.LayerGroup | null = null

const MILES_TO_METERS = 1609.34
const TEAL = '#47bfa9'

const zipCodes = computed(() =>
  props.areas
    .filter((a) => a.type === 'zip' && a.zipCode)
    .map((a) => a.zipCode as string),
)

const hasDrawableGeometry = computed(() =>
  props.areas.some((a) => a.type !== 'zip'),
)

function renderAreas(areas: TargetingArea[]) {
  if (!map || !shapeLayer) return
  shapeLayer.clearLayers()
  const boundsPts: L.LatLngTuple[] = []

  for (const area of areas) {
    if (area.type === 'circle' || area.type === 'job_radius') {
      const center = area.coordinates?.[0]
      if (!center || center.length < 2) continue
      const lat = center[0] as number
      const lng = center[1] as number
      const circle = L.circle([lat, lng], {
        radius: (area.radiusMiles ?? 1) * MILES_TO_METERS,
        color: TEAL,
        fillColor: TEAL,
        fillOpacity: 0.2,
        weight: 2,
      })
      shapeLayer.addLayer(circle)
      boundsPts.push([lat, lng])
    } else if (area.type === 'rectangle' || area.type === 'polygon') {
      const pts = (area.coordinates ?? []).filter(
        (p): p is [number, number] => p.length >= 2,
      )
      if (pts.length < 2) continue
      const shape = L.polygon(pts, {
        color: TEAL,
        fillColor: TEAL,
        fillOpacity: 0.2,
        weight: 2,
      })
      shapeLayer.addLayer(shape)
      boundsPts.push(...pts)
    }
    // 'zip' areas have no geometry to draw — surfaced as text below the map.
  }

  if (boundsPts.length > 0) {
    map.fitBounds(boundsPts, { padding: [40, 40], maxZoom: 13 })
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

  shapeLayer = L.layerGroup()
  shapeLayer.addTo(map)

  renderAreas(props.areas)
})

watch(
  () => props.areas,
  (a) => renderAreas(a),
  { deep: true },
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  shapeLayer = null
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 overflow-hidden">
    <div
      v-if="hasDrawableGeometry"
      ref="mapEl"
      class="w-full h-64"
      role="img"
      aria-label="Targeted area map preview"
    />
    <div
      v-else
      class="flex items-center justify-center h-16 text-sm text-slate-400 bg-slate-50"
    >
      No area geometry to display
    </div>
    <div
      v-if="zipCodes.length"
      class="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500"
    >
      ZIP codes: {{ zipCodes.join(', ') }}
    </div>
    <div
      v-else-if="areas.length === 0"
      class="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center"
    >
      No area data to display
    </div>
  </div>
</template>
