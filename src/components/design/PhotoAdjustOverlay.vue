<script setup lang="ts">
/**
 * PhotoAdjustOverlay (S81) — ON-CANVAS photo position/crop.
 *
 * Replaces the S80 drawer mini-frame with direct manipulation over the rendered
 * card. The component overlays the photo zone's pixel rect ON the canvas with a
 * clipped <img> rendered using the EXACT worker-mirroring CSS from
 * utils/photoCrop (cropImgStyle: object-position pan + scale at focal origin,
 * cover baseline). The card PNG below shows through everywhere else.
 *
 * Interactions are INSTANT (pure CSS, zero server calls):
 *   - drag anywhere in the zone pans (grab-and-drag; pan-room scales with zoom)
 *   - scroll wheel OR the floating zoom slider zooms 1–2.5× around the focal
 *   - double-click resets to identity
 * A floating chip pinned near the zone holds [zoom slider] [Reset] [Done].
 * Esc / Done exit (handled by the host via @done/@exit).
 *
 * The crop math + the commit debounce live in usePhotoAdjust (the host owns the
 * instance so reconcile state survives the render round-trip). This component is
 * the VIEW: it positions the rect, paints the live crop, and forwards gestures.
 */
import { computed } from "vue";
import type { PhotoCrop } from "@/types/campaign";
import {
  cropImgStyle,
  isIdentityCrop,
  CROP_MIN_ZOOM,
  CROP_MAX_ZOOM,
} from "@/utils/photoCrop";
import {
  zonePixelRect,
  type ZoneBox,
  type ViewportRect,
} from "@/composables/usePopoverAnchor";

const props = defineProps<{
  /** Resolved photo URL for the active slot. */
  src: string;
  /** Photo zone percentage box on the card. */
  zone: ZoneBox;
  /** Canvas viewport mapping (same object StepDesign feeds the popover). */
  viewport: ViewportRect;
  /** Live crop applied to the overlay img. */
  crop: PhotoCrop;
  /** Label for the chip / a11y. */
  label?: string;
  /** Step for the scroll-wheel zoom nudge. */
  zoomStep?: number;
}>();

const emit = defineEmits<{
  /** Raw pointer drag delta since drag-start + the zone rect size (px). */
  (e: "pan", payload: { startCrop: PhotoCrop; dx: number; dy: number; w: number; h: number }): void;
  /** Absolute zoom value (slider). */
  (e: "zoom", value: number): void;
  /** Relative zoom nudge (scroll wheel). */
  (e: "zoom-by", delta: number): void;
  /** Reset to cover-center. */
  (e: "reset"): void;
  /** Commit + exit (Done button). */
  (e: "done"): void;
}>();

// Map the zone % box onto the rendered img box, REUSING the popover anchoring
// math (zonePixelRect already adds the card-box offset within the canvas
// region). Identical geometry as the hotspots, so the overlay lands on the
// zone ±sub-pixel.
const rect = computed(() => zonePixelRect(props.zone, props.viewport));

const overlayStyle = computed(() => ({
  left: `${rect.value.left}px`,
  top: `${rect.value.top}px`,
  width: `${rect.value.width}px`,
  height: `${rect.value.height}px`,
}));

// Worker-mirroring crop CSS on the clipped img.
const imgStyle = computed(() => cropImgStyle(props.crop));

const isDefault = computed(() => isIdentityCrop(props.crop));

// --- drag to pan ---
let dragging = false;
let startX = 0;
let startY = 0;
let startCrop: PhotoCrop = props.crop;
let rectW = 1;
let rectH = 1;

function onPointerDown(e: PointerEvent) {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startCrop = { ...props.crop };
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  rectW = r.width;
  rectH = r.height;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return;
  emit("pan", {
    startCrop,
    dx: e.clientX - startX,
    dy: e.clientY - startY,
    w: rectW,
    h: rectH,
  });
}

function onPointerUp(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const step = props.zoomStep ?? 0.12;
  // Wheel up (deltaY<0) zooms in.
  emit("zoom-by", e.deltaY < 0 ? step : -step);
}

function onZoomInput(e: Event) {
  emit("zoom", parseFloat((e.target as HTMLInputElement).value));
}
</script>

<template>
  <!-- Above the PNG, below the popover/drawer layers. The host renders this
       inside the canvas region (the same positioning container the popover
       uses), so the pixel rect lands on the zone. -->
  <div class="pointer-events-none absolute inset-0 z-20" data-testid="photo-adjust-layer">
    <!-- Clipped live crop over the zone rect. overflow hidden + radius 0 so it
         clips to the zone exactly (per S81 spec). -->
    <div
      data-testid="photo-adjust-overlay"
      class="pointer-events-auto absolute overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing ring-2 ring-[#47bfa9] shadow-[0_0_0_9999px_rgba(11,45,80,0.28)]"
      :style="overlayStyle"
      :aria-label="label ? `Adjust ${label}` : 'Adjust photo position'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
      @dblclick="emit('reset')"
    >
      <img
        v-if="src"
        :src="src"
        alt="Adjust photo position"
        class="pointer-events-none block h-full w-full"
        data-testid="photo-adjust-img"
        :style="imgStyle"
        draggable="false"
      />
    </div>

    <!-- Floating control chip pinned just below the zone (clamped into view). -->
    <div
      data-testid="photo-adjust-chip"
      class="pointer-events-auto absolute flex items-center gap-2 rounded-full bg-[#0b2d50] px-3 py-1.5 text-white shadow-lg"
      :style="{
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + rect.height + 8}px`,
        transform: 'translateX(-50%)',
      }"
      @pointerdown.stop
      @wheel.stop
    >
      <span class="text-[10px] text-white/60">1×</span>
      <input
        type="range"
        data-testid="photo-adjust-zoom"
        class="w-24 accent-[#47bfa9]"
        :min="CROP_MIN_ZOOM"
        :max="CROP_MAX_ZOOM"
        step="0.05"
        :value="crop.zoom"
        :aria-label="'Zoom'"
        @input="onZoomInput"
      />
      <span class="text-[10px] text-white/60">{{ CROP_MAX_ZOOM }}×</span>
      <button
        type="button"
        data-testid="photo-adjust-reset"
        class="text-[11px] font-medium text-white/70 hover:text-white disabled:opacity-40"
        :disabled="isDefault"
        @click="emit('reset')"
      >
        Reset
      </button>
      <button
        type="button"
        data-testid="photo-adjust-done"
        class="rounded-full bg-[#47bfa9] px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-[#3aa893]"
        @click="emit('done')"
      >
        Done
      </button>
    </div>
  </div>
</template>
