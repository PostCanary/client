// src/stores/useBrandKitStore.ts
import { defineStore } from "pinia";
import { watch } from "vue";
import type { BrandKit } from "@/types/campaign";
import { getBrandKit, updateBrandKit, triggerScrape } from "@/api/brandKit";
import { useAuthStore } from "@/stores/auth";

export const useBrandKitStore = defineStore("brandKit", {
  state: () => ({
    brandKit: null as BrandKit | null,
    loading: false,
    hydrated: false,
    error: null as string | null,
  }),

  getters: {
    isComplete: (state): boolean => {
      return (state.brandKit?.completenessPercent ?? 0) >= 80;
    },
  },

  actions: {
    async fetch() {
      this.loading = true;
      this.error = null;
      try {
        this.brandKit = await getBrandKit();
        this.hydrated = true;
      } catch (e: any) {
        this.error = "Couldn't load your brand info — try again";
      } finally {
        this.loading = false;
      }
    },

    async update(partial: Partial<BrandKit>) {
      this.error = null;
      try {
        this.brandKit = await updateBrandKit(partial);
      } catch (e: any) {
        this.error = "Failed to update brand kit";
      }
    },

    async triggerScrape(websiteUrl?: string) {
      this.error = null;
      try {
        this.brandKit = await triggerScrape(websiteUrl);
      } catch (e: any) {
        this.error = "Failed to start website scan";
      }
    },

    /**
     * Watch for org switches and re-fetch brand kit.
     * Call this once from the app root or wizard mount.
     */
    setupOrgWatcher() {
      const auth = useAuthStore();
      watch(
        () => auth.orgId,
        (newOrgId, oldOrgId) => {
          if (newOrgId && newOrgId !== oldOrgId) {
            this.hydrated = false;
            this.fetch();
          }
        },
      );
    },
  },
});
