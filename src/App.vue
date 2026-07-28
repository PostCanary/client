<!-- client/src/App.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import { NMessageProvider } from "naive-ui"; // <- add this (unless auto-imported)
import Loader from "@/components/Loader.vue";
import { useAuthStore } from "@/stores/auth";
import LoginModal from "@/components/LoginModal.vue";
import DemoModal from "@/components/DemoModal.vue";
import ChatWidget from "@/components/chat/ChatWidget.vue";
import { useDemoStore } from "@/stores/demo";
import { topLevelRouteViewKey } from "@/utils/routeViewKey";
import "@/styles/index.css";

const auth = useAuthStore();
const demo = useDemoStore();
const route = useRoute();

// Hide chatbot inside the campaign wizard — it overlaps the Next button
const showChat = computed(() => !route.path.startsWith("/app/send"));

// POS-190: the list-review route and the standard send wizard intentionally
// use the same WizardLayout component under different top-level route records.
// Vue can otherwise reuse that layout while retaining the old RouterView
// depth, leaving the new child route as an empty comment until a hard reload.
// Remount only when the top-level route record changes; query updates within a
// page should not tear down the application shell.
const routeViewKey = computed(() => topLevelRouteViewKey(route));
</script>

<template>
  <n-message-provider>
    <Loader />
    <RouterView :key="routeViewKey" />
    <!-- Show modal whenever store says it's open -->
    <LoginModal v-if="auth.loginModalOpen" />
    <DemoModal v-if="demo.modalOpen" />
    <ChatWidget v-if="showChat" />
  </n-message-provider>
</template>
