<!-- src/components/OnboardingModal.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useUserProfile } from "@/composables/useUserProfile";
import { useAuthStore } from "@/stores/auth";
import { updateOrg } from "@/api/orgs";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { INDUSTRY_LABELS } from "@/types/campaign";
import type { Industry } from "@/types/campaign";

const emit = defineEmits<{
  (e: "completed"): void;
}>();

const auth = useAuthStore();
const brandKitStore = useBrandKitStore();
const {
  profile,
  form,
  loading,
  saving,
  error,
  hasLoaded,
  loadProfile,
  saveProfile,
} = useUserProfile();

if (!hasLoaded.value && auth.isAuthenticated) {
  loadProfile();
}

const isInvitedUser = computed(() => !!profile.value?.is_invited_user);
const submitting = ref(false);

// Multi-step state
const currentScreen = ref(1);
const totalScreens = computed(() => (isInvitedUser.value ? 1 : 4));

// New org-level fields
const businessName = ref("");
const streetAddress = ref("");
const city = ref("");
const state = ref("");
const zip = ref("");
const selectedIndustry = ref<Industry | "">("");
const serviceTypes = ref<string[]>([]);
const websiteUrl = ref("");
const acceptedTerms = ref(false);

const industries = Object.entries(INDUSTRY_LABELS) as [Industry, string][];

const SERVICE_OPTIONS: Record<Industry, string[]> = {
  hvac: ["AC Repair", "Heating", "Duct Cleaning", "Installation", "Maintenance"],
  plumbing: ["Drain Cleaning", "Water Heater", "Pipe Repair", "Remodel", "Emergency"],
  roofing: ["Repair", "Replacement", "Inspection", "Storm Damage", "Commercial"],
  cleaning: ["House Cleaning", "Carpet Cleaning", "Pressure Washing", "Window Cleaning"],
  electrical: ["Wiring", "Panel Upgrade", "Lighting", "Generator", "Emergency"],
  pest_control: ["General Pest", "Termite", "Rodent", "Mosquito", "Wildlife"],
  landscaping: ["Lawn Care", "Hardscape", "Tree Service", "Irrigation", "Design"],
  other: ["General Service"],
};

const serviceOptionsForIndustry = computed(() => {
  if (!selectedIndustry.value) return [];
  return SERVICE_OPTIONS[selectedIndustry.value] ?? ["General Service"];
});

// Screen navigation
function nextScreen() {
  if (currentScreen.value < totalScreens.value) {
    currentScreen.value++;
  }
}

function prevScreen() {
  if (currentScreen.value > 1) {
    currentScreen.value--;
  }
}

// Can proceed from current screen
const canProceed = computed(() => {
  if (isInvitedUser.value) {
    return !!(form.value.full_name || "").trim() && acceptedTerms.value;
  }
  switch (currentScreen.value) {
    case 1:
      return !!(form.value.full_name || "").trim() && !!businessName.value.trim();
    case 2:
      return !!streetAddress.value.trim() && !!city.value.trim() && !!state.value.trim() && !!zip.value.trim();
    case 3:
      return !!selectedIndustry.value;
    case 4:
      return acceptedTerms.value;
    default:
      return false;
  }
});

async function onSubmit() {
  if (!canProceed.value) return;

  submitting.value = true;
  try {
    // Save user-level fields (full_name, industry, website)
    if (selectedIndustry.value) {
      form.value.industry = selectedIndustry.value;
    }
    form.value.website_url = websiteUrl.value.trim();
    await saveProfile();

    // Save org-level fields (not for invited users)
    if (!isInvitedUser.value && auth.orgId) {
      const fullAddress = `${streetAddress.value.trim()}, ${city.value.trim()}, ${state.value.trim()} ${zip.value.trim()}`;
      await updateOrg(auth.orgId, {
        business_name: businessName.value.trim(),
        location: fullAddress,
        street_address: streetAddress.value.trim(),
        city: city.value.trim(),
        state: state.value.trim(),
        zip: zip.value.trim(),
        service_types: serviceTypes.value.length > 0 ? serviceTypes.value : undefined,
      });

      // Seed brand kit from org data + trigger mock scrape
      await brandKitStore.fetch();
      if (websiteUrl.value.trim()) {
        brandKitStore.triggerScrape(websiteUrl.value.trim());
      }
    }

    // Refresh auth state to pick up new profile_complete
    await auth.fetchMe();
    emit("completed");
  } catch (e: any) {
    // error is handled by useUserProfile
  } finally {
    submitting.value = false;
  }
}

function openTerms() {
  window.open("/terms", "_blank");
}
</script>

<template>
  <div class="onboarding-overlay">
    <div class="onboarding-backdrop"></div>

    <div class="onboarding-modal">
      <header class="onboarding-header">
        <h2 v-if="isInvitedUser">Finish joining your team</h2>
        <h2 v-else>Let's get you set up — 60 seconds</h2>
        <p v-if="isInvitedUser">
          Add your name so your team can recognize you in PostCanary.
        </p>
      </header>

      <section class="onboarding-body">
        <form @submit.prevent="isInvitedUser || currentScreen === totalScreens ? onSubmit() : nextScreen()">
          <div v-if="error" class="onboarding-error">{{ error }}</div>

          <!-- Invited user: single screen -->
          <template v-if="isInvitedUser">
            <div class="field">
              <label>Full name</label>
              <input v-model="form.full_name" type="text" placeholder="Joe the Plumber" required />
            </div>
            <div class="terms-checkbox">
              <label class="terms-label">
                <input v-model="acceptedTerms" type="checkbox" class="terms-input" required />
                <span class="terms-text">
                  I agree to the
                  <button type="button" @click="openTerms" class="terms-link">Terms of Service</button>
                </span>
              </label>
            </div>
          </template>

          <!-- Non-invited: 4 screens -->
          <template v-else>
            <!-- Screen 1: Name + Business name -->
            <template v-if="currentScreen === 1">
              <div class="field">
                <label>Your name</label>
                <input v-model="form.full_name" type="text" placeholder="Joe Martinez" required />
              </div>
              <div class="field">
                <label>Business name</label>
                <input v-model="businessName" type="text" placeholder="Martinez Plumbing" required />
              </div>
            </template>

            <!-- Screen 2: Business Address -->
            <template v-if="currentScreen === 2">
              <div class="field">
                <label>Business address</label>
                <span class="hint">This will appear as the return address on your postcards.</span>
                <input v-model="streetAddress" type="text" placeholder="123 Main St" required />
              </div>
              <div class="field-row">
                <div class="field field--grow">
                  <label>City</label>
                  <input v-model="city" type="text" placeholder="Scottsdale" required />
                </div>
                <div class="field field--small">
                  <label>State</label>
                  <input v-model="state" type="text" placeholder="AZ" maxlength="2" required />
                </div>
                <div class="field field--small">
                  <label>ZIP</label>
                  <input v-model="zip" type="text" placeholder="85251" maxlength="10" required />
                </div>
              </div>
            </template>

            <!-- Screen 3: Industry + Services -->
            <template v-if="currentScreen === 3">
              <div class="field">
                <label>What industry are you in?</label>
                <div class="industry-grid">
                  <button
                    v-for="[key, label] in industries"
                    :key="key"
                    type="button"
                    class="industry-btn"
                    :class="selectedIndustry === key ? 'industry-btn--active' : ''"
                    @click="selectedIndustry = key"
                  >
                    {{ label }}
                  </button>
                </div>
              </div>
              <div v-if="selectedIndustry" class="field">
                <label>What services do you offer?</label>
                <div class="service-checkboxes">
                  <label
                    v-for="svc in serviceOptionsForIndustry"
                    :key="svc"
                    class="service-check"
                  >
                    <input
                      type="checkbox"
                      :value="svc"
                      v-model="serviceTypes"
                      class="terms-input"
                    />
                    <span class="text-sm text-gray-700">{{ svc }}</span>
                  </label>
                </div>
              </div>
            </template>

            <!-- Screen 4: Website + Terms -->
            <template v-if="currentScreen === 4">
              <div class="field">
                <label>What's your website?</label>
                <input v-model="websiteUrl" type="text" placeholder="joesplumbing.com" />
                <span class="hint">
                  We'll pull your logo, photos, and reviews to auto-build your postcards.
                </span>
              </div>
              <button
                v-if="!websiteUrl.trim()"
                type="button"
                class="skip-link"
                @click="websiteUrl = ''"
              >
                Skip — I'll add them manually
              </button>
              <div class="terms-checkbox">
                <label class="terms-label">
                  <input v-model="acceptedTerms" type="checkbox" class="terms-input" required />
                  <span class="terms-text">
                    I agree to the
                    <button type="button" @click="openTerms" class="terms-link">Terms of Service</button>
                  </span>
                </label>
              </div>
            </template>
          </template>

          <!-- Progress dots (non-invited only) -->
          <div v-if="!isInvitedUser && totalScreens > 1" class="progress-dots">
            <span
              v-for="i in totalScreens"
              :key="i"
              class="dot"
              :class="i === currentScreen ? 'dot--active' : i < currentScreen ? 'dot--done' : ''"
            />
          </div>

          <!-- Actions -->
          <div class="actions">
            <button
              v-if="!isInvitedUser && currentScreen > 1"
              type="button"
              class="btn-back"
              @click="prevScreen"
            >
              Back
            </button>
            <div class="grow" />
            <button
              type="submit"
              class="btn-primary"
              :disabled="!canProceed || submitting || loading"
            >
              <template v-if="submitting || saving">Saving...</template>
              <template v-else-if="isInvitedUser">Continue</template>
              <template v-else-if="currentScreen < totalScreens">Next</template>
              <template v-else>Get Started</template>
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboarding-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
}

.onboarding-modal {
  position: relative;
  z-index: 61;
  max-width: 480px;
  width: 100%;
  margin: 0 16px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25),
    0 0 0 1px rgba(15, 23, 42, 0.04);
  padding: 28px 28px 24px;
}

.onboarding-header {
  margin-bottom: 20px;
}

.onboarding-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.onboarding-header p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.onboarding-body form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.onboarding-error {
  background: #fef2f2;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #b91c1c;
}

.field-row {
  display: flex;
  gap: 10px;
}

.field--grow {
  flex: 1;
}

.field--small {
  flex: 0 0 72px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.field input {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  font-size: 14px;
  color: #1e293b;
}

.field input::placeholder {
  color: #94a3b8;
}

.field input:focus {
  outline: none;
  border-color: #47bfa9;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.industry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.industry-btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.industry-btn:hover {
  border-color: #47bfa9;
}

.industry-btn--active {
  border-color: #47bfa9;
  background: rgba(71, 191, 169, 0.08);
  color: #0f172a;
}

.service-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.service-check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.skip-link {
  background: none;
  border: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.skip-link:hover {
  color: #475569;
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: background 0.2s;
}

.dot--active {
  background: #47bfa9;
}

.dot--done {
  background: #47bfa9;
  opacity: 0.5;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.grow {
  flex: 1;
}

.btn-primary {
  border-radius: 999px;
  border: none;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  background: #47bfa9;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #3aa893;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-back {
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
}

.btn-back:hover {
  color: #475569;
}

.terms-checkbox {
  margin-top: 4px;
}

.terms-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.5;
}

.terms-input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #47bfa9;
  flex-shrink: 0;
}

.terms-text {
  color: #475569;
  user-select: none;
}

.terms-link {
  color: #47bfa9;
  text-decoration: underline;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}

.terms-link:hover {
  color: #3aa893;
}
</style>
