<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
    <div class="text-4xl mb-4">📬</div>
    <h2 class="text-lg font-semibold text-[var(--pc-navy,#1c2430)] mb-2">Campaigns</h2>
    <p class="text-sm text-gray-500 mb-6">
      Your campaigns will appear here once you send your first postcards.
    </p>
    <button
      class="bg-[var(--app-btn-bg,#1c2430)] text-white font-semibold px-6 py-2.5 rounded-[2px] hover:bg-[var(--app-btn-bg-hover,#2a3544)] transition-colors"
      @click="router.push('/app/send')"
    >
      + Send Postcards
    </button>
  </div>
</template>
