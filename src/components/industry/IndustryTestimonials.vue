<!-- src/components/industry/IndustryTestimonials.vue -->
<script setup lang="ts">
import type { IndustryTestimonialsContent } from "@/types/industry";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";
import AnimatedEntry from "@/components/marketing/AnimatedEntry.vue";

defineProps<{
  content?: IndustryTestimonialsContent;
}>();
</script>

<template>
  <SectionWrapper
    v-if="content && content.testimonials && content.testimonials.length > 0"
    bg="alt"
  >
    <SectionHeading
      :heading="content.heading"
      :subheading="content.subheading"
    />

    <div class="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
      <AnimatedEntry
        v-for="(testimonial, index) in content.testimonials"
        :key="index"
        :delay="index * 100"
      >
        <article
          class="flex h-full flex-col rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-6 sm:p-8 shadow-[var(--mkt-card-shadow)] hover:shadow-[var(--mkt-card-shadow-lg)] transition-shadow duration-300"
        >
          <blockquote class="flex-1 text-[15px] sm:text-[16px] leading-relaxed text-[var(--mkt-text-muted)]">
            "{{ testimonial.quote }}"
          </blockquote>

          <div
            v-if="testimonial.metric"
            class="mt-4 inline-flex self-start rounded-full bg-[var(--mkt-teal)]/10 px-4 py-1.5 text-[14px] font-semibold text-[var(--mkt-teal)]"
          >
            {{ testimonial.metric }}
          </div>

          <div class="mt-6 flex items-center gap-3">
            <div
              v-if="testimonial.avatar"
              class="h-11 w-11 overflow-hidden rounded-full bg-[var(--mkt-bg-alt)]"
            >
              <img
                :src="testimonial.avatar"
                :alt="testimonial.author"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mkt-teal)] text-white font-semibold"
            >
              {{ testimonial.author.charAt(0) }}
            </div>
            <div>
              <p class="font-semibold text-[var(--mkt-text)]">
                {{ testimonial.author }}
              </p>
              <p class="text-[13px] text-[var(--mkt-text-soft)]">
                <span v-if="testimonial.role">{{ testimonial.role }}, </span>
                {{ testimonial.company }}
              </p>
            </div>
          </div>
        </article>
      </AnimatedEntry>
    </div>
  </SectionWrapper>
</template>
