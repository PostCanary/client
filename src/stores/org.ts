// src/stores/org.ts
import { defineStore } from "pinia";
import type { Org, OrgMember, OrgInvitation } from "@/api/orgs";
import {
  getOrgs as apiGetOrgs,
  getMembers as apiGetMembers,
  getInvitations as apiGetInvitations,
  sendInvite as apiSendInvite,
  removeMember as apiRemoveMember,
  updateMemberRole as apiUpdateRole,
  switchOrg as apiSwitchOrg,
} from "@/api/orgs";
import { useAuthStore } from "@/stores/auth";

export const useOrgStore = defineStore("org", {
  state: () => ({
    orgs: [] as Org[],
    members: [] as OrgMember[],
    invitations: [] as OrgInvitation[],
    loading: false,
    hydrated: false,
  }),

  getters: {
    activeOrg(state): Org | null {
      const auth = useAuthStore();
      const orgId = auth.orgId;
      if (!orgId) return null;
      return state.orgs.find((o) => o.id === orgId) ?? null;
    },

    isOwner(): boolean {
      const auth = useAuthStore();
      return auth.orgRole === "owner";
    },

    isAdmin(): boolean {
      const auth = useAuthStore();
      return auth.orgRole === "owner" || auth.orgRole === "admin";
    },
  },

  actions: {
    async fetchOrgs() {
      this.loading = true;
      try {
        this.orgs = await apiGetOrgs();
      } finally {
        this.loading = false;
        this.hydrated = true;
      }
    },

    async fetchMembers(orgId: string) {
      this.loading = true;
      try {
        this.members = await apiGetMembers(orgId);
      } finally {
        this.loading = false;
      }
    },

    async fetchInvitations(orgId: string) {
      this.loading = true;
      try {
        this.invitations = await apiGetInvitations(orgId);
      } finally {
        this.loading = false;
      }
    },

    async sendInvite(orgId: string, email: string, role: string) {
      const invitation = await apiSendInvite(orgId, email, role);
      this.invitations.push(invitation);
      return invitation;
    },

    async removeMember(orgId: string, userId: string) {
      await apiRemoveMember(orgId, userId);
      this.members = this.members.filter((m) => m.user_id !== userId);
    },

    async updateRole(orgId: string, userId: string, role: string) {
      await apiUpdateRole(orgId, userId, role);
      const member = this.members.find((m) => m.user_id === userId);
      if (member) member.role = role;
    },

    async switchOrg(orgId: string) {
      await apiSwitchOrg(orgId);
      // Refresh auth store to pick up new org context
      const auth = useAuthStore();
      await auth.fetchMe();
    },
  },
});
