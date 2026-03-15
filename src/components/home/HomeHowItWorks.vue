<!-- src/components/home/HomeHowItWorks.vue -->
<script setup lang="ts">
import { Upload, GitMerge, BarChart3 } from "lucide-vue-next";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload your mailing list",
    description:
      "CSV, Excel, or direct integration. We match on address, name, and email.",
  },
  {
    number: 2,
    icon: GitMerge,
    title: "Connect your conversion data",
    description:
      "CRM export, order data, or form submissions. PostCanary accepts whatever you've got.",
  },
  {
    number: 3,
    icon: BarChart3,
    title: "See matched conversions in real time",
    description:
      "Every match is surfaced on your dashboard with campaign, date, and geography data attached.",
  },
];
</script>

<template>
  <SectionWrapper bg="alt">
    <SectionHeading
      heading="Simple setup. Continuous attribution."
      subheading="PostCanary works alongside your existing mail vendor. No switching required."
    />

    <div class="relative">
      <!-- Connector line (desktop only) -->
      <div
        class="hidden xl:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-[var(--mkt-teal)]/20"
      />

      <div class="grid gap-10 md:grid-cols-3 md:gap-8">
        <AnimatedEntry
          v-for="step in steps"
          :key="step.number"
          :delay="(step.number - 1) * 150"
        >
          <div class="flex flex-col items-center text-center relative">
            <!-- Number badge -->
            <div
              class="absolute -top-2.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[var(--mkt-teal)] text-white text-[13px] font-bold flex items-center justify-center z-10"
            >
              {{ step.number }}
            </div>

            <!-- Icon circle -->
            <div
              class="w-[120px] h-[120px] rounded-full bg-[var(--mkt-card)] border-2 border-[var(--mkt-teal)]/30 flex items-center justify-center shadow-[var(--mkt-card-shadow)]"
            >
              <component
                :is="step.icon"
                class="w-12 h-12 text-[var(--mkt-teal)]"
              />
            </div>

            <h3
              class="mt-6 text-[20px] sm:text-[22px] leading-snug font-semibold text-[var(--mkt-text)]"
            >
              {{ step.title }}
            </h3>

            <p
              class="mt-2.5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--mkt-text-muted)] max-w-[300px]"
            >
              {{ step.description }}
            </p>
          </div>
        </AnimatedEntry>
      </div>
    </div>
  </SectionWrapper>
</template>
