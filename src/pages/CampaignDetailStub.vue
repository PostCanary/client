<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
    <div class="text-4xl mb-4">📊</div>
    <h2 class="text-lg font-semibold text-[#0b2d50] mb-2">Campaign Details</h2>
    <p class="text-sm text-gray-500 mb-6">
      Campaign details will be available after Terminal 3 is built.
    </p>
    <button
      class="text-sm text-[#47bfa9] font-medium hover:underline"
      @click="router.push('/app/campaigns')"
    >
      ← All Campaigns
    </button>
  </div>
</template>
