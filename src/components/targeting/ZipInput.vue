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
        class="px-3 py-2 bg-[#47bfa9] text-white text-sm font-medium rounded-lg hover:bg-[#3aa893] transition-colors"
        @click="addZips"
      >
        Add
      </button>
    </div>
    <div v-if="zips.length > 0" class="flex flex-wrap gap-1.5 mt-2">
      <span
        v-for="zip in zips"
        :key="zip"
        class="inline-flex items-center gap-1 bg-[#47bfa9]/10 text-[#47bfa9] text-xs font-medium px-2.5 py-1 rounded-full"
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
