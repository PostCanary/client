<!-- src/components/home/HomeVisualize.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useInView } from "@/composables/useInView";
import VisualizeDashboardMockup from "./visualize/VisualizeDashboardMockup.vue";
import VisualizeTrendMockup from "./visualize/VisualizeTrendMockup.vue";
import VisualizeGeoMockup from "./visualize/VisualizeGeoMockup.vue";

/* ── Tab config ─────────────────────────────────────────── */
const tabs = [
  {
    id: 0,
    label: "Performance Dashboard",
    description:
      "Instantly see total mail sent, conversions matched, revenue generated, and cost-per-acquisition. Every metric updates automatically when you upload new data.",
  },
  {
    id: 1,
    label: "Trend Analytics",
    description:
      "Track mail volume, CRM conversions, and match rates month over month. Spot seasonal patterns and measure the impact of campaign changes over time.",
  },
  {
    id: 2,
    label: "Geographic Insights",
    description:
      "Discover which cities and ZIP codes convert highest, identify underperforming areas to cut, and find untapped markets for your next campaign.",
  },
] as const;

const activeTab = ref(0);
const activeDescription = ref<string>(tabs[0]!.description);

function setTab(index: number) {
  activeTab.value = index;
  activeDescription.value = tabs[index]!.description;
}

/* ── Scroll entrance ────────────────────────────────────── */
const sectionRef = ref<HTMLElement | null>(null);
const { isInView } = useInView(sectionRef);

/* ── Auto-cycle ─────────────────────────────────────────── */
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

onMounted(() => startAutoPlay());
onUnmounted(() => stopAutoPlay());
</script>

<template>
  <section
    ref="sectionRef"
    class="bg-[var(--pc-navy-2)] py-16 sm:py-24"
    @mouseenter="stopAutoPlay"
    @mouseleave="startAutoPlay"
    @focusin="stopAutoPlay"
    @focusout="startAutoPlay"
  >
    <div
      class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16"
    >
      <!-- Heading -->
      <div
        class="text-center max-w-[900px] mx-auto mb-10 sm:mb-14 transition-all duration-700"
        :class="isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <h2
          class="text-[var(--pc-text)] text-[32px] leading-10 sm:text-[44px] sm:leading-[54px] xl:text-[64px] xl:leading-[76px] font-normal tracking-[-0.04em]"
        >
          See the Full Picture of<br />
          Your Direct Mail ROI
        </h2>
        <p
          class="mt-4 sm:mt-6 text-[15px] sm:text-[18px] leading-relaxed text-[var(--pc-text-muted)] max-w-[720px] mx-auto"
        >
          From campaign KPIs to geographic hotspots, PostCanary turns your mail
          and CRM data into actionable dashboards &mdash; no manual
          spreadsheets, no guesswork.
        </p>
      </div>

      <!-- Tab Bar -->
      <div
        class="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto transition-all duration-700 delay-100"
        :class="isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        role="tablist"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          class="relative whitespace-nowrap px-3 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[15px] font-medium rounded-lg transition-all duration-300"
          :class="
            activeTab === tab.id
              ? 'text-[var(--pc-cyan)] bg-[var(--pc-cyan)]/10'
              : 'text-[var(--pc-text-soft)] hover:text-[var(--pc-text-muted)] hover:bg-[var(--pc-navy)]/50'
          "
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
          <!-- Active indicator line -->
          <span
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-3 right-3 sm:left-5 sm:right-5 h-[2px] bg-[var(--pc-cyan)] rounded-full"
          />
        </button>
      </div>

      <!-- Tab Description -->
      <Transition name="fade" mode="out-in">
        <p
          :key="activeTab"
          class="text-center text-[14px] sm:text-[16px] text-[var(--pc-text-muted)] max-w-[640px] mx-auto mb-6 sm:mb-8"
        >
          {{ activeDescription }}
        </p>
      </Transition>

      <!-- Showcase Panel -->
      <div
        class="rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-navy)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition-all duration-700 delay-200"
        :class="isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        role="tabpanel"
      >
        <Transition name="fade" mode="out-in">
          <VisualizeDashboardMockup
            v-if="activeTab === 0"
            :key="0"
            :active="isInView && activeTab === 0"
          />
          <VisualizeTrendMockup
            v-else-if="activeTab === 1"
            :key="1"
            :active="isInView && activeTab === 1"
          />
          <VisualizeGeoMockup
            v-else
            :key="2"
            :active="isInView && activeTab === 2"
          />
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
