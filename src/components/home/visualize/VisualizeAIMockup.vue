<!-- src/components/home/visualize/VisualizeAIMockup.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

const props = defineProps<{ active: boolean }>();

const hasAnimated = ref(false);
const visibleSections = ref<boolean[]>([false, false, false, false]);
let timeouts: ReturnType<typeof setTimeout>[] = [];

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function runAnimation() {
  if (hasAnimated.value) return;
  hasAnimated.value = true;
  visibleSections.value.forEach((_, i) => {
    timeouts.push(
      setTimeout(() => {
        visibleSections.value[i] = true;
      }, 200 + i * 250),
    );
  });
}

watch(
  () => props.active,
  (val) => {
    if (val) runAnimation();
  },
  { immediate: true },
);

onUnmounted(() => clearTimers());

const insights = [
  {
    title: "Executive Summary",
    icon: "📊",
    text: "Your latest campaign outperformed the previous quarter by 18%. Match revenue increased to $148K driven by stronger performance in the 85021 and 85281 zip codes. CPA dropped to $14.70, your lowest in 6 months.",
  },
  {
    title: "Top Performing Areas",
    icon: "📍",
    text: "Phoenix metro (85021) generated 3.2x more conversions than average. Consider increasing mail volume in this area by 20-30% next quarter.",
  },
  {
    title: "Campaign Timing",
    icon: "📅",
    text: "Mailers sent on Tuesday–Thursday showed 24% higher match rates than weekend drops. Median days-to-convert shortened from 23 to 19 days.",
  },
];

const recommendations = [
  { action: "Increase volume in 85021 and 85281", impact: "High", status: "new" },
  { action: "Reduce spend in 85345 (below-average ROI)", impact: "Medium", status: "new" },
  { action: "Test a follow-up mailer at day 14", impact: "Medium", status: "new" },
];
</script>

<template>
  <div class="space-y-4">
    <!-- AI Summary Banner -->
    <div
      class="rounded-xl border border-[var(--mkt-teal)]/20 bg-[var(--mkt-teal)]/5 px-4 sm:px-5 py-3 flex items-center gap-3 transition-all duration-500"
      :class="visibleSections[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
    >
      <span class="text-lg">✨</span>
      <div>
        <p class="text-[13px] sm:text-[14px] font-semibold text-[var(--mkt-text)]">
          AI Insights Generated
        </p>
        <p class="text-[11px] sm:text-[12px] text-[var(--mkt-text-muted)]">
          Based on 24,180 mailers across 3 campaigns
        </p>
      </div>
    </div>

    <!-- Insight Cards -->
    <div class="grid gap-3 sm:gap-4 md:grid-cols-3">
      <div
        v-for="(insight, i) in insights"
        :key="insight.title"
        class="rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-bg)] p-4 transition-all duration-500"
        :class="visibleSections[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
        :style="{ transitionDelay: visibleSections[1] ? `${i * 100}ms` : '0ms' }"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-base">{{ insight.icon }}</span>
          <h4 class="text-[13px] sm:text-[14px] font-semibold text-[var(--mkt-text)]">
            {{ insight.title }}
          </h4>
        </div>
        <p class="text-[12px] sm:text-[13px] leading-relaxed text-[var(--mkt-text-muted)]">
          {{ insight.text }}
        </p>
      </div>
    </div>

    <!-- Recommendations Table -->
    <div
      class="rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-bg)] p-4 transition-all duration-500"
      :class="visibleSections[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
    >
      <h4 class="text-[13px] sm:text-[14px] font-semibold text-[var(--mkt-text)] mb-3">
        Recommendations
      </h4>
      <div class="space-y-2">
        <div
          v-for="rec in recommendations"
          :key="rec.action"
          class="flex items-center justify-between rounded-lg bg-[var(--mkt-card)] border border-[var(--mkt-border)] px-3 py-2.5"
        >
          <span class="text-[12px] sm:text-[13px] text-[var(--mkt-text)]">
            {{ rec.action }}
          </span>
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="
                rec.impact === 'High'
                  ? 'bg-[var(--mkt-teal)]/10 text-[var(--mkt-teal)]'
                  : 'bg-[var(--mkt-yellow)]/15 text-amber-600'
              "
            >
              {{ rec.impact }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
