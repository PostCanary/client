<!-- src/pages/Team.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useAuthStore } from "@/stores/auth";
import { useOrgStore } from "@/stores/org";

const auth = useAuthStore();
const orgStore = useOrgStore();
const message = useMessage();

const loading = ref(true);
const inviteModalOpen = ref(false);
const inviteEmail = ref("");
const inviteRole = ref("member");
const inviteBusy = ref(false);

const roleChangeBusy = ref<string | null>(null);
const removeBusy = ref<string | null>(null);

const isAdmin = computed(() => orgStore.isAdmin);
const isOwner = computed(() => orgStore.isOwner);
const currentUserId = computed(() =>
  auth.me?.authenticated ? auth.me.user_id : null,
);

const activeMembers = computed(() =>
  orgStore.members.filter((m) => m.status === "active"),
);

const pendingMembers = computed(() =>
  orgStore.invitations,
);

onMounted(async () => {
  const orgId = auth.orgId;
  if (!orgId) return;

  try {
    await Promise.all([
      orgStore.fetchMembers(orgId),
      orgStore.fetchInvitations(orgId),
    ]);
  } finally {
    loading.value = false;
  }
});

function openInviteModal() {
  inviteEmail.value = "";
  inviteRole.value = "member";
  inviteModalOpen.value = true;
}

function closeInviteModal() {
  inviteModalOpen.value = false;
  inviteEmail.value = "";
  inviteRole.value = "member";
}

async function onSendInvite() {
  const orgId = auth.orgId;
  if (!orgId) return;

  const email = inviteEmail.value.trim().toLowerCase();
  if (!email) {
    message.error("Please enter an email address.");
    return;
  }

  inviteBusy.value = true;
  try {
    await orgStore.sendInvite(orgId, email, inviteRole.value);
    message.success(`Invitation sent to ${email}`);
    closeInviteModal();
    // Refresh both lists so active members and pending invites stay in sync.
    await Promise.all([
      orgStore.fetchMembers(orgId),
      orgStore.fetchInvitations(orgId),
    ]);
  } catch (err: any) {
    console.error("[Team] sendInvite failed", err);
    message.error(err?.message || "Failed to send invitation.");
  } finally {
    inviteBusy.value = false;
  }
}

async function onChangeRole(userId: string, newRole: string) {
  const orgId = auth.orgId;
  if (!orgId) return;

  roleChangeBusy.value = userId;
  try {
    await orgStore.updateRole(orgId, userId, newRole);
    message.success("Role updated.");
  } catch (err: any) {
    console.error("[Team] updateRole failed", err);
    message.error(err?.message || "Failed to update role.");
  } finally {
    roleChangeBusy.value = null;
  }
}

async function onRemoveMember(userId: string, memberName: string) {
  const orgId = auth.orgId;
  if (!orgId) return;

  const confirmed = window.confirm(
    `Remove ${memberName || "this member"} from the organization? They will lose access immediately.`,
  );
  if (!confirmed) return;

  removeBusy.value = userId;
  try {
    await orgStore.removeMember(orgId, userId);
    message.success("Member removed.");
  } catch (err: any) {
    console.error("[Team] removeMember failed", err);
    message.error(err?.message || "Failed to remove member.");
  } finally {
    removeBusy.value = null;
  }
}

function displayRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
</script>

<template>
  <div class="min-h-dvh px-4 py-6 sm:px-6">
    <div class="mx-auto w-full max-w-3xl space-y-6">
      <!-- Header -->
      <header
        class="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4"
      >
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Team</h1>
          <p class="text-sm text-slate-500">
            Manage members and invitations for your organization.
          </p>
        </div>

        <button
          v-if="isAdmin"
          type="button"
          class="inline-flex items-center rounded-full bg-[#47bfa9] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer"
          @click="openInviteModal"
        >
          Invite member
        </button>
      </header>

      <!-- Loading state -->
      <div v-if="loading" class="py-12 text-center text-sm text-slate-500">
        Loading team members...
      </div>

      <template v-else>
        <!-- Active members -->
        <section
          class="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div class="px-4 py-3 sm:px-6 border-b border-slate-100">
            <h2 class="text-sm font-semibold text-slate-900">
              Members ({{ activeMembers.length }})
            </h2>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="member in activeMembers"
              :key="member.user_id"
              class="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-900 truncate">
                  {{ member.full_name || member.email }}
                  <span
                    v-if="member.user_id === currentUserId"
                    class="ml-1 text-xs text-slate-400"
                    >(you)</span
                  >
                </p>
                <p
                  v-if="member.full_name"
                  class="text-xs text-slate-500 truncate"
                >
                  {{ member.email }}
                </p>
              </div>

              <div class="flex items-center gap-3">
                <!-- Role display / selector -->
                <template
                  v-if="
                    isOwner &&
                    member.user_id !== currentUserId &&
                    member.role !== 'owner'
                  "
                >
                  <select
                    :value="member.role"
                    :disabled="roleChangeBusy === member.user_id"
                    class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    @change="
                      onChangeRole(
                        member.user_id,
                        ($event.target as HTMLSelectElement).value,
                      )
                    "
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </template>
                <span
                  v-else
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="
                    member.role === 'owner'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : member.role === 'admin'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                  "
                >
                  {{ displayRole(member.role) }}
                </span>

                <!-- Remove button -->
                <button
                  v-if="
                    isAdmin &&
                    member.user_id !== currentUserId &&
                    member.role !== 'owner'
                  "
                  type="button"
                  class="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="removeBusy === member.user_id"
                  title="Remove member"
                  @click="
                    onRemoveMember(
                      member.user_id,
                      member.full_name || member.email,
                    )
                  "
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-if="activeMembers.length === 0"
              class="px-4 py-6 text-center text-sm text-slate-500"
            >
              No active members found.
            </div>
          </div>
        </section>

        <!-- Pending invitations -->
        <section
          v-if="pendingMembers.length > 0"
          class="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div class="px-4 py-3 sm:px-6 border-b border-slate-100">
            <h2 class="text-sm font-semibold text-slate-900">
              Pending invitations ({{ pendingMembers.length }})
            </h2>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="invitation in pendingMembers"
              :key="invitation.id"
              class="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-600 truncate">
                  {{ invitation.email }}
                </p>
                <p class="text-xs text-slate-400">Invitation pending</p>
              </div>

              <span
                class="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
              >
                {{ displayRole(invitation.role) }}
              </span>
            </div>
          </div>
        </section>
      </template>

      <!-- Invite modal overlay -->
      <Teleport to="body">
        <div
          v-if="inviteModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/40"
            @click="closeInviteModal"
          />

          <!-- Modal card -->
          <div
            class="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 class="text-lg font-semibold text-slate-900">
              Invite a team member
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              They will receive an email with a link to join your organization.
            </p>

            <form class="mt-5 space-y-4" @submit.prevent="onSendInvite">
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >Email address</label
                >
                <input
                  v-model="inviteEmail"
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  :disabled="inviteBusy"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >Role</label
                >
                <select
                  v-model="inviteRole"
                  class="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  :disabled="inviteBusy"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p class="mt-1 text-xs text-slate-400">
                  Admins can manage team members and settings. Members have
                  standard access.
                </p>
              </div>

              <div class="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  class="inline-flex items-center rounded-full bg-[#e4e7eb] px-5 py-2 text-sm font-medium text-[#243b53] hover:bg-[#d8dde4] cursor-pointer"
                  :disabled="inviteBusy"
                  @click="closeInviteModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="inline-flex items-center rounded-full bg-[#47bfa9] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3aa893] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="inviteBusy"
                >
                  {{ inviteBusy ? "Sending..." : "Send invitation" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped></style>
