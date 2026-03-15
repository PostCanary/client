<!-- src/components/marketing/SectionWrapper.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    bg?: "light" | "alt" | "navy";
    id?: string;
  }>(),
  { bg: "light" },
);
</script>

<template>
  <section
    :id="id"
    class="py-16 sm:py-24 lg:py-28"
    :class="{
      'bg-[var(--mkt-bg)]': bg === 'light',
      'bg-[var(--mkt-bg-alt)]': bg === 'alt',
      'bg-[var(--mkt-navy)] text-white': bg === 'navy',
    }"
  >
    <div
      class="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-10 xl:px-16"
    >
      <slot />
    </div>
  </section>
</template>
