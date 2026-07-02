import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

// Mock the brand-kit API so the EditPanel's onMounted feature probe and the
// map-generate call don't hit the network. mapsConfigured=true exposes the
// Service Area Map section for the neighborhood-map layout.
const generateMapImage = vi.fn();
vi.mock("@/api/brandKit", () => ({
  getMediaFeaturesCached: vi.fn().mockResolvedValue({
    stockConfigured: false,
    aiConfigured: false,
    mapsConfigured: true,
  }),
  generateMapImage: (...args: unknown[]) => generateMapImage(...args),
  searchStockPhotos: vi.fn(),
}));

import EditPanel from "./EditPanel.vue";
import type { CardDesign, CardPurpose } from "@/types/campaign";

function makeCard(purpose: CardPurpose = "offer"): CardDesign {
  return {
    cardNumber: 1,
    cardPurpose: purpose,
    templateId: "neighborhood-map-offer",
    renderTemplateId: "neighborhood-map-front-v1",
    previewImageUrl: "",
    overrides: {},
    resolvedContent: {
      headline: "We're in your neighborhood",
      offerText: "Get $50 OFF",
      offerTeaser: "$50 OFF",
      offerItems: [],
      photoUrl: "",
      reviewQuote: "Great service",
      reviewerName: "J. Smith",
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
  };
}

function mountPanel(card: CardDesign) {
  return mount(EditPanel, {
    props: { card, brandKit: null, requestedEditor: null },
  });
}

describe("EditPanel — Service Area Map (S76)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    generateMapImage.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the map section toggle on the neighborhood-map offer card", async () => {
    const wrapper = mountPanel(makeCard("offer"));
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-map-toggle"]').exists()).toBe(true);
  });

  it("hides the map section on proof cards (review panel replaces it)", async () => {
    const wrapper = mountPanel(makeCard("proof"));
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-map-toggle"]').exists()).toBe(false);
  });

  it("opens the radius selector + generate button and generates a map", async () => {
    generateMapImage.mockResolvedValue({
      ok: true,
      url: "/media/brand-photos/o/map-x.png",
      lat: 33.4,
      lng: -112.0,
      radiusMiles: 5,
      attribution: "© OpenStreetMap contributors © Geoapify",
      cached: false,
    });
    const wrapper = mountPanel(makeCard("offer"));
    await flushPromises();

    await wrapper.find('[data-testid="edit-map-toggle"]').trigger("click");
    // Radius options 1/2/3/5/10 render.
    expect(wrapper.find('[data-testid="map-radius-5"]').exists()).toBe(true);
    await wrapper.find('[data-testid="map-radius-5"]').trigger("click");
    await wrapper.find('[data-testid="map-generate"]').trigger("click");
    await flushPromises();

    // S80: radius + the default view controls (Standard zoom, ring on, no
    // offset) are forwarded.
    expect(generateMapImage).toHaveBeenCalledWith(5, {
      zoomDelta: 0,
      showRing: true,
      centerOffset: { dxMiles: 0, dyMiles: 0 },
    });
    // The new map URL is emitted via the update-field pattern.
    const emitted = wrapper.emitted("update-field");
    expect(emitted).toBeTruthy();
    expect(emitted!.some((e) => e[0] === "mapImageUrl" && e[1] === "/media/brand-photos/o/map-x.png")).toBe(true);
    // S80: the chosen view controls are persisted via update-map-settings.
    const settings = wrapper.emitted("update-map-settings");
    expect(settings).toBeTruthy();
    expect(settings![0]![0]).toMatchObject({ radiusMiles: 5, zoomDelta: 0, showRing: true });
  });

  it("forwards zoom, ring, and nudge controls and clamps the offset", async () => {
    generateMapImage.mockResolvedValue({
      ok: true,
      url: "/media/brand-photos/o/map-y.png",
      lat: 33.4,
      lng: -112.0,
      radiusMiles: 3,
      zoomDelta: 1,
      showRing: false,
      centerOffset: { dxMiles: 1, dyMiles: 0 },
      attribution: "x",
      cached: false,
    });
    const wrapper = mountPanel(makeCard("offer"));
    await flushPromises();
    await wrapper.find('[data-testid="edit-map-toggle"]').trigger("click");

    // Close-up zoom → +1
    await wrapper.find('[data-testid="map-zoom-1"]').trigger("click");
    await flushPromises();
    // Toggle the ring off
    await wrapper.find('[data-testid="map-ring-toggle"]').trigger("click");
    await flushPromises();
    // Nudge east once → dxMiles 1
    await wrapper.find('[data-testid="map-nudge-e"]').trigger("click");
    await flushPromises();

    const lastCall = generateMapImage.mock.calls[generateMapImage.mock.calls.length - 1];
    expect(lastCall?.[1]).toMatchObject({
      zoomDelta: 1,
      showRing: false,
      centerOffset: { dxMiles: 1, dyMiles: 0 },
    });
  });
});
