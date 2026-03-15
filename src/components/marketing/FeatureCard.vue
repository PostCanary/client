<!-- src/components/marketing/FeatureCard.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    title: string;
    body: string;
    layout?: "vertical" | "horizontal";
  }>(),
  { layout: "vertical" },
);
</script>

<template>
  <article
    class="rounded-[var(--mkt-card-radius)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] shadow-[var(--mkt-card-shadow)] transition-shadow duration-300 hover:shadow-[var(--mkt-card-shadow-lg)]"
    :class="
      layout === 'horizontal'
        ? 'flex items-start gap-5 p-6 sm:p-8'
        : 'flex flex-col items-center text-center px-6 sm:px-8 pt-10 pb-8'
    "
  >
    <!-- Icon -->
    <div
      v-if="icon"
      class="flex items-center justify-center rounded-xl bg-[var(--mkt-teal)]/10 shrink-0"
      :class="layout === 'horizontal' ? 'h-12 w-12' : 'h-16 w-16 mb-6'"
    >
      <img
        :src="icon"
        alt=""
        class="object-contain"
        :class="layout === 'horizontal' ? 'h-6 w-6' : 'h-8 w-8'"
      />
    </div>

    <div>
      <h3
        class="text-[18px] sm:text-[20px] font-semibold text-[var(--mkt-text)] leading-snug"
      >
        {{ title }}
      </h3>

      <p
        class="mt-2.5 text-[15px] sm:text-[16px] leading-relaxed text-[var(--mkt-text-muted)]"
      >
        {{ body }}
      </p>
    </div>
  </article>
</template>
