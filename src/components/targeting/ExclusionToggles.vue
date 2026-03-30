<script setup lang="ts">
const excludePast = defineModel<boolean>("excludePastCustomers", {
  default: true,
});
const frequencyDays = defineModel<number | null>("excludeMailedWithinDays", {
  default: 30,
});
const props = defineProps<{
  doNotMailCount: number;
}>();
</script>

<template>
  <div class="space-y-3">
    <h4 class="text-sm font-semibold text-[#0b2d50]">Exclusions</h4>

    <!-- Past customers -->
    <label class="flex items-center gap-2 text-sm">
      <input
        v-model="excludePast"
        type="checkbox"
        class="accent-[#47bfa9]"
      />
      <span class="text-gray-700">Exclude past customers</span>
    </label>

    <!-- Frequency cap -->
    <div>
      <label class="text-xs text-gray-500">
        Don't mail people contacted within:
      </label>
      <select
        :value="frequencyDays ?? 30"
        class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @change="frequencyDays = parseInt(($event.target as HTMLSelectElement).value) || null"
      >
        <option :value="15">15 days</option>
        <option :value="30">30 days</option>
        <option :value="60">60 days</option>
        <option :value="90">90 days</option>
      </select>
    </div>

    <!-- Do not mail -->
    <div class="text-xs text-gray-400">
      {{ props.doNotMailCount }} addresses on your do-not-mail list
    </div>
  </div>
</template>
