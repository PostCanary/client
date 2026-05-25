<script setup lang="ts">
defineProps<{
  brandColors?: string[];
}>();
</script>

<template>
  <div
    class="rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
    :style="{
      backgroundColor: brandColors?.[0] ?? '#f0f4f8',
      aspectRatio: '6 / 4',
    }"
  >
    <div class="text-center">
      <div class="text-lg font-semibold" :style="{ color: brandColors?.[1] ?? '#0b2d50' }">
        Front Preview
      </div>
      <div class="text-sm mt-1" :style="{ color: brandColors?.[1] ?? '#64748b' }">
        Terminal 2 replaces this with real postcard layout
      </div>
    </div>
  </div>
</template>
