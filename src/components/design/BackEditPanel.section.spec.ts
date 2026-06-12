import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BackEditPanel from "./BackEditPanel.vue";
import type { BrandKit, CardDesign } from "@/types/campaign";

const STUBS = { RouterLink: { template: "<a><slot /></a>" } };

function makeBrandKit(overrides: Partial<BrandKit> = {}): BrandKit {
  return {
    id: "bk-1",
    orgId: "org-1",
    businessName: "Acme HVAC",
    location: "Phoenix, AZ",
    address: "123 Main St",
    phone: "(602) 555-1212",
    websiteUrl: "acmehvac.com",
    logoUrl: null,
    licenseNumber: "ROC #1",
    logoQualityScore: null,
    brandColors: ["#dc3228"],
    photos: [],
    googleRating: null,
    reviews: [],
    certifications: [],
    currentOffers: [],
    guarantees: [],
    yearsInBusiness: 12,
    industry: "hvac",
    serviceTypes: [],
    scrapeStatus: "complete",
    ...overrides,
  } as BrandKit;
}

function makeBackContent(
  overrides: Partial<CardDesign["backContent"]> = {},
): CardDesign["backContent"] {
  return {
    guarantee: "100% Satisfaction Guaranteed",
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
    ...overrides,
  };
}

function mountSection(
  section: string,
  backContent: Partial<CardDesign["backContent"]> = {},
) {
  return mount(BackEditPanel, {
    props: {
      backContent: makeBackContent(backContent),
      brandKit: makeBrandKit(),
      mode: "section",
      section: section as any,
    },
    global: { stubs: STUBS },
  });
}

describe("BackEditPanel — section mode (S79 Phase-2)", () => {
  it("section=back-subhead shows only the subhead input", () => {
    const wrapper = mountSection("back-subhead");
    expect(wrapper.find('[data-testid="back-subhead-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-guarantee-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="back-style-selector"]').exists()).toBe(false);
  });

  it("section=back-guarantee shows only the guarantee input and still emits", async () => {
    const wrapper = mountSection("back-guarantee");
    const ta = wrapper.get('[data-testid="back-guarantee-input"]');
    expect(wrapper.find('[data-testid="back-subhead-input"]').exists()).toBe(false);
    await ta.setValue("New guarantee");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some((e) => (e[0] as any).guarantee === "New guarantee"),
    ).toBe(true);
  });

  it("section=back-style shows the style selector (drawer entry point)", () => {
    const wrapper = mountSection("back-style");
    expect(wrapper.find('[data-testid="back-style-selector"]').exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="back-style-photo-back-v1"]').exists(),
    ).toBe(true);
  });

  it("section=back-services bundles the hours input", () => {
    const wrapper = mountSection("back-services");
    expect(wrapper.find('[data-testid="back-service-add"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-hours-input"]').exists()).toBe(true);
  });

  it("section=back-photo shows the back-photo grid only on the Photo style", () => {
    const onPhoto = mountSection("back-photo", {
      backTemplateId: "photo-back-v1",
    });
    expect(onPhoto.find('[data-testid="back-photo-section"]').exists()).toBe(true);
  });

  it("panel mode still renders the full flat stack (legacy default)", () => {
    const wrapper = mount(BackEditPanel, {
      props: {
        backContent: makeBackContent(),
        brandKit: makeBrandKit(),
      },
      global: { stubs: STUBS },
    });
    expect(wrapper.find('[data-testid="back-style-selector"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-subhead-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-guarantee-input"]').exists()).toBe(true);
  });
});
