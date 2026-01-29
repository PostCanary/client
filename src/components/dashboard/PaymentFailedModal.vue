<!-- src/components/dashboard/PaymentFailedModal.vue -->
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    loading?: boolean;
    title?: string;
    message?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
  }>(),
  {
    loading: false,
    title: "Payment issue",
    message:
      "We couldn’t charge your card. Update your payment method to resume matching runs.",
    primaryLabel: "Fix payment",
    secondaryLabel: "Not now",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "primary"): void;
  (e: "secondary"): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

function handlePrimary() {
  if (props.loading) return;
  emit("primary");
}

function handleSecondary() {
  emit("secondary");
  emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-2147483647 grid place-items-center"
      aria-modal="true"
      role="dialog"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/40" @click="handleSecondary" />

      <!-- Modal panel -->
      <div
        class="relative z-10 w-[min(480px,92vw)] rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        <!-- Icon / header -->
        <div class="mb-3 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
          >
            <!-- simple warning icon -->
            <span class="text-xl">!</span>
          </div>
          <h3
            class="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
          >
            {{ title }}
          </h3>
        </div>

        <!-- Body -->
        <p class="mb-5 text-sm text-neutral-600 dark:text-neutral-300">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            @click="handleSecondary"
          >
            {{ secondaryLabel }}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="handlePrimary"
          >
            <span v-if="!loading">{{ primaryLabel }}</span>
            <span v-else class="flex items-center gap-2">
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <span>Opening portal…</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
