<!-- src/pages/Settings.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage } from "naive-ui";

import { useUserProfile } from "@/composables/useUserProfile";
import {
  createSetupSession,
  fetchPaymentMethodSummary,
  type PaymentMethodSummary,
} from "@/api/billing";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { usePermissions } from "@/composables/usePermissions";
import { useTour } from "@/composables/useTour";
import { BRAND } from "@/config/brand";
import { formatTierRange, usePayPerSendTiers } from "@/composables/usePricing";
import {
  updateOrg,
  getReturnAddress,
  updateReturnAddress,
  type OrgReturnAddress,
} from "@/api/orgs";
import { syncBrandLocationFromProfile } from "@/utils/businessLocation";
import IndustryPicker from "@/components/IndustryPicker.vue";
import {
  industryEnumForSave,
  parseIndustrySelection,
} from "@/types/campaign";
import { canEditOrgReturnAddress } from "@/utils/firstRunSetup";
import {
  isCompleteReturnAddress,
  toReturnAddressPayload,
  validateReturnAddressForm,
} from "@/utils/returnAddress";

const {
  profile,
  form,
  loading,
  saving,
  error,
  isProfileComplete,
  loadProfile,
  saveProfile,
} = useUserProfile();

const billingBusy = ref(false);
const paymentMethod = ref<PaymentMethodSummary | null>(null);
const paymentMethodLoading = ref(false);
const payPerSendTiers = usePayPerSendTiers();

function formatRate(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const brandKitStore = useBrandKitStore();
const { manageOrg, manageBilling } = usePermissions();
const { startTour } = useTour();
const message = useMessage();

// POS-119.1 — Business name lives on the brand kit, not the user profile,
// and the AI generation flow only ever reads brand_kit.data.businessName
// (never User.website_url or the profile form). This was previously only
// editable from the designer's Business Info panel; surface it here too so
// it has a discoverable home, and so Website changes here actually reach
// the same brand kit the AI flow reads from (see onSubmit below).
const bizName = ref("");
const brandKitError = ref<string | null>(null);
function syncBizNameFromKit() {
  bizName.value = brandKitStore.brandKit?.businessName ?? "";
}

// Org name editing
const orgName = ref(auth.orgName || "");
const orgNameSaving = ref(false);
const canWriteReturnAddress = computed(() =>
  canEditOrgReturnAddress({
    isInvitedUser:
      profile.value?.is_invited_user ?? auth.profile?.is_invited_user,
    orgRole: auth.orgRole,
  }),
);

// POS-161 — Business mailing (return) address. Required for postcard print
// submit; account-level default that campaigns can override in Review.
const returnAddressForm = ref({
  name: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
});
const returnAddressLoading = ref(false);
const returnAddressSaving = ref(false);
const returnAddressError = ref<string | null>(null);

function validateSettingsReturnAddress(): string | null {
  return validateReturnAddressForm(returnAddressForm.value);
}

const mailingAddressComplete = computed(() =>
  isCompleteReturnAddress(returnAddressForm.value),
);
const isAccountComplete = computed(
  () => isProfileComplete.value && mailingAddressComplete.value,
);
const profileBadgeReady = computed(
  () => !loading.value && !returnAddressLoading.value,
);

function applyReturnAddress(addr: OrgReturnAddress | null) {
  if (!addr) {
    returnAddressForm.value = {
      name: "",
      address: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
    };
    return;
  }
  returnAddressForm.value = {
    name: addr.name ?? "",
    address: addr.address ?? "",
    address2: addr.address2 ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zip ?? "",
  };
}

async function loadReturnAddress() {
  if (!auth.orgId) return;
  returnAddressLoading.value = true;
  returnAddressError.value = null;
  try {
    const addr = await getReturnAddress();
    applyReturnAddress(addr);
  } catch (err: any) {
    // Server route may not exist yet (parallel server lane). Surface quietly
    // so Settings still loads; empty form is fine.
    console.warn("[Settings] getReturnAddress failed", err);
    returnAddressError.value = null;
  } finally {
    returnAddressLoading.value = false;
  }
}

async function onSaveReturnAddress() {
  if (!auth.orgId || returnAddressSaving.value || !canWriteReturnAddress.value) {
    return;
  }
  const validationError = validateSettingsReturnAddress();
  if (validationError) {
    message.error(validationError);
    return;
  }

  const payload: OrgReturnAddress = toReturnAddressPayload(returnAddressForm.value);

  returnAddressSaving.value = true;
  returnAddressError.value = null;
  try {
    const saved = await updateReturnAddress(payload);
    applyReturnAddress(saved ?? payload);
    // Keep brand kit / org.location in sync so Step 1 and map defaults use
    // the same city/state as the mailing address (no onboarding required).
    if (!brandKitStore.hydrated) {
      await brandKitStore.fetch();
    }
    await syncBrandLocationFromProfile({
      orgId: auth.orgId,
      brandLocation: brandKitStore.brandKit?.location,
      brandIndustry: brandKitStore.brandKit?.industry ?? null,
      profileIndustry: auth.profile?.industry ?? null,
      forceLocation: true,
      updateBrandKit: (partial) => brandKitStore.update(partial),
      patchBrandKitLocal: (partial) => {
        brandKitStore.$patch({
          brandKit: {
            ...brandKitStore.brandKit,
            ...partial,
          },
        });
      },
    });
    message.success("Business mailing address saved.");
  } catch (err: any) {
    console.error("[Settings] updateReturnAddress failed", err);
    const code = err?.data?.error ?? err?.message;
    message.error(
      typeof code === "string" && code
        ? code
        : "Failed to save business mailing address.",
    );
  } finally {
    returnAddressSaving.value = false;
  }
}
const canManageBilling = computed(() => !!auth.orgId && manageBilling.value);
const paymentMethodActionLabel = computed(() =>
  paymentMethod.value?.has_payment_method
    ? "Change payment method"
    : "Add payment method"
);

async function onSaveOrgName() {
  const orgId = auth.orgId;
  if (!orgId) return;

  const trimmed = orgName.value.trim();
  if (!trimmed) {
    message.error("Organization name cannot be empty.");
    return;
  }

  orgNameSaving.value = true;
  try {
    await updateOrg(orgId, { name: trimmed });
    await auth.fetchMe();
    orgName.value = auth.orgName || "";
    message.success("Organization name updated.");
  } catch (err: any) {
    console.error("[Settings] updateOrg failed", err);
    message.error(err?.message || "Failed to update organization name.");
  } finally {
    orgNameSaving.value = false;
  }
}

onMounted(async () => {
  loadProfile();
  if (!brandKitStore.hydrated) await brandKitStore.fetch();
  syncBizNameFromKit();
  void loadReturnAddress();
  void loadPaymentMethod();
  if (route.query.billing === "card_saved") {
    message.success("Payment method saved.");
  } else if (route.query.billing === "card_setup_cancelled") {
    message.info("Payment method setup was canceled.");
  }
});

async function loadPaymentMethod() {
  paymentMethodLoading.value = true;
  try {
    paymentMethod.value = await fetchPaymentMethodSummary();
  } catch (err) {
    console.error("[Settings] Failed to load payment method:", err);
    paymentMethod.value = null;
  } finally {
    paymentMethodLoading.value = false;
  }
}

async function onSubmit() {
  const prevWebsiteUrl = (profile.value?.website_url ?? "").trim();
  const newWebsiteUrl = form.value.website_url.trim();
  const websiteChanged = newWebsiteUrl !== prevWebsiteUrl;

  const prevBizName = (brandKitStore.brandKit?.businessName ?? "").trim();
  const newBizName = bizName.value.trim();
  const bizNameChanged = newBizName !== prevBizName;

  const { key: industryKey, otherText } = parseIndustrySelection(
    form.value.industry,
  );
  if (industryKey === "other" && !otherText.trim()) {
    message.error("Tell us your industry.");
    return;
  }

  brandKitError.value = null;
  const prevIndustry = (profile.value?.industry ?? "").trim();
  await saveProfile();
  // saveProfile() already surfaces its own failure via `error` — don't
  // pile a brand-kit failure on top of an unsaved profile.
  if (error.value) return;

  const industryEnum = industryEnumForSave(form.value.industry);
  const industryChanged =
    form.value.industry.trim() !== prevIndustry ||
    (!!industryEnum && brandKitStore.brandKit?.industry !== industryEnum);
  if (industryEnum && industryChanged) {
    try {
      if (!brandKitStore.hydrated) await brandKitStore.fetch();
      await brandKitStore.update({ industry: industryEnum });
    } catch (err) {
      console.error("[Settings] brand kit industry update failed", err);
    }
  }

  if (!websiteChanged && !bizNameChanged) return;

  // Website changes rescan the brand kit (logo/colors/photos/services);
  // a businessName-only edit never should — scraping never overwrites a
  // non-empty businessName anyway, so there's nothing for it to refresh.
  const patch: Record<string, string> = {};
  if (websiteChanged) patch.websiteUrl = newWebsiteUrl;
  if (bizNameChanged && newBizName) patch.businessName = newBizName;
  if (Object.keys(patch).length === 0) return;

  try {
    await brandKitStore.update(patch);
    if (brandKitStore.error) {
      brandKitError.value = brandKitStore.error;
      return;
    }
    syncBizNameFromKit();
    if (websiteChanged && newWebsiteUrl && auth.hasPostcards) {
      void brandKitStore.rescan(newWebsiteUrl);
    }
  } catch (err: any) {
    console.error("[Settings] brand kit update failed", err);
    brandKitError.value =
      "Profile saved, but the brand kit update failed — try again.";
  }
}

async function onManageBilling() {
  if (billingBusy.value) return;
  billingBusy.value = true;

  try {
    const { url } = await createSetupSession("/app/settings");
    if (url) {
      window.location.href = url;
      return;
    }
    console.error("[Settings] No billing URL returned from backend");
    message.error("Unable to open billing right now.");
  } catch (err: any) {
    console.error("[Settings] Failed to open card setup:", err);
    message.error("Unable to open billing right now.");
  } finally {
    billingBusy.value = false;
  }
}

function onReplayTour() {
  router.push("/dashboard");
  setTimeout(() => {
    startTour();
  }, 500);
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-inner">
      <header class="settings-header">
        <div>
          <p class="settings-eyebrow">Account</p>
          <h1>Settings</h1>
          <p class="settings-lede">
            Profile, mailing address, organization, and billing.
          </p>
        </div>

        <span
          v-if="profileBadgeReady"
          class="profile-badge"
          data-testid="settings-profile-badge"
          :class="isAccountComplete ? 'is-complete' : 'is-incomplete'"
        >
          <span class="profile-badge-dot" />
          <span>
            {{ isAccountComplete ? "Profile complete" : "Profile incomplete" }}
          </span>
        </span>
      </header>

      <form class="settings-panel" @submit.prevent="onSubmit">
        <div class="panel-head">
          <h2>Profile</h2>
          <p>Identity and tools used with your mail program.</p>
        </div>

        <fieldset :disabled="loading || saving" class="field-stack">
          <div class="field">
            <label for="settings-full-name">Full name</label>
            <input
              id="settings-full-name"
              v-model="form.full_name"
              type="text"
              autocomplete="name"
            />
          </div>

          <div class="field">
            <label>Email</label>
            <input
              :value="profile?.email || ''"
              type="email"
              disabled
            />
          </div>

          <div class="field">
            <label for="settings-business-name">Business name</label>
            <input
              id="settings-business-name"
              v-model="bizName"
              type="text"
              placeholder="Your business name"
              autocomplete="organization"
            />
            <p class="field-hint">
              Prints on every card. A website scan never overwrites this once
              it's set.
            </p>
          </div>

          <div class="field">
            <label for="settings-website">Website</label>
            <input
              id="settings-website"
              v-model="form.website_url"
              type="text"
              placeholder="example.com"
              autocomplete="url"
            />
            <p class="field-hint">
              Used to build your brand kit — changing it rescans your website.
            </p>
          </div>

          <div class="field">
            <label for="settings-industry">Industry</label>
            <IndustryPicker
              id="settings-industry"
              v-model="form.industry"
              :disabled="loading || saving"
            />
          </div>

          <div class="field">
            <label>CRM</label>
            <input
              v-model="form.crm"
              type="text"
              placeholder="ServiceTitan, HubSpot…"
            />
          </div>

          <div class="field">
            <label>Mail provider</label>
            <input
              v-model="form.mail_provider"
              type="text"
              placeholder="Lob, USPS EDDM, in-house…"
            />
          </div>
        </fieldset>

        <p v-if="error" class="msg-error">{{ error }}</p>
        <p
          v-if="brandKitError"
          class="msg-warn"
          data-testid="settings-brand-kit-error"
        >
          {{ brandKitError }}
        </p>

        <div class="panel-actions">
          <span v-if="saving" class="muted">Saving…</span>
          <button
            type="submit"
            class="btn-primary"
            :disabled="saving || loading"
          >
            Save changes
          </button>
        </div>
      </form>

      <section v-if="auth.orgId" class="settings-panel">
        <div class="panel-head">
          <h2>Organization</h2>
          <p>Manage your organization settings and team.</p>
        </div>

        <div class="org-row">
          <div class="field grow">
            <label for="settings-org-name">Organization name</label>
            <input
              id="settings-org-name"
              v-model="orgName"
              type="text"
              :disabled="!manageOrg || orgNameSaving"
              :class="{ 'is-readonly': !manageOrg }"
            />
          </div>
          <button
            v-if="manageOrg"
            type="button"
            class="btn-primary"
            :disabled="orgNameSaving"
            @click="onSaveOrgName"
          >
            {{ orgNameSaving ? "Saving..." : "Save" }}
          </button>
        </div>

        <div class="panel-split">
          <p class="muted">Manage team members, roles, and invitations.</p>
          <button
            type="button"
            class="btn-secondary"
            @click="router.push('/team')"
          >
            Manage team
          </button>
        </div>
      </section>

      <section
        v-if="auth.orgId"
        class="settings-panel"
        data-testid="settings-return-address"
      >
        <div class="panel-head">
          <h2>Business mailing address</h2>
          <p>
            Required return address printed on every postcard. Campaigns can
            override this at review time.
          </p>
        </div>

        <fieldset
          :disabled="returnAddressLoading || returnAddressSaving || !canWriteReturnAddress"
          class="field-stack"
        >
          <div class="field">
            <label for="settings-return-name">
              Name <span class="optional">(optional)</span>
            </label>
            <input
              id="settings-return-name"
              v-model="returnAddressForm.name"
              type="text"
              autocomplete="organization"
              data-testid="settings-return-name"
            />
          </div>

          <div class="field">
            <label for="settings-return-address">Street address</label>
            <input
              id="settings-return-address"
              v-model="returnAddressForm.address"
              type="text"
              autocomplete="address-line1"
              data-testid="settings-return-address"
            />
          </div>

          <div class="field">
            <label for="settings-return-address2">
              Apt/Suite <span class="optional">(optional)</span>
            </label>
            <input
              id="settings-return-address2"
              v-model="returnAddressForm.address2"
              type="text"
              autocomplete="address-line2"
              data-testid="settings-return-address2"
            />
          </div>

          <div class="address-grid">
            <div class="field">
              <label for="settings-return-city">City</label>
              <input
                id="settings-return-city"
                v-model="returnAddressForm.city"
                type="text"
                autocomplete="address-level2"
                data-testid="settings-return-city"
              />
            </div>
            <div class="field">
              <label for="settings-return-state">State</label>
              <input
                id="settings-return-state"
                v-model="returnAddressForm.state"
                type="text"
                maxlength="2"
                autocomplete="address-level1"
                data-testid="settings-return-state"
                class="is-upper"
              />
            </div>
            <div class="field">
              <label for="settings-return-zip">ZIP</label>
              <input
                id="settings-return-zip"
                v-model="returnAddressForm.zip"
                type="text"
                inputmode="numeric"
                autocomplete="postal-code"
                data-testid="settings-return-zip"
              />
            </div>
          </div>
        </fieldset>

        <p
          v-if="!canWriteReturnAddress"
          class="muted"
          data-testid="settings-return-address-role-note"
        >
          Only organization owners and admins can update the business mailing
          address.
        </p>

        <div class="panel-actions">
          <span v-if="returnAddressLoading" class="muted">Loading…</span>
          <span v-else-if="returnAddressSaving" class="muted">Saving…</span>
          <button
            v-if="canWriteReturnAddress"
            type="button"
            class="btn-primary"
            :disabled="returnAddressLoading || returnAddressSaving"
            data-testid="settings-return-address-save"
            @click="onSaveReturnAddress"
          >
            {{ returnAddressSaving ? "Saving..." : "Save address" }}
          </button>
        </div>
      </section>

      <section class="settings-panel" data-testid="settings-billing">
        <div class="panel-head">
          <h2>Billing</h2>
          <p>
            $0 subscription fee. Every physical postcard is billed pay as you
            go when you send.
          </p>
        </div>

        <div class="info-card">
          <p class="info-label">Per postcard</p>
          <ul class="rate-list" data-testid="settings-rate-tiers">
            <li v-for="tier in payPerSendTiers.list" :key="tier.min_cards">
              <span>{{ formatTierRange(tier) }}</span>
              <strong>{{ formatRate(tier.rate_cents) }}</strong>
            </li>
          </ul>
          <p class="field-hint">
            One rate per campaign — the size of the whole campaign sets the
            rate, and every postcard in it bills at that rate.
          </p>
        </div>

        <div class="info-card">
          <p class="info-label">Payment method</p>
          <p class="payment-value" data-testid="settings-payment-method">
            <template v-if="paymentMethodLoading">Loading…</template>
            <template v-else-if="paymentMethod?.label">
              {{ paymentMethod.label }}
            </template>
            <template v-else>No card on file</template>
          </p>
          <p
            v-if="!paymentMethodLoading && !paymentMethod?.has_payment_method"
            class="field-hint"
          >
            A card is required before a campaign can be sent.
          </p>
        </div>

        <p
          v-if="!canManageBilling"
          class="muted"
          data-testid="settings-billing-role-note"
        >
          Only organization owners and admins can manage the payment method.
        </p>

        <div
          v-else
          class="panel-actions start"
          data-testid="settings-billing-actions"
        >
          <button
            type="button"
            class="btn-secondary"
            :disabled="billingBusy || paymentMethodLoading"
            data-testid="settings-manage-billing"
            @click="onManageBilling"
          >
            {{ paymentMethodActionLabel }}
          </button>
        </div>
      </section>

      <section class="settings-panel">
        <div class="panel-split">
          <div class="panel-head tight">
            <h2>Guided tour</h2>
            <p>
              Walk through the main features of {{ BRAND.name }} with an
              interactive step-by-step tour.
            </p>
          </div>
          <button type="button" class="btn-secondary" @click="onReplayTour">
            Replay tour
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 24px 16px 48px;
}

.settings-inner {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border, #c8d0db);
}

.settings-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pc-canary-deep, #e5b820);
}

.settings-header h1 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: clamp(26px, 3.5vw, 32px);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.settings-lede {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--app-text-secondary, #5a6b7d);
}

.profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--app-card-radius, 2px);
  border: 1px solid var(--app-border, #c8d0db);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
  background: var(--app-card-bg, #f7f9fb);
}

.profile-badge.is-complete {
  border-color: rgba(250, 207, 65, 0.55);
  background: rgba(250, 207, 65, 0.16);
}

.profile-badge.is-incomplete {
  border-color: #fcd34d;
  background: #fffbeb;
  color: #92400e;
}

.profile-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
}

.profile-badge.is-complete .profile-badge-dot {
  background: var(--pc-navy, #1c2430);
}

.settings-panel {
  background: var(--app-card-bg, #f7f9fb);
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  border-left: 3px solid var(--pc-canary, #facf41);
  padding: 20px 22px;
  box-shadow: none;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head.tight {
  margin-bottom: 0;
}

.panel-head h2 {
  margin: 0;
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text, #1c2430);
}

.panel-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--app-text-muted, #8a97a8);
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 0;
  margin: 0;
  padding: 0;
  min-inline-size: 0;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-body, #3d4a5c);
}

.field .optional {
  font-weight: 400;
  color: var(--app-text-muted, #8a97a8);
}

.field input {
  margin-top: 6px;
  display: block;
  width: 100%;
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  background: #fff;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--app-text, #1c2430);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}

.field input:focus {
  border-color: var(--pc-navy, #1c2430);
  box-shadow: 0 0 0 1px var(--pc-navy, #1c2430);
}

.field input:disabled,
.field input.is-readonly {
  border-color: var(--app-border, #c8d0db);
  background: #eef2f6;
  color: var(--app-text-muted, #8a97a8);
  box-shadow: none;
}

.field input.is-upper {
  text-transform: uppercase;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
}

.address-grid {
  display: grid;
  gap: 12px;
}

@media (min-width: 640px) {
  .address-grid {
    grid-template-columns: 1.4fr 0.7fr 0.9fr;
  }
}

.org-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
}

.org-row .grow {
  flex: 1;
  min-width: 200px;
}

.panel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.panel-actions.start {
  justify-content: flex-start;
}

.panel-split {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.info-card {
  border: 1px solid var(--app-border, #c8d0db);
  border-radius: var(--app-card-radius, 2px);
  background: #fff;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.info-label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted, #8a97a8);
}

.rate-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rate-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
  color: var(--app-text-body, #3d4a5c);
}

.rate-list strong {
  font-family: var(--pc-font-display, "Oswald", sans-serif);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--app-text, #1c2430);
}

.payment-value {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text, #1c2430);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-card-radius, 2px);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn-primary {
  border: none;
  background: var(--app-btn-bg, #1c2430);
  color: var(--app-btn-fg, #ffffff);
}

.btn-primary:hover:not(:disabled) {
  background: var(--app-btn-bg-hover, #2a3544);
}

.btn-secondary {
  border: 1px solid var(--app-border, #c8d0db);
  background: #fff;
  color: var(--app-text, #1c2430);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--pc-navy, #1c2430);
  background: #fff;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.muted {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted, #8a97a8);
}

.msg-error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #9f1239;
}

.msg-warn {
  margin: 12px 0 0;
  font-size: 13px;
  color: #92400e;
}
</style>
