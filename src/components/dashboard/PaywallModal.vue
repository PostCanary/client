<!-- src/components/dashboard/PaywallModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center"
        style="z-index: 2147483647;"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40"
          @click="onSecondary"
          aria-hidden="true"
        ></div>

        <!-- Modal card -->
        <div
          class="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-[min(720px,92vw)] p-6 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
        >
          <header class="flex items-start justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h2
                id="paywall-title"
                class="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-50"
              >
                {{ cfg.title }}
              </h2>
              <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {{ cfg.body }}
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="onSecondary"
              aria-label="Close paywall"
            >
              <span class="text-xl leading-none">&times;</span>
            </button>
          </header>

          <!-- Price summary / bullet points -->
          <section class="space-y-3 mb-6">
            <p
              class="text-base font-semibold text-neutral-900 dark:text-neutral-50"
            >
              {{ cfg.priceSummary }}
            </p>

            <ul
              v-if="cfg.bullets.length"
              class="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300"
            >
              <li v-for="(b, idx) in cfg.bullets" :key="idx" class="flex gap-2">
                <span
                  class="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-500"
                />
                <span>{{ b }}</span>
              </li>
            </ul>
          </section>

          <!-- Optional tier selector -->
          <section v-if="showTierPicker" class="mb-6">
            <p
              class="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100"
            >
              Choose a plan
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="p in plans"
                :key="p.code"
                type="button"
                class="rounded-xl border px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                :class="[
                  selectedPlan === p.code
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-neutral-200 dark:border-neutral-700',
                ]"
                @click="selectedPlan = p.code"
                :disabled="loading"
              >
                <div class="flex items-center justify-between gap-3">
                  <div
                    class="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
                  >
                    {{ p.name }}
                  </div>
                  <div
                    class="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
                  >
                    {{ p.price }}
                  </div>
                </div>
                <div
                  class="mt-1 text-xs text-neutral-600 dark:text-neutral-300"
                >
                  {{ p.limit }}
                </div>
              </button>
            </div>

            <p
              v-if="cfg.tierHint"
              class="mt-2 text-xs text-neutral-500 dark:text-neutral-400"
            >
              {{ cfg.tierHint }}
            </p>
          </section>

          <!-- Actions -->
          <footer class="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="onSecondary"
              :disabled="loading"
            >
              {{ cfg.secondaryLabel }}
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              @click="onPrimary"
              :disabled="loading || (showTierPicker && !selectedPlan)"
            >
              <span v-if="!loading">{{ cfg.primaryLabel }}</span>
              <span v-else>Processing…</span>
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type PlanCode = "INSIGHT" | "PERFORMANCE" | "PRECISION" | "ELITE";

interface PaywallConfig {
  title?: string;
  body?: string;
  priceSummary?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  bullets?: string[];

  // tier UX (camelCase only)
  defaultPlanCode?: PlanCode;
  tierPicker?: boolean;
  tierHint?: string;
}

const props = defineProps<{
  modelValue: boolean;
  config?: PaywallConfig;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "primary", payload: { planCode: PlanCode }): void;
  (e: "secondary"): void;
}>();

const loading = computed(() => props.loading ?? false);

const cfg = computed(() => {
  const c = props.config || {};
  return {
    title: c.title ?? "Subscribe to run matching",
    body:
      c.body ??
      "Choose a subscription tier to upload, match, and track performance across your campaigns.",
    priceSummary:
      c.priceSummary ?? "Tiered monthly subscription (no per-run charges).",
    primaryLabel: c.primaryLabel ?? "Start subscription",
    secondaryLabel: c.secondaryLabel ?? "Not now",
    bullets: c.bullets ?? [
      "Run matching + geocoding on demand",
      "Keep history in sync across uploads",
      "Monthly tier limit based on mail volume",
      "Cancel anytime in the billing portal",
    ],
    defaultPlanCode: c.defaultPlanCode,
    tierPicker: !!c.tierPicker,
    tierHint: c.tierHint ?? "",
  };
});

const showTierPicker = computed(() => cfg.value.tierPicker);

const plans = [
  {
    code: "INSIGHT" as const,
    name: "Tier 1",
    price: "$99/mo",
    limit: "Up to 1,000 mailers / month",
  },
  {
    code: "PERFORMANCE" as const,
    name: "Tier 2",
    price: "$249/mo",
    limit: "Up to 5,000 mailers / month",
  },
  {
    code: "PRECISION" as const,
    name: "Tier 3",
    price: "$499/mo",
    limit: "Up to 25,000 mailers / month",
  },
  {
    code: "ELITE" as const,
    name: "Tier 4",
    price: "$999/mo",
    limit: "Unlimited mailers",
  },
];

const selectedPlan = ref<PlanCode | null>(null);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;

    // Always have a plan ready (even if tier picker is hidden)
    selectedPlan.value = cfg.value.defaultPlanCode ?? "INSIGHT";
  },
  { immediate: true }
);

function onPrimary() {
  if (loading.value) return;

  // By design we always have a PlanCode when open (watch sets it).
  // This is just a defensive fallback.
  const planCode = (selectedPlan.value ?? "INSIGHT") as PlanCode;

  emit("primary", { planCode });
}

function onSecondary() {
  if (loading.value) return;
  emit("update:modelValue", false);
  emit("secondary");
}
</script>
