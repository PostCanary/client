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
  uploadBrandPhoto,
  uploadBrandLogo,
  importStockPhoto as apiImportStockPhoto,
  generateAiImage as apiGenerateAiImage,
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

    // --- Brief #6 Task 5c: scrape progress for the progressive-loading UI ---
    // These read from the new orchestrator progress fields on scrapeProgress.
    // All optional — return sensible defaults so existing components that don't
    // read them continue to work.

    /** Current step label from the extraction pipeline (connecting/reading/...) */
    scrapeStep: (state): string | null => {
      return state.brandKit?.scrapeProgress?.step ?? null;
    },

    /** Human-readable progress message — "Downloading your photos..." */
    scrapeMessage: (state): string | null => {
      return state.brandKit?.scrapeProgress?.message ?? null;
    },

    /** How many steps of the orchestrator have finished (0-5). */
    scrapeCompletedSteps: (state): number => {
      return state.brandKit?.scrapeProgress?.completedSteps ?? 0;
    },

    /** Total steps in the orchestrator pipeline (5). Falls back to 5 if unset. */
    scrapeTotalSteps: (state): number => {
      return state.brandKit?.scrapeProgress?.totalSteps ?? 5;
    },

    /** 0-100 percentage for the progress bar. */
    scrapeProgressPercent(): number {
      const total = this.scrapeTotalSteps;
      if (total <= 0) return 0;
      return Math.round((this.scrapeCompletedSteps / total) * 100);
    },

    /** Which sources contributed to the current brand kit (firecrawl, google_places). */
    extractionSources: (state): string[] => {
      return state.brandKit?.extractionSources ?? [];
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
        // AI-scrape-triggers spec edge case #8: a page reload mid-scan
        // would otherwise leave `scraping` state on screen forever with
        // nobody polling for it to settle (this.scraping resets to false
        // on every fresh page load). Resume polling so the strip clears
        // and waitForScrapeSettled() below can actually resolve.
        if (this.brandKit?.scrapeStatus === "scraping" && !this.scraping) {
          this._pollScrapeStatus();
        }
      } catch (e: any) {
        this.error = "Couldn't load your brand info — try again";
      } finally {
        this.loading = false;
      }
    },

    /** S85: orgs that onboarded while ungated never ran the website
     * scrape (OnboardingModal skips it without the postcards feature),
     * and nothing else triggers one. When an approved org opens a design
     * surface with a never-scraped kit ("pending") and a known website
     * URL, kick the scrape off once. 409 (already scraping) is handled
     * inside triggerScrape. */
    async ensureScraped() {
      if (import.meta.env.VITE_SKIP_AUTH === "true") return;
      const auth = useAuthStore();
      if (!auth.hasPostcards) return;
      if (!this.hydrated) await this.fetch();
      if (this.brandKit?.scrapeStatus !== "pending") return;
      const url = (
        this.brandKit?.websiteUrl ||
        auth.profile?.website_url ||
        ""
      ).trim();
      if (!url) return;
      await this.triggerScrape(url);
    },

    /** S89 Fix B: wait for an in-flight scrape to settle before generation
     * reads the brand kit, so the first campaign isn't built from a sparse
     * kit. Resolves immediately with "idle" when nothing is scraping
     * (pending/absent kit) or in mock mode. Piggybacks on the existing
     * _pollScrapeStatus loop (starting it if it isn't already running —
     * e.g. right after a reload, see fetch() above) and just watches
     * `brandKit.scrapeStatus` for the poll to land on a terminal value. */
    async waitForScrapeSettled(
      timeoutMs = 130_000,
    ): Promise<"complete" | "failed" | "timeout" | "idle"> {
      if (import.meta.env.VITE_SKIP_AUTH === "true") return "idle";

      const settled = (): "complete" | "failed" | "idle" | null => {
        const status = this.brandKit?.scrapeStatus;
        if (!status || status === "pending") return "idle";
        if (status === "scraping") return null;
        if (status === "failed") return "failed";
        // complete | partial | skipped — all are terminal, usable states.
        return "complete";
      };

      const immediate = settled();
      if (immediate !== null) return immediate;

      if (!this.scraping) this._pollScrapeStatus();

      const startedAt = Date.now();
      return new Promise((resolve) => {
        const check = () => {
          const result = settled();
          if (result !== null) {
            resolve(result);
            return;
          }
          if (Date.now() - startedAt >= timeoutMs) {
            resolve("timeout");
            return;
          }
          setTimeout(check, 300);
        };
        check();
      });
    },

    /** S89 Fix A: rescan the (possibly-just-changed) website URL. Thin
     * wrapper over triggerScrape — 409 (already scraping) is swallowed
     * inside it. Self-guards against gated orgs, empty URLs, and mock
     * mode so callers (Business Info save, the Rescan button, the
     * failed-strip "Try again") don't need to repeat those checks. */
    async rescan(url: string): Promise<void> {
      if (import.meta.env.VITE_SKIP_AUTH === "true") return;
      const auth = useAuthStore();
      if (!auth.hasPostcards) return;
      const trimmed = url.trim();
      if (!trimmed) return;
      await this.triggerScrape(trimmed);
      // triggerScrape already starts polling when ITS OWN response comes
      // back "scraping". On the 409 path (a scan from elsewhere is already
      // running) it returns early without touching brandKit — make sure
      // polling is still active so this caller's UI reflects that scan.
      if (this.brandKit?.scrapeStatus === "scraping" && !this.scraping) {
        this._pollScrapeStatus();
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

    async uploadPhoto(file: File): Promise<string | null> {
      // Returns the new photo's URL on success (so the designer can select
      // it immediately), null on failure (this.error is set).
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        // Mock mode: add a local object URL
        const url = URL.createObjectURL(file);
        const photos = [...(this.brandKit?.photos ?? [])];
        photos.push({
          url,
          alt: file.name,
          qualityScore: 100,
          source: "upload",
          printReady: true,
        } as any);
        this.brandKit = { ...this.brandKit, photos } as any;
        return url;
      }
      this.error = null;
      try {
        const before = new Set(
          (this.brandKit?.photos ?? []).map((p) => p.url),
        );
        this.brandKit = await uploadBrandPhoto(file);
        const added = (this.brandKit?.photos ?? []).find(
          (p) => !before.has(p.url),
        );
        return added?.url ?? null;
      } catch (e: any) {
        this.error =
          e?.data?.error || e?.message || "Failed to upload photo";
        return null;
      }
    },

    /** S72 Business Info: upload an org logo. Returns true on success
     * (this.error set on failure). */
    async uploadLogo(file: File): Promise<boolean> {
      this.error = null;
      try {
        this.brandKit = await uploadBrandLogo(file);
        return true;
      } catch (e: any) {
        this.error = e?.data?.error || e?.message || "Failed to upload logo";
        return false;
      }
    },

    /** S72 stock photos: copy a Pexels image into the brand library.
     * Returns the new photo's /media URL (so the designer can apply it
     * to the card immediately), null on failure (this.error set). */
    async importStockPhoto(url: string, alt: string): Promise<string | null> {
      this.error = null;
      try {
        const before = new Set(
          (this.brandKit?.photos ?? []).map((p) => p.url),
        );
        this.brandKit = await apiImportStockPhoto(url, alt);
        const added = (this.brandKit?.photos ?? []).find(
          (p) => !before.has(p.url),
        );
        return added?.url ?? null;
      } catch (e: any) {
        this.error =
          e?.data?.error || e?.message || "Failed to import stock photo";
        return null;
      }
    },

    /** S72 AI images: generate a photo from a prompt into the brand
     * library. Returns the new photo's /media URL, null on failure. */
    async generateAiPhoto(prompt: string): Promise<string | null> {
      this.error = null;
      try {
        const before = new Set(
          (this.brandKit?.photos ?? []).map((p) => p.url),
        );
        this.brandKit = await apiGenerateAiImage(prompt);
        const added = (this.brandKit?.photos ?? []).find(
          (p) => !before.has(p.url),
        );
        return added?.url ?? null;
      } catch (e: any) {
        this.error =
          e?.data?.error || e?.message || "Image generation failed";
        return null;
      }
    },

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
      if (!selected) return;
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
