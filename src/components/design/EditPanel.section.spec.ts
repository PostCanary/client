import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/api/brandKit", () => ({
  getMediaFeaturesCached: vi.fn().mockResolvedValue({
    stockConfigured: false,
    aiConfigured: false,
    mapsConfigured: true,
  }),
  generateMapImage: vi.fn(),
  searchStockPhotos: vi.fn(),
}));

import EditPanel from "./EditPanel.vue";
import type { CardDesign, CardPurpose } from "@/types/campaign";

function makeCard(purpose: CardPurpose = "offer"): CardDesign {
  return {
    cardNumber: 1,
    cardPurpose: purpose,
    templateId: "hac-1000-offer",
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
      guarantee: "",
      certifications: [],
      licenseNumber: "",
      companyAddress: "",
      websiteUrl: "",
      qrCodeUrl: "",
    },
    headlineCandidates: [],
    offerReason: "",
    reviewReason: "",
    templateReason: "",
  } as CardDesign;
}

function mountSection(section: string) {
  return mount(EditPanel, {
    props: {
      card: makeCard(),
      brandKit: null,
      requestedEditor: null,
      mode: "section",
      section: section as any,
    },
  });
}

describe("EditPanel — section mode (S79 Phase-2)", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.clearAllMocks());

  it("renders ONLY the requested section's inputs (no accordion toggles)", async () => {
    const wrapper = mountSection("headline");
    await flushPromises();
    // The headline line inputs are present...
    expect(wrapper.find('[data-testid="headline-line-red1"]').exists()).toBe(true);
    // ...but the accordion toggle buttons are gone.
    expect(wrapper.find('[data-testid="edit-colors-toggle"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="edit-business-toggle"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="reset-to-original"]').exists()).toBe(false);
  });

  it("section=colors shows the palette controls and emits update-colors", async () => {
    const wrapper = mountSection("colors");
    await flushPromises();
    expect(wrapper.find('[data-testid="palette-brand"]').exists()).toBe(true);
    // headline inputs are NOT rendered in the colors section
    expect(wrapper.find('[data-testid="headline-line-red1"]').exists()).toBe(false);
  });

  it("section=business shows the business form fields", async () => {
    const wrapper = mountSection("business");
    await flushPromises();
    expect(wrapper.find('[data-testid="biz-name-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="biz-save"]').exists()).toBe(true);
  });

  it("still emits update-headline-lines from the section-mode headline inputs", async () => {
    const wrapper = mountSection("headline");
    await flushPromises();
    await wrapper.get('[data-testid="headline-line-red1"]').setValue("New top");
    expect(wrapper.emitted("update-headline-lines")).toBeTruthy();
  });

  it("panel mode still renders the full accordion (legacy default)", async () => {
    const wrapper = mount(EditPanel, {
      props: { card: makeCard(), brandKit: null, requestedEditor: null },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-colors-toggle"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reset-to-original"]').exists()).toBe(true);
  });

  // --- S81 ON-CANVAS photo positioning (entry button replaces S80 mini-frame) ---

  it("photo section shows the on-canvas Adjust-position entry once a photo is applied", async () => {
    const card = makeCard();
    card.resolvedContent.photoUrl = "/media/brand-photos/o/p.jpg";
    const wrapper = mount(EditPanel, {
      props: {
        card,
        brandKit: null,
        requestedEditor: null,
        mode: "section",
        section: "photo" as any,
      },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="photo-adjust-section"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="photo-adjust-entry"]').exists()).toBe(true);
    // The S80 in-panel mini-frame is gone — direct manipulation lives on the canvas.
    expect(wrapper.find('[data-testid="photo-crop-adjuster"]').exists()).toBe(false);
  });

  it("hides the Adjust-position entry when no photo is applied", async () => {
    const wrapper = mount(EditPanel, {
      props: {
        card: makeCard(),
        brandKit: null,
        requestedEditor: null,
        mode: "section",
        section: "photo" as any,
      },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="photo-adjust-section"]').exists()).toBe(false);
  });

  it("emits enter-photo-adjust with the photoCrop field when the entry button is clicked", async () => {
    const card = makeCard();
    card.resolvedContent.photoUrl = "/media/brand-photos/o/p.jpg";
    const wrapper = mount(EditPanel, {
      props: {
        card,
        brandKit: null,
        requestedEditor: null,
        mode: "section",
        section: "photo" as any,
      },
    });
    await flushPromises();
    await wrapper.find('[data-testid="photo-adjust-entry"]').trigger("click");
    const emitted = wrapper.emitted("enter-photo-adjust");
    expect(emitted).toBeTruthy();
    expect(emitted![emitted!.length - 1]![0]).toBe("photoCrop");
  });
});
