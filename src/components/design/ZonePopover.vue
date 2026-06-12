<script setup lang="ts">
/**
 * ZonePopover (S79 Phase-2) — a compact editor popover anchored NEXT TO the
 * card zone the user clicked, instead of in a far-away rail. It hosts a single
 * editor section (EditPanel/BackEditPanel in section mode) so editing happens
 * in the object's native context (direct manipulation).
 *
 * Positioning is pure math (usePopoverAnchor): the zone's percentage box →
 * pixel rect within the canvas viewport, then a flip/clamp so the popover is
 * never clipped (zones near the right edge open leftward; bottom zones get
 * pushed upward by the clamp).
 *
 * Close UX: Esc and outside-click close. Clicks INSIDE the popover (inputs,
 * buttons, color pickers, file dialogs) NEVER close it — the close handler is
 * registered on the document with a contains() guard, and the popover stops
 * pointerdown propagation. Typing therefore never dismisses the popover.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { anchorPopover, type ZoneBox } from "@/composables/usePopoverAnchor";

const props = defineProps<{
  /** the clicked zone's percentage box within the canvas */
  zone: ZoneBox;
  /** the canvas viewport pixel rect the zone percentages are relative to */
  viewport: { width: number; height: number };
  /** human label for the editor (popover header) */
  label: string;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const POPOVER_WIDTH = 320;
const root = ref<HTMLElement | null>(null);
// Measured height; starts at a sensible default and updates after mount so the
// vertical clamp is accurate for tall/short editors.
const measuredHeight = ref(320);

const anchor = computed(() =>
  anchorPopover(props.zone, props.viewport, {
    width: POPOVER_WIDTH,
    height: measuredHeight.value,
  }),
);

const style = computed(() => ({
  left: `${anchor.value.left}px`,
  top: `${anchor.value.top}px`,
  width: `${POPOVER_WIDTH}px`,
}));

function remeasure() {
  if (root.value) {
    measuredHeight.value = root.value.offsetHeight;
  }
}

watch(
  () => [props.zone, props.label],
  () => nextTick(remeasure),
);

// --- Close handling ---------------------------------------------------------
function onDocPointerDown(ev: PointerEvent) {
  const el = root.value;
  if (!el) return;
  if (el.contains(ev.target as Node)) return; // click inside → keep open
  emit("close");
}
function onKeydown(ev: KeyboardEvent) {
  if (ev.key === "Escape") {
    ev.stopPropagation();
    emit("close");
  }
}

onMounted(() => {
  nextTick(remeasure);
  // pointerdown (capture phase off) on the document closes on outside clicks.
  document.addEventListener("pointerdown", onDocPointerDown);
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointerDown);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div
    ref="root"
    data-testid="zone-popover"
    :data-placement="anchor.placement"
    class="absolute z-30 rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5"
    :style="style"
    role="dialog"
    :aria-label="label"
    @pointerdown.stop
  >
    <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
      <span class="text-xs font-semibold text-[#0b2d50] truncate">{{ label }}</span>
      <button
        type="button"
        data-testid="zone-popover-close"
        class="text-gray-400 hover:text-gray-700 text-sm leading-none px-1"
        aria-label="Close"
        @click="emit('close')"
      >
        &times;
      </button>
    </div>
    <div class="max-h-[min(70vh,520px)] overflow-y-auto p-3">
      <slot />
    </div>
  </div>
</template>
