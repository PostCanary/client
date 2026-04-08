<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
    <div class="text-4xl mb-4">📬</div>
    <h2 class="text-lg font-semibold text-[#0b2d50] mb-2">Campaigns</h2>
    <p class="text-sm text-gray-500 mb-6">
      Your campaigns will appear here once you send your first postcards.
    </p>
    <button
      class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors"
      @click="router.push('/app/send')"
    >
      + Send Postcards
    </button>
  </div>
</template>
