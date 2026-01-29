<!-- src/pages/Settings.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";

import { useUserProfile } from "@/composables/useUserProfile";
import {
  createBillingPortalSession,
  createCheckoutSession,
  type PlanCode,
} from "@/api/billing";
import { useAuthStore } from "@/stores/auth";

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
const deleteBusy = ref(false);
const deleteError = ref<string | null>(null);

const router = useRouter();
const auth = useAuthStore();
const message = useMessage();

onMounted(() => {
  loadProfile();
});

async function onSubmit() {
  await saveProfile();
}

/**
 * Best-effort plan_code from backend “me” payload / billing blob.
 * Used only for fallback checkout if portal isn't available.
 */
const currentPlanCode = computed<PlanCode | null>(() => {
  const pc = (auth.billing?.plan_code ||
    (auth.billing as any)?.subscription?.plan_code) as PlanCode | undefined;
  return pc ?? null;
});

/**
 * Manage subscription:
 *  - First try Stripe Billing Portal (for existing customers).
 *  - If portal isn't available:
 *      - If we don't know a plan_code, route user to pricing to pick a tier.
 *      - If we do know a plan_code, start checkout for that plan.
 */
async function onManageSubscription() {
  if (billingBusy.value) return;
  billingBusy.value = true;

  try {
    // 1) Try portal (existing Stripe customer)
    try {
      const { url } = await createBillingPortalSession();
      if (url) {
        window.location.href = url;
        return;
      }
      console.warn(
        "[Settings] Billing portal returned no URL; falling back to checkout/pricing"
      );
    } catch (err) {
      console.warn(
        "[Settings] Billing portal failed; falling back to checkout/pricing:",
        err
      );
    }

    // 2) If we don't know a plan code, don't guess: send them to pricing to choose.
    if (!currentPlanCode.value) {
      message.info("Choose a plan to start your subscription.");
      router.push({ path: "/", hash: "#pricing" });
      return;
    }

    // 3) Start checkout for known plan code
    try {
      const { url: checkoutUrl } = await createCheckoutSession(
        currentPlanCode.value,
        "settings_manage_subscription"
      );
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      console.error("[Settings] No checkout URL returned from backend");
    } catch (err) {
      console.error("[Settings] Failed to start subscription checkout:", err);
    }
  } finally {
    billingBusy.value = false;
  }
}

/**
 * Delete the current user account + data via auth store helper.
 */
async function onDeleteAccount() {
  if (deleteBusy.value) return;

  const confirmed = window.confirm(
    "Deleting your account will permanently remove your MailTrace data. This cannot be undone. Are you sure?"
  );
  if (!confirmed) return;

  deleteBusy.value = true;
  deleteError.value = null;

  try {
    const ok = await auth.deleteAccount();

    if (ok) {
      message.success("Your account has been deleted.");
      router.push("/");
    }
  } catch (err: any) {
    console.error("[Settings] Failed to delete account:", err);
    deleteError.value =
      err?.message || "Failed to delete account. Please try again.";
  } finally {
    deleteBusy.value = false;
  }
}
</script>

<template>
  <div class="min-h-dvh px-4 py-6 sm:px-6">
    <!-- Centered column; gutters on large screens, full width on small -->
    <div class="mx-auto w-full max-w-3xl space-y-6">
      <!-- Header -->
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

      <!-- Profile form card -->
      <form
        class="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        @submit.prevent="onSubmit"
      >
        <fieldset :disabled="loading || saving" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
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
            <label class="block text-sm font-medium text-slate-700">
              Website
            </label>
            <input
              v-model="form.website_url"
              type="url"
              placeholder="https://example.com"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autocomplete="url"
            />
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

      <!-- Billing card -->
      <section
        class="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              Billing &amp; subscription
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Manage your MailTrace subscription, update your payment method, or
              change plans via Stripe.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center rounded-full bg-[#e4e7eb] px-5 py-2 text-sm font-medium text-[#243b53] hover:bg-[#d8dde4] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="billingBusy"
            @click="onManageSubscription"
          >
            Manage subscription
          </button>
        </div>
      </section>

      <!-- Danger zone -->
      <section
        class="w-full rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5"
      >
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-sm font-semibold text-red-700">Danger zone</h2>
            <p class="mt-1 text-xs text-red-700/80">
              Deleting your account will permanently remove your MailTrace data.
              This action cannot be undone.
            </p>
            <p v-if="deleteError" class="mt-1 text-xs text-red-800">
              {{ deleteError }}
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="deleteBusy"
            @click="onDeleteAccount"
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped></style>
