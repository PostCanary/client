<!-- src/components/industry/IndustryFAQ.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";
import type { IndustryFAQContent } from "@/types/industry";

defineProps<{
  content: IndustryFAQContent;
}>();

const openIndex = ref<number | null>(null);

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index;
};
</script>

<template>
  <section class="bg-[var(--pc-navy)] py-24">
    <div
      class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-6 md:px-10 xl:px-16"
    >
      <h2
        class="text-center font-normal text-[var(--pc-text)] text-[36px] leading-44px md:text-[48px] md:leading-[58px] xl:text-[70px] xl:leading-80px tracking-[-0.04em]"
      >
        {{ content.heading ?? "Frequently Asked Questions" }}
      </h2>

      <div class="mt-14 mx-auto max-w-3xl">
        <div
          v-for="(faq, index) in content.faqs"
          :key="index"
          class="border-b border-[var(--pc-border)]"
        >
          <button
            type="button"
            class="w-full py-6 flex items-center justify-between text-left gap-4 cursor-pointer"
            :aria-expanded="openIndex === index"
            @click="toggle(index)"
          >
            <span
              class="text-[18px] md:text-[20px] font-medium text-[var(--pc-text)]"
            >
              {{ faq.question }}
            </span>
            <ChevronDown
              class="w-6 h-6 text-[var(--pc-cyan)] flex-shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': openIndex === index }"
            />
          </button>

          <div
            class="overflow-hidden transition-all duration-300 ease-in-out"
            :class="openIndex === index ? 'max-h-[500px] pb-6' : 'max-h-0'"
          >
            <p class="text-[16px] leading-[26px] text-[var(--pc-text-muted)] pr-10">
              {{ faq.answer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
