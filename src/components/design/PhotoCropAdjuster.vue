<script setup lang="ts">
/**
 * PhotoCropAdjuster (S80) — "Adjust position" control for a photo.
 *
 * A mini frame matching the zone's aspect ratio shows the photo with the
 * current crop applied (live, via the SAME object-fit/object-position/transform
 * CSS the worker renders — see utils/photoCrop.cropImgStyle). The user DRAGS
 * the photo to pan and uses a zoom slider (1x–2.5x). Changes are debounced and
 * emitted as a {x, y, zoom} crop (or undefined when reset to center/no-zoom),
 * so the card re-renders like text edits do. A Reset button restores the
 * cover-center default.
 */
import { computed, ref, watch } from "vue";
import type { PhotoCrop } from "@/types/campaign";
import {
  applyDrag,
  applyZoom,
  cropImgStyle,
  cropToOverride,
  isIdentityCrop,
  normalizeCrop,
  CROP_MAX_ZOOM,
  CROP_MIN_ZOOM,
} from "@/utils/photoCrop";

const props = defineProps<{
  /** Resolved photo URL to adjust (already media-resolved by the parent). */
  src: string;
  /** Current crop override (or undefined = cover-center). */
  modelValue?: PhotoCrop;
  /** Zone aspect ratio (width / height) so the frame matches the print. */
  aspect?: number;
  /** Debounce window for commit (mirrors text-edit debounce). */
  debounceMs?: number;
}>();

const emit = defineEmits<{
  /** Emits the new crop, or undefined when reset to the identity crop. */
  (e: "update:modelValue", crop: PhotoCrop | undefined): void;
}>();

const frame = ref<HTMLElement | null>(null);
const crop = ref<PhotoCrop>(normalizeCrop(props.modelValue));

// Keep local state in sync if the parent swaps the crop (e.g. slot switch).
watch(
  () => props.modelValue,
  (v) => {
    crop.value = normalizeCrop(v);
  },
);

const aspectRatio = computed(() => props.aspect && props.aspect > 0 ? props.aspect : 1.5);
const imgStyle = computed(() => cropImgStyle(crop.value));
const isDefault = computed(() => isIdentityCrop(crop.value));

// --- debounced commit (like the text editors) ---
let commitTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleCommit() {
  if (commitTimer) clearTimeout(commitTimer);
  const delay = props.debounceMs ?? 250;
  commitTimer = setTimeout(() => {
    emit("update:modelValue", cropToOverride(crop.value));
  }, delay);
}

// --- drag to pan ---
let dragging = false;
let lastX = 0;
let lastY = 0;
let dragStartCrop: PhotoCrop = crop.value;

function onPointerDown(e: PointerEvent) {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  dragStartCrop = { ...crop.value };
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e: PointerEvent) {
  if (!dragging || !frame.value) return;
  const rect = frame.value.getBoundingClientRect();
  // Drag the photo: moving the pointer right should reveal content to the
  // LEFT of the photo (focal moves left). Inverting the delta makes the photo
  // follow the cursor (grab-and-drag feel).
  const dx = -(e.clientX - lastX);
  const dy = -(e.clientY - lastY);
  crop.value = applyDrag(dragStartCrop, dx, dy, rect.width, rect.height);
  scheduleCommit();
}

function onPointerUp(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  // Flush immediately on release so the final position commits promptly.
  if (commitTimer) clearTimeout(commitTimer);
  emit("update:modelValue", cropToOverride(crop.value));
}

// --- zoom slider ---
function onZoomInput(e: Event) {
  const z = parseFloat((e.target as HTMLInputElement).value);
  crop.value = applyZoom(crop.value, z);
  scheduleCommit();
}

function reset() {
  crop.value = { x: 50, y: 50, zoom: 1 };
  if (commitTimer) clearTimeout(commitTimer);
  emit("update:modelValue", undefined);
}
</script>

<template>
  <div class="space-y-2" data-testid="photo-crop-adjuster">
    <div class="flex items-center justify-between">
      <label class="block text-xs font-medium text-gray-600">Adjust position</label>
      <button
        type="button"
        data-testid="crop-reset"
        class="text-[11px] text-gray-400 hover:text-[#0b2d50] disabled:opacity-40"
        :disabled="isDefault"
        @click="reset"
      >
        Reset
      </button>
    </div>

    <!-- Mini frame: matches the zone aspect; drag to pan. -->
    <div
      ref="frame"
      data-testid="crop-frame"
      class="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 cursor-grab active:cursor-grabbing select-none touch-none"
      :style="{ aspectRatio: String(aspectRatio) }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        v-if="src"
        :src="src"
        alt="Adjust photo position"
        class="pointer-events-none block"
        data-testid="crop-preview-img"
        :style="imgStyle"
        draggable="false"
      />
      <div
        v-else
        class="flex h-full items-center justify-center text-[11px] text-gray-400"
      >
        Pick a photo first
      </div>
    </div>

    <!-- Zoom slider -->
    <div class="flex items-center gap-2">
      <span class="text-[10px] text-gray-400">1x</span>
      <input
        type="range"
        data-testid="crop-zoom"
        class="flex-1 accent-[#47bfa9]"
        :min="CROP_MIN_ZOOM"
        :max="CROP_MAX_ZOOM"
        step="0.05"
        :value="crop.zoom"
        @input="onZoomInput"
      />
      <span class="text-[10px] text-gray-400">{{ CROP_MAX_ZOOM }}x</span>
    </div>
    <p class="text-[10px] text-gray-400 leading-snug">
      Drag the photo to reposition it; use the slider to zoom.
    </p>
  </div>
</template>
