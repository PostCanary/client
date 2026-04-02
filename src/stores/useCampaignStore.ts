// src/stores/useCampaignStore.ts
import { defineStore } from "pinia";
import type { Campaign } from "@/api/campaigns";
import {
  getCampaigns,
  createCampaign as apiCreate,
  updateCampaign as apiUpdate,
  deleteCampaign as apiDelete,
  assignBatches as apiAssign,
  removeBatch as apiRemove,
} from "@/api/campaigns";

const LS_KEY = "mt:campaign:v1";

export const useCampaignStore = defineStore("campaign", {
  state: () => ({
    campaigns: [] as Campaign[],
    activeCampaignId: null as string | null,
    loading: false,
    hydrated: false,
  }),

  getters: {
    activeCampaign(state): Campaign | null {
      if (!state.activeCampaignId) return null;
      return state.campaigns.find((c) => c.id === state.activeCampaignId) ?? null;
    },

    /** Query string param for API calls. Returns "" for all campaigns, or "&campaign_id=<id>" */
    campaignQueryParam(state): string {
      return state.activeCampaignId
        ? `campaign_id=${state.activeCampaignId}`
        : "";
    },
  },

  actions: {
    hydrate() {
      if (this.hydrated) return;
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          this.activeCampaignId = data.activeCampaignId ?? null;
        }
      } catch {
        // ignore
      }
      this.hydrated = true;
    },

    persist() {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ activeCampaignId: this.activeCampaignId }),
      );
    },

    setActiveCampaign(id: string | null) {
      this.activeCampaignId = id;
      this.persist();
    },

    async fetchCampaigns() {
      this.loading = true;
      try {
        this.campaigns = await getCampaigns();
        // If active campaign was deleted, reset
        if (
          this.activeCampaignId &&
          !this.campaigns.find((c) => c.id === this.activeCampaignId)
        ) {
          this.activeCampaignId = null;
          this.persist();
        }
      } catch {
        // API unavailable (no backend or not authenticated) — keep existing state
      } finally {
        this.loading = false;
      }
    },

    async createCampaign(name: string, description?: string) {
      const campaign = await apiCreate(name, description);
      this.campaigns.unshift(campaign);
      return campaign;
    },

    async updateCampaign(
      id: string,
      data: { name?: string; description?: string },
    ) {
      const updated = await apiUpdate(id, data);
      const idx = this.campaigns.findIndex((c) => c.id === id);
      if (idx !== -1) this.campaigns[idx] = updated;
      return updated;
    },

    async deleteCampaign(id: string) {
      await apiDelete(id);
      this.campaigns = this.campaigns.filter((c) => c.id !== id);
      if (this.activeCampaignId === id) {
        this.activeCampaignId = null;
        this.persist();
      }
    },

    async assignBatches(campaignId: string, batchIds: string[]) {
      return apiAssign(campaignId, batchIds);
    },

    async removeBatch(campaignId: string, batchId: string) {
      return apiRemove(campaignId, batchId);
    },
  },
});
