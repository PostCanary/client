import { describe, expect, it } from "vitest";
import {
  filterIndustryCatalog,
  INDUSTRY_CATALOG,
  INDUSTRY_GROUPS,
  industryMatchesQuery,
} from "./industryCatalog";
import {
  asIndustry,
  industryEnumForSave,
  parseIndustrySelection,
  persistIndustryEnum,
  persistIndustryProfileValue,
  resolveIndustry,
} from "@/types/campaign";

describe("industry catalog", () => {
  it("keeps the grouped slugs used by setup, Settings, and send gate", () => {
    const byGroup = Object.fromEntries(
      INDUSTRY_GROUPS.map((group) => [
        group.id,
        INDUSTRY_CATALOG.filter((entry) => entry.group === group.id).map(
          (entry) => entry.slug,
        ),
      ]),
    );

    expect(INDUSTRY_GROUPS.map((group) => group.label)).toEqual([
      "Home services",
      "Health",
      "Food",
      "Property",
      "Auto",
      "Professional",
      "Local other",
    ]);
    expect(byGroup.home_services).toEqual([
      "hvac",
      "plumbing",
      "roofing",
      "electrical",
      "cleaning",
      "pest_control",
      "landscaping",
      "painting",
      "remodeling",
      "windows_doors",
      "solar",
      "garage_doors",
      "handyman",
    ]);
    expect(byGroup.health).toContain("dental");
    expect(byGroup.health).toContain("fitness");
    expect(byGroup.food).toEqual(["restaurant", "pizza_qsr", "cafe_bakery"]);
    expect(INDUSTRY_CATALOG.some((entry) => entry.slug === "other")).toBe(true);
    expect(
      INDUSTRY_CATALOG.some((entry) =>
        ["credit_card", "bank", "credit_cards"].includes(entry.slug),
      ),
    ).toBe(false);
  });

  it("maps search aliases onto the canonical slug", () => {
    const cases: Array<[string, string]> = [
      ["plumber", "plumbing"],
      ["dentist", "dental"],
      ["ac", "hvac"],
      ["lawn", "landscaping"],
      ["lawyer", "legal"],
      ["gym", "fitness"],
      ["pizza", "pizza_qsr"],
      ["heating", "hvac"],
      ["roofer", "roofing"],
      ["exterminator", "pest_control"],
      ["attorney", "legal"],
      ["daycare", "childcare"],
    ];

    for (const [query, slug] of cases) {
      const entry = INDUSTRY_CATALOG.find((item) => item.slug === slug);
      expect(entry, slug).toBeTruthy();
      expect(industryMatchesQuery(entry!, query)).toBe(true);
      expect(resolveIndustry(query)).toBe(slug);
    }
  });

  it("filters the grouped list by alias and always keeps Other", () => {
    const groups = filterIndustryCatalog("plumber");
    expect(groups.map((group) => group.id)).toEqual(["home_services", "other"]);
    expect(groups[0]?.options.map((option) => option.slug)).toEqual(["plumbing"]);
    expect(groups[1]?.options.map((option) => option.slug)).toEqual(["other"]);
  });
});

describe("existing stored values still resolve", () => {
  it("hydrates the original first-run slugs and custom Other text", () => {
    for (const slug of [
      "hvac",
      "plumbing",
      "roofing",
      "cleaning",
      "electrical",
      "pest_control",
      "landscaping",
      "other",
    ] as const) {
      expect(resolveIndustry(slug)).toBe(slug);
      expect(asIndustry(slug)).toBe(slug);
      expect(persistIndustryEnum(slug)).toBe(slug);
    }

    expect(asIndustry("hvac")).toBe("hvac");
    expect(parseIndustrySelection("hvac")).toEqual({
      key: "hvac",
      otherText: "",
    });
    expect(parseIndustrySelection("Pool service")).toEqual({
      key: "other",
      otherText: "Pool service",
    });
    expect(persistIndustryProfileValue("other", "")).toBe("other");
    expect(industryEnumForSave("other")).toBeNull();
    expect(industryEnumForSave("Pool service")).toBe("other");
  });
});
