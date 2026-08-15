<!-- src/pages/WhyPostCanary.vue -->
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import CTAButton from "@/components/marketing/CTAButton.vue";
import Reveal from "@/components/marketing/Reveal.vue";
import CountUp from "@/components/marketing/CountUp.vue";

const auth = useAuthStore();

function onCta() {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "signup");
    return;
  }
  window.location.href = "/app/home";
}

const gaps = [
  {
    title: "They call instead of scanning",
    body: "When the AC breaks or the pipe bursts, people pick up the phone — they don't hunt for a QR code. That response never reaches your tracker.",
  },
  {
    title: "They search your name later",
    body: "A postcard plants the seed; a Google search days later closes it. QR-only tools credit that conversion to 'organic', not your mail.",
  },
  {
    title: "They walk in",
    body: "Local businesses feel mail in foot traffic and booked jobs — outcomes no scan can capture. PostCanary matches the address, not the click.",
  },
] as const;

const calculators = [
  {
    to: "/attribution-gap-calculator",
    title: "Attribution Gap Calculator",
    blurb: "See how much revenue your direct mail is missing right now.",
  },
  {
    to: "/direct-mail-roi-calculator",
    title: "ROI Calculator",
    blurb: "Calculate your real direct-mail ROI, not just what QR codes track.",
  },
  {
    to: "/savings-calculator",
    title: "Savings Calculator",
    blurb: "See how much time you waste matching addresses in Excel.",
  },
] as const;
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="bg-[var(--pc-navy)] text-white" aria-labelledby="why-heading">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-20 sm:py-28"
      >
        <Reveal>
          <p
            class="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-canary)] mb-4"
          >
            <router-link to="/" class="hover:underline">PostCanary</router-link>
            <span class="text-white/50"> / Why PostCanary</span>
          </p>
          <h1
            id="why-heading"
            class="font-bold tracking-[-0.03em] text-[34px] leading-[40px] sm:text-[52px] sm:leading-[58px] max-w-3xl"
          >
            QR codes miss most of your response.
          </h1>
          <p
            class="mt-5 text-[17px] sm:text-[19px] leading-relaxed text-white/75 max-w-2xl"
          >
            Direct mail works — but only
            <span class="text-[var(--pc-canary)] font-semibold">
              <CountUp :to="9" suffix="%" />
            </span>
            of recipients ever scan a code. PostCanary matches every conversion
            back to the exact address it came from, capturing the other
            <span class="text-[var(--pc-canary)] font-semibold">70–90%</span>.
          </p>
          <div class="mt-9">
            <CTAButton size="lg" @click="onCta">Start Tracking</CTAButton>
          </div>
        </Reveal>
      </div>
    </section>

    <!-- The attribution gap -->
    <section class="bg-[var(--mkt-bg)]" aria-labelledby="gap-heading">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
      >
        <Reveal>
          <h2
            id="gap-heading"
            class="font-bold tracking-[-0.02em] text-[26px] sm:text-[32px] text-[var(--mkt-text)] text-center"
          >
            Where the response really goes
          </h2>
        </Reveal>
        <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <Reveal v-for="(gap, i) in gaps" :key="gap.title" :delay="i * 120">
            <div
              class="h-full rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-6 sm:p-7 shadow-[var(--mkt-card-shadow)]"
            >
              <h3 class="text-[18px] font-semibold text-[var(--mkt-text)]">
                {{ gap.title }}
              </h3>
              <p class="mt-2.5 text-[15px] leading-relaxed text-[var(--mkt-text-muted)]">
                {{ gap.body }}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>

    <!-- How PostCanary closes it -->
    <section class="bg-[var(--mkt-bg-alt)]" aria-labelledby="how-heading">
      <div
        class="mx-auto w-full max-w-[900px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
      >
        <Reveal>
          <h2
            id="how-heading"
            class="font-bold tracking-[-0.02em] text-[26px] sm:text-[32px] text-[var(--mkt-text)] text-center"
          >
            How PostCanary closes the gap
          </h2>
          <p
            class="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-[var(--mkt-text-muted)] text-center"
          >
            Instead of relying on a scan, PostCanary matches the addresses you
            mailed against the customers who actually converted — by address,
            name, and email. Upload your mail list and your sales, and every
            match is surfaced with campaign, date, and geography attached.
          </p>
        </Reveal>
      </div>
    </section>

    <!-- Calculators -->
    <section class="bg-[var(--mkt-bg)]" aria-labelledby="calc-heading">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-16 sm:py-24"
      >
        <Reveal>
          <h2
            id="calc-heading"
            class="font-bold tracking-[-0.02em] text-[26px] sm:text-[32px] text-[var(--mkt-text)] text-center"
          >
            Run your own numbers
          </h2>
        </Reveal>
        <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <Reveal v-for="(calc, i) in calculators" :key="calc.to" :delay="i * 120">
            <router-link
              :to="calc.to"
              class="block h-full rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-6 sm:p-7 shadow-[var(--mkt-card-shadow)] hover:border-[var(--pc-teal-brand)] hover:shadow-[var(--mkt-card-shadow-lg)] transition-all"
            >
              <h3 class="text-[18px] font-semibold text-[var(--mkt-text)]">
                {{ calc.title }}
              </h3>
              <p class="mt-2.5 text-[15px] leading-relaxed text-[var(--mkt-text-muted)]">
                {{ calc.blurb }}
              </p>
              <span class="mt-4 inline-block text-[14px] font-semibold text-[var(--pc-teal-brand)]">
                Try it free →
              </span>
            </router-link>
          </Reveal>
        </div>
      </div>
    </section>

    <!-- Closing CTA -->
    <section class="bg-[var(--pc-navy)] text-white" aria-labelledby="why-cta-heading">
      <div
        class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16 py-20 sm:py-24 text-center"
      >
        <Reveal>
          <h2
            id="why-cta-heading"
            class="font-bold tracking-[-0.03em] text-[28px] leading-9 sm:text-[40px] sm:leading-[48px] max-w-2xl mx-auto"
          >
            Stop guessing. Start attributing.
          </h2>
          <div class="mt-9">
            <CTAButton size="lg" @click="onCta">Get Started</CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  </div>
</template>
