// src/utils/campaignDisplay.ts
// POS-151: derived display helpers for the Campaigns history list + "Your
// Campaign" modal. Kept out of the MailCampaign type file since these are
// UI-facing projections, not server contract fields.
import type {
  MailCampaign,
  MailCampaignOrder,
  TargetingArea,
} from "@/types/campaign";
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
export function campaignPiecesSent(campaign: MailCampaign): number | null {
  if (campaign.order) return campaign.order.counts.submitted;
  if (campaign.orderContractPresent) return null;

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

/** Best available server-owned recipient population for customer display. */
export function campaignRecipientCount(campaign: MailCampaign): number | null {
  const counts = campaign.order?.counts;
  if (counts) {
    for (const value of [
      counts.submitted,
      counts.printable,
      counts.purchased,
      counts.approved,
      counts.requested,
    ]) {
      if (typeof value === "number") return value;
    }
    return null;
  }
  if (campaign.orderContractPresent) return null;
  return typeof campaign.householdCount === "number"
    ? campaign.householdCount
    : null;
}

const BENIGN_RECONCILIATION_STATES = new Set([
  "none",
  "in_sync",
  "reconciled",
  "not_required",
]);
const ATTENTION_TOKENS = [
  "retry",
  "fail",
  "error",
  "reconcil",
  "ambiguous",
  "blocked",
  "declin",
];

function normalizedState(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function campaignOrderNeedsAttention(
  order: MailCampaignOrder | null,
): boolean {
  if (!order) return false;
  if (
    order.recovery_action === "retry_purchase" ||
    order.recovery_action === "contact_support"
  ) {
    return true;
  }
  const counts = order.counts;
  if ((counts.failed ?? 0) > 0 || (counts.returned ?? 0) > 0) return true;
  if (
    (counts.purchased !== null &&
      counts.requested !== null &&
      counts.purchased > counts.requested) ||
    (counts.billed !== null &&
      counts.purchased !== null &&
      counts.billed > counts.purchased) ||
    (counts.purchased !== null &&
      counts.printable !== null &&
      counts.printable > counts.purchased) ||
    (counts.printable !== null &&
      counts.submitted !== null &&
      counts.submitted > counts.printable) ||
    (counts.submitted !== null &&
      counts.accepted !== null &&
      counts.accepted > counts.submitted)
  ) {
    return true;
  }
  const fulfillment = normalizedState(order.fulfillment_state);
  if (
    ["submitted", "accepted", "partially_accepted", "in_production", "printed", "mailed", "delivered"].includes(fulfillment) &&
    counts.printable !== null &&
    counts.submitted !== counts.printable
  ) {
    return true;
  }
  if (
    ["accepted", "partially_accepted", "in_production", "printed", "mailed", "delivered"].includes(fulfillment) &&
    counts.submitted !== null &&
    counts.accepted !== counts.submitted
  ) {
    return true;
  }
  const reconciliation = normalizedState(order.reconciliation_state);
  if (reconciliation && !BENIGN_RECONCILIATION_STATES.has(reconciliation)) {
    return true;
  }
  return [order.payment_state, order.fulfillment_state].some((state) => {
    const normalized = normalizedState(state);
    return ATTENTION_TOKENS.some((token) => normalized.includes(token));
  });
}

export interface CampaignStatusPresentation {
  label: string;
  color: string;
  dot: string;
}

/**
 * Prefer the durable order lifecycle. Unknown order states stay neutral and
 * never inherit a coarse campaign status that could overstate fulfillment.
 */
export function campaignStatusPresentation(
  campaign: Pick<MailCampaign, "status" | "order" | "orderContractPresent">,
): CampaignStatusPresentation {
  const order = campaign.order;
  if (order) {
    if (campaignOrderNeedsAttention(order)) {
      return {
        label:
          order.recovery_action === "retry_purchase"
            ? "Retry available"
            : "Needs attention",
        color: "bg-red-100 text-red-700",
        dot: "bg-red-500",
      };
    }

    const fulfillment = normalizedState(order.fulfillment_state);
    if (["delivered", "completed"].includes(fulfillment)) {
      return { label: "Delivered", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    }
    if (["mailed", "in_transit"].includes(fulfillment)) {
      return { label: "Mailed", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    }
    if (["submitted", "accepted", "in_production", "printing", "printed"].includes(fulfillment)) {
      return { label: "In production", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    }
    if (fulfillment) {
      return { label: "Preparing", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    }

    const payment = normalizedState(order.payment_state);
    if (payment) {
      return { label: "Payment confirmed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    }
    return { label: "Status pending", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  }
  if (campaign.orderContractPresent) {
    return { label: "Status unavailable", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
  }

  switch (campaign.status) {
    case "approved":
    case "records_purchased":
    case "purchasing_records":
      return { label: "Preparing", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    case "pending_moderation":
      return { label: "Under Review", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "submitted_to_partner":
    case "in_production":
    case "printing":
      return { label: "In production", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    case "in_transit":
      return { label: "Mailed", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500" };
    case "delivered":
      return { label: "Delivered", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "returned":
      return { label: "Returned", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "failed":
      return { label: "Failed", color: "bg-red-100 text-red-700", dot: "bg-red-500" };
    case "held":
      return { label: "Held", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "cancelled":
      return { label: "Cancelled", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    case "results_ready":
      return { label: "Results Ready", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "completed":
      return { label: "Completed", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    case "paused":
      return { label: "Paused", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    case "draft":
      return { label: "Draft", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
    default:
      return { label: "Unknown", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
  }
}

export function formatOrderAmount(
  cents: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (typeof cents !== "number") return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(cents / 100);
  } catch {
    return `${cents.toLocaleString()} cents`;
  }
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
