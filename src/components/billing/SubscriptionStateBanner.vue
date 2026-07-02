<!-- src/components/billing/SubscriptionStateBanner.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const dismissed = ref(false)

const billing = computed(() => auth.billing as Record<string, unknown> | null)
const stateAction = computed(() => billing.value?.state_action as string | null ?? null)
const stateMessage = computed(() => billing.value?.state_message as string ?? '')

const variant = computed(() => {
  const action = stateAction.value
  const status = billing.value?.subscription_status as string
  if (status === 'trialing') return 'info'
  if (action === 'update_card') return 'error'
  if (action === 'resubscribe') return 'warning'
  if (status === 'paused') return 'warning'
  return 'info'
})

const visible = computed(
  () => !dismissed.value && !!stateAction.value
)

function handleCta() {
  const action = stateAction.value
  if (action === 'update_card') {
    window.location.href = '/app/settings?tab=billing'
  } else if (action === 'resubscribe') {
    window.location.href = '/app/settings?tab=billing'
  }
}

const ctaLabel = computed(() => {
  if (stateAction.value === 'update_card') return 'Update Payment Method'
  if (stateAction.value === 'resubscribe') return 'Resubscribe'
  return ''
})
</script>

<template>
  <div v-if="visible" :class="['state-banner', `state-banner--${variant}`]" role="alert">
    <span class="state-banner__msg">{{ stateMessage }}</span>
    <button v-if="ctaLabel" class="state-banner__cta" type="button" @click="handleCta">
      {{ ctaLabel }}
    </button>
    <button class="state-banner__dismiss" type="button" aria-label="Dismiss" @click="dismissed = true">
      ✕
    </button>
  </div>
</template>

<style scoped>
.state-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
}

.state-banner--error {
  background: #fef2f2;
  color: #b91c1c;
  border-bottom: 1px solid #fecaca;
}

.state-banner--warning {
  background: #fffbeb;
  color: #92400e;
  border-bottom: 1px solid #fde68a;
}

.state-banner--info {
  background: #eff6ff;
  color: #1d4ed8;
  border-bottom: 1px solid #bfdbfe;
}

.state-banner__msg {
  flex: 1;
}

.state-banner__cta {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.state-banner__cta:hover {
  opacity: 0.8;
}

.state-banner__dismiss {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  font-size: 12px;
  padding: 2px 4px;
  line-height: 1;
}

.state-banner__dismiss:hover {
  opacity: 1;
}
</style>
