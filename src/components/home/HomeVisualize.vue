<!-- src/components/home/HomeVisualize.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";
import VisualizeDashboardMockup from "./visualize/VisualizeDashboardMockup.vue";
import VisualizeTrendMockup from "./visualize/VisualizeTrendMockup.vue";
import VisualizeGeoMockup from "./visualize/VisualizeGeoMockup.vue";
import VisualizeAIMockup from "./visualize/VisualizeAIMockup.vue";
import VisualizeDemoMockup from "./visualize/VisualizeDemoMockup.vue";

const tabs = [
  {
    id: 0,
    label: "Performance Dashboard",
    description:
      "See total mail sent, conversions matched, revenue generated, and cost per acquisition. Every metric updates automatically when you upload new data.",
  },
  {
    id: 1,
    label: "Trend Analytics",
    description:
      "Track conversion rates and revenue over time across campaigns. Spot what's improving, what's declining, and when your mail is hitting hardest.",
  },
  {
    id: 2,
    label: "Geographic Insights",
    description:
      "See which zip codes and neighborhoods convert best. Double down on high-performing areas and stop mailing the ones that aren't working.",
  },
  {
    id: 3,
    label: "AI Insights",
    description:
      "Get automated analysis of what's working and why. PostCanary surfaces patterns across your campaigns so you're not digging through data to find the answer.",
  },
  {
    id: 4,
    label: "Demographics",
    description:
      "See who's converting, not just where. Break down matched conversions by age, income, household size, and other demographic signals to sharpen your targeting on the next send.",
  },
];

const activeTab = ref(0);
const isVisible = ref(false);

function setTab(index: number) {
  activeTab.value = index;
}

let autoPlayTimer: ReturnType<typeof setInterval> | null = null;

function startAutoPlay() {
  if (autoPlayTimer) return;
  autoPlayTimer = setInterval(() => {
    const next = (activeTab.value + 1) % tabs.length;
    setTab(next);
  }, 8000);
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

onMounted(() => {
  startAutoPlay();
  isVisible.value = true;
});
onUnmounted(() => stopAutoPlay());
</script>

<template>
  <SectionWrapper
    bg="light"
    id="features"
    @mouseenter="stopAutoPlay"
    @mouseleave="startAutoPlay"
    @focusin="stopAutoPlay"
    @focusout="startAutoPlay"
  >
    <SectionHeading
      badge="Direct Mail Analytics"
      heading="One dashboard. Every conversion accounted for."
      subheading="Upload your mailing list and CRM data. PostCanary matches them automatically and gives you campaign performance, geographic breakdowns, and trend data in one place. No spreadsheets. No manual reporting."
    />

    <!-- Tab bar -->
    <AnimatedEntry :delay="100">
      <div
        class="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto"
        role="tablist"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          class="relative whitespace-nowrap px-3 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[15px] font-medium rounded-lg transition-all duration-300 cursor-pointer"
          :class="
            activeTab === tab.id
              ? 'text-[var(--mkt-teal)] bg-[var(--mkt-teal)]/8'
              : 'text-[var(--mkt-text-soft)] hover:text-[var(--mkt-text-muted)] hover:bg-[var(--mkt-bg-alt)]'
          "
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
          <span
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-3 right-3 sm:left-5 sm:right-5 h-[2px] bg-[var(--mkt-teal)] rounded-full"
          />
        </button>
      </div>
    </AnimatedEntry>

    <!-- Tab description -->
    <div class="grid [&>*]:col-start-1 [&>*]:row-start-1 mb-6 sm:mb-8">
      <p
        v-for="tab in tabs"
        :key="tab.id"
        class="text-center text-[14px] sm:text-[16px] text-[var(--mkt-text-muted)] max-w-[640px] mx-auto transition-opacity duration-300"
        :class="
          activeTab === tab.id
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        "
      >
        {{ tab.description }}
      </p>
    </div>

    <!-- Showcase panel -->
    <AnimatedEntry :delay="200">
      <div
        class="rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-4 sm:p-6 lg:p-8 shadow-[var(--mkt-card-shadow-lg)]"
        role="tabpanel"
      >
        <div class="grid [&>*]:col-start-1 [&>*]:row-start-1">
          <VisualizeDashboardMockup
            class="transition-opacity duration-300"
            :class="activeTab === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            :active="isVisible && activeTab === 0"
          />
          <VisualizeTrendMockup
            class="transition-opacity duration-300"
            :class="activeTab === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            :active="isVisible && activeTab === 1"
          />
          <VisualizeGeoMockup
            class="transition-opacity duration-300"
            :class="activeTab === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            :active="isVisible && activeTab === 2"
          />
          <VisualizeAIMockup
            class="transition-opacity duration-300"
            :class="activeTab === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            :active="isVisible && activeTab === 3"
          />
          <VisualizeDemoMockup
            class="transition-opacity duration-300"
            :class="activeTab === 4 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            :active="isVisible && activeTab === 4"
          />
        </div>
      </div>
    </AnimatedEntry>
  </SectionWrapper>
</template>
