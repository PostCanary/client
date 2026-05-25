<script setup lang="ts">
import { computed } from "vue";
import * as icons from "@vicons/ionicons5";
import type { GoalDefinition } from "@/data/campaignGoals";

const props = defineProps<{
  goal: GoalDefinition;
  selected: boolean;
  size?: "primary" | "more";
}>();

const emit = defineEmits<{
  (e: "select"): void;
}>();

const isPrimary = computed(() => props.size === "primary");
const isDisabled = computed(() => !!props.goal.comingSoon);

const iconComponent = computed(() => {
  return (icons as Record<string, any>)[props.goal.icon] ?? null;
});

function handleClick() {
  if (!isDisabled.value) {
    emit("select");
  }
}
</script>

<template>
  <button
    class="goal-card text-left rounded-xl border-2 transition-all relative"
    :class="{
      'border-[#47bfa9] bg-[#47bfa9]/5 shadow-sm': selected,
      'border-gray-200 hover:border-gray-300 hover:shadow-sm': !selected && !isDisabled,
      'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed': isDisabled,
      'cursor-pointer': !isDisabled,
      'p-5': isPrimary,
      'p-3.5': !isPrimary,
    }"
    :disabled="isDisabled"
    @click="handleClick"
  >
    <!-- Coming Soon badge -->
    <span
      v-if="goal.comingSoon"
      class="absolute top-2 right-2 text-[10px] font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full"
    >
      Coming Soon
    </span>

    <!-- Recommended badge -->
    <span
      v-if="goal.recommended && !goal.comingSoon"
      class="absolute top-2 right-2 text-[10px] font-semibold bg-[#47bfa9]/15 text-[#47bfa9] px-2 py-0.5 rounded-full"
    >
      Recommended
    </span>

    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div
        class="shrink-0 rounded-lg flex items-center justify-center"
        :class="{
          'w-10 h-10 bg-[#47bfa9]/10 text-[#47bfa9]': selected,
          'w-10 h-10 bg-gray-100 text-gray-500': !selected,
        }"
      >
        <component
          v-if="iconComponent"
          :is="iconComponent"
          :class="isPrimary ? 'w-5 h-5' : 'w-4 h-4'"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div
          class="font-semibold"
          :class="{
            'text-[#0b2d50]': !isDisabled,
            'text-gray-400': isDisabled,
            'text-base': isPrimary,
            'text-sm': !isPrimary,
          }"
        >
          {{ goal.label }}
        </div>
        <p
          class="mt-0.5 text-gray-500 leading-snug"
          :class="isPrimary ? 'text-sm' : 'text-xs'"
        >
          {{ goal.shortDescription }}
        </p>
      </div>

      <!-- Checkmark when selected -->
      <div v-if="selected" class="shrink-0 mt-0.5">
        <svg class="w-5 h-5 text-[#47bfa9]" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>
  </button>
</template>
