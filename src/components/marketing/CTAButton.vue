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
    class="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    :class="[
      // Size
      size === 'sm' && 'px-4 py-2 text-[14px]',
      size === 'md' && 'px-5 py-2.5 text-[15px]',
      size === 'lg' && 'px-6 sm:px-8 py-3 sm:py-3.5 text-[16px] sm:text-[17px]',
      // Variant
      variant === 'primary' &&
        'bg-teal-brand text-white shadow-sm hover:bg-teal-brand/90',
      variant === 'outline' &&
        'border border-teal-brand text-teal-brand hover:bg-teal-brand hover:text-white',
      variant === 'white' &&
        'bg-white text-navy shadow-sm hover:bg-white/90',
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
