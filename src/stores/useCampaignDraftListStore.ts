import { defineStore } from "pinia";
import { listDrafts } from "@/api/campaignDrafts";
import type { CampaignDraft } from "@/types/campaign";

const refreshesByStore = new WeakMap<
  object,
  Map<string, Promise<boolean>>
>();

function refreshesFor(store: object): Map<string, Promise<boolean>> {
  let refreshes = refreshesByStore.get(store);
  if (!refreshes) {
    refreshes = new Map();
    refreshesByStore.set(store, refreshes);
  }
  return refreshes;
}

/**
 * Shared organization-scoped draft list.
 *
 * The server list contains only persisted, unapproved, undeleted drafts for
 * the active organization. Persistence is the durable "reached Step 3"
 * marker, even when a customer later navigates back and saves Step 2.
 */
export const useCampaignDraftListStore = defineStore("campaignDraftList", {
  state: () => ({
    drafts: [] as CampaignDraft[],
    activeOrgId: null as string | null,
    loadedOrgId: null as string | null,
    hasLoaded: false,
    refreshing: false,
    error: null as string | null,
    orgRevision: 0,
  }),

  getters: {
    count: (state): number | null =>
      state.hasLoaded &&
      state.activeOrgId !== null &&
      state.loadedOrgId === state.activeOrgId
        ? state.drafts.length
        : null,
  },

  actions: {
    setActiveOrg(orgId: string | null): void {
      const normalizedOrgId = orgId?.trim() || null;
      if (this.activeOrgId === normalizedOrgId) return;

      this.activeOrgId = normalizedOrgId;
      this.loadedOrgId = null;
      this.drafts = [];
      this.hasLoaded = false;
      this.refreshing = false;
      this.error = null;
      this.orgRevision++;
    },

    async refresh(orgId: string): Promise<boolean> {
      const normalizedOrgId = orgId.trim();
      if (!normalizedOrgId) return false;

      // Mutation callers can initialize the cache before persistent chrome
      // mounts. Once auth has selected an org, stale callers from another org
      // are ignored rather than replacing or clearing the active tenant.
      if (this.activeOrgId === null) {
        this.setActiveOrg(normalizedOrgId);
      } else if (this.activeOrgId !== normalizedOrgId) {
        return false;
      }

      const revision = this.orgRevision;
      const requestKey = `${revision}:${normalizedOrgId}`;
      const refreshes = refreshesFor(this);
      const existing = refreshes.get(requestKey);
      if (existing) return existing;

      this.refreshing = true;
      const request = (async () => {
        try {
          const drafts = await listDrafts();
          if (
            this.activeOrgId !== normalizedOrgId ||
            this.orgRevision !== revision
          ) {
            return false;
          }
          this.drafts = drafts;
          this.loadedOrgId = normalizedOrgId;
          this.hasLoaded = true;
          this.error = null;
          return true;
        } catch {
          if (
            this.activeOrgId !== normalizedOrgId ||
            this.orgRevision !== revision
          ) {
            return false;
          }
          // Keep the last successful dataset. On initial failure hasLoaded
          // remains false, so consumers hide the badge instead of showing a
          // fabricated zero.
          this.error = "Unable to refresh campaign drafts.";
          return false;
        }
      })();
      const refreshPromise = request.finally(() => {
        if (
          this.activeOrgId === normalizedOrgId &&
          this.orgRevision === revision
        ) {
          this.refreshing = false;
        }
        if (refreshes.get(requestKey) === refreshPromise) {
          refreshes.delete(requestKey);
        }
      });
      refreshes.set(requestKey, refreshPromise);

      return refreshPromise;
    },
  },
});
