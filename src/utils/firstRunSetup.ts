import { getOrg, getReturnAddress } from "@/api/orgs";
import { resolveIndustry } from "@/types/campaign";
import { isCompleteReturnAddress } from "@/utils/returnAddress";
import type { UserProfile } from "@/api/users";
import type { BrandKit } from "@/types/campaign";

export function hasIndustryValue(
  profileIndustry?: string | null,
  brandIndustry?: string | null,
): boolean {
  if (resolveIndustry(profileIndustry) || resolveIndustry(brandIndustry)) {
    return true;
  }
  // Custom "Other" text is a real selection even if it is not an enum key.
  return !!(profileIndustry ?? "").trim() || !!(brandIndustry ?? "").trim();
}

export function hasMailingLocation(opts: {
  returnAddress?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
  brandLocation?: string | null;
  orgLocation?: string | null;
}): boolean {
  if (isCompleteReturnAddress(opts.returnAddress)) return true;
  if ((opts.brandLocation ?? "").trim()) return true;
  if ((opts.orgLocation ?? "").trim()) return true;
  return false;
}

export function needsFirstRunFields(opts: {
  profileIndustry?: string | null;
  brandIndustry?: string | null;
  returnAddress?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
  brandLocation?: string | null;
  orgLocation?: string | null;
}): boolean {
  return (
    !hasIndustryValue(opts.profileIndustry, opts.brandIndustry) ||
    !hasMailingLocation(opts)
  );
}

const FIRST_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function isFirstSessionProfile(
  profile: Pick<UserProfile, "created_at"> | null | undefined,
  now = Date.now(),
): boolean {
  const created = profile?.created_at;
  if (!created) return false;
  const ts = Date.parse(created);
  if (!Number.isFinite(ts)) return false;
  return now - ts < FIRST_SESSION_MS;
}

export type FirstRunSources = {
  orgId: string | null;
  profileIndustry: string | null | undefined;
  fetchBrandKit: () => Promise<Pick<BrandKit, "location" | "industry"> | null>;
};

/**
 * True when industry or mailing location is still missing after checking
 * profile, return address, brand kit, and org.location. Skip for invited
 * teammates / QA fixtures that already have both.
 */
export async function evaluateNeedsFirstRun(
  sources: FirstRunSources,
): Promise<boolean> {
  let brand: Pick<BrandKit, "location" | "industry"> | null = null;
  let returnAddress = null as Awaited<ReturnType<typeof getReturnAddress>>;
  let orgLocation: string | null = null;

  try {
    returnAddress = await getReturnAddress();
  } catch {
    returnAddress = null;
  }

  if (
    !needsFirstRunFields({
      profileIndustry: sources.profileIndustry,
      returnAddress,
    })
  ) {
    return false;
  }

  try {
    brand = await sources.fetchBrandKit();
  } catch {
    brand = null;
  }

  if (
    !needsFirstRunFields({
      profileIndustry: sources.profileIndustry,
      brandIndustry: brand?.industry,
      returnAddress,
      brandLocation: brand?.location,
    })
  ) {
    return false;
  }

  if (sources.orgId) {
    try {
      const org = await getOrg(sources.orgId);
      orgLocation = org.location ?? null;
    } catch {
      orgLocation = null;
    }
  }

  return needsFirstRunFields({
    profileIndustry: sources.profileIndustry,
    brandIndustry: brand?.industry,
    returnAddress,
    brandLocation: brand?.location,
    orgLocation,
  });
}

export function humanizeAuth0LoginError(code: string): string {
  const normalized = code.trim().toLowerCase();
  const known: Record<string, string> = {
    access_denied: "Sign-in was cancelled or denied. Please try again.",
    unauthorized: "We could not sign you in. Please try again.",
    login_required: "Please sign in to continue.",
    server_error: "Sign-in failed. Please try again.",
    temporarily_unavailable:
      "Sign-in is temporarily unavailable. Please try again.",
    invalid_request: "Sign-in failed. Please try again.",
  };
  return known[normalized] || "Sign-in failed. Please try again.";
}
