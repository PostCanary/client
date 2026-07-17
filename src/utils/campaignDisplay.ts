// src/utils/campaignDisplay.ts
// POS-151: derived display helpers for the Campaigns history list + "Your
// Campaign" modal. Kept out of the MailCampaign type file since these are
// UI-facing projections, not server contract fields.
import type { MailCampaign, TargetingArea } from "@/types/campaign";

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

const SENT_CARD_STATUSES = ["printing", "in_transit", "delivered"] as const;

/**
 * The API has no literal "pieces sent" field — MailCampaignCard tracks one
 * status per mailing (card 1/2/3), not per recipient. This derives a piece
 * count as (cards that have gone to print or further) x household count,
 * which is 0 for a still-approved campaign and householdCount x
 * sequenceLength once every card in the sequence has shipped.
 */
export function campaignPiecesSent(campaign: MailCampaign): number {
  const sentCards = campaign.cards.filter((card) =>
    (SENT_CARD_STATUSES as readonly string[]).includes(card.status),
  ).length;
  return sentCards * campaign.householdCount;
}

export function campaignDesignPreviewUrl(campaign: MailCampaign): string | null {
  const url = campaign.cards[0]?.previewImageUrl?.trim();
  return url && url.length > 0 ? url : null;
}
