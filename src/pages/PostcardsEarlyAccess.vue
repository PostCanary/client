<!-- src/pages/PostcardsEarlyAccess.vue -->
<!-- Where feature-gated postcards routes land for unapproved orgs (S85).
     The server enforces the same gate with 403 feature_not_enabled; this
     page is the friendly face of that. -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { captureEvent } from '@/composables/usePostHog'
import { BRAND } from '@/config/brand'

onMounted(() => {
  captureEvent('postcards_early_access_page_viewed')
})

function onRequestInvite() {
  captureEvent('postcards_early_access_invite_requested')
  window.location.href = `mailto:${BRAND.email.support}?subject=${encodeURIComponent('Postcards early access request')}`
}
</script>

<template>
  <div class="early-access-page">
    <div class="early-access-card">
      <div class="early-access-badge">Early access</div>
      <h1 class="early-access-title">Postcard designs &amp; sending are almost here</h1>
      <p class="early-access-copy">
        We're rolling out AI-designed postcards and one-click mail sending to a
        small group of businesses first. Want in? Request an invite and we'll
        get you set up.
      </p>
      <button class="early-access-cta" type="button" @click="onRequestInvite">
        Request an invite
      </button>
    </div>
  </div>
</template>

<style scoped>
.early-access-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}
.early-access-card {
  max-width: 520px;
  text-align: center;
  padding: 3rem 2.5rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 16px;
  background: var(--color-surface, #fff);
  box-shadow: 0 4px 24px rgba(11, 45, 80, 0.06);
}
.early-access-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  margin-bottom: 1rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0b2d50;
  background: #e6f4f1;
}
.early-access-title {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading, #0b2d50);
}
.early-access-copy {
  margin: 0 0 1.5rem;
  color: var(--color-text-muted, #64748b);
  line-height: 1.6;
}
.early-access-cta {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #0b2d50;
  cursor: pointer;
}
.early-access-cta:hover {
  background: #0c3a66;
}
</style>
