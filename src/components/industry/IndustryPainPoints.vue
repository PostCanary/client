<!-- src/components/industry/IndustryPainPoints.vue -->
<script setup lang="ts">
import type { IndustryPainPointsContent } from "@/types/industry";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";

defineProps<{
  content: IndustryPainPointsContent;
}>();
</script>

<template>
  <SectionWrapper bg="alt">
    <SectionHeading
      :heading="content.heading"
      :subheading="content.subheading"
    />

    <div class="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-4">
      <AnimatedEntry
        v-for="(card, i) in content.cards"
        :key="card.title"
        :delay="i * 100"
      >
        <article
          class="flex h-full flex-col items-center text-center rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] px-6 sm:px-8 pt-10 pb-8 shadow-[var(--mkt-card-shadow)] hover:shadow-[var(--mkt-card-shadow-lg)] transition-shadow duration-300"
        >
          <div
            class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--mkt-teal)]/10"
          >
            <img
              :src="card.icon"
              :alt="card.iconAlt"
              class="h-10 w-10 object-contain"
            />
          </div>

          <h3
            class="text-[18px] sm:text-[20px] leading-snug font-semibold text-[var(--mkt-text)]"
          >
            {{ card.title }}
          </h3>

          <p
            class="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-[var(--mkt-text-muted)]"
          >
            {{ card.body }}
          </p>
        </article>
      </AnimatedEntry>
    </div>
  </SectionWrapper>
</template>
