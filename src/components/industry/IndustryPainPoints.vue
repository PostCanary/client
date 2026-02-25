<!-- src/components/industry/IndustryPainPoints.vue -->
<script setup lang="ts">
import type { IndustryPainPointsContent } from "@/types/industry";

defineProps<{
  content: IndustryPainPointsContent;
}>();
</script>

<template>
  <section class="bg-[var(--pc-navy)] py-24">
    <div
      class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-6 md:px-10 xl:px-16"
    >
      <h2
        class="text-center font-normal text-[var(--pc-text)] text-[36px] leading-44px md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-80px tracking-[-0.04em]"
      >
        {{ content.heading }}
      </h2>

      <p
        class="mx-auto mt-6 max-w-[640px] text-center text-[16px] leading-[26px] md:text-[20px] md:leading-28px text-[var(--pc-text-muted)]"
      >
        {{ content.subheading }}
      </p>

      <div class="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in content.cards"
          :key="card.title"
          class="flex flex-col items-center rounded-[14px] border border-[var(--pc-border)] bg-[var(--pc-card)] px-8 pt-12 pb-10 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
        >
          <div
            class="mb-8 flex h-[139px] w-[139px] items-center justify-center rounded-full bg-[var(--pc-cyan)]"
          >
            <img
              :src="card.icon"
              :alt="card.iconAlt"
              class="h-[72px] w-[72px] object-contain"
            />
          </div>

          <h3
            class="text-center text-[22px] leading-[30px] md:text-[24px] md:leading-32px lg:text-[30px] lg:leading-36px font-semibold text-[var(--pc-text)]"
          >
            {{ card.title }}
          </h3>

          <p class="mt-4 text-center text-[16px] leading-[26px] text-[var(--pc-text-muted)]">
            {{ card.body }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
