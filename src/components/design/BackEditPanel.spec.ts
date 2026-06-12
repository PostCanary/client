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
    address: "123 Main St, Phoenix, AZ 85032",
    phone: "(602) 555-1212",
    websiteUrl: "acmehvac.com",
    logoUrl: null,
    licenseNumber: "ROC #123456",
    logoQualityScore: null,
    brandColors: ["#dc3228"],
    photos: [],
    googleRating: null,
    reviews: [],
    certifications: ["Licensed & Insured", "NATE Certified"],
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

function mountPanel(
  props: {
    backContent?: Partial<CardDesign["backContent"]>;
    brandKit?: BrandKit | null;
  } = {},
) {
  return mount(BackEditPanel, {
    props: {
      backContent: makeBackContent(props.backContent),
      brandKit:
        "brandKit" in props ? props.brandKit! : makeBrandKit(),
    },
    global: { stubs: STUBS },
  });
}

describe("BackEditPanel v2 (S77)", () => {
  // --- Guarantee (existing behavior, now via update-back) ---
  it("renders the guarantee in an editable textarea", () => {
    const wrapper = mountPanel({ backContent: { guarantee: "We guarantee it." } });
    const ta = wrapper.get('[data-testid="back-guarantee-input"]');
    expect((ta.element as HTMLTextAreaElement).value).toBe("We guarantee it.");
  });

  it("emits update-back with the guarantee patch on input", async () => {
    const wrapper = mountPanel();
    const ta = wrapper.get('[data-testid="back-guarantee-input"]');
    await ta.setValue("New guarantee");
    const emitted = wrapper.emitted("update-back");
    expect(emitted?.some((e) => (e[0] as any).guarantee === "New guarantee")).toBe(
      true,
    );
  });

  // --- Back style selector ---
  it("renders the three back styles", () => {
    const wrapper = mountPanel();
    expect(wrapper.find('[data-testid="back-style-standard-back-v2"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="back-style-testimonial-back-v1"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="back-style-service-area-back-v1"]').exists(),
    ).toBe(true);
  });

  it("emits the selected back style", async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="back-style-testimonial-back-v1"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some(
        (e) => (e[0] as any).backTemplateId === "testimonial-back-v1",
      ),
    ).toBe(true);
  });

  // --- Subhead ---
  it("emits update-back with the subhead", async () => {
    const wrapper = mountPanel();
    await wrapper
      .get('[data-testid="back-subhead-input"]')
      .setValue("Why neighbors choose us");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some((e) => (e[0] as any).backSubhead === "Why neighbors choose us"),
    ).toBe(true);
  });

  // --- Benefits editor ---
  it("renders existing benefits and can add a row", async () => {
    const wrapper = mountPanel({
      backContent: { backBenefits: ["Fast", "Cheap"] },
    });
    expect(wrapper.find('[data-testid="back-benefit-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-benefit-1"]').exists()).toBe(true);
    await wrapper.get('[data-testid="back-benefit-add"]').trigger("click");
    expect(wrapper.find('[data-testid="back-benefit-2"]').exists()).toBe(true);
  });

  it("caps benefits at five rows (no add button at five)", () => {
    const wrapper = mountPanel({
      backContent: { backBenefits: ["a", "b", "c", "d", "e"] },
    });
    expect(wrapper.find('[data-testid="back-benefit-add"]').exists()).toBe(false);
  });

  it("emits update-back when a benefit is removed", async () => {
    const wrapper = mountPanel({
      backContent: { backBenefits: ["one", "two"] },
    });
    await wrapper.get('[data-testid="back-benefit-remove-0"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some((e) => JSON.stringify((e[0] as any).backBenefits) === '["two"]'),
    ).toBe(true);
  });

  // --- Testimonial picker ---
  it("lists brand-kit reviews and a 'none' option", () => {
    const wrapper = mountPanel({
      brandKit: makeBrandKit({
        reviews: [
          { quote: "Great job", reviewerName: "Sam", rating: 5 } as any,
        ],
      }),
    });
    expect(wrapper.find('[data-testid="back-testimonial-none"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-testimonial-0"]').exists()).toBe(true);
  });

  it("emits the chosen review as the testimonial", async () => {
    const wrapper = mountPanel({
      brandKit: makeBrandKit({
        reviews: [
          { quote: "Great job", reviewerName: "Sam", rating: 5 } as any,
        ],
      }),
    });
    await wrapper.get('[data-testid="back-testimonial-0"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some(
        (e) => (e[0] as any).backTestimonial?.quote === "Great job",
      ),
    ).toBe(true);
  });

  it("emits an empty testimonial when 'none' is chosen (rating-chip fallback)", async () => {
    const wrapper = mountPanel({
      backContent: {
        backTestimonial: { quote: "x", reviewerName: "y", rating: 5 },
      },
    });
    await wrapper.get('[data-testid="back-testimonial-none"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some((e) => (e[0] as any).backTestimonial?.quote === ""),
    ).toBe(true);
  });

  // --- Services + hours ---
  it("emits services on edit and hours on input", async () => {
    const wrapper = mountPanel({ backContent: { backServices: ["A/C"] } });
    await wrapper.get('[data-testid="back-service-add"]').trigger("click");
    expect(wrapper.find('[data-testid="back-service-1"]').exists()).toBe(true);

    await wrapper.get('[data-testid="back-hours-input"]').setValue("Mon-Fri 9-5");
    const emitted = wrapper.emitted("update-back");
    expect(emitted?.some((e) => (e[0] as any).backHours === "Mon-Fri 9-5")).toBe(true);
  });

  // --- Read-only Business Info ---
  it("shows Business-Info-sourced fields read-only", () => {
    const wrapper = mountPanel();
    expect(wrapper.get('[data-testid="back-info-address"]').text()).toContain(
      "123 Main St, Phoenix, AZ 85032",
    );
    expect(wrapper.get('[data-testid="back-info-license"]').text()).toContain(
      "ROC #123456",
    );
  });

  it("prompts to add the address when missing", () => {
    const wrapper = mountPanel({ brandKit: makeBrandKit({ address: null }) });
    expect(wrapper.get('[data-testid="back-info-address"]').text()).toContain(
      "Add your business address",
    );
  });

  it("handles a null brand kit without crashing", () => {
    const wrapper = mountPanel({ brandKit: null });
    expect(wrapper.get('[data-testid="back-info-website"]').text()).toContain("—");
  });

  // --- S78: the two visually-rich back styles ---
  it("renders all five back styles including Photo and Bold", () => {
    const wrapper = mountPanel();
    for (const id of [
      "standard-back-v2",
      "testimonial-back-v1",
      "service-area-back-v1",
      "photo-back-v1",
      "brand-bold-back-v1",
    ]) {
      expect(wrapper.find(`[data-testid="back-style-${id}"]`).exists()).toBe(true);
    }
  });

  it("emits the Photo back style when picked", async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="back-style-photo-back-v1"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some((e) => (e[0] as any).backTemplateId === "photo-back-v1"),
    ).toBe(true);
  });

  it("emits the Bold back style when picked", async () => {
    const wrapper = mountPanel();
    await wrapper
      .get('[data-testid="back-style-brand-bold-back-v1"]')
      .trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some((e) => (e[0] as any).backTemplateId === "brand-bold-back-v1"),
    ).toBe(true);
  });

  // --- S78: back-photo picker (only on the Photo style) ---
  it("hides the back-photo picker unless the Photo style is active", () => {
    const wrapper = mountPanel({ backContent: { backTemplateId: "standard-back-v2" } });
    expect(wrapper.find('[data-testid="back-photo-section"]').exists()).toBe(false);
  });

  it("shows the back-photo picker when the Photo style is active", () => {
    const wrapper = mountPanel({ backContent: { backTemplateId: "photo-back-v1" } });
    expect(wrapper.find('[data-testid="back-photo-section"]').exists()).toBe(true);
  });

  it("renders brand + stock photos in the back-photo grid with a Low-res badge", () => {
    const wrapper = mountPanel({
      backContent: { backTemplateId: "photo-back-v1" },
      brandKit: makeBrandKit({
        industry: "hvac",
        photos: [
          {
            url: "/media/brand-photos/org-1/sharp.jpg",
            alt: "Sharp truck",
            qualityScore: 90,
            source: "upload",
            printReady: true,
          },
          {
            url: "/media/brand-photos/org-1/soft.jpg",
            alt: "Soft scan",
            qualityScore: 40,
            source: "upload",
            printReady: false,
          },
        ] as BrandKit["photos"],
      }),
    });
    const grid = wrapper.get('[data-testid="back-photo-grid"]');
    // 2 brand photos + the hvac stock pack (non-empty).
    expect(grid.findAll("button").length).toBeGreaterThan(2);
    expect(wrapper.find('[data-testid="back-photo-lowres-badge"]').exists()).toBe(true);
  });

  it("emits backPhotoUrl when a back photo is picked", async () => {
    const wrapper = mountPanel({
      backContent: { backTemplateId: "photo-back-v1" },
      brandKit: makeBrandKit({
        photos: [
          {
            url: "/media/brand-photos/org-1/pick.jpg",
            alt: "Pick me",
            qualityScore: 90,
            source: "upload",
            printReady: true,
          },
        ] as BrandKit["photos"],
      }),
    });
    await wrapper.get('[data-testid="back-photo-option-0"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(
      emitted?.some(
        (e) => (e[0] as any).backPhotoUrl === "/media/brand-photos/org-1/pick.jpg",
      ),
    ).toBe(true);
  });

  it("clears backPhotoUrl when the active photo is re-clicked", async () => {
    const url = "/media/brand-photos/org-1/pick.jpg";
    const wrapper = mountPanel({
      backContent: { backTemplateId: "photo-back-v1", backPhotoUrl: url },
      brandKit: makeBrandKit({
        photos: [
          {
            url,
            alt: "Pick me",
            qualityScore: 90,
            source: "upload",
            printReady: true,
          },
        ] as BrandKit["photos"],
      }),
    });
    await wrapper.get('[data-testid="back-photo-option-0"]').trigger("click");
    const emitted = wrapper.emitted("update-back");
    expect(emitted?.some((e) => (e[0] as any).backPhotoUrl === "")).toBe(true);
  });
});
