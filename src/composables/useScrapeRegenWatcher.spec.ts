// AI-scrape-triggers spec (2026-07-02), Fix C: arm/disarm one-shot logic
// for the post-scrape regen decision (silent refresh + toast when pristine,
// non-blocking banner when the customer already edited the design), plus
// the org-switch reset and the "never drop the Refresh click" backstop.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { disarmScrapeRegenWatcher, isScrapeRegenWatcherArmed } from "./scrapeRegenState";

const generateCardsMock = vi.fn().mockResolvedValue([]);
vi.mock("@/composables/usePostcardGenerator", () => ({
  generateCards: (...args: unknown[]) => generateCardsMock(...args),
  deriveTeaser: () => "",
}));
vi.mock("@/api/campaignDrafts", () => ({
  saveDraft: vi.fn().mockResolvedValue(undefined),
  getDraft: vi.fn(),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
  listDrafts: vi.fn(),
}));

import { useScrapeRegenWatcher } from "./useScrapeRegenWatcher";

function seedDraftWithCards(
  draftStore: ReturnType<typeof useCampaignDraftStore>,
  designUserEdited: boolean,
) {
  draftStore.draft = {
    id: "draft-1",
    campaignType: "targeted",
    currentStep: 3,
    completedSteps: [1, 2, 3],
    needsReviewSteps: [],
    goal: { goalType: "neighbor_marketing", sequenceLength: 3 } as any,
    targeting: null,
    audience: null,
    review: null,
    design: {
      templateId: "t",
      templateLayoutType: "full-bleed",
      isCustomUpload: false,
      customUploadUrl: null,
      sequenceCards: [{ cardNumber: 1 } as any],
    },
    designUserEdited,
  } as any;
}

function grantPostcards() {
  const auth = useAuthStore();
  auth.me = {
    authenticated: true,
    org_id: "org-1",
    features: ["postcards"],
  } as any;
  return auth;
}

describe("useScrapeRegenWatcher", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    disarmScrapeRegenWatcher();
    generateCardsMock.mockClear();
  });

  afterEach(() => {
    disarmScrapeRegenWatcher();
  });

  it("auto-refreshes + toasts on a pristine draft when the scan settles complete", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, false);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);

    const { toastMessage, bannerVisible } = useScrapeRegenWatcher();

    brandKitStore.brandKit = { scrapeStatus: "scraping" } as any;
    await nextTick();
    expect(isScrapeRegenWatcherArmed()).toBe(true);

    brandKitStore.brandKit = { scrapeStatus: "complete" } as any;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0)); // let maybeTrigger's await settle

    expect(genSpy).toHaveBeenCalledTimes(1);
    expect(toastMessage.value).toContain("Designs updated");
    expect(bannerVisible.value).toBe(false);
    expect(isScrapeRegenWatcherArmed()).toBe(false); // one-shot: disarmed after firing
  });

  it("arms at mount when a scan is ALREADY in flight (SPA navigation into the wizard)", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    // Kit hydrated as "scraping" BEFORE the composable mounts — the watch
    // never sees a → "scraping" transition for this run, so without the
    // init-time arm its settle would be silently ignored (S89 review
    // finding).
    brandKitStore.brandKit = { scrapeStatus: "scraping" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, false);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);

    const { toastMessage } = useScrapeRegenWatcher();
    expect(isScrapeRegenWatcherArmed()).toBe(true);

    brandKitStore.brandKit = { scrapeStatus: "complete" } as any;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(genSpy).toHaveBeenCalledTimes(1);
    expect(toastMessage.value).toContain("Designs updated");
  });

  it("shows a non-blocking banner instead of auto-refreshing when the design was edited", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, true);
    const genSpy = vi.spyOn(draftStore, "generateCardsForDraft");

    const { bannerVisible, toastMessage } = useScrapeRegenWatcher();

    brandKitStore.brandKit = { scrapeStatus: "scraping" } as any;
    await nextTick();
    brandKitStore.brandKit = { scrapeStatus: "complete" } as any;
    await nextTick();

    expect(genSpy).not.toHaveBeenCalled();
    expect(bannerVisible.value).toBe(true);
    expect(toastMessage.value).toBeNull();
  });

  it("takes no action on a scraping → failed transition", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, false);
    const genSpy = vi.spyOn(draftStore, "generateCardsForDraft");

    const { bannerVisible } = useScrapeRegenWatcher();

    brandKitStore.brandKit = { scrapeStatus: "scraping" } as any;
    await nextTick();
    brandKitStore.brandKit = { scrapeStatus: "failed" } as any;
    await nextTick();

    expect(genSpy).not.toHaveBeenCalled();
    expect(bannerVisible.value).toBe(false);
  });

  it("skips a run already consumed (disarmed) by generateCardsForDraft's own wait", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, false);
    const genSpy = vi.spyOn(draftStore, "generateCardsForDraft");

    useScrapeRegenWatcher();

    brandKitStore.brandKit = { scrapeStatus: "scraping" } as any;
    await nextTick();
    expect(isScrapeRegenWatcherArmed()).toBe(true);

    // Simulate generateCardsForDraft noticing the in-flight scan and
    // disarming before it awaits waitForScrapeSettled.
    disarmScrapeRegenWatcher();

    brandKitStore.brandKit = { scrapeStatus: "complete" } as any;
    await nextTick();
    await nextTick();

    expect(genSpy).not.toHaveBeenCalled();
  });

  it("drops a pending banner and re-arm state on an org switch (no cross-org banner)", async () => {
    const auth = grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, true);

    const { bannerVisible } = useScrapeRegenWatcher();

    brandKitStore.brandKit = { scrapeStatus: "scraping" } as any;
    await nextTick();
    brandKitStore.brandKit = { scrapeStatus: "complete" } as any;
    await nextTick();
    expect(bannerVisible.value).toBe(true);

    auth.me = { ...(auth.me as any), org_id: "org-2" };
    await nextTick();

    expect(bannerVisible.value).toBe(false);
    expect(isScrapeRegenWatcherArmed()).toBe(false);
  });

  it("refresh() never drops the click — waits out an in-flight generation, then runs its own", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraftWithCards(draftStore, true);

    let resolveFirst!: () => void;
    generateCardsMock.mockReset();
    generateCardsMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = () => resolve([]);
      }),
    );
    generateCardsMock.mockResolvedValue([]);

    const { refresh, bannerRefreshing } = useScrapeRegenWatcher();

    const firstGeneration = draftStore.generateCardsForDraft();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(draftStore.isGeneratingCards()).toBe(true);

    const refreshPromise = refresh();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(bannerRefreshing.value).toBe(true);
    // refresh() is waiting — it must not have queued a second call yet
    // (generateCardsForDraft's own re-entrancy guard would just no-op it).
    expect(generateCardsMock).toHaveBeenCalledTimes(1);

    resolveFirst();
    await firstGeneration;
    await refreshPromise;

    expect(generateCardsMock).toHaveBeenCalledTimes(2);
    expect(bannerRefreshing.value).toBe(false);
  });
});
