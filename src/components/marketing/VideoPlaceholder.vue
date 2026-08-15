<!-- src/components/marketing/VideoPlaceholder.vue -->
<script setup lang="ts">
import { Mailbox } from "lucide-vue-next";

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  { label: "Video placeholder" },
);
</script>

<template>
  <div
    class="video-ph"
    role="img"
    :aria-label="label"
  >
    <slot>
      <div class="video-ph__poster" aria-hidden="true">
        <Mailbox class="video-ph__mark" stroke-width="1.25" />
      </div>
    </slot>
  </div>
</template>

<style scoped>
.video-ph {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  border-radius: var(--mkt-card-radius);
  background-color: var(--pc-navy);
  box-shadow: var(--mkt-card-shadow-lg);
}

.video-ph__poster {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      120% 90% at 12% 0%,
      color-mix(in srgb, var(--pc-teal-brand) 38%, transparent) 0%,
      transparent 58%
    ),
    radial-gradient(
      80% 70% at 92% 100%,
      color-mix(in srgb, var(--pc-canary) 22%, transparent) 0%,
      transparent 55%
    ),
    linear-gradient(
      145deg,
      var(--pc-navy) 0%,
      color-mix(in srgb, var(--pc-navy) 72%, var(--pc-teal-brand)) 100%
    );
}

.video-ph__mark {
  width: min(28%, 7.5rem);
  height: auto;
  color: color-mix(in srgb, var(--pc-canary) 55%, white);
  opacity: 0.18;
}
</style>
