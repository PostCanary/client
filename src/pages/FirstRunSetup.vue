<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { updateUserProfile } from "@/api/users";
import { updateReturnAddress } from "@/api/orgs";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import IndustryPicker from "@/components/IndustryPicker.vue";
import { BRAND } from "@/config/brand";
import {
  parseIndustrySelection,
  persistIndustryEnum,
} from "@/types/campaign";
import { syncBrandLocationFromProfile } from "@/utils/businessLocation";
import {
  toReturnAddressPayload,
  validateReturnAddressForm,
} from "@/utils/returnAddress";
import landingLogo from "@/assets/brand/logo-hz-800.png";

const router = useRouter();
const auth = useAuthStore();
const brandKitStore = useBrandKitStore();

const industry = ref(auth.profile?.industry ?? "");
const address = ref("");
const city = ref("");
const state = ref("");
const zip = ref("");
const saving = ref(false);
const error = ref<string | null>(null);

const industrySelection = computed(() => parseIndustrySelection(industry.value));

const canSave = computed(() => {
  const industryOk =
    !!industrySelection.value.key &&
    (industrySelection.value.key !== "other" ||
      !!industrySelection.value.otherText.trim());
  return (
    industryOk &&
    validateReturnAddressForm({
      address: address.value,
      city: city.value,
      state: state.value,
      zip: zip.value,
    }) === null
  );
});

async function onSubmit() {
  if (!canSave.value || saving.value) return;

  const addressError = validateReturnAddressForm({
    address: address.value,
    city: city.value,
    state: state.value,
    zip: zip.value,
  });
  if (addressError) {
    error.value = addressError;
    return;
  }
  if (
    industrySelection.value.key === "other" &&
    !industrySelection.value.otherText.trim()
  ) {
    error.value = "Tell us your industry.";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const updated = await updateUserProfile({ industry: industry.value.trim() });
    auth.profile = updated;

    const savedAddress = await updateReturnAddress(
      toReturnAddressPayload({
        address: address.value,
        city: city.value,
        state: state.value,
        zip: zip.value,
      }),
    );
    if (!savedAddress) {
      throw new Error("Failed to save business mailing address.");
    }

    if (!brandKitStore.hydrated) {
      await brandKitStore.fetch();
    }

    const industryEnum = persistIndustryEnum(industrySelection.value.key);
    await syncBrandLocationFromProfile({
      orgId: auth.orgId,
      brandLocation: brandKitStore.brandKit?.location,
      brandIndustry: brandKitStore.brandKit?.industry ?? null,
      profileIndustry: industryEnum ?? updated.industry,
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

    if (
      industryEnum &&
      brandKitStore.brandKit?.industry !== industryEnum
    ) {
      await brandKitStore.update({ industry: industryEnum });
    }

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
</script>

<template>
  <div class="first-run" data-testid="first-run-setup">
    <header class="first-run-header">
      <img :src="landingLogo" :alt="`${BRAND.name} logo`" class="first-run-logo" />
    </header>

    <main class="first-run-main">
      <form class="first-run-card" @submit.prevent="onSubmit">
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
            <IndustryPicker v-model="industry" variant="pills" />
          </div>

          <div>
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
                  autocomplete="address-line1"
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
                    autocomplete="address-level2"
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
                    autocomplete="address-level1"
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
                    autocomplete="postal-code"
                    data-testid="first-run-zip"
                    class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
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
  padding: 20px 24px 0;
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
