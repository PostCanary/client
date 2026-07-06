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
import type { CardDesign, CardPurpose, OfferStackItem } from "@/types/campaign";

function makeCard(
  purpose: CardPurpose = "offer",
  offerItems: OfferStackItem[] = [],
): CardDesign {
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
      offerItems,
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

function mountOfferSection(offerItems: OfferStackItem[] = []) {
  return mount(EditPanel, {
    props: {
      card: makeCard("offer", offerItems),
      brandKit: null,
      requestedEditor: null,
      mode: "section",
      section: "offer" as any,
    },
  });
}

// POS-124: the main offer-text field must be disabled (with an inline
// hint) whenever ANY coupon tier exists, since every front template only
// prints offerText in the `{% else %}` of `{% if offer_tiers %}` — the
// field otherwise silently edits something the card never shows.
describe("EditPanel — offer text field vs coupon tiers (POS-124)", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.clearAllMocks());

  it("keeps the offer text field enabled with no tiers", async () => {
    const wrapper = mountOfferSection([]);
    await flushPromises();
    const textarea = wrapper.find('[data-testid="offer-text-input"]');
    expect(textarea.exists()).toBe(true);
    expect((textarea.element as HTMLTextAreaElement).disabled).toBe(false);
    expect(wrapper.find('[data-testid="offer-text-tiers-hint"]').exists()).toBe(false);
  });

  it("disables the offer text field and shows a hint with exactly 1 tier", async () => {
    const wrapper = mountOfferSection([{ label: "A/C Tune-Up", value: "$79" }]);
    await flushPromises();
    const textarea = wrapper.find('[data-testid="offer-text-input"]');
    expect((textarea.element as HTMLTextAreaElement).disabled).toBe(true);
    expect(wrapper.find('[data-testid="offer-text-tiers-hint"]').exists()).toBe(true);
  });

  it("disables the offer text field with 2+ tiers", async () => {
    const wrapper = mountOfferSection([
      { label: "Good", value: "$79" },
      { label: "Better", value: "$99" },
    ]);
    await flushPromises();
    const textarea = wrapper.find('[data-testid="offer-text-input"]');
    expect((textarea.element as HTMLTextAreaElement).disabled).toBe(true);
  });

  it("re-enables the field immediately after removing the last tier", async () => {
    const wrapper = mountOfferSection([{ label: "Good", value: "$79" }]);
    await flushPromises();
    expect(
      (wrapper.find('[data-testid="offer-text-input"]').element as HTMLTextAreaElement).disabled,
    ).toBe(true);

    await wrapper.find('[data-testid="offer-tier-remove-0"]').trigger("click");
    await flushPromises();

    const textarea = wrapper.find('[data-testid="offer-text-input"]');
    expect((textarea.element as HTMLTextAreaElement).disabled).toBe(false);
    expect(wrapper.find('[data-testid="offer-text-tiers-hint"]').exists()).toBe(false);
  });
});
