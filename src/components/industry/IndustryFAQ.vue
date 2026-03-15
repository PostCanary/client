<!-- src/components/industry/IndustryFAQ.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";
import type { IndustryFAQContent } from "@/types/industry";
import SectionWrapper from "@/components/marketing/SectionWrapper.vue";
import SectionHeading from "@/components/marketing/SectionHeading.vue";

defineProps<{
  content: IndustryFAQContent;
}>();

const openIndex = ref<number | null>(null);

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index;
};
</script>

<template>
  <SectionWrapper bg="light">
    <SectionHeading
      :heading="content.heading ?? 'Frequently Asked Questions'"
    />

    <div class="mx-auto max-w-3xl">
      <div
        v-for="(faq, index) in content.faqs"
        :key="index"
        class="border-b border-[var(--mkt-border)]"
      >
        <button
          type="button"
          class="w-full py-6 flex items-center justify-between text-left gap-4 cursor-pointer"
          :aria-expanded="openIndex === index"
          @click="toggle(index)"
        >
          <span
            class="text-[18px] md:text-[20px] font-medium text-[var(--mkt-text)]"
          >
            {{ faq.question }}
          </span>
          <ChevronDown
            class="w-6 h-6 text-[var(--mkt-teal)] flex-shrink-0 transition-transform duration-300"
            :class="{ 'rotate-180': openIndex === index }"
          />
        </button>

        <div
          class="overflow-hidden transition-all duration-300 ease-in-out"
          :class="openIndex === index ? 'max-h-[500px] pb-6' : 'max-h-0'"
        >
          <p class="text-[16px] leading-[26px] text-[var(--mkt-text-muted)] pr-10">
            {{ faq.answer }}
          </p>
        </div>
      </div>
    </div>
  </SectionWrapper>
</template>
