<script setup lang="ts">
// src/pages/PrintJobStatus.vue
//
// S350 — print-job status polling page (U.5 brief).
// Route: /app/print-jobs/:id (registered S351 in router.ts).
//
// Consumes usePrintJob().watch(jobId) — composable owns the polling
// loop, generation-counter cancellation, exp backoff, 120s deadline,
// 9-state server enum → 10-state UI phase mapping.
//
// Page sections (per S349 Q-S348-2 path-c — asset preview deferred to U.6):
//   1. Status header (badge + human-readable phase)
//   2. 5-step horizontal timeline (submitted → accepted → producing → mailed → delivered)
//   3. Order metadata (job id + partner id + partner order id)
//   4. Terminal CTAs (route by phase)
//
// Failed-retry routing per S349 Q-S348-1: optional ?from=campaign:<id>
// query-param threads the campaign id forward; the "Try again" CTA
// routes back to /app/campaigns/<id> so the modal (already shipped
// S339 with localStorage prefill) can replay with adjusted inputs.

import { onMounted, computed, watch as vueWatch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePrintJob, type PrintJobPhase } from "@/composables/usePrintJob";

const route = useRoute();
const router = useRouter();

// S355 LOW-3 fold: keep jobId reactive against route.params.id so
// component-reuse navigation (vue-router reuses this instance when the
// only delta is :id) restarts polling against the new job rather than
// continuing to poll the stale snapshot.
const jobId = computed(() => route.params.id as string);
const { phase, status, partnerOrderId, error, watch: watchJob } = usePrintJob();

// Optional ?from=campaign:<uuid> threads the originating campaign id back
// for the failed-retry CTA + Back link. Absent → fall back to /app/campaigns.
const fromCampaignId = computed<string | null>(() => {
  const raw = route.query.from;
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("campaign:")) return null;
  return raw.slice("campaign:".length) || null;
});

const backHref = computed(() =>
  fromCampaignId.value
    ? `/app/campaigns/${fromCampaignId.value}`
    : "/app/campaigns",
);

onMounted(() => {
  watchJob(jobId.value);
});

vueWatch(
  () => route.params.id,
  (newId, oldId) => {
    if (typeof newId === "string" && newId !== oldId) {
      watchJob(newId);
    }
  },
);

const PHASE_COPY: Record<PrintJobPhase, string> = {
  idle: "Loading…",
  submitting: "Submitting…",
  submitted: "Submitted to print partner",
  accepted: "Accepted — your mail is queued for production",
  producing: "In production",
  mailed: "Mailed",
  delivered: "Delivered",
  returned: "Returned — please check the recipient address",
  failed: "Submission failed",
  cancelled: "Cancelled",
};

// Timeline rendering: 5 forward steps; `returned` / `failed` / `cancelled`
// collapse the timeline → terminal banner.
const TIMELINE_STEPS: PrintJobPhase[] = [
  "submitted",
  "accepted",
  "producing",
  "mailed",
  "delivered",
];

const TIMELINE_LABELS: Record<(typeof TIMELINE_STEPS)[number], string> = {
  submitted: "Submitted",
  accepted: "Accepted",
  producing: "Producing",
  mailed: "Mailed",
  delivered: "Delivered",
};

const TERMINAL_ERROR_PHASES: ReadonlySet<PrintJobPhase> = new Set([
  "failed",
  "returned",
  "cancelled",
]);

const isTerminalError = computed(() => TERMINAL_ERROR_PHASES.has(phase.value));

function stepIndex(p: PrintJobPhase): number {
  return TIMELINE_STEPS.indexOf(p);
}

const currentStepIdx = computed(() => stepIndex(phase.value));

function stepState(idx: number): "complete" | "current" | "upcoming" {
  if (currentStepIdx.value < 0) return "upcoming";
  if (idx < currentStepIdx.value) return "complete";
  if (idx === currentStepIdx.value) return "current";
  return "upcoming";
}

function retry() {
  router.push(backHref.value);
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-8 px-4">
    <!-- Back link -->
    <button
      class="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      @click="router.push(backHref)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      {{ fromCampaignId ? "Back to campaign" : "All Campaigns" }}
    </button>

    <!-- Section 1: Status header -->
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-[#0b2d50] mb-2">Print job status</h1>
      <p class="text-base text-[#0b2d50]">{{ PHASE_COPY[phase] }}</p>
    </header>

    <!-- Section 2: Timeline (hidden on terminal-error) -->
    <ol
      v-if="!isTerminalError"
      class="flex items-center justify-between mb-8 px-2"
      aria-label="Print job timeline"
    >
      <li
        v-for="(step, idx) in TIMELINE_STEPS"
        :key="step"
        class="flex flex-col items-center flex-1 relative"
      >
        <span
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
          :class="{
            'bg-[#47bfa9] text-white': stepState(idx) === 'complete',
            'bg-[#0b2d50] text-white animate-pulse': stepState(idx) === 'current',
            'bg-gray-200 text-gray-500': stepState(idx) === 'upcoming',
          }"
        >
          {{ idx + 1 }}
        </span>
        <span class="text-xs mt-2 text-[#0b2d50]">{{ TIMELINE_LABELS[step] }}</span>
        <span
          v-if="idx < TIMELINE_STEPS.length - 1"
          class="absolute top-3.5 left-[calc(50%+0.875rem)] right-[calc(-50%+0.875rem)] h-0.5"
          :class="stepState(idx) === 'complete' ? 'bg-[#47bfa9]' : 'bg-gray-200'"
        />
      </li>
    </ol>

    <!-- Terminal-error banner (replaces timeline) -->
    <div
      v-else
      class="mb-8 rounded-lg border p-4 text-sm"
      :class="
        phase === 'cancelled'
          ? 'border-gray-200 bg-gray-50 text-gray-700'
          : 'border-red-200 bg-red-50 text-red-800'
      "
      role="alert"
    >
      <p class="font-semibold mb-1">{{ PHASE_COPY[phase] }}</p>
      <p v-if="error?.message">{{ error.message }}</p>
      <p v-else-if="phase === 'returned'">
        The mail was returned. Update the recipient address and resubmit from the campaign page.
      </p>
    </div>

    <!-- Section 3: Order metadata -->
    <section class="bg-white rounded-xl border border-gray-200 p-5 mb-8">
      <h3 class="text-sm font-semibold text-[#0b2d50] mb-3">Order details</h3>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
        <div>
          <dt class="text-gray-500">Job ID</dt>
          <dd class="text-[#0b2d50] font-mono break-all">{{ jobId }}</dd>
        </div>
        <div v-if="status">
          <dt class="text-gray-500">Server status</dt>
          <dd class="text-[#0b2d50]">{{ status }}</dd>
        </div>
        <div v-if="partnerOrderId">
          <dt class="text-gray-500">Partner order ID</dt>
          <dd class="text-[#0b2d50] font-mono break-all">{{ partnerOrderId }}</dd>
        </div>
        <div v-if="error?.code">
          <dt class="text-gray-500">Error code</dt>
          <dd class="text-red-700">{{ error.code }}</dd>
        </div>
      </dl>
    </section>

    <!-- Section 4: Terminal CTAs -->
    <div v-if="isTerminalError" class="flex gap-3">
      <button
        class="px-4 py-2 rounded-lg bg-[#47bfa9] text-white text-sm font-semibold hover:bg-[#3aa68f]"
        @click="retry"
      >
        {{ phase === "returned" ? "Update address and resubmit" : "Try again" }}
      </button>
      <button
        class="px-4 py-2 rounded-lg border border-gray-300 text-[#0b2d50] text-sm font-semibold hover:bg-gray-50"
        @click="router.push(backHref)"
      >
        Cancel
      </button>
    </div>
    <div
      v-else-if="phase === 'accepted' || phase === 'mailed' || phase === 'delivered'"
      class="flex gap-3"
    >
      <button
        class="px-4 py-2 rounded-lg bg-[#47bfa9] text-white text-sm font-semibold hover:bg-[#3aa68f]"
        @click="router.push(backHref)"
      >
        {{ fromCampaignId ? "Back to campaign" : "All Campaigns" }}
      </button>
    </div>
  </div>
</template>
