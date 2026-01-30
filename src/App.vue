<!-- client/src/App.vue -->
<script setup lang="ts">
// import { RouterView } from "vue-router"; // Commented out for Coming Soon mode
import { NMessageProvider } from "naive-ui"; // <- add this (unless auto-imported)
import Loader from "@/components/Loader.vue";
import { useAuthStore } from "@/stores/auth";
import LoginModal from "@/components/LoginModal.vue";
import ComingSoon from "@/components/ComingSoon.vue";
import "@/styles/index.css";

const auth = useAuthStore();

// Coming Soon is the default. Set VITE_COMING_SOON=false to show full app
const isComingSoon = import.meta.env.VITE_COMING_SOON !== "false";
</script>

<template>
  <n-message-provider>
    <!-- Show Coming Soon page if enabled, otherwise show full app -->
    <ComingSoon v-if="isComingSoon" />
    <template v-else>
      <Loader />
      <!-- <RouterView /> --> <!-- Commented out for Coming Soon mode -->
      <!-- Show modal whenever store says it's open -->
      <LoginModal v-if="auth.loginModalOpen" />
    </template>
  </n-message-provider>
</template>
