<!-- src/components/marketing/CountUp.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useInView } from "@/composables/useInView";

const props = withDefaults(
  defineProps<{
    /** Target number to count up to. */
    to: number;
    /** Optional prefix/suffix rendered around the number (e.g. "$", "%"). */
    prefix?: string;
    suffix?: string;
    /** Decimal places to show. */
    decimals?: number;
    /** Animation duration in ms. */
    duration?: number;
  }>(),
  { prefix: "", suffix: "", decimals: 0, duration: 1600 },
);

const el = ref<HTMLElement | null>(null);
const { isInView } = useInView(el, { threshold: 0.4 });

const current = ref(0);
let raf = 0;

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

watch(isInView, (inView) => {
  if (!inView) return;
  if (reduced()) {
    current.value = props.to;
    return;
  }
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - start) / props.duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    current.value = props.to * eased;
    if (t < 1) raf = requestAnimationFrame(tick);
    else current.value = props.to;
  };
  raf = requestAnimationFrame(tick);
});

onBeforeUnmount(() => cancelAnimationFrame(raf));

const display = computed(() => {
  const n = props.decimals > 0
    ? current.value.toFixed(props.decimals)
    : Math.round(current.value).toLocaleString();
  return `${props.prefix}${n}${props.suffix}`;
});
</script>

<template>
  <span ref="el" class="count-up">{{ display }}</span>
</template>
