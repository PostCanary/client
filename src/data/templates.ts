// src/data/templates.ts
import type {
  TemplateDefinition,
  TemplateLayoutType,
  CardPurpose,
  CampaignGoalType,
} from "@/types/campaign";

function makeTemplate(
  layoutType: TemplateLayoutType,
  layoutName: string,
  cardPosition: CardPurpose,
  bestFor: CampaignGoalType[],
  desc: string,
): TemplateDefinition {
  const posLabel =
    cardPosition === "offer"
      ? "Offer"
      : cardPosition === "proof"
        ? "Social Proof"
        : "Last Chance";
  return {
    id: `${layoutType}-${cardPosition}`,
    layoutType,
    name: `${layoutName} — ${posLabel}`,
    description: desc,
    cardPosition,
    bestFor,
    contentSlots: {
      headline: { maxChars: 50, placeholder: "Your headline here" },
      offerText: { maxChars: 200, placeholder: "Your special offer..." },
      reviewQuote: { maxChars: 120, placeholder: "What customers say about you" },
      urgencyText: { maxChars: 60, placeholder: "Limited time offer" },
      riskReversal: { maxChars: 80, placeholder: "100% satisfaction guaranteed" },
    },
    previewImageUrl: "", // inline SVG placeholders used in UI
  };
}

const LAYOUTS: {
  type: TemplateLayoutType;
  name: string;
  desc: string;
  bestFor: CampaignGoalType[];
}[] = [
  { type: "full-bleed", name: "Full-Bleed Photo", desc: "Big photo fills the card. Great for before/after or dramatic visuals.", bestFor: ["neighbor_marketing", "target_area"] },
  { type: "side-split", name: "Side Split", desc: "Photo on one side, messaging on the other. Clean and professional.", bestFor: ["seasonal_tuneup", "cross_service_promo"] },
  { type: "photo-top", name: "Photo Top", desc: "Photo across the top, details below. Works for any service.", bestFor: ["neighbor_marketing", "win_back"] },
  { type: "bold-graphic", name: "Bold Graphic", desc: "Minimal photo, bold headline and colors. Grabs attention.", bestFor: ["storm_response", "target_area"] },
  { type: "before-after", name: "Before / After", desc: "Two photos side by side showing transformation.", bestFor: ["neighbor_marketing", "target_area", "cross_service_promo"] },
  { type: "review-forward", name: "Review Forward", desc: "Customer review front and center. Trust-first approach.", bestFor: ["win_back", "seasonal_tuneup"] },
];

const POSITIONS: CardPurpose[] = ["offer", "proof", "last_chance"];

// D-02 (Phase 2, 2026-04-09): Only the Full-Bleed Photo layout is rebuilt
// to Draplin standard for the 2026-04-20 demo. The other 5 layouts
// (side-split, photo-top, bold-graphic, before-after, review-forward)
// stay in the file so PostcardFront.vue's conditional chain still compiles
// and the dev route layout selector still works — but they're filtered
// out of the customer-facing template browser so demo viewers can't
// accidentally pick an unfinished layout.
//
// Remove this constant (and revert the filter in getTemplateSetsForGoal)
// as each additional layout gets rebuilt to Draplin standard post-demo.
export const DEMO_VISIBLE_LAYOUTS: TemplateLayoutType[] = ["full-bleed"];

// 18 templates: 6 layouts × 3 card positions
export const ALL_TEMPLATES: TemplateDefinition[] = LAYOUTS.flatMap((layout) =>
  POSITIONS.map((pos) =>
    makeTemplate(layout.type, layout.name, pos, layout.bestFor, layout.desc),
  ),
);

// Goal → recommended layout
export const GOAL_TEMPLATE_MAP: Record<CampaignGoalType, TemplateLayoutType> = {
  neighbor_marketing: "full-bleed",
  seasonal_tuneup: "side-split",
  target_area: "bold-graphic",
  storm_response: "bold-graphic",
  win_back: "review-forward",
  cross_service_promo: "side-split",
  new_mover: "photo-top",
  other: "photo-top",
};

/**
 * Get the recommended 3-template set for a goal (one per card position).
 */
export function getRecommendedTemplateSet(
  goalType: CampaignGoalType,
): TemplateDefinition[] {
  const layout = GOAL_TEMPLATE_MAP[goalType];
  return POSITIONS.map(
    (pos) =>
      ALL_TEMPLATES.find(
        (t) => t.layoutType === layout && t.cardPosition === pos,
      )!,
  );
}

/**
 * Get all template sets filtered by goal (for the template browser).
 */
export function getTemplateSetsForGoal(
  goalType: CampaignGoalType,
): { layout: TemplateLayoutType; name: string; templates: TemplateDefinition[]; recommended: boolean }[] {
  const recommended = GOAL_TEMPLATE_MAP[goalType];
  // D-02: filter to DEMO_VISIBLE_LAYOUTS before mapping — keeps unbuilt
  // layouts in ALL_TEMPLATES (so code that references them still works)
  // but hides them from the customer browser.
  return LAYOUTS
    .filter((layout) => DEMO_VISIBLE_LAYOUTS.includes(layout.type))
    .map((layout) => ({
      layout: layout.type,
      name: layout.name,
      templates: POSITIONS.map(
        (pos) =>
          ALL_TEMPLATES.find(
            (t) => t.layoutType === layout.type && t.cardPosition === pos,
          )!,
      ),
      recommended: layout.type === recommended,
    }));
}
