import { defineStore } from "pinia";
import { listDrafts } from "@/api/campaignDrafts";
import type { CampaignDraft } from "@/types/campaign";

let refreshInFlight: Promise<boolean> | null = null;

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
    hasLoaded: false,
    refreshing: false,
    error: null as string | null,
  }),

  getters: {
    count: (state): number | null =>
      state.hasLoaded ? state.drafts.length : null,
  },

  actions: {
    async refresh(): Promise<boolean> {
      if (refreshInFlight) return refreshInFlight;

      this.refreshing = true;
      refreshInFlight = (async () => {
        try {
          const drafts = await listDrafts();
          this.drafts = drafts;
          this.hasLoaded = true;
          this.error = null;
          return true;
        } catch {
          // Keep the last successful dataset. On initial failure hasLoaded
          // remains false, so consumers hide the badge instead of showing a
          // fabricated zero.
          this.error = "Unable to refresh campaign drafts.";
          return false;
        } finally {
          this.refreshing = false;
          refreshInFlight = null;
        }
      })();

      return refreshInFlight;
    },
  },
});
