// src/stores/useBrandKitStore.ts
import { defineStore } from "pinia";
import { watch } from "vue";
import type { BrandKit } from "@/types/campaign";
import {
  getBrandKit,
  updateBrandKit,
  triggerScrape,
  addManualReview,
  removeReview as apiRemoveReview,
} from "@/api/brandKit";
import { useAuthStore } from "@/stores/auth";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 60; // 120s max polling time

export const useBrandKitStore = defineStore("brandKit", {
  state: () => ({
    brandKit: null as BrandKit | null,
    loading: false,
    hydrated: false,
    error: null as string | null,
    scraping: false,
  }),

  getters: {
    isComplete: (state): boolean => {
      return (state.brandKit?.completenessPercent ?? 0) >= 80;
    },
    isScraping: (state): boolean => {
      return state.scraping;
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
      // MOCK MODE: simulate scrape locally
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        this.brandKit = {
          ...this.brandKit,
          scrapeStatus: "complete",
          completenessPercent: 85,
        } as any;
        return;
      }

      this.error = null;
      try {
        this.brandKit = await triggerScrape(websiteUrl);
      } catch (e: any) {
        // 409 = already scraping
        if (e?.response?.status === 409 || e?.status === 409) {
          this.error = "A website scan is already running";
          return;
        }
        this.error = "Failed to start website scan";
        return;
      }

      // Start polling if scrape is in progress
      if (this.brandKit?.scrapeStatus === "scraping") {
        this._pollScrapeStatus();
      }
    },

    async _pollScrapeStatus() {
      this.scraping = true;
      let polls = 0;

      const poll = async () => {
        if (polls >= MAX_POLLS) {
          this.scraping = false;
          this.error = "Website scan timed out — you can enter your info manually";
          return;
        }

        try {
          this.brandKit = await getBrandKit();
        } catch {
          // Network error during poll — keep trying
        }

        if (
          this.brandKit?.scrapeStatus &&
          this.brandKit.scrapeStatus !== "scraping"
        ) {
          // Scrape finished (complete, partial, or failed)
          this.scraping = false;
          return;
        }

        polls++;
        setTimeout(poll, POLL_INTERVAL_MS);
      };

      // Start polling after first interval
      setTimeout(poll, POLL_INTERVAL_MS);
    },

    // ----- Manual Review Management -----

    async addReview(reviewText: string, reviewerName: string, rating: number) {
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        // Mock mode: add locally
        const reviews = [...(this.brandKit?.reviews ?? [])];
        reviews.push({
          quote: reviewText.split(" ").slice(0, 35).join(" "),
          fullText: reviewText,
          reviewerName,
          rating,
          source: "manual",
          reason: "",
        });
        this.brandKit = { ...this.brandKit, reviews } as any;
        return;
      }
      this.error = null;
      try {
        this.brandKit = await addManualReview({
          review_text: reviewText,
          reviewer_name: reviewerName,
          rating,
        });
      } catch {
        this.error = "Failed to add review";
      }
    },

    async removeReview(index: number) {
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        const reviews = [...(this.brandKit?.reviews ?? [])];
        reviews.splice(index, 1);
        this.brandKit = { ...this.brandKit, reviews } as any;
        return;
      }
      this.error = null;
      try {
        this.brandKit = await apiRemoveReview(index);
      } catch {
        this.error = "Failed to remove review";
      }
    },

    selectReview(index: number) {
      if (!this.brandKit?.reviews?.length) return;
      const reviews = [...this.brandKit.reviews];
      if (index < 0 || index >= reviews.length) return;
      const [selected] = reviews.splice(index, 1);
      reviews.unshift(selected);
      this.brandKit = { ...this.brandKit, reviews } as any;
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
