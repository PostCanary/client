<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { updateUserProfile } from "@/api/users";
import {
  getOrg,
  getReturnAddress,
  updateReturnAddress,
  type OrgReturnAddress,
} from "@/api/orgs";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import IndustryPicker from "@/components/IndustryPicker.vue";
import { BRAND } from "@/config/brand";
import {
  industryEnumForSave,
  industryValueForApi,
  parseIndustrySelection,
} from "@/types/campaign";
import {
  parseLocationLabel,
  syncBrandLocationFromProfile,
} from "@/utils/businessLocation";
import { canEditOrgReturnAddress } from "@/utils/firstRunSetup";
import { logoutAndLeave } from "@/utils/sessionLogout";
import { getFirstRunDraft, setFirstRunDraft } from "@/utils/firstRunDraft";
import {
  isCompleteReturnAddress,
  returnAddressFieldsEqual,
  toReturnAddressPayload,
  validateReturnAddressForm,
} from "@/utils/returnAddress";
import landingLogo from "@/assets/brand/logo-hz-800.png";

const router = useRouter();
const auth = useAuthStore();
const brandKitStore = useBrandKitStore();

const savedDraft = getFirstRunDraft();
const industry = ref(savedDraft?.industry ?? auth.profile?.industry ?? "");
const address = ref(savedDraft?.address ?? "");
const city = ref(savedDraft?.city ?? "");
const state = ref(savedDraft?.state ?? "");
const zip = ref(savedDraft?.zip ?? "");
const loadedAddress = ref<OrgReturnAddress | null>(null);
const loading = ref(true);
const formReady = ref(!!savedDraft);
const saving = ref(false);
const signingOut = ref(false);
const formDirty = ref(!!savedDraft);
const error = ref<string | null>(null);

function persistDraft() {
  setFirstRunDraft({
    industry: industry.value,
    address: address.value,
    city: city.value,
    state: state.value,
    zip: zip.value,
  });
}

function markFormDirty() {
  formDirty.value = true;
  persistDraft();
}

watch([industry, address, city, state, zip], () => {
  if (formDirty.value) persistDraft();
});

const industrySelection = computed(() => parseIndustrySelection(industry.value));
const industryOk = computed(() => {
  if (!industrySelection.value.key) return false;
  if (industrySelection.value.key === "other") {
    return !!industrySelection.value.otherText.trim();
  }
  return true;
});

const canWriteAddress = computed(() =>
  canEditOrgReturnAddress({
    isInvitedUser: auth.profile?.is_invited_user,
    orgRole: auth.orgRole,
  }),
);

const addressAlreadyComplete = computed(() =>
  isCompleteReturnAddress(loadedAddress.value),
);

const showAddressFields = computed(() => canWriteAddress.value);

const currentAddressPayload = computed(() =>
  toReturnAddressPayload({
    name: loadedAddress.value?.name ?? "",
    address2: loadedAddress.value?.address2 ?? "",
    address: address.value,
    city: city.value,
    state: state.value,
    zip: zip.value,
  }),
);

const addressChanged = computed(
  () =>
    !returnAddressFieldsEqual(loadedAddress.value, currentAddressPayload.value),
);

const addressRequired = computed(
  () => canWriteAddress.value && !addressAlreadyComplete.value,
);

const addressValid = computed(
  () =>
    validateReturnAddressForm({
      address: address.value,
      city: city.value,
      state: state.value,
      zip: zip.value,
    }) === null,
);

const canSave = computed(() => {
  if (!industryOk.value) return false;
  if (addressRequired.value) return addressValid.value;
  return true;
});

function applyLoadedAddress(
  addr: OrgReturnAddress | null,
  opts: { force?: boolean } = {},
) {
  // Never clobber fields the user has already typed (ZIP keystroke used
  // to land on a late refetch / remount that wiped industry + address).
  if (formDirty.value && !opts.force) return;
  loadedAddress.value = addr;
  address.value = addr?.address ?? "";
  city.value = addr?.city ?? "";
  state.value = addr?.state ?? "";
  zip.value = addr?.zip ?? "";
}

function prefillCityStateFromLabel(label?: string | null) {
  if (formDirty.value) return;
  if (city.value.trim() || state.value.trim()) return;
  const parsed = parseLocationLabel(label);
  if (!parsed) return;
  city.value = parsed.city;
  state.value = parsed.state;
}

onMounted(async () => {
  try {
    if (!brandKitStore.hydrated) {
      await brandKitStore.fetch();
    }
    if (
      !formDirty.value &&
      !industry.value.trim() &&
      brandKitStore.brandKit?.industry
    ) {
      industry.value = brandKitStore.brandKit.industry;
    }
    try {
      applyLoadedAddress(await getReturnAddress());
    } catch {
      applyLoadedAddress(null);
    }
    if (!isCompleteReturnAddress(loadedAddress.value)) {
      prefillCityStateFromLabel(brandKitStore.brandKit?.location);
      if (!city.value.trim() && auth.orgId) {
        try {
          const org = await getOrg(auth.orgId);
          prefillCityStateFromLabel(org.location);
        } catch {
          // Prefill only — skip decision never uses org.location.
        }
      }
    }
  } finally {
    loading.value = false;
    formReady.value = true;
  }
});

async function onSubmit() {
  if (!canSave.value || saving.value) return;

  if (!industryOk.value) {
    error.value = "Tell us your industry.";
    return;
  }
  if (addressRequired.value && !addressValid.value) {
    error.value =
      validateReturnAddressForm({
        address: address.value,
        city: city.value,
        state: state.value,
        zip: zip.value,
      }) ?? "Street address is required.";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const profileIndustry = industryValueForApi(industry.value);
    const updated = await updateUserProfile({ industry: profileIndustry });
    auth.profile = updated;

    let knownAddress = loadedAddress.value;
    const shouldWriteAddress =
      canWriteAddress.value &&
      addressValid.value &&
      (!addressAlreadyComplete.value || addressChanged.value);

    if (shouldWriteAddress) {
      const savedAddress = await updateReturnAddress(currentAddressPayload.value);
      if (!savedAddress) {
        throw new Error("Failed to save business mailing address.");
      }
      knownAddress = savedAddress;
      applyLoadedAddress(savedAddress, { force: true });
    }

    const industryEnum = industryEnumForSave(industry.value);
    await syncBrandLocationFromProfile({
      orgId: canWriteAddress.value ? auth.orgId : null,
      brandLocation: brandKitStore.brandKit?.location,
      brandIndustry: brandKitStore.brandKit?.industry ?? null,
      profileIndustry: industryEnum ?? updated.industry,
      knownReturnAddress: knownAddress,
      forceLocation: shouldWriteAddress,
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

    if (industryEnum && brandKitStore.brandKit?.industry !== industryEnum) {
      await brandKitStore.update({ industry: industryEnum });
    }

    setFirstRunDraft(null);
    auth.markFirstRunComplete();
    await router.replace({ name: "AppHome" });
  } catch (err: unknown) {
    console.error("[FirstRunSetup] save failed", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: string }).message)
        : null;
    error.value = message || "Could not save. Please try again.";
  } finally {
    saving.value = false;
  }
}

async function onSignOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  setFirstRunDraft(null);
  try {
    await logoutAndLeave();
  } finally {
    signingOut.value = false;
  }
}
</script>

<template>
  <div class="first-run" data-testid="first-run-setup">
    <header class="first-run-header">
      <img :src="landingLogo" :alt="`${BRAND.name} logo`" class="first-run-logo" />
      <div class="first-run-user">
        <button
          type="button"
          class="first-run-avatar"
          data-testid="first-run-avatar"
          :aria-expanded="false"
          :disabled="signingOut"
          @click="onSignOut"
        >
          {{ (auth.userName || "U").slice(0, 1).toUpperCase() }}
        </button>
        <button
          type="button"
          class="first-run-sign-out"
          data-testid="first-run-sign-out"
          :disabled="signingOut"
          @click="onSignOut"
        >
          {{ signingOut ? "Signing out…" : "Sign out" }}
        </button>
      </div>
    </header>

    <main class="first-run-main">
      <div
        v-if="loading && !formReady"
        class="first-run-loading"
        data-testid="first-run-loading"
      >
        <div
          class="w-6 h-6 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin"
        />
      </div>

      <form
        v-else
        class="first-run-card"
        autocomplete="off"
        @submit.prevent="onSubmit"
        @input="markFormDirty"
      >
        <h1 class="first-run-title">A couple things before you send</h1>
        <p class="first-run-sub">
          This helps us target the right neighborhoods and print your return
          address on every postcard.
        </p>

        <div class="space-y-5">
          <div>
            <p class="block text-sm font-medium text-slate-700 mb-2">
              What industry are you in?
            </p>
            <div @click="markFormDirty">
              <IndustryPicker v-model="industry" />
            </div>
          </div>

          <div v-if="showAddressFields">
            <p class="block text-sm font-medium text-slate-700 mb-2">
              Business mailing / return address
            </p>
            <div class="space-y-3">
              <div>
                <label for="first-run-street" class="block text-sm text-slate-600">
                  Street address
                </label>
                <input
                  id="first-run-street"
                  v-model="address"
                  type="text"
                  autocomplete="off"
                  data-testid="first-run-street"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div class="grid gap-3 sm:grid-cols-3">
                <div class="sm:col-span-1">
                  <label for="first-run-city" class="block text-sm text-slate-600">
                    City
                  </label>
                  <input
                    id="first-run-city"
                    v-model="city"
                    type="text"
                    autocomplete="off"
                    data-testid="first-run-city"
                    class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label for="first-run-state" class="block text-sm text-slate-600">
                    State
                  </label>
                  <input
                    id="first-run-state"
                    v-model="state"
                    type="text"
                    maxlength="2"
                    autocomplete="off"
                    data-testid="first-run-state"
                    class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label for="first-run-zip" class="block text-sm text-slate-600">
                    ZIP
                  </label>
                  <input
                    id="first-run-zip"
                    v-model="zip"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    data-testid="first-run-zip"
                    class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <p
            v-else-if="addressAlreadyComplete"
            class="text-sm text-slate-500"
            data-testid="first-run-address-locked"
          >
            Your team already has a business mailing address. You only need to
            set your industry.
          </p>
        </div>

        <p v-if="error" class="mt-4 text-sm text-red-600" data-testid="first-run-error">
          {{ error }}
        </p>

        <button
          type="submit"
          class="mt-6 inline-flex items-center rounded-lg bg-[#47bfa9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3aa893] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canSave || saving"
          data-testid="first-run-continue"
        >
          {{ saving ? "Saving…" : "Continue" }}
        </button>
      </form>
    </main>
  </div>
</template>

<style scoped>
.first-run {
  min-height: 100vh;
  background: var(--app-bg, #f0f2f5);
  display: flex;
  flex-direction: column;
}

.first-run-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 0;
}

.first-run-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.first-run-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #d7dde5;
  background: #0b2d50;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.first-run-avatar:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.first-run-sign-out {
  background: none;
  border: none;
  padding: 6px 0;
  color: #52677b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.first-run-sign-out:hover:not(:disabled) {
  color: #0b2d50;
  text-decoration: underline;
}

.first-run-sign-out:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.first-run-logo {
  height: 40px;
  width: auto;
}

.first-run-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 48px;
}

.first-run-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.first-run-card {
  width: 100%;
  max-width: 560px;
  background: #fff8e8;
  border: 1px solid #f3e0a8;
  border-radius: 16px;
  padding: 28px 24px 24px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.06);
}

.first-run-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0b2d50;
}

.first-run-sub {
  margin: 0 0 20px;
  font-size: 0.925rem;
  color: #52677b;
}

@media (max-width: 639px) {
  .first-run-card {
    padding: 22px 18px 20px;
  }
}
</style>
