import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/orgs", () => ({
  getReturnAddress: vi.fn(),
  getOrg: vi.fn(),
  updateOrg: vi.fn(),
}));

vi.mock("@/api/targeting", () => ({
  getZipCentroids: vi.fn(),
}));

import {
  getOrg,
  getReturnAddress,
  updateOrg,
} from "@/api/orgs";
import { getZipCentroids } from "@/api/targeting";
import {
  locationLabelFromParts,
  locationLabelFromReturnAddress,
  resolveMapCenterFromReturnAddress,
  syncBrandLocationFromProfile,
  zip5FromReturnAddress,
} from "./businessLocation";

describe("locationLabelFromParts", () => {
  it("formats city and state", () => {
    expect(locationLabelFromParts("Brooklyn", "ny")).toBe("Brooklyn, NY");
  });

  it("returns null when both empty", () => {
    expect(locationLabelFromParts("", "")).toBeNull();
    expect(locationLabelFromParts(null, undefined)).toBeNull();
  });

  it("allows city-only or state-only", () => {
    expect(locationLabelFromParts("Brooklyn", "")).toBe("Brooklyn");
    expect(locationLabelFromParts("", "NY")).toBe("NY");
  });
});

describe("locationLabelFromReturnAddress / zip5", () => {
  it("reads city/state and ZIP+4", () => {
    expect(
      locationLabelFromReturnAddress({
        city: "Brooklyn",
        state: "NY",
      }),
    ).toBe("Brooklyn, NY");
    expect(zip5FromReturnAddress({ zip: "11201-1234" })).toBe("11201");
    expect(zip5FromReturnAddress({ zip: "" })).toBeNull();
    expect(locationLabelFromReturnAddress(null)).toBeNull();
  });
});

describe("syncBrandLocationFromProfile", () => {
  const updateBrandKit = vi.fn();
  const patchBrandKitLocal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    updateBrandKit.mockResolvedValue(undefined);
  });

  it("does nothing when brand kit already has location and industry", async () => {
    const result = await syncBrandLocationFromProfile({
      orgId: "org-1",
      brandLocation: "Phoenix, AZ",
      brandIndustry: "hvac",
      profileIndustry: "plumbing",
      updateBrandKit,
      patchBrandKitLocal,
    });
    expect(result).toEqual({ location: "Phoenix, AZ", industry: "hvac" });
    expect(getReturnAddress).not.toHaveBeenCalled();
    expect(updateBrandKit).not.toHaveBeenCalled();
  });

  it("uses a known return address instead of re-fetching", async () => {
    const result = await syncBrandLocationFromProfile({
      orgId: "org-1",
      brandLocation: "",
      brandIndustry: null,
      profileIndustry: "plumbing",
      knownReturnAddress: {
        name: null,
        address: "9 Pine",
        address2: null,
        city: "Buffalo",
        state: "NY",
        zip: "14201",
      },
      updateBrandKit,
      patchBrandKitLocal,
    });

    expect(result.location).toBe("Buffalo, NY");
    expect(getReturnAddress).not.toHaveBeenCalled();
    expect(updateBrandKit).toHaveBeenCalledWith({
      location: "Buffalo, NY",
      industry: "plumbing",
    });
  });

  it("fills location from return address and industry from profile", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue({
      name: null,
      address: "1 Main",
      address2: null,
      city: "Brooklyn",
      state: "NY",
      zip: "11201",
    });

    const result = await syncBrandLocationFromProfile({
      orgId: "org-1",
      brandLocation: "",
      brandIndustry: null,
      profileIndustry: "hvac",
      updateBrandKit,
      patchBrandKitLocal,
    });

    expect(result).toEqual({ location: "Brooklyn, NY", industry: "hvac" });
    expect(updateOrg).toHaveBeenCalledWith("org-1", {
      location: "Brooklyn, NY",
    });
    expect(updateBrandKit).toHaveBeenCalledWith({
      location: "Brooklyn, NY",
      industry: "hvac",
    });
  });

  it("falls back to org.location when return address is empty", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue(null);
    vi.mocked(getOrg).mockResolvedValue({
      id: "org-1",
      name: "Acme",
      slug: "acme",
      role: "owner",
      business_name: null,
      location: "Scottsdale, AZ",
      service_types: null,
    });

    await syncBrandLocationFromProfile({
      orgId: "org-1",
      brandLocation: null,
      brandIndustry: "plumbing",
      profileIndustry: null,
      updateBrandKit,
      patchBrandKitLocal,
    });

    expect(updateBrandKit).toHaveBeenCalledWith({
      location: "Scottsdale, AZ",
    });
  });

  it("force overwrite updates from return address", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue({
      name: null,
      address: "9 Pine",
      address2: null,
      city: "Buffalo",
      state: "NY",
      zip: "14201",
    });

    await syncBrandLocationFromProfile({
      orgId: "org-1",
      brandLocation: "Phoenix, AZ",
      brandIndustry: "hvac",
      profileIndustry: null,
      forceLocation: true,
      updateBrandKit,
      patchBrandKitLocal,
    });

    expect(updateBrandKit).toHaveBeenCalledWith({
      location: "Buffalo, NY",
    });
  });

  it("patches locally when brand kit update fails", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue({
      name: null,
      address: "1 Main",
      address2: null,
      city: "Austin",
      state: "TX",
      zip: "78701",
    });
    updateBrandKit.mockRejectedValue(new Error("fail"));

    await syncBrandLocationFromProfile({
      orgId: null,
      brandLocation: "",
      brandIndustry: "hvac",
      profileIndustry: null,
      updateBrandKit,
      patchBrandKitLocal,
    });

    expect(patchBrandKitLocal).toHaveBeenCalledWith({
      location: "Austin, TX",
    });
  });
});

describe("resolveMapCenterFromReturnAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ZIP centroid when available", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue({
      name: null,
      address: "1 Main",
      address2: null,
      city: "Brooklyn",
      state: "NY",
      zip: "11201",
    });
    vi.mocked(getZipCentroids).mockResolvedValue({
      centroids: [{ zip: "11201", lat: 40.69, lon: -73.99 }],
    });

    await expect(resolveMapCenterFromReturnAddress()).resolves.toEqual([
      40.69, -73.99,
    ]);
  });

  it("returns null when no ZIP", async () => {
    vi.mocked(getReturnAddress).mockResolvedValue(null);
    await expect(resolveMapCenterFromReturnAddress()).resolves.toBeNull();
    expect(getZipCentroids).not.toHaveBeenCalled();
  });
});
