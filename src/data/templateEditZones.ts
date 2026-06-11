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
  | "notice";

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
