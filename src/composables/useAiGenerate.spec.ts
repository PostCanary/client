// S90 "Generate with AI" button: unit coverage for the click state machine —
// no-website→modal, scanned→direct-regen, unscanned→rescan+regen, and the
// edited→confirm gate. Mirrors the store-mocking style of
// useScrapeRegenWatcher.spec.ts (real Pinia stores, mocked API modules,
// spies on the store actions this composable orchestrates).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import {
  disarmScrapeRegenWatcher,
  isScrapeRunClaimed,
  releaseScrapeRunClaim,
} from "@/composables/scrapeRegenState";

vi.mock("@/api/brandKit", () => ({
  getBrandKit: vi.fn(),
  updateBrandKit: vi.fn(),
  triggerScrape: vi.fn(),
  addManualReview: vi.fn(),
  removeReview: vi.fn(),
  uploadBrandPhoto: vi.fn(),
  uploadBrandLogo: vi.fn(),
  importStockPhoto: vi.fn(),
  generateAiImage: vi.fn(),
}));
vi.mock("@/api/campaignDrafts", () => ({
  saveDraft: vi.fn().mockResolvedValue(undefined),
  getDraft: vi.fn(),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
  listDrafts: vi.fn(),
}));
vi.mock("@/composables/usePostcardGenerator", () => ({
  generateCards: vi.fn().mockResolvedValue([]),
  deriveTeaser: () => "",
}));

import { useAiGenerate } from "./useAiGenerate";

function grantPostcards() {
  const auth = useAuthStore();
  auth.me = {
    authenticated: true,
    org_id: "org-1",
    features: ["postcards"],
  } as any;
  return auth;
}

function seedDraft(
  draftStore: ReturnType<typeof useCampaignDraftStore>,
  designUserEdited = false,
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

describe("useAiGenerate", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    disarmScrapeRegenWatcher();
    releaseScrapeRunClaim();
  });

  afterEach(() => {
    disarmScrapeRegenWatcher();
    releaseScrapeRunClaim();
    vi.restoreAllMocks();
  });

  it("opens the website modal when there is no website on file", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { websiteUrl: "", scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);

    const { handleClick, showWebsiteModal } = useAiGenerate();
    await handleClick();

    expect(showWebsiteModal.value).toBe(true);
    expect(genSpy).not.toHaveBeenCalled();
  });

  it("skips rescan and regenerates directly when the kit already has a real scan", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "complete",
      extractionSources: ["firecrawl"],
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);
    const rescanSpy = vi.spyOn(brandKitStore, "rescan");

    const { handleClick } = useAiGenerate();
    await handleClick();

    expect(rescanSpy).not.toHaveBeenCalled();
    expect(genSpy).toHaveBeenCalledTimes(1);
  });

  it("a 'complete' status with no extraction sources still counts as never-scanned", async () => {
    // A kit can look "complete" from server defaults with no real
    // extraction pipeline having run — must not skip straight to
    // regeneration in that case.
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "complete",
      extractionSources: [],
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    vi.spyOn(draftStore, "generateCardsForDraft").mockResolvedValue(undefined);
    const rescanSpy = vi.spyOn(brandKitStore, "rescan").mockResolvedValue(undefined);
    vi.spyOn(brandKitStore, "waitForScrapeSettled").mockResolvedValue("complete");

    const { handleClick } = useAiGenerate();
    await handleClick();

    expect(rescanSpy).toHaveBeenCalledWith("totalcomfort.com");
  });

  it("rescans and waits for settle (claiming the run from the passive watcher) before regenerating when never scanned", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "pending",
      extractionSources: [],
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);

    const order: string[] = [];
    // The claim must be held for the whole scan+wait window (that's what
    // keeps the passive watcher from arming on the run's own → "scraping"
    // transition — see scrapeRegenState.ts), and released by the time the
    // flow completes.
    const rescanSpy = vi
      .spyOn(brandKitStore, "rescan")
      .mockImplementation(async () => {
        order.push(`rescan:claimed=${isScrapeRunClaimed()}`);
      });
    const waitSpy = vi
      .spyOn(brandKitStore, "waitForScrapeSettled")
      .mockImplementation(async () => {
        order.push(`wait:claimed=${isScrapeRunClaimed()}`);
        return "complete";
      });
    vi.spyOn(draftStore, "generateCardsForDraft").mockImplementation(async () => {
      order.push("generate");
    });

    const { handleClick } = useAiGenerate();
    await handleClick();

    expect(rescanSpy).toHaveBeenCalledWith("totalcomfort.com");
    expect(waitSpy).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["rescan:claimed=true", "wait:claimed=true", "generate"]);
    expect(isScrapeRunClaimed()).toBe(false);
  });

  it("proceeds to regenerate even when the scan settles failed", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "pending",
      extractionSources: [],
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    vi.spyOn(brandKitStore, "rescan").mockResolvedValue(undefined);
    vi.spyOn(brandKitStore, "waitForScrapeSettled").mockResolvedValue("failed");
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);

    const { handleClick } = useAiGenerate();
    await handleClick();

    expect(genSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a confirm modal instead of regenerating when the design has been user-edited", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "complete",
      extractionSources: ["firecrawl"],
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore, true);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);

    const { handleClick, showConfirmModal, confirmRegenerate } = useAiGenerate();
    await handleClick();

    expect(showConfirmModal.value).toBe(true);
    expect(genSpy).not.toHaveBeenCalled();

    await confirmRegenerate();
    expect(genSpy).toHaveBeenCalledTimes(1);
    expect(showConfirmModal.value).toBe(false);
  });

  it("cancelConfirm dismisses without regenerating", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "complete",
      extractionSources: ["firecrawl"],
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore, true);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);

    const { handleClick, showConfirmModal, cancelConfirm } = useAiGenerate();
    await handleClick();
    expect(showConfirmModal.value).toBe(true);

    cancelConfirm();
    expect(showConfirmModal.value).toBe(false);
    expect(genSpy).not.toHaveBeenCalled();
  });

  it("saves the website via the modal, then scans and regenerates", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { websiteUrl: "", scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    const genSpy = vi
      .spyOn(draftStore, "generateCardsForDraft")
      .mockResolvedValue(undefined);
    const updateSpy = vi
      .spyOn(brandKitStore, "update")
      .mockImplementation(async (partial) => {
        brandKitStore.brandKit = {
          ...brandKitStore.brandKit,
          ...partial,
        } as any;
      });
    const rescanSpy = vi.spyOn(brandKitStore, "rescan").mockResolvedValue(undefined);
    const waitSpy = vi
      .spyOn(brandKitStore, "waitForScrapeSettled")
      .mockResolvedValue("complete");

    const { handleClick, showWebsiteModal, websiteInput, submitWebsiteModal } =
      useAiGenerate();
    await handleClick();
    expect(showWebsiteModal.value).toBe(true);

    websiteInput.value = "newbiz.com";
    await submitWebsiteModal();

    expect(updateSpy).toHaveBeenCalledWith({ websiteUrl: "newbiz.com" });
    expect(rescanSpy).toHaveBeenCalledWith("newbiz.com");
    expect(waitSpy).toHaveBeenCalledTimes(1);
    expect(genSpy).toHaveBeenCalledTimes(1);
    expect(showWebsiteModal.value).toBe(false);
  });

  it("rejects an empty/whitespace-only website with an inline error and never calls update", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { websiteUrl: "", scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    const updateSpy = vi.spyOn(brandKitStore, "update");

    const { handleClick, websiteInput, websiteModalError, submitWebsiteModal } =
      useAiGenerate();
    await handleClick();

    websiteInput.value = "   ";
    await submitWebsiteModal();

    expect(websiteModalError.value).toBeTruthy();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("surfaces the store's error inline when saving the website fails", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { websiteUrl: "", scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    vi.spyOn(brandKitStore, "update").mockImplementation(async () => {
      brandKitStore.error = "Failed to update brand kit";
    });
    const rescanSpy = vi.spyOn(brandKitStore, "rescan");

    const { handleClick, websiteInput, websiteModalError, submitWebsiteModal, showWebsiteModal } =
      useAiGenerate();
    await handleClick();

    websiteInput.value = "newbiz.com";
    await submitWebsiteModal();

    expect(websiteModalError.value).toBe("Failed to update brand kit");
    expect(showWebsiteModal.value).toBe(true); // stays open on error
    expect(rescanSpy).not.toHaveBeenCalled();
  });

  it("cancelWebsiteModal leaves everything idle", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = { websiteUrl: "", scrapeStatus: "pending" } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);

    const { handleClick, showWebsiteModal, cancelWebsiteModal } = useAiGenerate();
    await handleClick();
    expect(showWebsiteModal.value).toBe(true);

    cancelWebsiteModal();
    expect(showWebsiteModal.value).toBe(false);
  });

  it("reflects scanning / generating state in the label and disables clicks (belt-and-suspenders no-op)", async () => {
    grantPostcards();
    const brandKitStore = useBrandKitStore();
    brandKitStore.hydrated = true;
    brandKitStore.brandKit = {
      websiteUrl: "totalcomfort.com",
      scrapeStatus: "scraping",
    } as any;
    const draftStore = useCampaignDraftStore();
    seedDraft(draftStore);
    const genSpy = vi.spyOn(draftStore, "generateCardsForDraft");
    const rescanSpy = vi.spyOn(brandKitStore, "rescan");

    const { handleClick, busy, label } = useAiGenerate();
    expect(busy.value).toBe(true);
    expect(label.value).toBe("Scanning your website…");

    await handleClick();
    expect(genSpy).not.toHaveBeenCalled();
    expect(rescanSpy).not.toHaveBeenCalled();
  });
});
