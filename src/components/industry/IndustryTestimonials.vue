<!-- src/components/industry/IndustryTestimonials.vue -->
<script setup lang="ts">
import type { IndustryTestimonialsContent } from "@/types/industry";

defineProps<{
  content?: IndustryTestimonialsContent;
}>();
</script>

<template>
  <section
    v-if="content && content.testimonials && content.testimonials.length > 0"
    class="bg-[var(--pc-navy-2)] py-24"
  >
    <div
      class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-6 md:px-10 xl:px-16"
    >
      <h2
        class="text-center font-normal text-[var(--pc-text)] text-[36px] leading-44px md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-80px tracking-[-0.04em]"
      >
        {{ content.heading }}
      </h2>

      <p
        v-if="content.subheading"
        class="mx-auto mt-6 max-w-[640px] text-center text-[16px] leading-[26px] md:text-[20px] md:leading-8 text-[var(--pc-text-muted)]"
      >
        {{ content.subheading }}
      </p>

      <div class="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(testimonial, index) in content.testimonials"
          :key="index"
          class="flex flex-col rounded-[14px] border border-[var(--pc-border)] bg-[var(--pc-card)] p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
        >
          <blockquote class="flex-1 text-[16px] leading-[26px] text-[var(--pc-text-muted)]">
            "{{ testimonial.quote }}"
          </blockquote>

          <div
            v-if="testimonial.metric"
            class="mt-4 inline-flex self-start rounded-full bg-[var(--pc-cyan)]/10 px-4 py-1.5 text-[14px] font-semibold text-[var(--pc-cyan)]"
          >
            {{ testimonial.metric }}
          </div>

          <div class="mt-6 flex items-center gap-3">
            <div
              v-if="testimonial.avatar"
              class="h-12 w-12 overflow-hidden rounded-full bg-[var(--pc-navy)]"
            >
              <img
                :src="testimonial.avatar"
                :alt="testimonial.author"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pc-cyan)] text-[var(--pc-navy)] font-semibold"
            >
              {{ testimonial.author.charAt(0) }}
            </div>
            <div>
              <p class="font-semibold text-[var(--pc-text)]">
                {{ testimonial.author }}
              </p>
              <p class="text-[14px] text-[var(--pc-text-soft)]">
                <span v-if="testimonial.role">{{ testimonial.role }}, </span>
                {{ testimonial.company }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
