// src/utils/campaignDisplay.ts
// POS-151: derived display helpers for the Campaigns history list + "Your
// Campaign" modal. Kept out of the MailCampaign type file since these are
// UI-facing projections, not server contract fields.
import type { MailCampaign, TargetingArea } from "@/types/campaign";
import { mediaSrc } from "@/utils/mediaSrc";

export type CampaignAudienceType = "list" | "area";

// Audience source is coupled to goal type in the current wizard — only the
// send_to_list goal routes through the CSV/audience flow, every other goal
// draws an area on the map. See campaign.ts TargetingSelection/goal wiring.
export function campaignAudienceType(
  campaign: MailCampaign,
): CampaignAudienceType {
  return campaign.goalType === "send_to_list" ? "list" : "area";
}

export function campaignAreas(campaign: MailCampaign): TargetingArea[] {
  const areas = campaign.targetingData?.areas;
  return Array.isArray(areas) ? (areas as TargetingArea[]) : [];
}

const SENT_CARD_STATUSES = [
  "printing",
  "in_transit",
  "delivered",
  "submitted_to_partner",
  "in_production",
] as const;

/**
 * The API has no literal "pieces sent" field — MailCampaignCard tracks one
 * status per mailing (card 1/2/3), not per recipient. This derives a piece
 * count as (cards that have gone to print or further) x household count,
 * which is 0 for a still-approved campaign and householdCount x
 * sequenceLength once every card in the sequence has shipped.
 *
 * Flow v2 uploaded designs have empty cards[] — fall back to householdCount
 * once the campaign has left the pre-send "Preparing" states.
 */
export function campaignPiecesSent(campaign: MailCampaign): number {
  const households =
    typeof campaign.householdCount === "number" ? campaign.householdCount : 0;
  const cards = Array.isArray(campaign.cards) ? campaign.cards : [];
  if (cards.length === 0) {
    const shipped = [
      "submitted_to_partner",
      "in_production",
      "printing",
      "in_transit",
      "delivered",
    ].includes(campaign.status);
    return shipped ? households : 0;
  }
  const sentCards = cards.filter((card) =>
    (SENT_CARD_STATUSES as readonly string[]).includes(card.status),
  ).length;
  return sentCards * households;
}

export function campaignDesignPreviewUrl(campaign: MailCampaign): string | null {
  // POS-162: uploaded Flow v2 artwork lives on design_data.uploadedAsset,
  // not cards_data (which is [] for designSource='uploaded').
  if (campaign.designSource === "uploaded") {
    const uploaded = campaign.uploadedAsset?.frontUrl?.trim();
    if (uploaded) return mediaSrc(uploaded);
  }
  const url = campaign.cards?.[0]?.previewImageUrl?.trim();
  return url && url.length > 0 ? mediaSrc(url) : null;
}
