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
        class="flex items-center justify-center w-6 h-6 rounded-[2px] bg-[var(--app-btn-bg,#1c2430)] text-white text-xs font-bold shrink-0"
      >{{ stepNumber }}</span>
      <h2 class="text-lg font-semibold text-[var(--pc-navy,#1c2430)]">{{ strategy }}</h2>
    </div>
    <p class="text-sm text-slate-500 ml-8">{{ subText }}</p>
  </div>
</template>
