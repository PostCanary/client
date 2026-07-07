import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

// --- Mock the render composables so StepDesign mounts with a stable preview ---
vi.mock("@/composables/useCardPreview", () => ({
  useCardPreview: () => ({
    previewUrl: ref("blob:front"),
    loading: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  }),
}));
vi.mock("@/composables/useBackPreview", () => ({
  useBackPreview: () => ({
    previewUrl: ref("blob:back"),
    loading: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  }),
}));
vi.mock("@/composables/useRenderJob", () => ({
  useRenderJob: () => ({
    phase: ref("idle"),
    progress: ref(null),
    cards: ref([]),
    error: ref(null),
    start: vi.fn(),
  }),
}));
vi.mock("@/api/renderJobs", () => ({
  previewCard: vi.fn().mockResolvedValue({ blob: new Blob(), warnings: [] }),
}));
vi.mock("@/api/brandKit", () => ({
  generateMapImage: vi.fn(),
  getMediaFeaturesCached: vi.fn().mockResolvedValue({
    stockConfigured: false,
    aiConfigured: false,
    mapsConfigured: false,
  }),
  searchStockPhotos: vi.fn(),
}));

import StepDesign from "./StepDesign.vue";
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import type { CampaignDraft, CardDesign, CardPurpose } from "@/types/campaign";

function makeCard(n: number, purpose: CardPurpose): CardDesign {
  return {
    cardNumber: n,
    cardPurpose: purpose,
    templateId: "hac-1000-" + purpose,
    renderTemplateId: "hac-1000-front-v1",
    previewImageUrl: "",
    overrides: {},
    resolvedContent: {
      headline: "Comfort you can count on",
      offerText: "$50 OFF",
      offerTeaser: "$50 OFF",
      offerItems: [],
      photoUrl: "",
      reviewQuote: "Great",
      reviewerName: "J",
      phoneNumber: "(602) 555-1212",
      urgencyText: "",
      riskReversal: "",
      trustSignals: [],
      mapImageUrl: "",
    },
    backContent: {
      guarantee: "100% satisfaction guaranteed",
      certifications: [],
      licenseNumber: "",
      companyAddress: "",
      websiteUrl: "",
      qrCodeUrl: "",
      backTemplateId: "standard-back-v2",
      backSubhead: "",
      backBenefits: [],
      backServices: [],
      backHours: "",
    } as CardDesign["backContent"],
    headlineCandidates: [],
    offerReason: "",
    reviewReason: "",
    templateReason: "",
  } as CardDesign;
}

function seedStores() {
  const brandKitStore = useBrandKitStore();
  brandKitStore.brandKit = {
    industry: "hvac",
    location: "Phoenix, AZ",
    businessName: "Acme",
    websiteUrl: "https://a.example",
    phone: "(602) 555-1212",
    address: "123 Main",
    brandColors: ["#0b2d50", "#47bfa9"],
    logoUrl: null,
    googleRating: 4.9,
    reviewCount: 10,
    trustBadges: [],
    yearsInBusiness: 12,
    reviews: [],
    certifications: [],
  } as any;
  brandKitStore.hydrated = true;

  const draftStore = useCampaignDraftStore();
  draftStore.draft = {
    id: "11111111-1111-4111-8111-111111111111",
    orgId: "o",
    currentStep: 3,
    completedSteps: [1, 2],
    needsReviewSteps: [],
    campaignType: "targeted",
    goal: { goalType: "neighbor_marketing", sequenceLength: 3 },
    design: {
      templateId: "hac-1000-offer",
      templateLayoutType: "full-bleed",
      isCustomUpload: false,
      customUploadUrl: null,
      sequenceCards: [
        makeCard(1, "offer"),
        makeCard(2, "proof"),
        makeCard(3, "last_chance"),
      ],
    },
  } as unknown as CampaignDraft;
  draftStore.saveNow = (async () => {}) as any;
  // Single-owner refactor: card edits flow through setSequenceCards →
  // setDesign, so setDesign must stay REAL for the store to reflect edits.
  // Only the persistence side-effect is stubbed (no save timers/HTTP).
  draftStore._debounceSave = (() => {}) as any;
}

async function mountStep() {
  seedStores();
  const wrapper = mount(StepDesign, { attachTo: document.body });
  await flushPromises();
  return wrapper;
}

describe("StepDesign — contextual editing (S79 Phase-2)", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("opens an anchored popover when a tier-1 zone is clicked", async () => {
    const wrapper = await mountStep();
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(false);
    await wrapper.get('[data-testid="card-zone-headline"]').trigger("click");
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(true);
    // the popover hosts the headline editor inputs (section mode)
    expect(wrapper.find('[data-testid="headline-line-red1"]').exists()).toBe(true);
    // and the drawer is NOT open
    expect(wrapper.find('[data-testid="context-drawer"]').exists()).toBe(false);
  });

  it("clicking the photo zone opens the drawer (not a popover)", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="card-zone-photo"]').trigger("click");
    expect(wrapper.find('[data-testid="context-drawer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(false);
  });

  it("toolbar Colors button opens the Colors drawer", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="toolbar-colors"]').trigger("click");
    const drawer = wrapper.get('[data-testid="context-drawer"]');
    expect(drawer.text()).toContain("Colors");
    expect(wrapper.find('[data-testid="palette-brand"]').exists()).toBe(true);
  });

  it("toolbar Business button opens the Business drawer", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="toolbar-business"]').trigger("click");
    expect(wrapper.find('[data-testid="biz-name-input"]').exists()).toBe(true);
  });

  it("opening the drawer closes an open popover (one editor at a time)", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="card-zone-headline"]').trigger("click");
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(true);
    await wrapper.get('[data-testid="toolbar-colors"]').trigger("click");
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="context-drawer"]').exists()).toBe(true);
  });

  it("the drawer close button collapses it", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="toolbar-colors"]').trigger("click");
    await wrapper.get('[data-testid="context-drawer-close"]').trigger("click");
    expect(wrapper.find('[data-testid="context-drawer"]').exists()).toBe(false);
  });

  it("the popover close button dismisses it", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="card-zone-headline"]').trigger("click");
    await wrapper.get('[data-testid="zone-popover-close"]').trigger("click");
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(false);
  });

  it("switching to the Back side shows back zone hotspots and the Back Style toolbar button", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="side-toggle-back"]').trigger("click");
    await flushPromises();
    expect(wrapper.find('[data-testid="toolbar-back-style"]').exists()).toBe(true);
    // a back zone hotspot exists over the back PNG
    expect(
      wrapper.find('[data-testid="card-zone-back-subhead"]').exists(),
    ).toBe(true);
  });

  it("clicking a back zone opens a popover hosting the back editor", async () => {
    const wrapper = await mountStep();
    await wrapper.get('[data-testid="side-toggle-back"]').trigger("click");
    await flushPromises();
    await wrapper
      .get('[data-testid="card-zone-back-subhead"]')
      .trigger("click");
    expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-subhead-input"]').exists()).toBe(true);
  });

  describe("POS-130/131: front business zone + locked-zone cue", () => {
    it("clicking the front business zone opens the Business drawer (same as the toolbar button)", async () => {
      const wrapper = await mountStep();
      expect(wrapper.find('[data-testid="context-drawer"]').exists()).toBe(false);
      await wrapper.get('[data-testid="card-zone-business"]').trigger("click");
      expect(wrapper.find('[data-testid="context-drawer"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="biz-name-input"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(false);
    });

    it("clicking the front locked-zone catcher shows a non-editable hint and auto-hides it", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const wrapper = await mountStep();
        expect(wrapper.find('[data-testid="front-locked-zone-hint"]').exists()).toBe(false);
        await wrapper.get('[data-testid="front-locked-zone-catcher"]').trigger("click");
        const hint = wrapper.get('[data-testid="front-locked-zone-hint"]');
        expect(hint.text()).toContain("fixed for this template");
        vi.advanceTimersByTime(2300);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[data-testid="front-locked-zone-hint"]').exists()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("front zone hotspots (headline, business) win over the locked-zone catcher underneath them", async () => {
      const wrapper = await mountStep();
      await wrapper.get('[data-testid="card-zone-headline"]').trigger("click");
      expect(wrapper.find('[data-testid="zone-popover"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="front-locked-zone-hint"]').exists()).toBe(false);
    });

    it("switching sides clears a front locked-zone hint", async () => {
      const wrapper = await mountStep();
      await wrapper.get('[data-testid="front-locked-zone-catcher"]').trigger("click");
      expect(wrapper.find('[data-testid="front-locked-zone-hint"]').exists()).toBe(true);
      await wrapper.get('[data-testid="side-toggle-back"]').trigger("click");
      await flushPromises();
      expect(wrapper.find('[data-testid="front-locked-zone-hint"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="back-locked-zone-hint"]').exists()).toBe(false);
    });
  });
});

describe("StepDesign — single-owner card state (POS-121/123/119.2 clobber class)", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  async function mountWithStore() {
    const wrapper = await mountStep();
    return { wrapper, draftStore: useCampaignDraftStore() };
  }

  it("an edit after a store-side regeneration keeps the fresh cards (no stale-mirror clobber)", async () => {
    const { wrapper, draftStore } = await mountWithStore();

    // Simulate the AI path: the STORE is rewritten with fresh cards while
    // the component is mounted (useAiGenerate → generateCardsForDraft).
    const fresh = [
      makeCard(1, "offer"),
      makeCard(2, "proof"),
      makeCard(3, "last_chance"),
    ].map((c, i) => ({
      ...c,
      resolvedContent: {
        ...c.resolvedContent,
        headline: `AI FRESH ${i + 1}`,
      },
    }));
    draftStore.setSequenceCards(fresh, { source: "system" });
    await flushPromises();

    // The editing surface reads the fresh cards immediately.
    await wrapper.get('[data-testid="card-zone-headline"]').trigger("click");
    // (splitHeadline distributes the headline across line slots — line 1
    // carries the leading words.)
    const line1 = wrapper.get('[data-testid="headline-line-red1"]');
    expect((line1.element as HTMLInputElement).value).toContain("AI FRESH");

    // First user edit after regeneration — the historical clobber moment.
    await line1.setValue("USER EDIT 1");
    await flushPromises();

    const stored = draftStore.draft!.design!.sequenceCards!;
    // Card 1 carries the user's edit...
    expect(stored[0]!.resolvedContent.headline).toContain("USER EDIT 1");
    // ...and cards 2/3 keep the AI-fresh content instead of reverting to
    // the pre-regeneration cards (the POS-121 data-loss signature).
    expect(stored[1]!.resolvedContent.headline).toBe("AI FRESH 2");
    expect(stored[2]!.resolvedContent.headline).toBe("AI FRESH 3");
  });

  it("a template switch writes cards and layout to the store in one write", async () => {
    const { wrapper, draftStore } = await mountWithStore();
    await wrapper.get('[data-testid="toolbar-try-template"]').trigger("click");
    await flushPromises();
    const browser = wrapper.findComponent({ name: "TemplateBrowser" });
    expect(browser.exists()).toBe(true);
    browser.vm.$emit("select", "side-split");
    await flushPromises();
    expect(draftStore.draft!.design!.templateLayoutType).toBe("side-split");
    expect(
      draftStore.draft!.design!.sequenceCards![0]!.renderTemplateId,
    ).toBe("side-split-front-v1");
  });
});
