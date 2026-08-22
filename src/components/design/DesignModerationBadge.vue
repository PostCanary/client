<script setup lang="ts">
import { computed } from "vue";
import {
  isDesignModerationStatus,
  type DesignModerationStatus,
} from "@/utils/designModeration";

const props = defineProps<{
  status?: DesignModerationStatus | string | null;
  reason?: string | null;
}>();

const label = computed(() => {
  if (!isDesignModerationStatus(props.status)) return null;
  if (props.status === "approved") return null;
  if (props.status === "pending") return "In review";
  const reason = props.reason?.trim();
  return reason ? `Rejected: ${reason}` : "Rejected";
});

const tone = computed(() =>
  props.status === "rejected" ? "rejected" : "pending",
);
</script>

<template>
  <span
    v-if="label"
    class="design-moderation-badge"
    :class="`design-moderation-badge--${tone}`"
    data-testid="design-moderation-badge"
  >
    {{ label }}
  </span>
</template>

<style scoped>
.design-moderation-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.design-moderation-badge--pending {
  color: #92400e;
  background: #fef3c7;
}

.design-moderation-badge--rejected {
  color: #991b1b;
  background: #fee2e2;
}
</style>
