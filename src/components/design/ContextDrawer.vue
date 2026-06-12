<script setup lang="ts">
/**
 * ContextDrawer (S79 Phase-2) — a docked right-side drawer for the HEAVY /
 * global editors that don't belong in a compact popover: Photo (gallery +
 * upload + stock + AI), Colors (palettes + custom), Business Info, and the
 * Back-style picker. It overlays the right edge of the canvas region WITHOUT
 * shifting the canvas (absolute, so the hero never reflows), is collapsed by
 * default, and scrolls itself.
 *
 * Open/close: opened from toolbar buttons and from relevant zone clicks (photo
 * zone → Photo tab; map zone keeps its existing in-popover editor). Esc and the
 * close button dismiss; the backdrop is intentionally non-modal (a faint scrim
 * only over the drawer's own gutter) so the canvas stays visible and the
 * customer keeps their place. Clicks inside never close it.
 */
import { onMounted, onBeforeUnmount } from "vue";

defineProps<{
  /** drawer title shown in the header */
  title: string;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

function onKeydown(ev: KeyboardEvent) {
  if (ev.key === "Escape") {
    ev.stopPropagation();
    emit("close");
  }
}
onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <!-- Positioned absolutely inside the (relative) canvas region so it overlays
       the right side without reflowing the hero. -->
  <aside
    data-testid="context-drawer"
    class="absolute inset-y-0 right-0 z-20 flex w-[360px] max-w-[88%] flex-col border-l border-gray-200 bg-white shadow-2xl"
    role="dialog"
    :aria-label="title"
  >
    <div class="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
      <h3 class="text-sm font-semibold text-[#0b2d50] truncate">{{ title }}</h3>
      <button
        type="button"
        data-testid="context-drawer-close"
        class="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
        aria-label="Close"
        @click="emit('close')"
      >
        &times;
      </button>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <slot />
    </div>
  </aside>
</template>
