<script setup lang="ts">
/**
 * ContextDrawer (S79 Phase-2 / Phase-3) — a docked right-side drawer for the
 * HEAVY / global editors: Photo, Colors, Business Info, and Back-style.
 * It overlays the right edge of the canvas region WITHOUT shifting the canvas
 * (absolute positioning), is collapsed by default, and scrolls itself.
 *
 * Open/close: opened from toolbar buttons and zone clicks. Esc is handled
 * centrally by useDesignKeyboard in StepDesign (Esc → close popover first,
 * then drawer); the close button is the in-component affordance.
 * Clicks inside never close it.
 *
 * Transition: the parent wraps this component in <Transition name="drawer">
 * using the .drawer-* classes declared in index.css (slide-in 200ms ease).
 */

defineProps<{
  /** drawer title shown in the header */
  title: string;
}>();

const emit = defineEmits<{ (e: "close"): void }>();
</script>

<template>
  <!-- Positioned absolutely inside the (relative) canvas region so it overlays
       the right side without reflowing the hero. The drawer slides in from the
       right (~200ms ease-in-out) and slides out on close. -->
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

