<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useTargetingMap } from "@/composables/useTargetingMap";
const emit = defineEmits<{
  (e: "areas-changed"): void;
  (e: "method-chosen", method: "draw" | "zip" | "around_jobs"): void;
}>();
const mapEl = ref<HTMLElement | null>(null);
const { initMap, areas, addJobRadii, highlightZips, clearAll, destroy } =
  useTargetingMap(mapEl);

// First-time prompt
const introSeen = ref(localStorage.getItem("pc:targeting-intro-seen") === "1");

function dismissIntro(method: "draw" | "zip" | "around_jobs") {
  introSeen.value = true;
  localStorage.setItem("pc:targeting-intro-seen", "1");
  emit("method-chosen", method);
}

onMounted(() => {
  // Center on brand kit location or default to Phoenix
  // Round 1: always default center (no geocoding of location string)
  initMap();
});

onBeforeUnmount(() => {
  destroy();
});

defineExpose({ addJobRadii, highlightZips, clearAll, areas });
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Map -->
    <div ref="mapEl" class="w-full h-full min-h-[400px]" />

    <!-- First-time guided prompt -->
    <div
      v-if="!introSeen"
      class="absolute inset-0 flex items-center justify-center bg-black/30 z-[1000]"
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
