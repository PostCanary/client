import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BackEditPanel from "./BackEditPanel.vue";
import type { BrandKit } from "@/types/campaign";

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

function mountPanel(props: Partial<{ guarantee: string; brandKit: BrandKit | null }> = {}) {
  return mount(BackEditPanel, {
    props: {
      guarantee: props.guarantee ?? "100% Satisfaction Guaranteed",
      brandKit: "brandKit" in props ? props.brandKit! : makeBrandKit(),
    },
    global: { stubs: STUBS },
  });
}

describe("BackEditPanel (S76 Phase-5)", () => {
  it("renders the guarantee in an editable textarea", () => {
    const wrapper = mountPanel({ guarantee: "We guarantee it." });
    const ta = wrapper.get('[data-testid="back-guarantee-input"]');
    expect((ta.element as HTMLTextAreaElement).value).toBe("We guarantee it.");
  });

  it("emits update-guarantee on input", async () => {
    const wrapper = mountPanel();
    const ta = wrapper.get('[data-testid="back-guarantee-input"]');
    await ta.setValue("New guarantee");
    expect(wrapper.emitted("update-guarantee")?.[0]).toEqual(["New guarantee"]);
  });

  it("shows Business-Info-sourced fields read-only", () => {
    const wrapper = mountPanel();
    expect(wrapper.get('[data-testid="back-info-address"]').text()).toContain(
      "123 Main St, Phoenix, AZ 85032",
    );
    expect(wrapper.get('[data-testid="back-info-website"]').text()).toContain(
      "acmehvac.com",
    );
    expect(wrapper.get('[data-testid="back-info-license"]').text()).toContain(
      "ROC #123456",
    );
    expect(wrapper.get('[data-testid="back-info-certs"]').text()).toContain(
      "Licensed & Insured, NATE Certified",
    );
  });

  it("prompts to add the address when missing", () => {
    const wrapper = mountPanel({ brandKit: makeBrandKit({ address: null }) });
    expect(wrapper.get('[data-testid="back-info-address"]').text()).toContain(
      "Add your business address",
    );
  });

  it("links to Business Info for editing the sourced fields", () => {
    const wrapper = mountPanel();
    expect(
      wrapper.find('[data-testid="back-edit-in-business-info"]').exists(),
    ).toBe(true);
  });

  it("handles a null brand kit without crashing", () => {
    const wrapper = mountPanel({ brandKit: null });
    expect(wrapper.get('[data-testid="back-info-website"]').text()).toContain("—");
  });
});
