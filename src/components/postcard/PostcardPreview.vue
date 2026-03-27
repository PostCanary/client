<script setup lang="ts">
import { ref } from "vue";
import PostcardFrontStub from "./PostcardFrontStub.vue";
import PostcardBackStub from "./PostcardBackStub.vue";

defineProps<{
  brandColors?: string[];
  size?: "thumbnail" | "large";
}>();

const showBack = ref(false);

function flip() {
  showBack.value = !showBack.value;
}
</script>

<template>
  <div
    class="relative cursor-pointer"
    :class="size === 'thumbnail' ? 'max-w-[240px]' : 'max-w-[480px]'"
    @click="flip"
  >
    <PostcardFrontStub v-if="!showBack" :brand-colors="brandColors" />
    <PostcardBackStub v-else :brand-colors="brandColors" />
    <button
      class="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow hover:bg-white transition-colors"
      @click.stop="flip"
    >
      {{ showBack ? "Show front" : "Flip card" }}
    </button>
  </div>
</template>
