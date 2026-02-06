<!-- src/components/OnboardingModal.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useUserProfile } from "@/composables/useUserProfile";
import { useAuthStore } from "@/stores/auth";
import profileIcon from "@/assets/profile-icon.svg?url";
import { hashUsernameToGradient } from "@/utils/avatar-gradient";

const emit = defineEmits<{
  (e: "completed"): void;
}>();

const auth = useAuthStore();
const acceptedTerms = ref(false);
const {
  profile,
  form,
  loading,
  saving,
  avatarUploading,
  error,
  isProfileComplete,
  hasLoaded,
  loadProfile,
  saveProfile,
  uploadAvatar,
} = useUserProfile();

// Load profile once when modal mounts if needed
if (!hasLoaded.value && auth.isAuthenticated) {
  loadProfile();
}

const submitting = computed(() => saving.value || avatarUploading.value);

// Name to feed into the gradient hasher
const displayName = computed(() => {
  return (
    profile.value?.full_name || auth.userName || profile.value?.email || "User"
  );
});

// Match Navbar gradient logic
const avatarGradientStyle = computed(() => {
  const [from, to] = hashUsernameToGradient(displayName.value);
  return {
    background: `linear-gradient(135deg, ${from}, ${to})`,
  };
});

async function onSubmit() {
  if (!acceptedTerms.value) {
    return;
  }
  const updated = await saveProfile();
  if (updated?.profile_complete) {
    emit("completed");
  }
}

function openTerms() {
  window.open("/terms", "_blank");
}

async function onAvatarChanged(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await uploadAvatar(file);
  input.value = "";
}
</script>

<template>
  <div class="onboarding-overlay">
    <div class="onboarding-backdrop"></div>

    <div class="onboarding-modal">
      <header class="onboarding-header">
        <h2>Tell us about your mail setup</h2>
        <p>We’ll use this to tailor KPIs and future features.</p>
      </header>

      <section class="onboarding-body">
        <form @submit.prevent="onSubmit" class="onboarding-form">
          <div v-if="error" class="onboarding-error">
            {{ error }}
          </div>

          <!-- Avatar -->
          <!-- Hidden for now - avatar upload functionality is broken -->
          <div v-if="false" class="field-row avatar-row">
            <div class="avatar-preview" :style="avatarGradientStyle">
              <img
                v-if="profile?.avatar_url"
                :src="profile.avatar_url"
                alt=""
                class="avatar-img"
              />
              <img v-else :src="profileIcon" alt="" class="avatar-icon" />
            </div>
            <div class="avatar-actions">
              <label class="btn-secondary">
                Upload avatar
                <input
                  type="file"
                  accept="image/*"
                  class="hidden-input"
                  @change="onAvatarChanged"
                />
              </label>
              <p class="hint">JPG or PNG, up to ~2MB.</p>
            </div>
          </div>

          <!-- Full name -->
          <div class="field">
            <label>Full name</label>
            <input
              v-model="form.full_name"
              type="text"
              placeholder="Joe the Plumber"
              required
            />
          </div>

          <!-- Website -->
          <div class="field">
            <label>Website</label>
            <input
              v-model="form.website_url"
              type="text"
              placeholder="joesplumbing.com"
              required
            />
          </div>

          <!-- Industry -->
          <div class="field">
            <label>Industry</label>
            <input
              v-model="form.industry"
              type="text"
              placeholder="plumbing, carpentry, etc."
              required
            />
          </div>

          <!-- CRM -->
          <div class="field">
            <label>CRM</label>
            <input
              v-model="form.crm"
              type="text"
              placeholder="HubSpot, Salesforce, custom…"
              required
            />
          </div>

          <!-- Mail provider -->
          <div class="field">
            <label>Mail provider</label>
            <input
              v-model="form.mail_provider"
              type="text"
              placeholder="Lob, Click2Mail, in-house…"
              required
            />
          </div>

          <!-- Terms of Service Checkbox -->
          <div class="terms-checkbox">
            <label class="terms-label">
              <input
                v-model="acceptedTerms"
                type="checkbox"
                class="terms-input"
                required
              />
              <span class="terms-text">
                I agree to the
                <button
                  type="button"
                  @click="openTerms"
                  class="terms-link"
                >
                  Terms of Service
                </button>
              </span>
            </label>
          </div>

          <div class="actions">
            <button
              type="submit"
              class="btn-primary"
              :disabled="submitting || loading || !acceptedTerms"
            >
              {{ isProfileComplete ? "Save" : "Save & continue" }}
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
  max-width: 640px;
  width: 100%;
  margin: 0 16px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25),
    0 0 0 1px rgba(15, 23, 42, 0.04);
  padding: 24px 24px 20px;
}

.onboarding-header {
  position: relative;
  margin-bottom: 16px;
}

.onboarding-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.onboarding-header p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.onboarding-body {
  margin-top: 8px;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.onboarding-error {
  background: #fef2f2;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #b91c1c;
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
  padding: 8px 10px;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15);
}

/* avatar row */
.avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  overflow: hidden;
  /* background is now controlled by :style (gradient) */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #0f172a;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  width: 70%;
  height: 70%;
  object-fit: contain;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hidden-input {
  display: none;
}

.btn-primary {
  border-radius: 999px;
  border: none;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  background: #47bfa9;
  color: #ffffff;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  background: #f8fafc;
  color: #1d4ed8;
  cursor: pointer;
}

.hint {
  font-size: 12px;
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.terms-checkbox {
  margin-top: 4px;
  margin-bottom: 4px;
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
