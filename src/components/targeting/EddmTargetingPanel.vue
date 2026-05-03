<script setup lang="ts">
import { ref } from "vue";
import type { EddmRoute } from "@/types/campaign";

const props = defineProps<{
  routes: EddmRoute[];
  selectedCrrt: Set<string>;
  selectedHouseholds: number;
}>();

const emit = defineEmits<{
  (e: "load-routes", zip5: string): void;
  (e: "toggle-route", crrt: string): void;
  (e: "clear"): void;
}>();

const zipInput = ref("");
const zipError = ref("");

function submitZip() {
  const zip = zipInput.value.trim();
  if (!/^\d{5}$/.test(zip)) {
    zipError.value = "Enter a 5-digit ZIP code";
    return;
  }
  zipError.value = "";
  emit("load-routes", zip);
}
</script>

<template>
  <div class="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-4 border-b border-gray-100">
      <h3 class="text-sm font-semibold text-[#0b2d50]">EDDM Route Selection</h3>
      <p class="text-xs text-gray-500 mt-0.5">
        Send to every address on selected carrier routes — no demographic filters.
      </p>
    </div>

    <!-- ZIP input -->
    <div class="px-4 py-3 border-b border-gray-100">
      <label class="block text-xs font-medium text-gray-700 mb-1">
        Enter ZIP code to see carrier routes
      </label>
      <div class="flex gap-2">
        <input
          v-model="zipInput"
          type="text"
          inputmode="numeric"
          maxlength="5"
          placeholder="e.g. 22201"
          class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#47bfa9]"
          @keydown.enter="submitZip"
        />
        <button
          class="bg-[#47bfa9] text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#3aa893] transition-colors"
          @click="submitZip"
        >
          Search
        </button>
      </div>
      <p v-if="zipError" class="text-xs text-red-500 mt-1">{{ zipError }}</p>
    </div>

    <!-- Summary -->
    <div v-if="routes.length > 0" class="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between text-xs text-gray-600">
      <span>Selected: <strong class="text-[#0b2d50]">{{ selectedCrrt.size }} of {{ routes.length }}</strong></span>
      <span>~<strong class="text-[#0b2d50]">{{ selectedHouseholds.toLocaleString() }}</strong> households</span>
    </div>

    <!-- Route list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="routes.length === 0" class="flex items-center justify-center h-full">
        <p class="text-sm text-gray-400 text-center px-4">
          Enter a ZIP code above to see available carrier routes.
        </p>
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="route in routes"
          :key="route.crrt"
          class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer select-none"
          @click="emit('toggle-route', route.crrt)"
        >
          <div
            class="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center"
            :class="selectedCrrt.has(route.crrt)
              ? 'border-[#F97316] bg-[#F97316]'
              : 'border-gray-300 bg-white'"
          >
            <svg v-if="selectedCrrt.has(route.crrt)" class="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-sm font-mono text-[#0b2d50] flex-1">{{ route.crrt }}</span>
          <span class="text-xs text-gray-500">~{{ route.household_count.toLocaleString() }} HH</span>
        </li>
      </ul>
    </div>

    <!-- Footer -->
    <div v-if="selectedCrrt.size > 0" class="px-4 py-3 border-t border-gray-100">
      <button
        class="text-xs text-gray-500 hover:text-red-500 transition-colors"
        @click="emit('clear')"
      >
        Clear selection
      </button>
    </div>
  </div>
</template>
