<script setup lang="ts">
defineProps<{
  brandColors?: string[];
}>();
</script>

<template>
  <div
    class="rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white"
    :style="{ aspectRatio: '6 / 4' }"
  >
    <div class="text-center">
      <div class="text-lg font-semibold text-gray-500">Back Preview</div>
      <div class="text-sm mt-1 text-gray-400">
        Terminal 2 replaces this with real postcard layout
      </div>
    </div>
  </div>
</template>
