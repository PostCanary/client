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
import { useOrgStore } from "@/stores/org";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useTour } from "@/composables/useTour";
import { BRAND } from "@/config/brand";
import { formatTierRange, usePayPerSendTiers } from "@/composables/usePricing";
import {
  updateOrg,
  getReturnAddress,
  updateReturnAddress,
  type OrgReturnAddress,
} from "@/api/orgs";

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
const orgStore = useOrgStore();
const brandKitStore = useBrandKitStore();
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
const isOrgAdmin = computed(() => orgStore.isAdmin);

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

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const STATE_RE = /^[A-Za-z]{2}$/;

function validateReturnAddressForm(): string | null {
  const f = returnAddressForm.value;
  if (!f.address.trim()) return "Street address is required.";
  if (!f.city.trim()) return "City is required.";
  if (!STATE_RE.test(f.state.trim())) return "State must be a 2-letter code.";
  if (!ZIP_RE.test(f.zip.trim())) {
    return "ZIP must be 5 digits or ZIP+4 (12345 or 12345-6789).";
  }
  return null;
}

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
  if (!auth.orgId || returnAddressSaving.value) return;
  const validationError = validateReturnAddressForm();
  if (validationError) {
    message.error(validationError);
    return;
  }

  const f = returnAddressForm.value;
  const payload: OrgReturnAddress = {
    name: f.name.trim() || null,
    address: f.address.trim(),
    address2: f.address2.trim() || null,
    city: f.city.trim(),
    state: f.state.trim().toUpperCase(),
    zip: f.zip.trim(),
  };

  returnAddressSaving.value = true;
  returnAddressError.value = null;
  try {
    const saved = await updateReturnAddress(payload);
    applyReturnAddress(saved ?? payload);
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
const canManageBilling = computed(() => !!auth.orgId && isOrgAdmin.value);
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

  brandKitError.value = null;
  await saveProfile();
  // saveProfile() already surfaces its own failure via `error` — don't
  // pile a brand-kit failure on top of an unsaved profile.
  if (error.value) return;
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
  <div class="min-h-dvh px-4 py-6 sm:px-6">
    <div class="mx-auto w-full max-w-3xl space-y-6">
      <header
        class="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4"
      >
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">
            Account settings
          </h1>
          <p class="text-sm text-slate-500">
            Update your profile, CRM/mail settings, and billing preferences.
          </p>
        </div>

        <span
          v-if="!loading"
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
          :class="
            isProfileComplete
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-amber-300 bg-amber-50 text-amber-700'
          "
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="isProfileComplete ? 'bg-emerald-500' : 'bg-amber-500'"
          />
          <span>
            {{ isProfileComplete ? "Profile complete" : "Profile incomplete" }}
          </span>
        </span>
      </header>

      <form
        class="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        @submit.prevent="onSubmit"
      >
        <fieldset :disabled="loading || saving" class="space-y-4">
          <div>
            <label
              for="settings-full-name"
              class="block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="settings-full-name"
              v-model="form.full_name"
              type="text"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autocomplete="name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              :value="profile?.email || ''"
              type="email"
              class="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              disabled
            />
          </div>

          <div>
            <label
              for="settings-business-name"
              class="block text-sm font-medium text-slate-700"
            >
              Business name
            </label>
            <input
              id="settings-business-name"
              v-model="bizName"
              type="text"
              placeholder="Your business name"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autocomplete="organization"
            />
            <p class="mt-1 text-xs text-slate-500">
              Prints on every card. A website scan never overwrites this
              once it's set.
            </p>
          </div>

          <div>
            <label
              for="settings-website"
              class="block text-sm font-medium text-slate-700"
            >
              Website
            </label>
            <input
              id="settings-website"
              v-model="form.website_url"
              type="text"
              placeholder="example.com"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autocomplete="url"
            />
            <p class="mt-1 text-xs text-slate-500">
              Used to build your brand kit — changing it rescans your
              website.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              Industry
            </label>
            <input
              v-model="form.industry"
              type="text"
              placeholder="Home services, real estate…"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              CRM
            </label>
            <input
              v-model="form.crm"
              type="text"
              placeholder="ServiceTitan, HubSpot…"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">
              Mail provider
            </label>
            <input
              v-model="form.mail_provider"
              type="text"
              placeholder="Lob, USPS EDDM, in-house…"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </fieldset>

        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>
        <p
          v-if="brandKitError"
          class="text-sm text-amber-600"
          data-testid="settings-brand-kit-error"
        >
          {{ brandKitError }}
        </p>

        <div class="flex items-center justify-end gap-3">
          <span v-if="saving" class="text-xs text-slate-500">Saving…</span>
          <button
            type="submit"
            class="inline-flex items-center rounded-full bg-[#47bfa9] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving || loading"
          >
            Save changes
          </button>
        </div>
      </form>

      <section
        v-if="auth.orgId"
        class="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="space-y-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Organization</h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage your organization settings and team.
            </p>
          </div>

          <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[200px]">
              <label
                for="settings-org-name"
                class="block text-sm font-medium text-slate-700"
              >
                Organization name
              </label>
              <input
                id="settings-org-name"
                v-model="orgName"
                type="text"
                :disabled="!isOrgAdmin || orgNameSaving"
                class="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
                :class="
                  isOrgAdmin
                    ? 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                "
              />
            </div>
            <button
              v-if="isOrgAdmin"
              type="button"
              class="inline-flex items-center rounded-full bg-[#47bfa9] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="orgNameSaving"
              @click="onSaveOrgName"
            >
              {{ orgNameSaving ? "Saving..." : "Save" }}
            </button>
          </div>

          <div class="flex items-center justify-between pt-1">
            <p class="text-xs text-slate-500">
              Manage team members, roles, and invitations.
            </p>
            <button
              type="button"
              class="inline-flex items-center rounded-full bg-[#e4e7eb] px-5 py-2 text-sm font-medium text-[#243b53] hover:bg-[#d8dde4] cursor-pointer"
              @click="router.push('/team')"
            >
              Manage team
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="auth.orgId"
        class="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        data-testid="settings-return-address"
      >
        <div class="space-y-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              Business mailing address
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Required return address printed on every postcard. Campaigns can
              override this at review time.
            </p>
          </div>

          <fieldset
            :disabled="returnAddressLoading || returnAddressSaving || !isOrgAdmin"
            class="space-y-3"
          >
            <div>
              <label
                for="settings-return-name"
                class="block text-sm font-medium text-slate-700"
              >
                Name
                <span class="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="settings-return-name"
                v-model="returnAddressForm.name"
                type="text"
                autocomplete="organization"
                data-testid="settings-return-name"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label
                for="settings-return-address"
                class="block text-sm font-medium text-slate-700"
              >
                Street address
              </label>
              <input
                id="settings-return-address"
                v-model="returnAddressForm.address"
                type="text"
                autocomplete="address-line1"
                data-testid="settings-return-address"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label
                for="settings-return-address2"
                class="block text-sm font-medium text-slate-700"
              >
                Apt/Suite
                <span class="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="settings-return-address2"
                v-model="returnAddressForm.address2"
                type="text"
                autocomplete="address-line2"
                data-testid="settings-return-address2"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="sm:col-span-1">
                <label
                  for="settings-return-city"
                  class="block text-sm font-medium text-slate-700"
                >
                  City
                </label>
                <input
                  id="settings-return-city"
                  v-model="returnAddressForm.city"
                  type="text"
                  autocomplete="address-level2"
                  data-testid="settings-return-city"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label
                  for="settings-return-state"
                  class="block text-sm font-medium text-slate-700"
                >
                  State
                </label>
                <input
                  id="settings-return-state"
                  v-model="returnAddressForm.state"
                  type="text"
                  maxlength="2"
                  autocomplete="address-level1"
                  data-testid="settings-return-state"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label
                  for="settings-return-zip"
                  class="block text-sm font-medium text-slate-700"
                >
                  ZIP
                </label>
                <input
                  id="settings-return-zip"
                  v-model="returnAddressForm.zip"
                  type="text"
                  inputmode="numeric"
                  autocomplete="postal-code"
                  data-testid="settings-return-zip"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
          </fieldset>

          <p
            v-if="!isOrgAdmin"
            class="text-xs text-slate-500"
            data-testid="settings-return-address-role-note"
          >
            Only organization owners and admins can update the business mailing
            address.
          </p>

          <div class="flex items-center justify-end gap-3">
            <span
              v-if="returnAddressLoading"
              class="text-xs text-slate-500"
            >
              Loading…
            </span>
            <span
              v-else-if="returnAddressSaving"
              class="text-xs text-slate-500"
            >
              Saving…
            </span>
            <button
              v-if="isOrgAdmin"
              type="button"
              class="inline-flex items-center rounded-full bg-[#47bfa9] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="returnAddressLoading || returnAddressSaving"
              data-testid="settings-return-address-save"
              @click="onSaveReturnAddress"
            >
              {{ returnAddressSaving ? "Saving..." : "Save address" }}
            </button>
          </div>
        </div>
      </section>

      <!-- Billing. The subscription fee is $0 and every physical postcard is
           a pay-as-you-go line item. Rates come
           from GET /api/billing/pricing so this can never drift from
           checkout — never hardcode them. -->
      <section
        class="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        data-testid="settings-billing"
      >
        <div class="space-y-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Billing</h2>
            <p class="mt-1 text-xs text-slate-500">
              $0 subscription fee. Every physical postcard is billed
              pay as you go when you send.
            </p>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Per postcard
            </p>
            <ul class="mt-2 space-y-1" data-testid="settings-rate-tiers">
              <li
                v-for="tier in payPerSendTiers.list"
                :key="tier.min_cards"
                class="flex items-baseline justify-between gap-4 text-sm"
              >
                <span class="text-slate-600">{{ formatTierRange(tier) }}</span>
                <span class="font-semibold text-slate-900">
                  {{ formatRate(tier.rate_cents) }}
                </span>
              </li>
            </ul>
            <p class="mt-2 text-xs text-slate-500">
              One rate per campaign — the size of the whole campaign sets the
              rate, and every postcard in it bills at that rate.
            </p>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
              Payment method
            </p>
            <p
              class="mt-1 text-sm font-medium text-slate-900"
              data-testid="settings-payment-method"
            >
              <template v-if="paymentMethodLoading">Loading…</template>
              <template v-else-if="paymentMethod?.label">
                {{ paymentMethod.label }}
              </template>
              <template v-else>No card on file</template>
            </p>
            <p
              v-if="!paymentMethodLoading && !paymentMethod?.has_payment_method"
              class="mt-1 text-xs text-slate-500"
            >
              A card is required before a campaign can be sent.
            </p>
          </div>

          <p
            v-if="!canManageBilling"
            class="text-xs text-slate-500"
            data-testid="settings-billing-role-note"
          >
            Only organization owners and admins can manage the payment method.
          </p>

          <div
            v-else
            class="flex flex-wrap gap-3"
            data-testid="settings-billing-actions"
          >
            <button
              type="button"
              class="inline-flex items-center rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="billingBusy || paymentMethodLoading"
              data-testid="settings-manage-billing"
              @click="onManageBilling"
            >
              {{ paymentMethodActionLabel }}
            </button>
          </div>
        </div>
      </section>

      <section
        class="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">Guided tour</h2>
            <p class="mt-1 text-xs text-slate-500">
              Walk through the main features of {{ BRAND.name }} with an
              interactive step-by-step tour.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center rounded-full bg-[#e4e7eb] px-5 py-2 text-sm font-medium text-[#243b53] hover:bg-[#d8dde4] cursor-pointer"
            @click="onReplayTour"
          >
            Replay tour
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped></style>
