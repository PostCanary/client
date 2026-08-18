<!-- Legacy paywall shell. New servers do not emit subscription gates. -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center"
        style="z-index: 2147483647"
      >
        <div class="absolute inset-0 bg-black/40" aria-hidden="true" @click="close" />
        <div
          class="relative w-[min(560px,92vw)] rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <h2 id="paywall-title" class="text-xl font-semibold text-neutral-900">
            {{ copy.title }}
          </h2>
          <p class="mt-2 text-sm text-neutral-600">{{ copy.body }}</p>
          <p class="mt-4 font-semibold text-neutral-900">{{ copy.priceSummary }}</p>
          <ul class="mt-3 space-y-1.5 text-sm text-neutral-600">
            <li v-for="item in copy.bullets" :key="item">• {{ item }}</li>
          </ul>
          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              :disabled="loading"
              @click="continueWithoutSubscription"
            >
              {{ loading ? "Processing…" : copy.primaryLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface PaywallConfig {
  title?: string;
  body?: string;
  priceSummary?: string;
  primaryLabel?: string;
  bullets?: string[];
}

const props = defineProps<{
  modelValue: boolean;
  config?: PaywallConfig;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "primary"): void;
  (event: "secondary"): void;
}>();

const copy = {
  title: "No subscription required",
  body: "PostCanary has a $0 subscription fee. Continue without choosing a plan.",
  priceSummary: "Pay only when you send physical mail.",
  primaryLabel: "Continue",
  bullets: ["No paid plans", "No free tier", "No monthly analysis-row entitlement"],
};

function close(): void {
  emit("update:modelValue", false);
  emit("secondary");
}

function continueWithoutSubscription(): void {
  emit("update:modelValue", false);
  emit("primary");
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
