// Generation-overwrite race (S73): async card generation completing AFTER
// a user design edit must never silently replace what's on screen.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const generateCardsMock = vi.fn();
vi.mock("@/composables/usePostcardGenerator", () => ({
  generateCards: (...args: unknown[]) => generateCardsMock(...args),
  deriveTeaser: () => "",
}));
vi.mock("@/stores/useBrandKitStore", () => ({
  useBrandKitStore: () => ({ hydrated: true, brandKit: { businessName: "Acme" } }),
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
  });
});
