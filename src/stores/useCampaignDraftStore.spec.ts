// Generation-overwrite race (S73): async card generation completing AFTER
// a user design edit must never silently replace what's on screen.
//
// Also covers the AI-scrape-triggers spec (2026-07-02): generateCardsForDraft
// waiting on an in-flight scrape before reading the brand kit (Fix B), and
// setDesign's "user"/"system" source flag driving designUserEdited (Fix C).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const generateCardsMock = vi.fn();
vi.mock("@/composables/usePostcardGenerator", () => ({
  generateCards: (...args: unknown[]) => generateCardsMock(...args),
  deriveTeaser: () => "",
}));

// A plain mutable object (read through getters, so the SAME closure state
// is visible however many times useBrandKitStore() is called) — lets tests
// change brandKit/scrapeStatus mid-flight without needing the real store.
const brandKitStoreState: { hydrated: boolean; brandKit: any } = {
  hydrated: true,
  brandKit: { businessName: "Acme" },
};
const waitForScrapeSettledMock = vi.fn().mockResolvedValue("idle");
vi.mock("@/stores/useBrandKitStore", () => ({
  useBrandKitStore: () => ({
    get hydrated() {
      return brandKitStoreState.hydrated;
    },
    get brandKit() {
      return brandKitStoreState.brandKit;
    },
    waitForScrapeSettled: (...args: unknown[]) =>
      waitForScrapeSettledMock(...args),
  }),
}));
vi.mock("@/api/campaignDrafts", () => ({
  saveDraft: vi.fn().mockResolvedValue(undefined),
  getDraft: vi.fn(),
  createDraft: vi.fn(),
  deleteDraft: vi.fn(),
  listDrafts: vi.fn(),
}));

import { useCampaignDraftStore } from "./useCampaignDraftStore";

function makeCard(n: number, purpose: string) {
  return {
    cardNumber: n,
    cardPurpose: purpose,
    templateId: `full-bleed-${purpose}`,
    renderTemplateId: "hac-1000-front-v1",
    previewImageUrl: "",
    overrides: {},
    resolvedContent: { headline: `Generated ${n}` },
    backContent: {},
    headlineCandidates: [],
    offerReason: "",
    reviewReason: "",
    templateReason: "",
  } as any;
}

function seedDraft(store: ReturnType<typeof useCampaignDraftStore>) {
  store.draft = {
    id: "draft-1",
    campaignType: "targeted",
    currentStep: 3,
    completedSteps: [1, 2],
    needsReviewSteps: [],
    goal: { goalType: "neighbor_marketing", sequenceLength: 3 } as any,
    targeting: null,
    audience: null,
    design: null,
    review: null,
  } as any;
}

describe("generateCardsForDraft — overwrite race", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    generateCardsMock.mockReset();
    waitForScrapeSettledMock.mockReset().mockResolvedValue("idle");
    brandKitStoreState.hydrated = true;
    brandKitStoreState.brandKit = { businessName: "Acme" };
  });

  it("applies generated cards on the undisturbed path", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    generateCardsMock.mockResolvedValue([
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ]);

    await store.generateCardsForDraft();

    expect(store.draft!.design?.sequenceCards).toHaveLength(3);
    expect(store.draft!.design?.sequenceCards?.[0]?.resolvedContent.headline).toBe(
      "Generated 1",
    );
  });

  it("keeps the user's cards when the design was edited mid-generation", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);

    let resolveGeneration!: (cards: unknown[]) => void;
    generateCardsMock.mockReturnValue(
      new Promise((resolve) => (resolveGeneration = resolve)),
    );
    const running = store.generateCardsForDraft();

    // User edits while the AI calls are in flight (e.g. a layout switch
    // remapping existing cards, or any card edit).
    const userCard = {
      ...makeCard(1, "offer"),
      renderTemplateId: "photo-top-front-v1",
      resolvedContent: { headline: "User edited" },
    };
    store.setDesign({
      templateId: userCard.templateId,
      templateLayoutType: "photo-top",
      isCustomUpload: false,
      customUploadUrl: null,
      sequenceCards: [userCard],
    } as any);

    resolveGeneration([
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ]);
    await running;

    expect(store.draft!.design?.sequenceCards).toHaveLength(1);
    expect(store.draft!.design?.sequenceCards?.[0]?.resolvedContent.headline).toBe(
      "User edited",
    );
    expect(store.draft!.design?.templateLayoutType).toBe("photo-top");
  });

  it("honors a card-less layout pick made mid-generation", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);

    let resolveGeneration!: (cards: unknown[]) => void;
    generateCardsMock.mockReturnValue(
      new Promise((resolve) => (resolveGeneration = resolve)),
    );
    const running = store.generateCardsForDraft();

    // selectTemplate over zero cards stores only the layout choice.
    store.setDesign({
      templateId: "",
      templateLayoutType: "photo-top",
      isCustomUpload: false,
      customUploadUrl: null,
      sequenceCards: [],
    } as any);

    resolveGeneration([
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ]);
    await running;

    const design = store.draft!.design!;
    // Generated cards still arrive (the user had nothing on screen)...
    expect(design.sequenceCards).toHaveLength(3);
    // ...but remapped onto the layout the user picked.
    expect(design.templateLayoutType).toBe("photo-top");
    expect(design.sequenceCards[0]!.renderTemplateId).toBe("photo-top-front-v1");
    expect(design.sequenceCards[0]!.templateId).toBe("photo-top-offer");
    // The layout pick is a real customer choice — the regeneration must
    // NOT mark the draft pristine, or a later post-scrape auto-refresh
    // would silently revert their layout to the recommended one (S89
    // review finding). Edited drafts get the prompt banner instead.
    expect(store.draft!.designUserEdited).toBe(true);
  });
});

describe("generateCardsForDraft — S89 Fix B: waits for an in-flight scrape", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    generateCardsMock.mockReset();
    waitForScrapeSettledMock.mockReset().mockResolvedValue("idle");
    brandKitStoreState.hydrated = true;
    brandKitStoreState.brandKit = { businessName: "Acme" };
  });

  it("does not wait when the kit isn't mid-scrape", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    generateCardsMock.mockResolvedValue([makeCard(1, "offer")]);

    await store.generateCardsForDraft();

    expect(waitForScrapeSettledMock).not.toHaveBeenCalled();
  });

  it("waits for the scan to settle, then reads the CURRENT (not stale) brand kit", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    brandKitStoreState.brandKit = { businessName: "Acme", scrapeStatus: "scraping" };

    let resolveWait!: (status: string) => void;
    waitForScrapeSettledMock.mockReturnValue(
      new Promise((resolve) => (resolveWait = resolve)),
    );
    generateCardsMock.mockResolvedValue([
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ]);

    const running = store.generateCardsForDraft();
    // Let the store's dynamic import + synchronous prelude reach the await.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(waitForScrapeSettledMock).toHaveBeenCalledTimes(1);
    expect(generateCardsMock).not.toHaveBeenCalled();

    // The scan settles with FRESH data — mutated before the wait resolves,
    // mirroring the real store where polling updates brandKit before
    // waitForScrapeSettled's promise settles.
    brandKitStoreState.brandKit = {
      businessName: "Acme Fresh From Scan",
      scrapeStatus: "complete",
    };
    resolveWait("complete");
    await running;

    expect(generateCardsMock).toHaveBeenCalledWith(
      expect.objectContaining({ businessName: "Acme Fresh From Scan" }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("proceeds with fallback content on timeout/failed rather than looping", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    brandKitStoreState.brandKit = { businessName: "Acme", scrapeStatus: "scraping" };
    waitForScrapeSettledMock.mockResolvedValue("timeout");
    generateCardsMock.mockResolvedValue([makeCard(1, "offer")]);

    await store.generateCardsForDraft();

    expect(generateCardsMock).toHaveBeenCalledTimes(1);
    expect(store.draft!.design?.sequenceCards).toHaveLength(1);
  });
});

describe("setDesign — S89 Fix C: designUserEdited pristine tracking", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    generateCardsMock.mockReset();
    waitForScrapeSettledMock.mockReset().mockResolvedValue("idle");
    brandKitStoreState.hydrated = true;
    brandKitStoreState.brandKit = { businessName: "Acme" };
  });

  const anyDesign = {
    templateId: "t",
    templateLayoutType: "full-bleed",
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: [],
  } as any;

  it('defaults to "user" and marks the draft edited', () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign);
    expect(store.draft!.designUserEdited).toBe(true);
  });

  it('a "system" source does not mark the draft edited', () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign, { source: "system" });
    expect(store.draft!.designUserEdited).toBeFalsy();
  });

  it('a "system" source (review-defaults touch-up) does not clear a prior user edit', () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign); // customer edit
    expect(store.draft!.designUserEdited).toBe(true);

    store.setDesign(anyDesign, { source: "system" }); // review-defaults commit
    expect(store.draft!.designUserEdited).toBe(true);
  });

  it("a full regeneration resets designUserEdited back to false", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign); // simulate a prior edit
    expect(store.draft!.designUserEdited).toBe(true);

    generateCardsMock.mockResolvedValue([
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ]);
    await store.generateCardsForDraft();

    expect(store.draft!.designUserEdited).toBe(false);
  });
});

describe("setDesign / markDesignReviewed — POS-138: step 3 checkmark requires review", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    generateCardsMock.mockReset();
    waitForScrapeSettledMock.mockReset().mockResolvedValue("idle");
    brandKitStoreState.hydrated = true;
    brandKitStoreState.brandKit = { businessName: "Acme" };
  });

  const anyDesign = {
    templateId: "t",
    templateLayoutType: "full-bleed",
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: [],
  } as any;

  it('a "system" source (auto-generation) populates the design but leaves step 3 incomplete', () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign, { source: "system" });
    expect(store.draft!.design).toEqual(anyDesign);
    expect(store.draft!.completedSteps).not.toContain(3);
  });

  it('a "user" source (real edit) completes step 3', () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign);
    expect(store.draft!.completedSteps).toContain(3);
  });

  it("markDesignReviewed completes step 3 and clears it from review without touching the design", () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setDesign(anyDesign, { source: "system" });
    store.draft!.needsReviewSteps = [3];
    expect(store.draft!.completedSteps).not.toContain(3);

    store.markDesignReviewed();

    expect(store.draft!.completedSteps).toContain(3);
    expect(store.draft!.needsReviewSteps).not.toContain(3);
    expect(store.draft!.design).toEqual(anyDesign);
  });

  it("a full (system) regeneration via generateCardsForDraft never completes step 3 on its own", async () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    generateCardsMock.mockResolvedValue([
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ]);

    await store.generateCardsForDraft();

    expect(store.draft!.design?.sequenceCards).toHaveLength(3);
    expect(store.draft!.completedSteps).not.toContain(3);
  });

  it("an existing step-3 completion (persisted draft) is left alone by a later system write", () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.draft!.completedSteps = [1, 2, 3];
    store.setDesign(anyDesign, { source: "system" });
    expect(store.draft!.completedSteps).toContain(3);
  });
});

describe("setSequenceCards — single-owner card writes (2026-07-07 refactor)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    generateCardsMock.mockReset();
    waitForScrapeSettledMock.mockReset().mockResolvedValue("idle");
    brandKitStoreState.hydrated = true;
    brandKitStoreState.brandKit = { businessName: "Acme" };
  });

  const card = (templateId: string) =>
    ({ cardNumber: 1, cardPurpose: "offer", templateId }) as any;

  it("writes cards and derives templateId from card 1", () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setSequenceCards([card("side-split-offer")]);
    expect(store.draft!.design!.sequenceCards).toHaveLength(1);
    expect(store.draft!.design!.templateId).toBe("side-split-offer");
    expect(store.draft!.designUserEdited).toBe(true);
  });

  it("preserves the current layout when opts.layout is omitted", () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setSequenceCards([card("a")], { layout: "side-split" as any });
    store.setSequenceCards([card("b")]);
    expect(store.draft!.design!.templateLayoutType).toBe("side-split");
  });

  it("updates the layout when opts.layout is given", () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setSequenceCards([card("a")], { layout: "photo-hero" as any });
    expect(store.draft!.design!.templateLayoutType).toBe("photo-hero");
  });

  it('forwards a "system" source (no user-edit mark, step 3 stays incomplete)', () => {
    const store = useCampaignDraftStore();
    seedDraft(store);
    store.setSequenceCards([card("a")], { source: "system" });
    expect(store.draft!.designUserEdited).toBeFalsy();
    expect(store.draft!.completedSteps).not.toContain(3);
  });
});
