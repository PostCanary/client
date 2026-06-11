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
  | "letter";

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
