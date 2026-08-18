import { describe, expect, it } from "vitest";
import { INDUSTRY_CATALOG } from "./industryCatalog";
import {
  FALLBACK_INDUSTRY_SLUGS,
  FALLBACK_TEMPLATE_PACK_ID,
  INDUSTRY_TEMPLATE_PACKS,
  catalogEntriesForPack,
  packHasAssets,
  packIdForIndustrySlug,
  resolveTemplatePack,
  storedIndustrySlug,
  type TemplatePackCatalogEntry,
  type TemplatePackId,
} from "./industryTemplatePacks";

const FALLBACK_CATALOG: TemplatePackCatalogEntry[] = [
  { id: "hvac-hac-1000-full-bleed-offer-v1", packId: "fallback", status: "visible" },
  { id: "hvac-hac-1000-full-bleed-proof-v1", packId: "fallback", status: "visible" },
  { id: "hvac-hac-1000-full-bleed-last-chance-v1", packId: "fallback", status: "visible" },
];

describe("packIdForIndustrySlug", () => {
  it("maps every confirmed vertical onto its Creative pack", () => {
    const cases: Array<[string, TemplatePackId]> = [
      ["hvac", "neighborhood_coupons"],
      ["plumbing", "neighborhood_coupons"],
      ["roofing", "neighborhood_coupons"],
      ["electrical", "neighborhood_coupons"],
      ["cleaning", "neighborhood_coupons"],
      ["pest_control", "neighborhood_coupons"],
      ["landscaping", "neighborhood_coupons"],
      ["painting", "neighborhood_coupons"],
      ["remodeling", "neighborhood_coupons"],
      ["windows_doors", "neighborhood_coupons"],
      ["solar", "neighborhood_coupons"],
      ["garage_doors", "neighborhood_coupons"],
      ["handyman", "neighborhood_coupons"],
      ["auto_repair", "neighborhood_coupons"],
      ["auto_dealer", "neighborhood_coupons"],
      ["auto_body", "neighborhood_coupons"],
      ["restaurant", "fridge_menu"],
      ["pizza_qsr", "fridge_menu"],
      ["cafe_bakery", "fridge_menu"],
      ["dental", "new_patient_tripwire"],
      ["chiropractic", "new_patient_tripwire"],
      ["primary_care", "new_patient_tripwire"],
      ["urgent_care", "new_patient_tripwire"],
      ["optometry", "new_patient_tripwire"],
      ["veterinary", "new_patient_tripwire"],
      ["mental_health", "new_patient_tripwire"],
      ["salon_spa", "new_patient_tripwire"],
      ["fitness", "new_patient_tripwire"],
      ["real_estate", "local_expert"],
      ["property_management", "local_expert"],
      ["mortgage", "local_expert"],
      ["legal", "local_expert"],
      ["insurance", "local_expert"],
      ["financial_advisor", "local_expert"],
      ["accounting", "local_expert"],
      ["retail", "fallback"],
      ["furniture", "fallback"],
      ["childcare", "fallback"],
      ["education", "fallback"],
      ["nonprofit", "fallback"],
      ["other", "fallback"],
    ];

    for (const [slug, packId] of cases) {
      expect(packIdForIndustrySlug(slug), slug).toBe(packId);
    }
  });

  it("resolves aliases and mixed-case stored values to the same pack", () => {
    expect(packIdForIndustrySlug("Restaurant")).toBe("fridge_menu");
    expect(packIdForIndustrySlug("dentist")).toBe("new_patient_tripwire");
    expect(packIdForIndustrySlug("plumber")).toBe("neighborhood_coupons");
    expect(packIdForIndustrySlug("realtor")).toBe("local_expert");
  });

  it("maps Other, unknown, and empty values to fallback", () => {
    expect(packIdForIndustrySlug("other")).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(packIdForIndustrySlug("Pool service")).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(packIdForIndustrySlug("unknown")).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(packIdForIndustrySlug("")).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(packIdForIndustrySlug("   ")).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(packIdForIndustrySlug(null)).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(packIdForIndustrySlug(undefined)).toBe(FALLBACK_TEMPLATE_PACK_ID);
  });

  it("covers every catalog slug so a new vertical cannot silently miss a pack", () => {
    const mapped = new Set([
      ...Object.values(INDUSTRY_TEMPLATE_PACKS).flat(),
      ...FALLBACK_INDUSTRY_SLUGS,
    ]);
    for (const entry of INDUSTRY_CATALOG) {
      expect(mapped.has(entry.slug), entry.slug).toBe(true);
      expect(packIdForIndustrySlug(entry.slug)).toBeTruthy();
    }
  });
});

describe("resolveTemplatePack — missing assets fall back to HVAC", () => {
  it("keeps today's HVAC cards when the mapped pack has no catalog assets", () => {
    expect(resolveTemplatePack("restaurant", FALLBACK_CATALOG)).toBe(
      FALLBACK_TEMPLATE_PACK_ID,
    );
    expect(resolveTemplatePack("dental", FALLBACK_CATALOG)).toBe(
      FALLBACK_TEMPLATE_PACK_ID,
    );
    expect(resolveTemplatePack("hvac", FALLBACK_CATALOG)).toBe(
      FALLBACK_TEMPLATE_PACK_ID,
    );
    expect(resolveTemplatePack("legal", FALLBACK_CATALOG)).toBe(
      FALLBACK_TEMPLATE_PACK_ID,
    );
    expect(catalogEntriesForPack("fallback", FALLBACK_CATALOG)).toHaveLength(3);
    expect(packHasAssets("fridge_menu", FALLBACK_CATALOG)).toBe(false);
    expect(packHasAssets("neighborhood_coupons", FALLBACK_CATALOG)).toBe(false);
  });

  it("shows the mapped pack and hides the HVAC set once that pack has assets", () => {
    const catalog: TemplatePackCatalogEntry[] = [
      ...FALLBACK_CATALOG,
      {
        id: "fridge_menu-offer-v1",
        packId: "fridge_menu",
        status: "visible",
      },
    ];

    expect(resolveTemplatePack("restaurant", catalog)).toBe("fridge_menu");
    expect(resolveTemplatePack("dental", catalog)).toBe(FALLBACK_TEMPLATE_PACK_ID);
    expect(catalogEntriesForPack("fridge_menu", catalog).map((entry) => entry.id)).toEqual([
      "fridge_menu-offer-v1",
    ]);
  });

  it("treats identifiable pack ids in the catalog as assets even without packId", () => {
    const catalog: TemplatePackCatalogEntry[] = [
      ...FALLBACK_CATALOG,
      { id: "new_patient_tripwire-offer-v1", status: "visible" },
    ];
    expect(resolveTemplatePack("dental", catalog)).toBe("new_patient_tripwire");
    expect(resolveTemplatePack("restaurant", catalog)).toBe(FALLBACK_TEMPLATE_PACK_ID);
  });

  it("ignores draft/retired pack entries so an unfinished pack still falls back", () => {
    const catalog: TemplatePackCatalogEntry[] = [
      ...FALLBACK_CATALOG,
      { id: "fridge_menu-draft", packId: "fridge_menu", status: "draft" },
    ];
    expect(resolveTemplatePack("restaurant", catalog)).toBe(FALLBACK_TEMPLATE_PACK_ID);
  });
});

describe("storedIndustrySlug", () => {
  it("prefers the brand-kit enum, then the profile value", () => {
    expect(storedIndustrySlug("restaurant", "dental")).toBe("restaurant");
    expect(storedIndustrySlug(null, "dental")).toBe("dental");
    expect(storedIndustrySlug("", "Pool service")).toBe("Pool service");
    expect(storedIndustrySlug(null, null)).toBeNull();
  });
});
