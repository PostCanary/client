<!-- src/components/marketing/sections/StatsSection.vue -->
<script setup lang="ts">
import CountUp from "@/components/marketing/CountUp.vue";
import Reveal from "@/components/marketing/Reveal.vue";

// ⚠️ PLACEHOLDER FIGURES: drawn from existing PostCanary industry copy
// (QR-code response gap, scan rate, direct-mail open rate). Replace with
// verified product stats before launch.
const stats = [
  {
    value: 90,
    prefix: "",
    suffix: "%",
    label: "of conversions QR-code tracking misses",
    note: "Most people never scan — they call or search.",
  },
  {
    value: 9,
    prefix: "",
    suffix: "%",
    label: "average QR-code scan rate on mail",
    note: "The rest of your response goes unattributed.",
  },
  {
    value: 37,
    prefix: "",
    suffix: "%",
    label: "direct-mail open rate for local services",
    note: "Mail gets seen. PostCanary proves it paid.",
  },
] as const;
</script>

<template>
  <section
    class="bg-[var(--pc-navy)] text-white"
    aria-labelledby="stats-heading"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-14 sm:py-20"
    >
      <Reveal>
        <h2 id="stats-heading" class="sr-only">
          Why tracking direct mail matters
        </h2>
        <p
          class="text-center text-[15px] sm:text-[16px] font-semibold uppercase tracking-[0.14em] text-white/70 mb-10 sm:mb-14"
        >
          The attribution gap, in numbers
        </p>
      </Reveal>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
        <Reveal
          v-for="(stat, i) in stats"
          :key="stat.label"
          :delay="i * 150"
        >
          <div class="text-center">
            <div
              class="font-bold leading-none text-[52px] sm:text-[64px] text-[var(--pc-canary)] tracking-[-0.02em]"
            >
              <CountUp
                :to="stat.value"
                :prefix="stat.prefix"
                :suffix="stat.suffix"
              />
            </div>
            <p
              class="mt-4 text-[16px] sm:text-[17px] font-semibold text-white leading-snug max-w-xs mx-auto"
            >
              {{ stat.label }}
            </p>
            <p class="mt-2 text-[14px] text-white/60 leading-relaxed">
              {{ stat.note }}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
</template>
