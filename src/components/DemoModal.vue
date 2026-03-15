<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useDemoStore } from "@/stores/demo";
import { BRAND } from "@/config/brand";
import { trackSchedule } from "@/composables/useMetaPixel";

const demo = useDemoStore();
const isOpen = computed(() => demo.modalOpen);
const iframeLoaded = ref(false);

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && demo.modalOpen) {
    demo.close();
  }
}

function onIframeLoad() {
  iframeLoaded.value = true;
}

// Reset loading state when modal closes
function close() {
  demo.close();
  iframeLoaded.value = false;
}

watch(isOpen, (open) => {
  if (open) {
    trackSchedule({ content_name: "Book a Demo" });
  }
});

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <!-- Click outside to close -->
      <div class="absolute inset-0" @click="close()" />

      <!-- Modal panel -->
      <div
        class="relative z-10 w-full max-w-2xl mx-4 rounded-2xl bg-[var(--mkt-card)] border border-[var(--mkt-border)] shadow-[0_24px_70px_rgba(0,0,0,0.45)] flex flex-col"
        style="height: min(90vh, 760px);"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h2 class="text-[20px] font-semibold text-[var(--mkt-text)]">
            Book a Demo
          </h2>
          <button
            type="button"
            class="text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] text-2xl leading-none cursor-pointer"
            @click="close()"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <!-- Loading indicator (shown until iframe loads) -->
        <div
          v-if="!iframeLoaded"
          class="flex items-center justify-center py-20 text-[var(--mkt-text-muted)] text-sm"
        >
          Loading scheduling widget...
        </div>

        <!-- Calendly iframe -->
        <iframe
          :src="BRAND.links.demo"
          class="flex-1 w-full rounded-b-2xl border-none"
          :class="{ 'invisible': !iframeLoaded }"
          allow="payment"
          @load="onIframeLoad"
        />
      </div>
    </div>
  </Teleport>
</template>
