<!-- src/pages/Settings.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";

import { useUserProfile } from "@/composables/useUserProfile";
import {
  cancelSubscription,
  createBillingPortalSession,
  createCheckoutSession,
  pauseSubscription,
  type BillingState,
  type PlanCode,
} from "@/api/billing";
import { useAuthStore } from "@/stores/auth";
import { useOrgStore } from "@/stores/org";
import { useTour } from "@/composables/useTour";
import { BRAND } from "@/config/brand";
import { PLAN_DISPLAY_DETAILS } from "@/config/plans";
import { updateOrg } from "@/api/orgs";

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
const subscriptionActionBusy = ref(false);
const pauseModalOpen = ref(false);
const cancelModalOpen = ref(false);

const router = useRouter();
const auth = useAuthStore();
const orgStore = useOrgStore();
const { startTour } = useTour();
const message = useMessage();

// Org name editing
const orgName = ref(auth.orgName || "");
const orgNameSaving = ref(false);
const isOrgAdmin = computed(() => orgStore.isAdmin);
const billing = computed<BillingState | null>(() => (auth.billing as BillingState | null) ?? null);
const billingStatus = computed(() =>
  String(billing.value?.subscription_status || "none").toLowerCase()
);
const cancelAtPeriodEnd = computed(() => !!billing.value?.cancel_at_period_end);
const canManageBilling = computed(() => !!auth.orgId && isOrgAdmin.value);
const currentPlanCode = computed<PlanCode | null>(() => {
  const pc = (billing.value?.plan_code || billing.value?.resume_plan_code) as PlanCode | undefined;
  return pc ?? null;
});
const currentPlanLabel = computed(() => {
  const code = currentPlanCode.value;
  if (!code) return "No paid plan selected";
  const detail = PLAN_DISPLAY_DETAILS[code];
  return detail ? `${detail.name} (${detail.price})` : code;
});
const subscriptionStatusLabel = computed(() => {
  switch (billingStatus.value) {
    case "active":
      return cancelAtPeriodEnd.value ? "Cancellation scheduled" : "Active";
    case "paused":
      return "Paused";
    case "past_due":
      return "Payment issue";
    case "canceled":
      return "Canceled";
    default:
      return "Not subscribed";
  }
});
const subscriptionStatusClasses = computed(() => {
  switch (billingStatus.value) {
    case "active":
      return cancelAtPeriodEnd.value
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "paused":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "past_due":
      return "border-red-300 bg-red-50 text-red-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
});

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

onMounted(() => {
  loadProfile();
});

async function onSubmit() {
  await saveProfile();
}

async function onChangePlan() {
  if (billingBusy.value) return;
  billingBusy.value = true;

  try {
    if (billingStatus.value === "paused" && currentPlanCode.value) {
      const { url: checkoutUrl } = await createCheckoutSession(
        currentPlanCode.value,
        "settings_resume_subscription"
      );
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
    }

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

    if (!currentPlanCode.value) {
      message.info("Choose a plan to start or resume your subscription.");
      router.push({ path: "/", hash: "#pricing" });
      return;
    }

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

async function onConfirmPauseSubscription() {
  if (subscriptionActionBusy.value) return;
  subscriptionActionBusy.value = true;

  try {
    await pauseSubscription();
    await auth.fetchMe();
    pauseModalOpen.value = false;
    message.success("Subscription paused. The account is now read-only.");
  } catch (err: any) {
    console.error("[Settings] Failed to pause subscription:", err);
    message.error(err?.message || "Failed to pause subscription.");
  } finally {
    subscriptionActionBusy.value = false;
  }
}

async function onConfirmCancelSubscription() {
  if (subscriptionActionBusy.value) return;
  subscriptionActionBusy.value = true;

  try {
    await cancelSubscription();
    await auth.fetchMe();
    cancelModalOpen.value = false;
    message.success("Cancellation scheduled for the end of the current billing period.");
  } catch (err: any) {
    console.error("[Settings] Failed to cancel subscription:", err);
    message.error(err?.message || "Failed to cancel subscription.");
  } finally {
    subscriptionActionBusy.value = false;
  }
}

function onPauseInsteadFromCancel() {
  cancelModalOpen.value = false;
  pauseModalOpen.value = true;
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
        class="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div class="space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Billing &amp; subscription
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Manage your {{ BRAND.name }} subscription, pause for read-only access, or
                schedule cancellation while keeping historical data intact.
              </p>
            </div>

            <span
              class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
              :class="subscriptionStatusClasses"
              data-testid="settings-subscription-status"
            >
              {{ subscriptionStatusLabel }}
            </span>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current plan
              </p>
              <p class="mt-1 text-sm font-medium text-slate-900" data-testid="settings-plan-label">
                {{ currentPlanLabel }}
              </p>
              <p
                v-if="billingStatus === 'paused'"
                class="mt-1 text-xs text-slate-500"
              >
                Historical data remains available while uploads and matching are paused.
              </p>
            </div>

            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                Billing state
              </p>
              <p class="mt-1 text-sm font-medium text-slate-900">
                {{ subscriptionStatusLabel }}
              </p>
              <p
                v-if="cancelAtPeriodEnd"
                class="mt-1 text-xs text-slate-500"
              >
                Your subscription remains active through the current billing period.
              </p>
              <p
                v-else-if="billingStatus === 'paused'"
                class="mt-1 text-xs text-slate-500"
              >
                Paused accounts are billed at $20/month and stay in read-only mode.
              </p>
            </div>
          </div>

          <p
            v-if="!canManageBilling"
            class="text-xs text-slate-500"
            data-testid="settings-billing-role-note"
          >
            Only organization owners and admins can manage subscription changes.
          </p>

          <div
            v-else
            class="flex flex-wrap gap-3"
            data-testid="settings-billing-actions"
          >
            <button
              type="button"
              class="inline-flex items-center rounded-full bg-[#e4e7eb] px-5 py-2 text-sm font-medium text-[#243b53] hover:bg-[#d8dde4] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="billingBusy"
              data-testid="settings-change-plan"
              @click="onChangePlan"
            >
              {{ billingStatus === "paused" ? "Resume subscription" : "Change plan" }}
            </button>

            <button
              v-if="billingStatus !== 'paused'"
              type="button"
              class="inline-flex items-center rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="subscriptionActionBusy || cancelAtPeriodEnd"
              data-testid="settings-pause-subscription"
              @click="pauseModalOpen = true"
            >
              Pause account
            </button>

            <button
              type="button"
              class="inline-flex items-center rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="subscriptionActionBusy || cancelAtPeriodEnd"
              data-testid="settings-cancel-subscription"
              @click="cancelModalOpen = true"
            >
              {{ cancelAtPeriodEnd ? "Cancellation scheduled" : "Cancel subscription" }}
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

    <div
      v-if="pauseModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      data-testid="pause-subscription-modal"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-900">Pause account</h3>
        <p class="mt-3 text-sm text-slate-600">
          Pausing moves this organization to a $20/month read-only mode. Team members can still sign in and review historical data, settings, and history, but uploads and matching stay disabled until you resume a paid plan.
        </p>
        <p class="mt-2 text-sm text-slate-600">
          Your existing data stays intact while the account is paused.
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            :disabled="subscriptionActionBusy"
            @click="pauseModalOpen = false"
          >
            Keep current plan
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-full bg-[#243b53] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d3145] disabled:opacity-60"
            :disabled="subscriptionActionBusy"
            data-testid="confirm-pause-subscription"
            @click="onConfirmPauseSubscription"
          >
            {{ subscriptionActionBusy ? "Pausing..." : "Pause for $20/month" }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="cancelModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      data-testid="cancel-subscription-modal"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-semibold text-slate-900">Cancel subscription</h3>
        <p class="mt-3 text-sm text-slate-600">
          Before canceling, consider pausing instead. Paused accounts keep full historical data access in a $20/month read-only mode.
        </p>
        <p class="mt-2 text-sm text-slate-600">
          If you continue, billing stays active through the current period and your historical data is retained after cancellation.
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            :disabled="subscriptionActionBusy"
            data-testid="cancel-subscription-pause-instead"
            @click="onPauseInsteadFromCancel"
          >
            Pause instead
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            :disabled="subscriptionActionBusy"
            @click="cancelModalOpen = false"
          >
            Keep subscription
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            :disabled="subscriptionActionBusy"
            data-testid="confirm-cancel-subscription"
            @click="onConfirmCancelSubscription"
          >
            {{ subscriptionActionBusy ? "Scheduling..." : "Continue to cancel" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
