import { getReturnAddress } from "@/api/orgs";
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
}): boolean {
  return isCompleteReturnAddress(opts.returnAddress);
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
  isInvitedUser?: boolean;
  fetchBrandKit: () => Promise<Pick<BrandKit, "location" | "industry"> | null>;
};

/**
 * True when industry or a complete structured return address is missing.
 * Brand kit / org.location may prefill the form later — they do not skip
 * this page. Invited teammates skip entirely (they cannot write org mail).
 */
export async function evaluateNeedsFirstRun(
  sources: FirstRunSources,
): Promise<boolean> {
  if (sources.isInvitedUser) return false;

  let returnAddress = null as Awaited<ReturnType<typeof getReturnAddress>>;
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

  let brand: Pick<BrandKit, "location" | "industry"> | null = null;
  if (!hasIndustryValue(sources.profileIndustry)) {
    try {
      brand = await sources.fetchBrandKit();
    } catch {
      brand = null;
    }
  }

  return needsFirstRunFields({
    profileIndustry: sources.profileIndustry,
    brandIndustry: brand?.industry,
    returnAddress,
  });
}

/** Invited teammates and non-admins must not write org mailing data. */
export function canEditOrgReturnAddress(opts: {
  isInvitedUser?: boolean | null;
  orgRole?: string | null;
}): boolean {
  if (opts.isInvitedUser) return false;
  return opts.orgRole === "owner" || opts.orgRole === "admin";
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
