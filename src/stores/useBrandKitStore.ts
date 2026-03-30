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
      // MOCK MODE: provide mock brand kit without API
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        this.brandKit = {
          industry: "hvac",
          location: "Golden Valley, MN",
          businessName: "Total Comfort Heating & Cooling",
          websiteUrl: "https://totalcomfort.com",
          phone: "(612) 887-2109",
          logo: null,
          photos: [],
          reviews: [],
          certifications: [],
          completenessPercent: 85,
        } as any;
        this.hydrated = true;
        this.loading = false;
        return;
      }
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
      // MOCK MODE: update locally without API
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        this.brandKit = { ...this.brandKit, ...partial } as any;
        return;
      }
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
