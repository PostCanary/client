<!-- src/components/marketing/CTAButton.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "outline" | "white";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
  }>(),
  { variant: "primary", size: "md", disabled: false },
);

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--app-card-radius)] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus-ring)]"
    :class="[
      // Size
      size === 'sm' && 'px-4 py-2 text-[14px]',
      size === 'md' && 'px-5 py-2.5 text-[15px]',
      size === 'lg' && 'px-6 sm:px-8 py-3 sm:py-3.5 text-[16px] sm:text-[17px]',
      // Variant — navy is the action fill (Match Strip). Teal is accent only.
      variant === 'primary' &&
        'bg-[var(--app-btn-bg)] text-[var(--app-btn-fg)] hover:bg-[var(--app-btn-bg-hover)]',
      variant === 'outline' &&
        'border border-[var(--app-btn-bg)] text-[var(--app-btn-bg)] hover:bg-[var(--app-btn-bg)] hover:text-[var(--app-btn-fg)]',
      variant === 'white' &&
        'bg-white text-navy hover:bg-[var(--app-card-bg)]',
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
