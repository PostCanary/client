<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { useMessage } from "naive-ui";
import {
  HTTP_EVENT_DESIGN_MODERATION,
  type HttpGateEventDetail,
} from "@/api/http";
import { extractDesignModerationConflict } from "@/utils/designModeration";

const message = useMessage();

function onDesignModerationError(event: Event) {
  const detail = (event as CustomEvent<HttpGateEventDetail>).detail;
  const conflict = extractDesignModerationConflict(detail);
  if (!conflict) return;
  if (conflict.code === "design_rejected") {
    message.error(conflict.message);
    return;
  }
  message.warning(conflict.message);
}

onMounted(() => {
  window.addEventListener(HTTP_EVENT_DESIGN_MODERATION, onDesignModerationError);
});

onBeforeUnmount(() => {
  window.removeEventListener(
    HTTP_EVENT_DESIGN_MODERATION,
    onDesignModerationError,
  );
});
</script>

<template></template>
