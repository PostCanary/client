<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useTargetingMap } from "@/composables/useTargetingMap";
const emit = defineEmits<{
  (e: "areas-changed"): void;
  (e: "method-chosen", method: "draw" | "zip" | "around_jobs"): void;
}>();
const mapEl = ref<HTMLElement | null>(null);
const { initMap, areas, addJobRadii, highlightZips, restoreAreas, startDrawing, clearAll, destroy, activeDrawTool } =
  useTargetingMap(mapEl);

// First-time prompt
const introSeen = ref(localStorage.getItem("pc:targeting-intro-seen") === "1");
const introFading = ref(false);
let introTimer: ReturnType<typeof setTimeout> | null = null;

function dismissIntro(method: "draw" | "zip" | "around_jobs") {
  if (introFading.value) return;
  introFading.value = true;
  setTimeout(() => {
    introSeen.value = true;
    localStorage.setItem("pc:targeting-intro-seen", "1");
    emit("method-chosen", method);
  }, 300);
}

onMounted(() => {
  initMap();
  if (!introSeen.value) {
    introTimer = setTimeout(() => dismissIntro("draw"), 10000);
  }
});

onBeforeUnmount(() => {
  destroy();
  if (introTimer) clearTimeout(introTimer);
});

defineExpose({ addJobRadii, highlightZips, restoreAreas, startDrawing, clearAll, areas, activeDrawTool });
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Map -->
    <div ref="mapEl" class="w-full h-full min-h-[400px]" />

    <!-- Custom drawing buttons (replaces Leaflet-Draw toolbar) -->
    <div
      v-if="introSeen"
      class="absolute top-[10px] left-[50px] z-[500] flex flex-col gap-1"
    >
      <button
        class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md text-sm font-medium text-[#0b2d50] hover:bg-gray-50 border transition-colors"
        :class="activeDrawTool === 'circle' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200'"
        @click="startDrawing('circle')"
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="8" cy="8" r="6" />
        </svg>
        Draw Circle
      </button>
      <button
        class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md text-sm font-medium text-[#0b2d50] hover:bg-gray-50 border transition-colors"
        :class="activeDrawTool === 'rectangle' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200'"
        @click="startDrawing('rectangle')"
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="12" height="10" rx="1" />
        </svg>
        Draw Rectangle
      </button>
      <button
        class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md text-sm font-medium text-[#0b2d50] hover:bg-gray-50 border transition-colors"
        :class="activeDrawTool === 'polygon' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200'"
        @click="startDrawing('polygon')"
      >
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="8,1 15,6 12,15 4,15 1,6" />
        </svg>
        Draw Area
      </button>
    </div>

    <!-- First-time guided prompt -->
    <div
      v-if="!introSeen"
      class="absolute inset-0 flex items-center justify-center bg-black/30 z-[1000] transition-opacity duration-300"
      :class="{ 'opacity-0': introFading }"
      @click.self="dismissIntro('draw')"
    >
      <div class="bg-white rounded-2xl shadow-xl p-6 max-w-sm text-center">
        <h3 class="text-lg font-semibold text-[#0b2d50] mb-2">
          How would you like to target?
        </h3>
        <p class="text-sm text-gray-500 mb-5">
          Pick a method to start — you can combine all three.
        </p>
        <div class="space-y-2">
          <button
            class="w-full py-2.5 px-4 rounded-lg border border-gray-200 text-sm font-medium text-[#0b2d50] hover:border-[#47bfa9] hover:bg-[#47bfa9]/5 transition-all"
            @click="dismissIntro('around_jobs')"
          >
            📍 Around My Jobs
          </button>
          <button
            class="w-full py-2.5 px-4 rounded-lg border border-gray-200 text-sm font-medium text-[#0b2d50] hover:border-[#47bfa9] hover:bg-[#47bfa9]/5 transition-all"
            @click="dismissIntro('draw')"
          >
            ✏️ I'll Draw on the Map
          </button>
          <button
            class="w-full py-2.5 px-4 rounded-lg border border-gray-200 text-sm font-medium text-[#0b2d50] hover:border-[#47bfa9] hover:bg-[#47bfa9]/5 transition-all"
            @click="dismissIntro('zip')"
          >
            📮 Enter ZIP Codes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
