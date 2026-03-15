<!-- src/components/marketing/SectionHeading.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    badge?: string;
    heading: string;
    subheading?: string;
    light?: boolean;
  }>(),
  { light: false },
);
</script>

<template>
  <div class="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
    <span
      v-if="badge"
      class="inline-flex items-center rounded-full px-4 py-1 text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase mb-5 sm:mb-6"
      :class="
        light
          ? 'bg-white/15 text-white/90'
          : 'bg-[var(--mkt-teal)]/10 text-[var(--mkt-teal)]'
      "
    >
      {{ badge }}
    </span>

    <h2
      class="font-semibold tracking-[-0.03em] text-[30px] leading-9 sm:text-[42px] sm:leading-[50px] xl:text-[52px] xl:leading-[62px]"
      :class="light ? 'text-white' : 'text-[var(--mkt-text)]'"
    >
      {{ heading }}
    </h2>

    <p
      v-if="subheading"
      class="mt-4 sm:mt-6 text-[16px] sm:text-[18px] leading-relaxed max-w-[640px] mx-auto"
      :class="light ? 'text-white/70' : 'text-[var(--mkt-text-muted)]'"
    >
      {{ subheading }}
    </p>
  </div>
</template>
