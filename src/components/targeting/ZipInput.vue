<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  zips: string[];
}>();

const emit = defineEmits<{
  (e: "add", zips: string[]): void;
  (e: "remove", zip: string): void;
}>();

const input = ref("");

function addZips() {
  const raw = input.value
    .split(/[,\s]+/)
    .map((z) => z.trim())
    .filter((z) => /^\d{5}$/.test(z))
    .filter((z) => !props.zips.includes(z));
  if (raw.length > 0) {
    emit("add", raw);
    input.value = "";
  }
}
</script>

<template>
  <div>
    <div class="flex gap-2">
      <input
        v-model="input"
        type="text"
        placeholder="Enter ZIP codes (comma-separated)"
        class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @keydown.enter.prevent="addZips"
      />
      <button
        class="px-3 py-2 bg-[var(--app-btn-bg,#1c2430)] text-white text-sm font-medium rounded-[2px] hover:bg-[var(--app-btn-bg-hover,#2a3544)] transition-colors"
        @click="addZips"
      >
        Add
      </button>
    </div>
    <div v-if="zips.length > 0" class="flex flex-wrap gap-1.5 mt-2">
      <span
        v-for="zip in zips"
        :key="zip"
        class="inline-flex items-center gap-1 bg-[rgba(250,207,65,0.16)] text-[var(--pc-navy,#1c2430)] text-xs font-medium px-2.5 py-1 rounded-full"
      >
        {{ zip }}
        <button
          class="hover:text-red-500 transition-colors"
          @click="emit('remove', zip)"
        >
          &times;
        </button>
      </span>
    </div>
  </div>
</template>
