<!-- client/src/App.vue -->
<script setup lang="ts">
// import { RouterView } from "vue-router"; // Commented out for Coming Soon mode
import { NMessageProvider } from "naive-ui"; // <- add this (unless auto-imported)
// import Loader from "@/components/Loader.vue"; // Commented out for Coming Soon mode
// import { useAuthStore } from "@/stores/auth"; // Commented out for Coming Soon mode
// import LoginModal from "@/components/LoginModal.vue"; // Commented out for Coming Soon mode
import ComingSoon from "@/components/ComingSoon.vue";
import "@/styles/index.css";

// const auth = useAuthStore(); // Commented out for Coming Soon mode

// Coming Soon is the default. Set VITE_COMING_SOON=false to show full app
const isComingSoon = import.meta.env.VITE_COMING_SOON !== "false";
</script>

<template>
  <n-message-provider>
    <!-- Show Coming Soon page if enabled, otherwise show full app -->
    <ComingSoon v-if="isComingSoon" />
    <!-- Commented out for Coming Soon mode - uncomment when VITE_COMING_SOON=false -->
    <!-- <template v-else>
      <Loader />
      <RouterView />
      <LoginModal v-if="auth.loginModalOpen" />
    </template> -->
  </n-message-provider>
</template>
