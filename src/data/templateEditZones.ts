// Click-to-edit hotspot maps for the server-rendered card preview.
//
// The preview is a single PNG, but each render template's slot geometry is
// fixed (mirrored from the template CSS in
// server/render_worker/templates/postcard/*.html — design space 1200x800 for
// HAC-1000). Zones are expressed as percentages so they scale with the
// displayed image. New render templates must ship their own zone map here,
// keyed by their renderTemplateId.

export type CardEditor =
  | "headline"
  | "offer"
  | "photo"
  | "review"
  | "checklist"
  | "notice"
  | "tips"
  | "letter"
  | "map"
  // Heavy/global editors hosted in the ContextDrawer (S79 Phase-2). These
  // are not front zone hotspots; they identify which drawer panel to open.
  | "colors"
  | "business"
  // Back-side zones (S79 Phase-2) — each maps to a section of the shared
  // back's content column (BackEditPanel renders these in section mode).
  | "back-style"
  | "back-subhead"
  | "back-benefits"
  | "back-testimonial"
  | "back-services"
  | "back-hours"
  | "back-guarantee"
  | "back-photo";

export interface EditZone {
  editor: CardEditor;
  label: string;
  /** percent of card width/height */
  left: number;
  top: number;
  width: number;
  height: number;
  /** only show on proof (social-proof) cards */
  proofOnly?: boolean;
  /** hide on proof cards (surface is replaced by the proof panel) */
  hideOnProof?: boolean;
}

export const DEFAULT_RENDER_TEMPLATE_ID = "hac-1000-front-v1";

export const TEMPLATE_EDIT_ZONES: Record<string, EditZone[]> = {
  // Geometry source: tips-card-front.html (S74 wave 3) — checklist base,
  // right panel = numbered tips (dedicated editor).
  "tips-card-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      proofOnly: true,
    },
    {
      editor: "tips",
      label: "Edit tips",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 51,
      height: 62.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: before-after-front.html (S74 wave 3) — split banner
  // (before 0-50%, after 50-100%), photo-top body below.
  "before-after-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 0,
      top: 0,
      width: 100,
      height: 38.9,
      proofOnly: true,
    },
    {
      editor: "photo",
      label: "Change before photo",
      left: 0,
      top: 0,
      width: 50,
      height: 38.9,
      hideOnProof: true,
    },
    {
      editor: "photo",
      label: "Change after photo",
      left: 50,
      top: 0,
      width: 50,
      height: 38.9,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 39.75,
      width: 100,
      height: 22.5,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: photo-hero-front.html (S74 wave 3) —
  //   .photo/.hero-scrim 0,0 1200x499 (photo IS the top zone)
  //   headline overlay   60,46 -> ~1160x190 (white knockout)
  //   .proof-panel       560,206 600x258 (floating review card)
  "photo-hero-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 46.7,
      top: 25.75,
      width: 50,
      height: 32.25,
      proofOnly: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 100,
      height: 24,
    },
    {
      editor: "photo",
      label: "Change photo",
      left: 0,
      top: 24,
      width: 100,
      height: 38.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: new-mover-front.html — photo-top base + greeting
  // chrome over the banner (greeting is template chrome, not editable).
  "new-mover-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 0,
      top: 0,
      width: 100,
      height: 38.9,
      proofOnly: true,
    },
    {
      editor: "photo",
      label: "Change photo",
      left: 0,
      top: 0,
      width: 100,
      height: 38.9,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 39.75,
      width: 100,
      height: 22.5,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: photo-top-front.html (S73) —
  //   .photo            -1,-1  1202x311 (full-width banner)
  //   .headline-zone-bg -1,318 1202x180 (condensed 2-line headline)
  //   .proof-panel      -1,-1  1202x311 (proof cards; replaces the banner)
  //   offer strips      0,498  1200x125
  "photo-top-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 0,
      top: 0,
      width: 100,
      height: 38.9,
      proofOnly: true,
    },
    {
      editor: "photo",
      label: "Change photo",
      left: 0,
      top: 0,
      width: 100,
      height: 38.9,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 39.75,
      width: 100,
      height: 22.5,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: hac-1000-front.html CSS —
  //   text-zone-bg  0,0    614x499
  //   .photo        510,0  690x499
  //   .proof-panel  584,54 536x386 (proof cards; overlays the photo)
  //   offer strips  0,498  1200x125
  "hac-1000-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 48.7,
      top: 6.8,
      width: 44.6,
      height: 48.2,
      proofOnly: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 42.5,
      height: 62.3,
    },
    {
      editor: "photo",
      label: "Change photo",
      left: 42.5,
      top: 0,
      width: 57.5,
      height: 62.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: side-split-front.html —
  //   white text zone 0,0 612x499 (8px cta_pop seam at x612)
  //   .photo          620,0 580x499
  //   .proof-panel    620,0 581x499 (proof cards; replaces the photo column)
  //   offer strips    0,498 1200x125
  "side-split-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      proofOnly: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 51,
      height: 62.3,
    },
    {
      editor: "photo",
      label: "Change photo",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      hideOnProof: true,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: bold-graphic-front.html — no photo on this layout.
  //   headline slots  x68-560 on the color field
  //   .echo-panel     700,80 420x330 (offer echo; hidden on proof cards)
  //   .proof-panel    584,54 536x386 (proof cards)
  //   offer strips    0,498 1200x125
  "bold-graphic-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 48.7,
      top: 6.8,
      width: 44.6,
      height: 48.2,
      proofOnly: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 48,
      height: 62.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 58.3,
      top: 10,
      width: 35,
      height: 41.3,
      hideOnProof: true,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: service-checklist-front.html — no photo. The right
  // panel is the services checklist (customer-editable rows, S73). Proof
  // cards swap it for the review panel.
  "service-checklist-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      proofOnly: true,
    },
    {
      editor: "checklist",
      label: "Edit checklist",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 51,
      height: 62.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: urgency-notice-front.html — no photo. Notice panel
  // body = urgencyText (dedicated editor, S73). Proof swaps to review.
  "urgency-notice-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      proofOnly: true,
    },
    {
      editor: "notice",
      label: "Edit notice text",
      left: 51.7,
      top: 0,
      width: 48.3,
      height: 62.3,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 51,
      height: 62.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: letter-note-front.html (S76-C) — no photo. The full
  // note field (salutation + body, 0-62.3% top) is one "letter" editor;
  // proof swaps it for the review panel. The offer/P.S. rides the bottom
  // strip like every other template.
  "letter-note-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 0,
      top: 0,
      width: 100,
      height: 62.3,
      proofOnly: true,
    },
    {
      editor: "letter",
      label: "Edit letter",
      left: 0,
      top: 0,
      width: 100,
      height: 62.3,
      hideOnProof: true,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],

  // Geometry source: neighborhood-map-front.html (S76-D) —
  //   .map           -1,-1   1202x470 (the service-area map is the hero)
  //   .headline-band -1,-1   1202x150 (brand-color band over the map top)
  //   .proof-panel   560,96  600x290  (proof cards; replaces band + callout)
  //   offer strip    -1,469  1200x130
  "neighborhood-map-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 46.7,
      top: 12,
      width: 50,
      height: 36.25,
      proofOnly: true,
    },
    {
      editor: "map",
      label: "Edit service area",
      left: 0,
      top: 18.75,
      width: 100,
      height: 40,
      hideOnProof: true,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 0,
      top: 0,
      width: 100,
      height: 18.75,
      hideOnProof: true,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 58.6,
      width: 100,
      height: 16.3,
    },
  ],

  // Geometry source: review-forward-front.html — no photo on this layout.
  //   .review-hero     0,0   701x499 (white; the review is the lead on
  //                    every card purpose, so the zone is always active)
  //   .headline-panel  700,0 501x499
  //   offer strips     0,498 1200x125
  "review-forward-front-v1": [
    {
      editor: "review",
      label: "Change review",
      left: 0,
      top: 0,
      width: 58.3,
      height: 62.3,
    },
    {
      editor: "headline",
      label: "Edit headline",
      left: 58.3,
      top: 0,
      width: 41.7,
      height: 62.3,
    },
    {
      editor: "offer",
      label: "Edit offer",
      left: 0,
      top: 62.3,
      width: 100,
      height: 15.6,
    },
  ],
};

// ---------------------------------------------------------------------------
// BACK-SIDE zone maps (S79 Phase-2).
//
// Geometry source: server/render_worker/templates/postcard/*-back-*.html. The
// back canvas is also 1200x800. On every back style the LEFT CONTENT COLUMN is
//   .content { left: 40px; top: 96px; width: 596px; max-height: 690px }
// → x 3.3%–53%, y 12%–98.25%. The right half (x≥55%) is the RESERVED mailing
// zone (return address, indicia, VDP strip, OneVision address + IMb barcode)
// and is intentionally NOT editable.
//
// The content column is an auto-height flex stack whose sections collapse when
// empty, so exact per-section pixel tops are dynamic. Like the front maps,
// these zones are approximate vertical bands over the column that route a
// click to the right BackEditPanel section. They never need to be pixel-exact
// against the artwork — they exist to anchor the popover near what was clicked.

const BACK_COLUMN = { left: 3.3, width: 49.7 } as const; // x 40–636 / 1200
const BACK_TOP = 12; // y 96 / 800
const BACK_BOTTOM = 86; // leave the QR/return strip (~690–800) non-editable

/** Evenly split the content column into vertical bands for the given editors. */
function backColumnBands(editors: { editor: CardEditor; label: string }[]): EditZone[] {
  const span = BACK_BOTTOM - BACK_TOP;
  const band = span / editors.length;
  return editors.map((e, i) => ({
    editor: e.editor,
    label: e.label,
    left: BACK_COLUMN.left,
    top: BACK_TOP + band * i,
    width: BACK_COLUMN.width,
    height: band,
  }));
}

export const BACK_EDIT_ZONES: Record<string, EditZone[]> = {
  // standard-back-v2: subhead → benefits → testimonial → services+hours →
  // guarantee, top-to-bottom in the collapsing flex column.
  "standard-back-v2": backColumnBands([
    { editor: "back-subhead", label: "Edit subheadline" },
    { editor: "back-benefits", label: "Edit benefits" },
    { editor: "back-testimonial", label: "Change testimonial" },
    { editor: "back-services", label: "Edit services" },
    { editor: "back-guarantee", label: "Edit guarantee" },
  ]),

  // testimonial-back-v1: the hero testimonial leads, then subhead/benefits,
  // then guarantee. The testimonial owns the top third.
  "testimonial-back-v1": [
    {
      editor: "back-testimonial",
      label: "Change testimonial",
      left: BACK_COLUMN.left,
      top: BACK_TOP,
      width: BACK_COLUMN.width,
      height: 28,
    },
    {
      editor: "back-subhead",
      label: "Edit subheadline",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 28,
      width: BACK_COLUMN.width,
      height: 12,
    },
    {
      editor: "back-benefits",
      label: "Edit benefits",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 40,
      width: BACK_COLUMN.width,
      height: 20,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 60,
      width: BACK_COLUMN.width,
      height: BACK_BOTTOM - (BACK_TOP + 60),
    },
  ],

  // service-area-back-v1: services head + rows, map thumb, area statement,
  // hours, guarantee.
  "service-area-back-v1": backColumnBands([
    { editor: "back-services", label: "Edit services" },
    { editor: "back-hours", label: "Edit hours" },
    { editor: "back-guarantee", label: "Edit guarantee" },
  ]),

  // photo-back-v1: PHOTO COLUMN occupies x 0–640 (≈0–53%); the brand overlay
  // band (subhead + guarantee) floats over it y 300–560 (≈37.5%–70%).
  "photo-back-v1": [
    {
      editor: "back-photo",
      label: "Change back photo",
      left: 0,
      top: 0,
      width: 53,
      height: 37,
    },
    {
      editor: "back-subhead",
      label: "Edit subheadline",
      left: 2,
      top: 37.5,
      width: 49,
      height: 14,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: 2,
      top: 52,
      width: 49,
      height: 18,
    },
    {
      editor: "back-photo",
      label: "Change back photo",
      left: 0,
      top: 70,
      width: 53,
      height: 30,
    },
  ],

  // brand-bold-back-v1: script kicker, knockout subhead, benefits checklist,
  // coupon/guarantee card, cert chips.
  "brand-bold-back-v1": [
    {
      editor: "back-subhead",
      label: "Edit subheadline",
      left: 3.3,
      top: BACK_TOP,
      width: 46.7,
      height: 12,
    },
    {
      editor: "back-benefits",
      label: "Edit benefits",
      left: 3.3,
      top: 25.5,
      width: 46.7,
      height: 23.5,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: 3.3,
      top: 50,
      width: 46.7,
      height: 20,
    },
  ],
};

// Legacy back id falls back to the standard map.
BACK_EDIT_ZONES["standard-back-v1"] = BACK_EDIT_ZONES["standard-back-v2"]!;

export const DEFAULT_BACK_TEMPLATE_ID = "standard-back-v2";

export function backEditZonesFor(
  backTemplateId: string | null | undefined,
): EditZone[] {
  return (
    BACK_EDIT_ZONES[backTemplateId ?? DEFAULT_BACK_TEMPLATE_ID] ??
    BACK_EDIT_ZONES[DEFAULT_BACK_TEMPLATE_ID] ??
    []
  );
}

export function editZonesFor(
  renderTemplateId: string | null | undefined,
  cardPurpose: string | null | undefined,
): EditZone[] {
  const zones =
    TEMPLATE_EDIT_ZONES[renderTemplateId ?? DEFAULT_RENDER_TEMPLATE_ID] ??
    TEMPLATE_EDIT_ZONES[DEFAULT_RENDER_TEMPLATE_ID] ??
    [];
  const isProof = cardPurpose === "proof";
  return zones.filter((z) => (isProof ? !z.hideOnProof : !z.proofOnly));
}
