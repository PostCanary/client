<script setup lang="ts">
import { computed } from "vue";
import type { WizardStep } from "@/types/campaign";

const props = defineProps<{
  currentStep: WizardStep;
  completedSteps: WizardStep[];
}>();

const emit = defineEmits<{
  (e: "goto", step: WizardStep): void;
}>();

const steps = [
  { num: 1 as WizardStep, label: "Choose Your Goal", time: "30 sec" },
  { num: 2 as WizardStep, label: "Pick Your Neighborhood", time: "1 min" },
  { num: 3 as WizardStep, label: "Your Postcard", time: "2 min" },
  { num: 4 as WizardStep, label: "Review & Send", time: "1 min" },
];

const progressPercent = computed(() => {
  return (props.completedSteps.length / 4) * 100;
});

const encouragement = computed(() => {
  if (progressPercent.value >= 75) return "Almost there!";
  if (progressPercent.value >= 50) return "Halfway done";
  return "";
});

function isCompleted(step: WizardStep): boolean {
  return props.completedSteps.includes(step);
}

function isClickable(step: WizardStep): boolean {
  return isCompleted(step) || step <= Math.max(...props.completedSteps, 0) + 1;
}

function handleClick(step: WizardStep) {
  if (isClickable(step)) {
    emit("goto", step);
  }
}
</script>

<template>
  <div class="flex items-center gap-1">
    <template v-for="(step, idx) in steps" :key="step.num">
      <!-- Step circle + label -->
      <button
        class="flex items-center gap-1.5 text-sm transition-colors"
        :class="{
          'text-[#47bfa9] font-semibold': step.num === currentStep,
          'text-[#47bfa9]': isCompleted(step.num) && step.num !== currentStep,
          'text-gray-400': !isCompleted(step.num) && step.num !== currentStep,
          'cursor-pointer hover:text-[#3aa893]': isClickable(step.num),
          'cursor-default': !isClickable(step.num),
        }"
        :disabled="!isClickable(step.num)"
        @click="handleClick(step.num)"
      >
        <!-- Circle -->
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
          :class="{
            'bg-[#47bfa9] text-white': step.num === currentStep,
            'bg-[#47bfa9]/20 text-[#47bfa9]': isCompleted(step.num) && step.num !== currentStep,
            'bg-gray-100 text-gray-400': !isCompleted(step.num) && step.num !== currentStep,
          }"
        >
          <svg
            v-if="isCompleted(step.num) && step.num !== currentStep"
            xmlns="http://www.w3.org/2000/svg"
            class="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span v-else>{{ step.num }}</span>
        </span>
        <!-- Label (hidden on small screens) -->
        <span class="hidden sm:inline whitespace-nowrap">{{ step.label }}</span>
        <span
          v-if="!isCompleted(step.num) && step.num === currentStep"
          class="hidden lg:inline text-[10px] text-gray-400 ml-0.5"
        >
          ~{{ step.time }}
        </span>
      </button>

      <!-- Connector line -->
      <div
        v-if="idx < steps.length - 1"
        class="flex-1 h-0.5 min-w-[16px] mx-1"
        :class="isCompleted(step.num) ? 'bg-[#47bfa9]' : 'bg-gray-200'"
      />
    </template>

    <!-- Encouragement text -->
    <span v-if="encouragement" class="hidden md:inline text-xs text-[#47bfa9] ml-2 whitespace-nowrap">
      {{ encouragement }}
    </span>
  </div>
</template>
