<!-- src/pages/AcceptInvite.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  getInvitationDetails,
  acceptInvitation,
  type InvitationDetails,
} from "@/api/orgs";
import { BRAND } from "@/config/brand";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const accepting = ref(false);
const error = ref<string | null>(null);
const invitation = ref<InvitationDetails | null>(null);

const token = computed(() => route.params.token as string);

const isAuthenticated = computed(() => auth.isAuthenticated);

onMounted(async () => {
  if (!auth.initialized) {
    await auth.fetchMe();
  }

  try {
    invitation.value = await getInvitationDetails(token.value);
  } catch (err: any) {
    console.error("[AcceptInvite] Failed to load invitation", err);
    error.value =
      err?.data?.error ||
      err?.message ||
      "This invitation link is invalid or has expired.";
  } finally {
    loading.value = false;
  }
});

async function onAccept() {
  if (accepting.value) return;

  accepting.value = true;
  error.value = null;

  try {
    await acceptInvitation(token.value);
    // Refresh auth to pick up new org membership
    await auth.fetchMe();
    router.push("/app/home");
  } catch (err: any) {
    console.error("[AcceptInvite] accept failed", err);
    error.value =
      err?.data?.error || err?.message || "Failed to accept invitation.";
  } finally {
    accepting.value = false;
  }
}

function onLogin() {
  auth.openLoginModal(`/invite/${token.value}`, "login");
}

function onSignup() {
  auth.openLoginModal(`/invite/${token.value}`, "signup");
}

function displayRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md">
      <!-- Loading -->
      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <p class="text-sm text-slate-500">Loading invitation details...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error && !invitation"
        class="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm"
      >
        <h2 class="text-lg font-semibold text-slate-900">
          Invalid invitation
        </h2>
        <p class="mt-2 text-sm text-red-600">{{ error }}</p>
        <button
          type="button"
          class="mt-6 inline-flex items-center rounded-full bg-[#47bfa9] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer"
          @click="router.push('/')"
        >
          Go to {{ BRAND.name }}
        </button>
      </div>

      <!-- Invitation details -->
      <div
        v-else-if="invitation"
        class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div class="text-center">
          <h2 class="text-xl font-semibold text-slate-900">
            You've been invited
          </h2>
          <p class="mt-2 text-sm text-slate-600">
            <span class="font-medium text-slate-900">{{
              invitation.invited_by
            }}</span>
            has invited you to join
            <span class="font-medium text-slate-900">{{
              invitation.org_name
            }}</span>
            on {{ BRAND.name }}.
          </p>
        </div>

        <div
          class="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2"
        >
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Organization</span>
            <span class="font-medium text-slate-900">{{
              invitation.org_name
            }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Role</span>
            <span class="font-medium text-slate-900">{{
              displayRole(invitation.role)
            }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Email</span>
            <span class="font-medium text-slate-900">{{
              invitation.email
            }}</span>
          </div>
        </div>

        <p v-if="error" class="mt-4 text-center text-sm text-red-600">
          {{ error }}
        </p>

        <!-- Authenticated: show accept button -->
        <template v-if="isAuthenticated">
          <button
            type="button"
            class="mt-6 w-full inline-flex items-center justify-center rounded-full bg-[#47bfa9] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="accepting"
            @click="onAccept"
          >
            {{ accepting ? "Accepting..." : "Accept invitation" }}
          </button>
        </template>

        <!-- Not authenticated: show login/signup prompts -->
        <template v-else>
          <div class="mt-6 space-y-3">
            <p class="text-center text-sm text-slate-500">
              Sign in or create an account to accept this invitation.
            </p>
            <button
              type="button"
              class="w-full inline-flex items-center justify-center rounded-full bg-[#47bfa9] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer"
              @click="onLogin"
            >
              Sign in
            </button>
            <button
              type="button"
              class="w-full inline-flex items-center justify-center rounded-full bg-[#e4e7eb] px-5 py-2.5 text-sm font-medium text-[#243b53] hover:bg-[#d8dde4] cursor-pointer"
              @click="onSignup"
            >
              Create an account
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
