import { describe, expect, it } from "vitest";
import {
  asIndustry,
  industryEnumForSave,
  industryValueForApi,
  normalizeIndustry,
  parseIndustrySelection,
  persistIndustryEnum,
  persistIndustryProfileValue,
  resolveIndustry,
} from "./campaign";

describe("resolveIndustry / parseIndustrySelection", () => {
  it("maps labels, keys, and aliases to the controlled list", () => {
    expect(normalizeIndustry("HVAC")).toBe("hvac");
    expect(resolveIndustry("Roofing")).toBe("roofing");
    expect(resolveIndustry("pest control")).toBe("pest_control");
    expect(resolveIndustry("other")).toBe("other");
    expect(resolveIndustry("plumber")).toBe("plumbing");
    expect(resolveIndustry("dental")).toBe("dental");
    expect(resolveIndustry("")).toBeNull();
    expect(asIndustry("hvac")).toBe("hvac");
    expect(asIndustry("Pool service")).toBe("other");
  });

  it("treats unrecognized text as Other with the custom value", () => {
    expect(resolveIndustry("Pool service")).toBeNull();
    expect(parseIndustrySelection("Pool service")).toEqual({
      key: "other",
      otherText: "Pool service",
    });
  });

  it("keeps Other selected when the stored value is the other sentinel", () => {
    expect(parseIndustrySelection("other")).toEqual({
      key: "other",
      otherText: "",
    });
    expect(persistIndustryProfileValue("other", "")).toBe("other");
    expect(persistIndustryProfileValue("other", "Pool service")).toBe(
      "Pool service",
    );
    expect(persistIndustryEnum("other")).toBe("other");
    expect(persistIndustryEnum("plumbing")).toBe("plumbing");
  });

  it("does not persist the literal other sentinel to the API", () => {
    expect(industryValueForApi("other")).toBe("");
    expect(industryValueForApi("")).toBe("");
    expect(industryValueForApi("Pool service")).toBe("Pool service");
    expect(industryValueForApi("plumbing")).toBe("plumbing");
    expect(industryEnumForSave("other")).toBeNull();
    expect(industryEnumForSave("Pool service")).toBe("other");
    expect(industryEnumForSave("hvac")).toBe("hvac");
  });
});
