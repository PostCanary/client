<script setup lang="ts">
/**
 * CanvasCoachMark (S79 Phase-3) — a one-time dismissible hint shown over the
 * canvas on first visit: "Click any part of the card to edit it."
 * Stored in localStorage so it only shows once per browser.
 */
import { ref, onMounted } from "vue";

const LS_KEY = "pc_coach_design_zones_v1";

const visible = ref(false);

onMounted(() => {
  try {
    if (!localStorage.getItem(LS_KEY)) {
      visible.value = true;
    }
  } catch {
    // localStorage unavailable (private mode edge case) — skip silently
  }
});

function dismiss() {
  visible.value = false;
  try {
    localStorage.setItem(LS_KEY, "1");
  } catch {
    // ignore
  }
}
</script>

<template>
  <Transition name="coach">
    <div
      v-if="visible"
      data-testid="canvas-coach-mark"
      class="pointer-events-none absolute inset-0 z-10 flex items-end justify-center pb-5"
    >
      <div
        class="pointer-events-auto flex items-center gap-3 rounded-full bg-[#0b2d50]/90 px-5 py-3 text-sm text-white shadow-xl backdrop-blur-sm"
      >
        <svg
          class="w-4 h-4 shrink-0 opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 3H5a2 2 0 0 0-2 2v4" />
          <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
          <path d="M15 3h4a2 2 0 0 1 2 2v4" />
          <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Click any part of the card to edit it</span>
        <button
          type="button"
          data-testid="canvas-coach-dismiss"
          class="ml-1 rounded-full px-2 py-0.5 text-xs font-medium opacity-70 transition-opacity hover:opacity-100 ring-1 ring-white/30"
          aria-label="Dismiss hint"
          @click="dismiss"
        >
          Got it
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.coach-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.coach-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.coach-enter-from,
.coach-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .coach-enter-active,
  .coach-leave-active {
    transition: opacity 0.15s ease;
  }
  .coach-enter-from,
  .coach-leave-to {
    transform: none;
  }
}
</style>
