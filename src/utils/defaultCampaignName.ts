// POS-188: default campaign name is date + current goal only.
// Never include city, ZIP, brand-kit location, or a prior draft name.
// Those org-level / leftover values are what made "anoka" survive a reset.

import type { CampaignDraft, ReviewSelection } from "@/types/campaign";
import { CAMPAIGN_GOALS } from "@/data/campaignGoals";

const FALLBACK_GOAL_LABEL = "Campaign";
const NEW_FORMAT = /^(\d{4})\/(\d{2})\/(\d{2}) - (.+)$/;
// Old Step 4 generator: "[Goal][ — Area] — Mon D" e.g. "Send to a List — Anoka — Jul 27"
const LEGACY_FORMAT = / — [A-Z][a-z]{2} \d{1,2}$/;

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDefaultCampaignName(
  goalLabel?: string | null,
  now: Date = new Date(),
): string {
  const label = goalLabel?.trim() || FALLBACK_GOAL_LABEL;
  return `${now.getFullYear()}/${pad2(now.getMonth() + 1)}/${pad2(now.getDate())} - ${label}`;
}

export function campaignGoalLabels(): string[] {
  return CAMPAIGN_GOALS.map((goal) => goal.label);
}

/**
 * True when `name` is (or looks like) a generated default, including the
 * pre-POS-188 "[Goal] — [Area] — Mon D" form and a bare leftover place
 * token such as a brand-kit city.
 */
export function looksLikeGeneratedCampaignName(
  name: string,
  options: { goalLabel?: string | null; staleTokens?: Array<string | null | undefined> } = {},
): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;

  const newMatch = trimmed.match(NEW_FORMAT);
  if (newMatch) return true;
  if (LEGACY_FORMAT.test(trimmed)) return true;

  const stale = (options.staleTokens ?? [])
    .flatMap((token) => (token ?? "").split(","))
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  const lowered = trimmed.toLowerCase();
  if (stale.some((token) => lowered === token || lowered.endsWith(` — ${token}`))) {
    return true;
  }

  return false;
}

export function resolveCampaignName(input: {
  savedName?: string | null;
  isCustom?: boolean | null;
  goalLabel?: string | null;
  now?: Date;
  staleTokens?: Array<string | null | undefined>;
}): string {
  const saved = input.savedName?.trim() ?? "";
  if (input.isCustom === true && saved) return saved;

  const looksGenerated =
    !saved ||
    input.isCustom === false ||
    looksLikeGeneratedCampaignName(saved, {
      goalLabel: input.goalLabel,
      staleTokens: input.staleTokens,
    });

  if (looksGenerated) {
    return formatDefaultCampaignName(input.goalLabel, input.now ?? new Date());
  }

  // Legacy draft: name exists, flag is missing, and it does not look generated.
  return saved;
}

export function draftListDisplayName(
  draft: Pick<CampaignDraft, "review" | "goal">,
): string {
  const named = draft.review?.campaignName?.trim();
  if (named) return named;
  return draft.goal?.goalLabel?.trim() || "Untitled Draft";
}

export function emptyReviewNamePatch(
  campaignName: string,
  campaignNameIsCustom: boolean,
): ReviewSelection {
  return {
    campaignName,
    campaignNameIsCustom,
    schedules: [],
    sendSeedCopy: true,
    seedAddress: "",
    additionalSeeds: [],
    paymentMethodId: null,
    paymentMethodLabel: null,
    agreedToTerms: false,
  };
}
