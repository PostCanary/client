<script setup lang="ts">
// Non-interactive overlay for USPS-required zone
</script>

<template>
  <div class="absolute inset-0 z-10 pointer-events-none">
    <div class="absolute inset-0 bg-[#f0f2f5]/80" />
    <div class="absolute top-2 left-2 flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
      </svg>
      <span class="text-[8px] text-gray-400 font-medium">Required by USPS</span>
    </div>
  </div>
</template>
