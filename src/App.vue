<!-- client/src/App.vue -->
<script setup lang="ts">
import { RouterView } from "vue-router";
import { NMessageProvider } from "naive-ui"; // <- add this (unless auto-imported)
import Loader from "@/components/Loader.vue";
import { useAuthStore } from "@/stores/auth";
import LoginModal from "@/components/LoginModal.vue";
import "@/styles/index.css";

const auth = useAuthStore();
</script>

<template>
  <n-message-provider>
    <Loader />
    <RouterView />
    <!-- Show modal whenever store says it's open -->
    <LoginModal v-if="auth.loginModalOpen" />
  </n-message-provider>
</template>
