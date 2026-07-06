// src/data/templates.ts
import type {
  TemplateDefinition,
  TemplateLayoutType,
  CardPurpose,
  CampaignGoalType,
  Industry,
} from "@/types/campaign";

export type TemplateStatus = "draft" | "visible" | "retired";
export type TemplateSource = "curated";
export type PreviewStrategy = "render-worker";

export interface DesignLibraryTemplate extends TemplateDefinition {
  version: number;
  status: TemplateStatus;
  source: TemplateSource;
  industry: Industry;
  goalTypes: CampaignGoalType[];
  cardPositions: CardPurpose[];
  renderTemplateId: string;
  tags: string[];
  previewStrategy: PreviewStrategy;
  thumbnailUrl: string;
}

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
  { type: "photo-hero", name: "Photo Hero", desc: "One big photo with bold text right on it. Maximum visual impact.", bestFor: ["neighbor_marketing", "target_area"] },
  { type: "new-mover", name: "New Mover Welcome", desc: "A warm welcome for families who just moved in.", bestFor: ["new_mover"] },
  { type: "bold-graphic", name: "Bold Graphic", desc: "Minimal photo, bold headline and colors. Grabs attention.", bestFor: ["storm_response", "target_area"] },
  { type: "before-after", name: "Before / After", desc: "Two photos side by side showing transformation.", bestFor: ["neighbor_marketing", "target_area", "cross_service_promo"] },
  { type: "review-forward", name: "Review Forward", desc: "Customer review front and center. Trust-first approach.", bestFor: ["win_back", "seasonal_tuneup"] },
  { type: "service-checklist", name: "Service Checklist", desc: "Your services as a bold checklist. Shows everything you do at a glance.", bestFor: ["cross_service_promo", "new_mover"] },
  { type: "urgency-notice", name: "Urgency Notice", desc: "Official notice style with deadline. Grabs attention like important mail.", bestFor: ["storm_response", "seasonal_tuneup"] },
  { type: "tips", name: "Quick Tips", desc: "Helpful seasonal tips with your offer as the payoff. Builds goodwill.", bestFor: ["seasonal_tuneup", "neighbor_marketing"] },
  { type: "letter-note", name: "Personal Letter", desc: "A warm handwritten-style note with your offer in the P.S. Feels personal, not promotional.", bestFor: ["win_back", "neighbor_marketing"] },
  { type: "neighborhood-map", name: "Neighborhood Map", desc: "A real map of your service area with a 'we're in your neighborhood' message. Proves you're local.", bestFor: ["neighbor_marketing", "target_area"] },
];

const POSITIONS: CardPurpose[] = ["offer", "proof", "last_chance"];

// D-02 (Phase 2, 2026-04-09): layouts are surfaced to customers only once
// their render-worker template ships. The 7-layout set (2026-06-11 adds
// photo-top with its condensed 2-line headline); before-after stays
// hidden until its worker template is built.
export const DEMO_VISIBLE_LAYOUTS: TemplateLayoutType[] = [
  "full-bleed",
  "photo-hero",
  "side-split",
  "photo-top",
  "bold-graphic",
  "review-forward",
  "service-checklist",
  "urgency-notice",
  "new-mover",
  "before-after",
  "tips",
  "letter-note",
  // S76: neighborhood-map is key-gated (GEOAPIFY_API_KEY) — it is in the
  // visible set, but the TemplateBrowser additionally hides it when
  // mediaFeatures.mapsConfigured is false (probed there).
  "neighborhood-map",
];

// Worker render template per layout — keys of the render worker's
// TEMPLATE_REGISTRY (render_worker/services/postcard_renderer.py) and the
// server's KNOWN_RENDER_TEMPLATE_IDS. Layouts without an entry render with
// the server-side default (hac-1000).
export const LAYOUT_RENDER_TEMPLATE_IDS: Partial<
  Record<TemplateLayoutType, string>
> = {
  "full-bleed": "hac-1000-front-v1",
  "side-split": "side-split-front-v1",
  "photo-top": "photo-top-front-v1",
  "photo-hero": "photo-hero-front-v1",
  "new-mover": "new-mover-front-v1",
  "before-after": "before-after-front-v1",
  "tips": "tips-card-front-v1",
  "letter-note": "letter-note-front-v1",
  "bold-graphic": "bold-graphic-front-v1",
  "review-forward": "review-forward-front-v1",
  "service-checklist": "service-checklist-front-v1",
  "urgency-notice": "urgency-notice-front-v1",
  "neighborhood-map": "neighborhood-map-front-v1",
};

export function renderTemplateIdForLayout(
  layout: TemplateLayoutType | null | undefined,
): string | undefined {
  return layout ? LAYOUT_RENDER_TEMPLATE_IDS[layout] : undefined;
}

/**
 * Resolve the worker render template for a client template id (library id
 * like "hvac-hac-1000-full-bleed-offer-v1" or layout id like
 * "side-split-offer"). Library templates carry an explicit
 * renderTemplateId; layout templates map through their layoutType.
 */
export function renderTemplateIdForTemplate(
  templateId: string | null | undefined,
): string | undefined {
  if (!templateId) return undefined;
  const library = DESIGN_LIBRARY_TEMPLATES.find((t) => t.id === templateId);
  if (library) return library.renderTemplateId;
  const layout = ALL_TEMPLATES.find((t) => t.id === templateId)?.layoutType;
  return renderTemplateIdForLayout(layout);
}

// 18 templates: 6 layouts × 3 card positions
export const ALL_TEMPLATES: TemplateDefinition[] = LAYOUTS.flatMap((layout) =>
  POSITIONS.map((pos) =>
    makeTemplate(layout.type, layout.name, pos, layout.bestFor, layout.desc),
  ),
);

function makeLibraryTemplate(
  id: string,
  cardPosition: CardPurpose,
  name: string,
  description: string,
  tags: string[],
): DesignLibraryTemplate {
  const base = makeTemplate(
    "full-bleed",
    "Full-Bleed Photo",
    cardPosition,
    ["neighbor_marketing", "send_to_list", "seasonal_tuneup"],
    description,
  );

  return {
    ...base,
    id,
    name,
    description,
    version: 1,
    status: "visible",
    source: "curated",
    industry: "hvac",
    goalTypes: ["neighbor_marketing", "send_to_list", "seasonal_tuneup"],
    cardPositions: [cardPosition],
    renderTemplateId: "hac-1000-front-v1",
    tags,
    previewStrategy: "render-worker",
    thumbnailUrl: "",
    previewImageUrl: "",
  };
}

export const DESIGN_LIBRARY_TEMPLATES: DesignLibraryTemplate[] = [
  makeLibraryTemplate(
    "hvac-hac-1000-full-bleed-offer-v1",
    "offer",
    "HVAC Neighborhood Offer",
    "Full-bleed HVAC offer card for high-intent neighborhood or list campaigns.",
    ["hvac", "offer", "neighbor-marketing"],
  ),
  makeLibraryTemplate(
    "hvac-hac-1000-full-bleed-proof-v1",
    "proof",
    "HVAC Reputation Proof",
    "Trust-led proof card for reviews, guarantees, and reputation signals.",
    ["hvac", "proof", "reviews"],
  ),
  makeLibraryTemplate(
    "hvac-hac-1000-full-bleed-last-chance-v1",
    "last_chance",
    "HVAC Final Call",
    "Urgency card for the final touch in a direct-mail sequence.",
    ["hvac", "last-chance", "urgency"],
  ),
];

export const visibleDesignLibraryTemplates = DESIGN_LIBRARY_TEMPLATES.filter(
  (template) => template.status === "visible",
);

export function getVisibleDesignLibraryTemplates(
  goalType?: CampaignGoalType,
): DesignLibraryTemplate[] {
  if (!goalType) return visibleDesignLibraryTemplates;

  const matches = visibleDesignLibraryTemplates.filter((template) =>
    template.goalTypes.includes(goalType),
  );

  return matches.length > 0 ? matches : visibleDesignLibraryTemplates;
}

export function getDesignLibraryTemplate(
  templateId: string,
): DesignLibraryTemplate | undefined {
  return visibleDesignLibraryTemplates.find((template) => template.id === templateId);
}

// Goal → recommended layout
export const GOAL_TEMPLATE_MAP: Record<CampaignGoalType, TemplateLayoutType> = {
  neighbor_marketing: "full-bleed",
  send_to_list: "full-bleed",
  seasonal_tuneup: "side-split",
  target_area: "bold-graphic",
  storm_response: "bold-graphic",
  win_back: "review-forward",
  cross_service_promo: "service-checklist",
  new_mover: "new-mover",
  other: "photo-top",
};


// S75 Phase C: per-industry recommendation overrides. The goal map stays
// the generic default; a trade with a stronger-fit layout overrides it
// (roofing sells with before/after proof, cleaning with visual results,
// pest control with the official-notice register, etc.).
export const INDUSTRY_GOAL_OVERRIDES: Partial<
  Record<string, Partial<Record<CampaignGoalType, TemplateLayoutType>>>
> = {
  hvac: { seasonal_tuneup: "photo-top" },
  plumbing: { seasonal_tuneup: "tips", neighbor_marketing: "photo-hero" },
  roofing: {
    storm_response: "before-after",
    neighbor_marketing: "before-after",
    target_area: "photo-hero",
  },
  cleaning: {
    neighbor_marketing: "before-after",
    seasonal_tuneup: "tips",
    target_area: "photo-hero",
  },
  electrical: { seasonal_tuneup: "tips" },
  pest_control: { seasonal_tuneup: "urgency-notice" },
  landscaping: {
    neighbor_marketing: "photo-hero",
    seasonal_tuneup: "before-after",
  },
};

function resolveRecommendedLayout(
  goalType: CampaignGoalType,
  industry?: string | null,
): TemplateLayoutType {
  const override =
    INDUSTRY_GOAL_OVERRIDES[(industry ?? "").toLowerCase()]?.[goalType];
  const mapped = override ?? GOAL_TEMPLATE_MAP[goalType];
  return DEMO_VISIBLE_LAYOUTS.includes(mapped) ? mapped : DEMO_VISIBLE_LAYOUTS[0]!;
}

// Lob-style use-case merchandising: the recommended set carries a
// campaign-shaped name, optionally sharpened per trade.
const USE_CASE_NAMES: Record<CampaignGoalType, string> = {
  neighbor_marketing: "Neighborhood Trust Builder",
  send_to_list: "Your List, Your Offer",
  seasonal_tuneup: "Seasonal Tune-Up Push",
  target_area: "Own the Zip Code",
  storm_response: "Storm Damage Response",
  win_back: "Win-Back Campaign",
  cross_service_promo: "Full-Service Showcase",
  new_mover: "Welcome the New Movers",
  other: "Local Awareness",
};
const INDUSTRY_USE_CASE_NAMES: Partial<
  Record<string, Partial<Record<CampaignGoalType, string>>>
> = {
  hvac: { seasonal_tuneup: "Beat-the-Season Tune-Up" },
  roofing: { storm_response: "Storm Damage Response", neighbor_marketing: "Before & After Proof" },
  cleaning: { neighbor_marketing: "Spotless Before & After" },
  pest_control: { seasonal_tuneup: "Season Pest Warning" },
  landscaping: { seasonal_tuneup: "Spring/Fall Cleanup Push" },
};

export function useCaseLabel(
  goalType: CampaignGoalType,
  industry?: string | null,
): string {
  return (
    INDUSTRY_USE_CASE_NAMES[(industry ?? "").toLowerCase()]?.[goalType] ??
    USE_CASE_NAMES[goalType]
  );
}

/**
 * Get the recommended 3-template set for a goal (one per card position).
 */
export function getRecommendedTemplateSet(
  goalType: CampaignGoalType,
  industry?: string | null,
): TemplateDefinition[] {
  const layout = resolveRecommendedLayout(goalType, industry);
  return POSITIONS.map(
    (pos) =>
      getVisibleDesignLibraryTemplates(goalType).find(
        (t) => t.layoutType === layout && t.cardPosition === pos,
      ) ??
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
  industry?: string | null,
): { layout: TemplateLayoutType; name: string; desc: string; templates: TemplateDefinition[]; recommended: boolean }[] {
  const recommended = resolveRecommendedLayout(goalType, industry);
  const visibleLibraryTemplates = getVisibleDesignLibraryTemplates(goalType);
  // D-02: filter to DEMO_VISIBLE_LAYOUTS before mapping — keeps unbuilt
  // layouts in ALL_TEMPLATES (so code that references them still works)
  // but hides them from the customer browser.
  return LAYOUTS
    .filter((layout) => DEMO_VISIBLE_LAYOUTS.includes(layout.type))
    .map((layout) => ({
      layout: layout.type,
      name: layout.name,
      desc: layout.desc,
      templates: POSITIONS.map(
        (pos) =>
          visibleLibraryTemplates.find(
            (t) => t.layoutType === layout.type && t.cardPosition === pos,
          ) ??
          ALL_TEMPLATES.find(
            (t) => t.layoutType === layout.type && t.cardPosition === pos,
          )!,
      ),
      recommended: layout.type === recommended,
    }));
}
