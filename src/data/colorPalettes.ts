// Curated print-safe palettes for the designer's color profile picker
// (S72). Each triple maps to the render context's primary / secondary /
// accent brand colors — the renderer's palette resolver derives the zone
// colors (offer strip, info bar, CTA pop) and guarantees text contrast,
// so every preset here renders readable on all four layouts. These were
// checked against the same dark/light matrix used to harden the
// templates; keep new entries saturated enough that cta_pop derivation
// has a hue to work with (gray/near-white primaries produce muddy CTAs).

import type { ColorOverride } from "@/types/campaign";

export interface ColorPalette extends ColorOverride {
  id: string;
  name: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  { id: "classic-service", name: "Classic Service", primary: "#d63a2f", secondary: "#2a7de1", accent: "#f5b50a" },
  { id: "navy-brass", name: "Navy & Brass", primary: "#15355e", secondary: "#3caad7", accent: "#e8a020" },
  { id: "forest", name: "Forest", primary: "#1e5631", secondary: "#3e885b", accent: "#f2c14e" },
  { id: "slate-orange", name: "Slate & Orange", primary: "#36454f", secondary: "#5b7c99", accent: "#f47b20" },
  { id: "bold-yellow", name: "Bold Yellow", primary: "#1c1c1c", secondary: "#3d3d3d", accent: "#ffd23f" },
  { id: "coastal-teal", name: "Coastal Teal", primary: "#0f6e6a", secondary: "#14a098", accent: "#f6a821" },
  { id: "burgundy-gold", name: "Burgundy & Gold", primary: "#6e1423", secondary: "#a4243b", accent: "#d8a31a" },
  { id: "royal", name: "Royal", primary: "#4a2d7d", secondary: "#7251b5", accent: "#f0a202" },
  { id: "charcoal-red", name: "Charcoal & Red", primary: "#2b2d31", secondary: "#6c6f75", accent: "#e63946" },
  { id: "sky-sun", name: "Sky & Sun", primary: "#1769aa", secondary: "#4dabf5", accent: "#ffb300" },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

export function isCompleteOverride(
  value: Partial<ColorOverride> | null | undefined,
): value is ColorOverride {
  return Boolean(
    value &&
      isValidHex(value.primary ?? "") &&
      isValidHex(value.secondary ?? "") &&
      isValidHex(value.accent ?? ""),
  );
}
