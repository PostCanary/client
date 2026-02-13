import { ref, onMounted, onUnmounted, type Ref } from "vue";

export function useInView(
  target: Ref<HTMLElement | null>,
  options?: IntersectionObserverInit,
) {
  const isInView = ref(false);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    if (!target.value) return;
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          isInView.value = true;
          observer?.disconnect();
        }
      },
      { threshold: 0.2, ...options },
    );
    observer.observe(target.value);
  });

  onUnmounted(() => observer?.disconnect());

  return { isInView };
}
