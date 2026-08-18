// Shared helpers for business mailing location → brand kit / map defaults.
// Settings return address is the source of truth when brand kit location is empty.

import {
  getOrg,
  getReturnAddress,
  updateOrg,
  type OrgReturnAddress,
} from "@/api/orgs";
import { getZipCentroids } from "@/api/targeting";
import { resolveIndustry, type Industry } from "@/types/campaign";

export function locationLabelFromParts(
  city?: string | null,
  state?: string | null,
): string | null {
  const c = (city ?? "").trim();
  const s = (state ?? "").trim().toUpperCase();
  if (!c && !s) return null;
  if (c && s) return `${c}, ${s}`;
  return c || s || null;
}

export function locationLabelFromReturnAddress(
  addr: Pick<OrgReturnAddress, "city" | "state"> | null | undefined,
): string | null {
  if (!addr) return null;
  return locationLabelFromParts(addr.city, addr.state);
}

export function zip5FromReturnAddress(
  addr: Pick<OrgReturnAddress, "zip"> | null | undefined,
): string | null {
  const zip = (addr?.zip ?? "").trim();
  const match = zip.match(/^(\d{5})/);
  return match?.[1] ?? null;
}

export type BrandLocationSyncDeps = {
  orgId: string | null;
  brandLocation: string | null | undefined;
  brandIndustry: string | null | undefined;
  profileIndustry: string | null | undefined;
  /**
   * When provided (including null), use this instead of fetching
   * GET /api/organizations/return-address.
   */
  knownReturnAddress?: OrgReturnAddress | null;
  /** When true, overwrite brand kit location from return address / org. */
  forceLocation?: boolean;
  updateBrandKit: (partial: {
    location?: string;
    industry?: Industry;
  }) => Promise<unknown>;
  patchBrandKitLocal: (partial: {
    location?: string;
    industry?: Industry;
  }) => void;
};

function asIndustry(value: string | null | undefined): Industry | null {
  if (!value?.trim()) return null;
  return resolveIndustry(value) ?? "other";
}

/**
 * Fill empty brand-kit location (and industry) from Settings return address,
 * org.location, and the user profile. Does not invent values when sources
 * are empty — Step 1 inline setup still handles that case.
 */
export async function syncBrandLocationFromProfile(
  deps: BrandLocationSyncDeps,
): Promise<{ location: string | null; industry: Industry | null }> {
  const force = !!deps.forceLocation;
  let location: string | null =
    !force && deps.brandLocation?.trim()
      ? deps.brandLocation.trim()
      : null;
  let industry: Industry | null = asIndustry(deps.brandIndustry);

  if (!location) {
    if (deps.knownReturnAddress !== undefined) {
      location = locationLabelFromReturnAddress(deps.knownReturnAddress);
    } else {
      try {
        const addr = await getReturnAddress();
        location = locationLabelFromReturnAddress(addr);
      } catch {
        // Route may be missing on older servers — fall through to org.location.
      }
    }
  }

  if (!location && deps.orgId) {
    try {
      const org = await getOrg(deps.orgId);
      const orgLoc = (org.location ?? "").trim();
      if (orgLoc) location = orgLoc;
    } catch {
      // ignore
    }
  }

  if (!industry) {
    industry = asIndustry(deps.profileIndustry);
  }

  const locationChanged =
    !!location &&
    (force || !(deps.brandLocation ?? "").trim()) &&
    location !== (deps.brandLocation ?? "").trim();
  const industryChanged = !!industry && !deps.brandIndustry;

  if (!locationChanged && !industryChanged) {
    return {
      location: (deps.brandLocation ?? "").trim() || location,
      industry: asIndustry(deps.brandIndustry) ?? industry,
    };
  }

  const patch: { location?: string; industry?: Industry } = {};
  if (locationChanged && location) patch.location = location;
  if (industryChanged && industry) patch.industry = industry;

  if (deps.orgId && patch.location) {
    try {
      await updateOrg(deps.orgId, { location: patch.location });
    } catch {
      // Local brand kit patch still applies below.
    }
  }

  try {
    await deps.updateBrandKit(patch);
  } catch {
    deps.patchBrandKitLocal(patch);
  }

  return {
    location: (patch.location ?? (deps.brandLocation ?? "").trim()) || null,
    industry: patch.industry ?? asIndustry(deps.brandIndustry),
  };
}

/** Map center from return-address ZIP when available; else null (caller keeps Phoenix default). */
export async function resolveMapCenterFromReturnAddress(): Promise<
  [number, number] | null
> {
  try {
    const addr = await getReturnAddress();
    const zip5 = zip5FromReturnAddress(addr);
    if (!zip5) return null;
    const res = await getZipCentroids([zip5]);
    const c = res.centroids?.[0];
    if (c == null || !Number.isFinite(c.lat) || !Number.isFinite(c.lon)) {
      return null;
    }
    return [c.lat, c.lon];
  } catch {
    return null;
  }
}
