<!-- src/components/layout/SearchBar.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "Search",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "search", v: string): void;
}>();

const q = ref(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    if (v !== q.value) q.value = v ?? "";
  }
);

function doSearch() {
  emit("update:modelValue", q.value);
  emit("search", q.value);
}
</script>

<template>
  <div class="mt-search-pill">
    <input
      v-model="q"
      type="text"
      :placeholder="placeholder"
      class="mt-search-input"
      @keydown.enter.prevent="doSearch"
    />
    <button
      type="button"
      class="mt-search-btn"
      aria-label="Search"
      @click="doSearch"
    >
      <svg viewBox="0 0 24 24" class="mt-search-icon">
        <path
          d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
          fill="none"
          stroke="#2EBFA7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.mt-search-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 48px;
  border-radius: 999px;
  background: #f4f5f7;
  padding: 0 16px;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.04);
}

.mt-search-input {
  flex: 1 1 auto;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #111827;
}

.mt-search-input::placeholder {
  color: #6b6b6b;
}

.mt-search-btn {
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  border-radius: 999px;
}

.mt-search-icon {
  width: 20px;
  height: 20px;
}
</style>
