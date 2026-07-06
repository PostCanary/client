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

// NOTE (POS-120): these maps used to be generated by an evenly-split helper
// (one band per editor, blind to content). That caused the services hitbox
// to rarely cover the rendered "We also do" line and starved the guarantee
// band, which can overflow with cert chips. Every style below now ships a
// hand-tuned stack of bands derived from its render template's geometry.

export const BACK_EDIT_ZONES: Record<string, EditZone[]> = {
  // standard-back-v2: subhead → benefits → testimonial → services+hours →
  // guarantee, top-to-bottom in the collapsing flex column (POS-120 tuned
  // bands, replacing the old equal 5-way split). Geometry source:
  // standard-back-v2.html — content column y 96-786 (12%-98.25%), zone
  // margin-bottom 18px/800 = 2.25%. Estimated rendered heights (px, incl.
  // the 18px zone margin): subhead ~68 (1-2 lines, font subhead_size),
  // benefits ~198 (the 5-item checkmark list — the tall one, ~28px/row),
  // testimonial ~111 (stars + 2-line quote + reviewer line), services ~85
  // (the "We also do:" line + optional hours line — modest, single-ish
  // line). Guarantee (kicker + text + cert chips + license/website meta,
  // which can overflow) gets the remainder and is pinned to BACK_BOTTOM so
  // clicks on overflowing chips still land on the guarantee editor.
  "standard-back-v2": [
    {
      editor: "back-subhead",
      label: "Edit subheadline",
      left: BACK_COLUMN.left,
      top: 12,
      width: BACK_COLUMN.width,
      height: 8.5,
    },
    {
      editor: "back-benefits",
      label: "Edit benefits list",
      left: BACK_COLUMN.left,
      top: 20.5,
      width: BACK_COLUMN.width,
      height: 25,
    },
    {
      editor: "back-testimonial",
      label: "Change testimonial",
      left: BACK_COLUMN.left,
      top: 45.5,
      width: BACK_COLUMN.width,
      height: 14,
    },
    {
      editor: "back-services",
      label: "Edit \"We also do\" line",
      left: BACK_COLUMN.left,
      top: 59.5,
      width: BACK_COLUMN.width,
      height: 9,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: BACK_COLUMN.left,
      top: 68.5,
      width: BACK_COLUMN.width,
      height: BACK_BOTTOM - 68.5, // 17.5 — reaches BACK_BOTTOM, catches chip overflow
    },
  ],

  // testimonial-back-v1: the hero testimonial leads (large pull-quote, bigger
  // type than standard-back-v2's inline testimonial), then a demoted one-line
  // subhead, then benefits, then guarantee. Geometry source:
  // testimonial-back-v1.html — hero-stars(30px) + hero-quote(28px, ~2 lines)
  // + hero-reviewer(16px) ≈ 133px+margin; subhead is ONE demoted secondary
  // line (18px) — much smaller than the old 12% band; benefits ~5 rows at
  // 24px check height; guarantee (kicker+text+chips+meta) was previously
  // starved at 14% — widened to reach BACK_BOTTOM so overflowing chips stay
  // clickable.
  "testimonial-back-v1": [
    {
      editor: "back-testimonial",
      label: "Change testimonial",
      left: BACK_COLUMN.left,
      top: BACK_TOP,
      width: BACK_COLUMN.width,
      height: 20,
    },
    {
      editor: "back-subhead",
      label: "Edit subheadline",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 20,
      width: BACK_COLUMN.width,
      height: 7,
    },
    {
      editor: "back-benefits",
      label: "Edit benefits list",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 27,
      width: BACK_COLUMN.width,
      height: 22,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 49,
      width: BACK_COLUMN.width,
      height: BACK_BOTTOM - (BACK_TOP + 49), // 25 — reaches BACK_BOTTOM
    },
  ],

  // service-area-back-v1: an optional map-thumb/area-statement leads (folded
  // into the services band below, since both route to the same editor),
  // then the FULL "Everything We Do" checklist (the tall element here, not
  // the one-line hours), then the single hours line, then guarantee.
  // Geometry source: service-area-back-v1.html — the old equal 3-way split
  // gave the one-line hours the same 24.67% as the multi-row checklist and
  // starved guarantee's chip overflow. Labeled "services checklist" (not
  // "We also do") since this style's services ARE the full checklist, not
  // the standard back's inline recap line.
  "service-area-back-v1": [
    {
      editor: "back-services",
      label: "Edit services checklist",
      left: BACK_COLUMN.left,
      top: BACK_TOP,
      width: BACK_COLUMN.width,
      height: 37,
    },
    {
      editor: "back-hours",
      label: "Edit hours",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 37,
      width: BACK_COLUMN.width,
      height: 6,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: BACK_COLUMN.left,
      top: BACK_TOP + 43,
      width: BACK_COLUMN.width,
      height: BACK_BOTTOM - (BACK_TOP + 43), // 31 — reaches BACK_BOTTOM
    },
  ],

  // photo-back-v1: PHOTO COLUMN occupies x 0–640 (≈0–53%); the brand overlay
  // BAND is a FIXED 300-560px block (37.5%-70%) — unlike the flex column
  // above, its subhead/guarantee split is a real pixel boundary, not an
  // estimate. Geometry source: photo-back-v1.html — band-kicker+band-subhead
  // (~61px) vs band-guarantee+band-chips (chips ride the band's lower edge
  // at y510-536, i.e. within the last ~19% of the band) — nudged the split
  // down slightly so the guarantee zone fully covers the chip row.
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
      height: 13,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: 2,
      top: 50.5,
      width: 49,
      height: 19.5,
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

  // brand-bold-back-v1: script kicker (not editable, sits above BACK_TOP),
  // knockout subhead, benefits checklist, then the guarantee coupon card +
  // cert chips. Geometry source: brand-bold-back-v1.html — subhead y100-196
  // (12.5%-24.5%), benefits y204-392 (25.5%-49%), coupon y400-560 (50%-70%)
  // with cert chips BELOW it at y576-636 (72%-79.5%). The old guarantee band
  // stopped at 70%, leaving the chips in a DEAD GAP that fell through to the
  // locked-zone catcher — widened to reach BACK_BOTTOM so the whole
  // coupon+chips block is one clickable guarantee zone.
  "brand-bold-back-v1": [
    {
      editor: "back-subhead",
      label: "Edit subheadline",
      left: 3.3,
      top: BACK_TOP,
      width: 46.7,
      height: 13,
    },
    {
      editor: "back-benefits",
      label: "Edit benefits list",
      left: 3.3,
      top: 25,
      width: 46.7,
      height: 24,
    },
    {
      editor: "back-guarantee",
      label: "Edit guarantee",
      left: 3.3,
      top: 49,
      width: 46.7,
      height: BACK_BOTTOM - 49, // 37 — reaches BACK_BOTTOM, covers coupon + chips
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
