<script setup lang="ts">
import { ref } from "vue";
import type { CampaignGoalType, TemplateLayoutType } from "@/types/campaign";
import { getTemplateSetsForGoal } from "@/data/templates";

const props = defineProps<{
  goalType: CampaignGoalType;
  currentLayout: TemplateLayoutType;
}>();

const emit = defineEmits<{
  (e: "select", layout: TemplateLayoutType): void;
  (e: "close"): void;
}>();

const sets = getTemplateSetsForGoal(props.goalType);
const showMore = ref(false);

// Show recommended + 2 others by default
const primarySets = sets.filter((s) => s.recommended).concat(
  sets.filter((s) => !s.recommended).slice(0, 2),
);
const moreSets = sets.filter(
  (s) => !primarySets.includes(s),
);

const LAYOUT_COLORS: Record<TemplateLayoutType, string> = {
  "full-bleed": "#47bfa9",
  "side-split": "#0b2d50",
  "photo-top": "#f5a623",
  "bold-graphic": "#e74c3c",
  "before-after": "#8e44ad",
  "review-forward": "#27ae60",
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/30" @click="emit('close')" />

    <!-- Panel -->
    <div class="relative w-[480px] bg-white h-full overflow-y-auto shadow-xl">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-[#0b2d50]">Choose a Template</h3>
          <button
            class="text-gray-400 hover:text-gray-600 p-1"
            @click="emit('close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="set in primarySets"
            :key="set.layout"
            class="rounded-xl border-2 p-4 cursor-pointer transition-all"
            :class="
              set.layout === currentLayout
                ? 'border-[#47bfa9] bg-[#47bfa9]/5'
                : 'border-gray-200 hover:border-gray-300'
            "
            @click="emit('select', set.layout)"
          >
            <div class="flex items-center gap-2 mb-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: LAYOUT_COLORS[set.layout] }"
              />
              <span class="text-sm font-semibold text-[#0b2d50]">
                {{ set.name }}
              </span>
              <span
                v-if="set.recommended"
                class="text-[10px] bg-[#47bfa9]/15 text-[#47bfa9] px-2 py-0.5 rounded-full font-medium"
              >
                ★ Best Match
              </span>
            </div>
            <!-- 3 mini thumbnails -->
            <div class="flex gap-2">
              <div
                v-for="t in set.templates"
                :key="t.id"
                class="flex-1 rounded-lg border border-gray-100 p-2 text-center"
                :style="{ backgroundColor: LAYOUT_COLORS[set.layout] + '10' }"
              >
                <div class="text-[8px] text-gray-500 font-medium">
                  {{ t.cardPosition === 'offer' ? 'Offer' : t.cardPosition === 'proof' ? 'Proof' : 'Last Chance' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- More styles -->
        <div v-if="moreSets.length > 0" class="mt-4">
          <button
            v-if="!showMore"
            class="text-sm text-[#47bfa9] font-medium hover:underline"
            @click="showMore = true"
          >
            More styles ({{ moreSets.length }})
          </button>
          <div v-if="showMore" class="space-y-4 mt-2">
            <div
              v-for="set in moreSets"
              :key="set.layout"
              class="rounded-xl border-2 border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-all"
              @click="emit('select', set.layout)"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: LAYOUT_COLORS[set.layout] }"
                />
                <span class="text-sm font-semibold text-[#0b2d50]">
                  {{ set.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
