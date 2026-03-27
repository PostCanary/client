<!-- src/components/PaywallOverlay.vue -->
<!--
  Centered "Subscribe to unlock" CTA shown on top of blurred page content.
  Place inside any page that should be gated behind a subscription.
  The parent page handles the blur CSS — this component is just the overlay prompt.
-->
<template>
  <div v-if="visible" class="paywall-overlay">
    <div class="paywall-overlay__card">
      <div class="paywall-overlay__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h3 class="paywall-overlay__title">{{ title }}</h3>
      <p class="paywall-overlay__body">{{ body }}</p>

      <button
        type="button"
        class="paywall-overlay__cta"
        @click="$emit('subscribe')"
      >
        Unlock Your Results
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title?: string;
  body?: string;
}>();

defineEmits<{
  (e: "subscribe"): void;
}>();
</script>

<style scoped>
.paywall-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.paywall-overlay__card {
  pointer-events: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 32px 40px;
  text-align: center;
  max-width: 420px;
  width: 90%;
}

.paywall-overlay__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #16a34a;
  margin-bottom: 16px;
}

.paywall-overlay__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0b2d50;
  margin: 0 0 8px;
}

.paywall-overlay__body {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 24px;
  line-height: 1.5;
}

.paywall-overlay__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 32px;
  background: #0d9488;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.paywall-overlay__cta:hover {
  background: #0f766e;
}
</style>
