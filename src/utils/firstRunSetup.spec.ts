import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/orgs", () => ({
  getReturnAddress: vi.fn(),
  getOrg: vi.fn(),
}));

import { getOrg, getReturnAddress } from "@/api/orgs";
import {
  evaluateNeedsFirstRun,
  hasIndustryValue,
  hasMailingLocation,
  humanizeAuth0LoginError,
  isFirstSessionProfile,
  needsFirstRunFields,
} from "./firstRunSetup";

describe("first-run completeness", () => {
  it("requires both industry and a mailing location", () => {
    expect(
      needsFirstRunFields({
        profileIndustry: "plumbing",
        brandLocation: "Scottsdale, AZ",
      }),
    ).toBe(false);
    expect(
      needsFirstRunFields({
        profileIndustry: "",
        brandLocation: "Scottsdale, AZ",
      }),
    ).toBe(true);
    expect(
      needsFirstRunFields({
        profileIndustry: "hvac",
        brandLocation: "",
      }),
    ).toBe(true);
  });

  it("treats custom Other text as a set industry", () => {
    expect(hasIndustryValue("Pool service", null)).toBe(true);
    expect(hasIndustryValue("", "roofing")).toBe(true);
    expect(hasIndustryValue("", "")).toBe(false);
  });

  it("accepts a complete return address or brand/org location", () => {
    expect(
      hasMailingLocation({
        returnAddress: {
          address: "1 Main",
          city: "Scottsdale",
          state: "AZ",
          zip: "85251",
        },
      }),
    ).toBe(true);
    expect(hasMailingLocation({ brandLocation: "Atlanta, GA" })).toBe(true);
    expect(hasMailingLocation({ orgLocation: "Phoenix, AZ" })).toBe(true);
    expect(hasMailingLocation({})).toBe(false);
  });
});

describe("isFirstSessionProfile", () => {
  it("is true only for recently created profiles", () => {
    const now = Date.parse("2026-08-18T20:00:00Z");
    expect(
      isFirstSessionProfile({ created_at: "2026-08-18T12:00:00Z" }, now),
    ).toBe(true);
    expect(
      isFirstSessionProfile({ created_at: "2024-01-10T12:00:00Z" }, now),
    ).toBe(false);
    expect(isFirstSessionProfile({ created_at: null }, now)).toBe(false);
  });
});

describe("evaluateNeedsFirstRun", () => {
  const fetchBrandKit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when profile industry and return address are already set", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue({
      name: null,
      address: "1 Main",
      address2: null,
      city: "Scottsdale",
      state: "AZ",
      zip: "85251",
    });

    await expect(
      evaluateNeedsFirstRun({
        orgId: "org-1",
        profileIndustry: "plumbing",
        fetchBrandKit,
      }),
    ).resolves.toBe(false);
    expect(fetchBrandKit).not.toHaveBeenCalled();
    expect(getOrg).not.toHaveBeenCalled();
  });

  it("skips QA fixtures that only have brand-kit location + industry", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue(null);
    fetchBrandKit.mockResolvedValue({
      location: "Atlanta, GA",
      industry: "roofing",
    });

    await expect(
      evaluateNeedsFirstRun({
        orgId: "org-alpha",
        profileIndustry: "Roofing",
        fetchBrandKit,
      }),
    ).resolves.toBe(false);
    expect(getOrg).not.toHaveBeenCalled();
  });

  it("requires the page when both industry and location are empty", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue(null);
    fetchBrandKit.mockResolvedValue({ location: "", industry: null });
    vi.mocked(getOrg).mockResolvedValue({
      id: "org-1",
      name: "New Co",
      slug: "new-co",
      role: "owner",
      business_name: null,
      location: null,
      service_types: null,
    });

    await expect(
      evaluateNeedsFirstRun({
        orgId: "org-1",
        profileIndustry: "",
        fetchBrandKit,
      }),
    ).resolves.toBe(true);
  });
});

describe("humanizeAuth0LoginError", () => {
  it("maps known codes and falls back safely", () => {
    expect(humanizeAuth0LoginError("access_denied")).toMatch(/cancelled/i);
    expect(humanizeAuth0LoginError("nope")).toMatch(/try again/i);
  });
});
