// Click-to-edit hotspot maps for the server-rendered card preview.
//
// The preview is a single PNG, but each render template's slot geometry is
// fixed (mirrored from the template CSS in
// server/render_worker/templates/postcard/*.html — design space 1200x800 for
// HAC-1000). Zones are expressed as percentages so they scale with the
// displayed image. New render templates must ship their own zone map here,
// keyed by their renderTemplateId.

export type CardEditor = "headline" | "offer" | "photo" | "review";

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
};

export function editZonesFor(
  renderTemplateId: string | null | undefined,
  cardPurpose: string | null | undefined,
): EditZone[] {
  const zones =
    TEMPLATE_EDIT_ZONES[renderTemplateId ?? DEFAULT_RENDER_TEMPLATE_ID] ??
    TEMPLATE_EDIT_ZONES[DEFAULT_RENDER_TEMPLATE_ID] ??
    [];
  return zones.filter((z) => !z.proofOnly || cardPurpose === "proof");
}
