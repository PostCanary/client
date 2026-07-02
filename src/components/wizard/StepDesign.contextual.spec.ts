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
  draftStore.setDesign = (() => {}) as any;
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
});
