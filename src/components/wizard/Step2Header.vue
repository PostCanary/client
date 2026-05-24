<script setup lang="ts">
defineProps<{
  stepNumber: number
  strategy: string
  subText: string
}>()
</script>

<template>
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-1">
      <span
        class="flex items-center justify-center w-6 h-6 rounded-full bg-[#47bfa9] text-white text-xs font-bold shrink-0"
      >{{ stepNumber }}</span>
      <h2 class="text-lg font-semibold text-[#0b2d50]">{{ strategy }}</h2>
    </div>
    <p class="text-sm text-slate-500 ml-8">{{ subText }}</p>
  </div>
</template>
