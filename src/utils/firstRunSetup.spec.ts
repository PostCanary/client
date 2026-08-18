import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/orgs", () => ({
  getReturnAddress: vi.fn(),
}));

import { getReturnAddress } from "@/api/orgs";
import {
  canEditOrgReturnAddress,
  evaluateNeedsFirstRun,
  hasIndustryValue,
  hasMailingLocation,
  humanizeAuth0LoginError,
  isFirstSessionProfile,
  needsFirstRunFields,
} from "./firstRunSetup";

describe("first-run completeness", () => {
  it("requires industry and a complete structured return address", () => {
    expect(
      needsFirstRunFields({
        profileIndustry: "plumbing",
        returnAddress: {
          address: "1 Main",
          city: "Scottsdale",
          state: "AZ",
          zip: "85251",
        },
      }),
    ).toBe(false);
    expect(
      needsFirstRunFields({
        profileIndustry: "plumbing",
      }),
    ).toBe(true);
    expect(
      needsFirstRunFields({
        profileIndustry: "",
        returnAddress: {
          address: "1 Main",
          city: "Scottsdale",
          state: "AZ",
          zip: "85251",
        },
      }),
    ).toBe(true);
  });

  it("treats custom Other text as a set industry", () => {
    expect(hasIndustryValue("Pool service", null)).toBe(true);
    expect(hasIndustryValue("", "roofing")).toBe(true);
    expect(hasIndustryValue("", "")).toBe(false);
  });

  it("counts only a complete structured return address as mailing", () => {
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
  });

  it("does not skip when industry is set but the return address is blank", async () => {
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
    ).resolves.toBe(true);
  });

  it("skips invited teammates even with a blank return address", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue(null);

    await expect(
      evaluateNeedsFirstRun({
        orgId: "org-alpha",
        profileIndustry: "Roofing",
        isInvitedUser: true,
        fetchBrandKit,
      }),
    ).resolves.toBe(false);
    expect(fetchBrandKit).not.toHaveBeenCalled();
  });

  it("requires the page when both industry and return address are empty", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue(null);
    fetchBrandKit.mockResolvedValue({ location: "", industry: null });

    await expect(
      evaluateNeedsFirstRun({
        orgId: "org-1",
        profileIndustry: "",
        fetchBrandKit,
      }),
    ).resolves.toBe(true);
  });
});

describe("canEditOrgReturnAddress", () => {
  it("blocks invited teammates and non-admins", () => {
    expect(
      canEditOrgReturnAddress({ isInvitedUser: true, orgRole: "admin" }),
    ).toBe(false);
    expect(
      canEditOrgReturnAddress({ isInvitedUser: false, orgRole: "member" }),
    ).toBe(false);
    expect(
      canEditOrgReturnAddress({ isInvitedUser: false, orgRole: "owner" }),
    ).toBe(true);
  });
});

describe("humanizeAuth0LoginError", () => {
  it("maps known codes and falls back safely", () => {
    expect(humanizeAuth0LoginError("access_denied")).toMatch(/cancelled/i);
    expect(humanizeAuth0LoginError("nope")).toMatch(/try again/i);
  });
});
