<script setup lang="ts">
const searchQuery = defineModel<string>("searchQuery", { default: "" });
const sortBy = defineModel<string>("sortBy", { default: "newest" });
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Search -->
    <div class="relative flex-1 max-w-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search campaigns..."
        class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#47bfa9] focus:outline-none"
      />
    </div>

    <!-- Sort -->
    <select
      v-model="sortBy"
      class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
    >
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
    </select>
  </div>
</template>
