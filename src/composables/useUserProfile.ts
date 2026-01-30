// src/composables/useUserProfile.ts
import { ref, computed } from "vue";
import type { Ref, ComputedRef } from "vue";
import { useAuthStore } from "@/stores/auth";
import {
  fetchUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  type UserProfile,
  type UpdateUserProfilePayload,
} from "@/api/users";
import { normalizeWebsiteUrl } from "@/utils/url-normalize";

export interface ProfileForm {
  full_name: string;
  website_url: string;
  industry: string;
  crm: string;
  mail_provider: string;
}

export interface UseUserProfile {
  profile: Ref<UserProfile | null>;
  form: Ref<ProfileForm>;

  loading: Ref<boolean>;
  saving: Ref<boolean>;
  avatarUploading: Ref<boolean>;
  error: Ref<string | null>;

  isProfileComplete: ComputedRef<boolean>;
  hasLoaded: Ref<boolean>;

  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<UserProfile | null>;
  uploadAvatar: (file: File) => Promise<string | null>;
  resetFormFromProfile: () => void;
}

function buildFormFromProfile(profile: UserProfile | null): ProfileForm {
  return {
    full_name: profile?.full_name ?? "",
    website_url: profile?.website_url ?? "",
    industry: profile?.industry ?? "",
    crm: profile?.crm ?? "",
    mail_provider: profile?.mail_provider ?? "",
  };
}

export function useUserProfile(): UseUserProfile {
  const auth = useAuthStore();

  // ✅ Canonical profile lives in auth.profile; this ref mirrors it for the composable.
  const profile = ref<UserProfile | null>(auth.profile ?? null);

  const form = ref<ProfileForm>(buildFormFromProfile(profile.value));
  const loading = ref(false);
  const saving = ref(false);
  const avatarUploading = ref(false);
  const error = ref<string | null>(null);
  const hasLoaded = ref(!!profile.value);

  const isProfileComplete = computed(() => !!profile.value?.profile_complete);

  const resetFormFromProfile = () => {
    form.value = buildFormFromProfile(profile.value);
  };

  const loadProfile = async () => {
    if (!auth.isAuthenticated) {
      profile.value = null;
      auth.profile = null;
      form.value = buildFormFromProfile(null);
      hasLoaded.value = false;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await fetchUserProfile();

      // ✅ single source of truth: auth.profile
      auth.profile = data;
      profile.value = data;

      hasLoaded.value = true;
      resetFormFromProfile();
    } catch (err: any) {
      console.error("[useUserProfile] loadProfile failed", err);
      error.value = err?.message || "Failed to load profile. Please try again.";
    } finally {
      loading.value = false;
    }
  };

  const saveProfile = async (): Promise<UserProfile | null> => {
    if (!auth.isAuthenticated) {
      error.value = "You must be signed in to update your profile.";
      return null;
    }

    saving.value = true;
    error.value = null;

    const payload: UpdateUserProfilePayload = {
      full_name: form.value.full_name,
      website_url: normalizeWebsiteUrl(form.value.website_url),
      industry: form.value.industry,
      crm: form.value.crm,
      mail_provider: form.value.mail_provider,
    };

    try {
      const updated = await updateUserProfile(payload);

      // ✅ sync canonical profile only
      auth.profile = updated;
      profile.value = updated;

      return updated;
    } catch (err: any) {
      console.error("[useUserProfile] saveProfile failed", err);
      error.value = err?.message || "Failed to save profile. Please try again.";
      return null;
    } finally {
      saving.value = false;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!auth.isAuthenticated) {
      error.value = "You must be signed in to upload an avatar.";
      return null;
    }

    avatarUploading.value = true;
    error.value = null;

    try {
      const publicUrl = await uploadUserAvatar(file);

      // update local profile + canonical auth.profile
      const nextProfile = profile.value
        ? { ...profile.value, avatar_url: publicUrl }
        : null;

      profile.value = nextProfile;
      auth.profile = nextProfile;

      return publicUrl;
    } catch (err: any) {
      console.error("[useUserProfile] uploadAvatar failed", err);
      error.value = err?.message || "Failed to upload avatar. Please try again.";
      return null;
    } finally {
      avatarUploading.value = false;
    }
  };

  return {
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
    resetFormFromProfile,
  };
}