// src/utils/contrast.ts
// WCAG 2.1 contrast math for postcard template text/background pairs.
//
// Draplin fix from expert review (06-design-studio-r2-expert-review.md §5):
// extracted brand colors may fail contrast against white/dark backgrounds in
// print. Every text-on-color pair must be checked and, when it fails 4.5:1,
// fall back to black or white (whichever passes).
//
// Formula: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
//   L = 0.2126 * R + 0.7152 * G + 0.0722 * B
//   where R/G/B are gamma-corrected sRGB channels (0-1).
//   Contrast = (L_lighter + 0.05) / (L_darker + 0.05)
//
// Verified against canonical values:
//   #000/#FFF = 21:1 (max possible)
//   #777/#FFF ≈ 4.48:1 (just under AA threshold)
//   Same color on same color = 1:1 (min possible)

const WCAG_AA_MIN = 4.5;

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Parse a hex color string into an RGB object.
 * Accepts #RGB, #RRGGBB, or without the leading #.
 * Throws on invalid input.
 */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (full.length !== 6) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  };
}

/**
 * Compute WCAG relative luminance for an sRGB color (0-1 scale).
 */
export function relativeLuminance({ r, g, b }: RGB): number {
  const srgb = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Return the WCAG contrast ratio between two hex colors.
 * Symmetric — order of arguments does not matter.
 * Range: 1.0 (identical) to 21.0 (black on white).
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Does fg-on-bg meet WCAG AA for normal text (4.5:1)?
 */
export function meetsAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= WCAG_AA_MIN;
}

/**
 * Return whichever of black or white has the higher contrast with `bg`.
 * Used as a fallback when an extracted brand color fails contrast.
 */
export function safeTextColor(bg: string): "#000000" | "#FFFFFF" {
  const black = contrastRatio("#000000", bg);
  const white = contrastRatio("#FFFFFF", bg);
  return black >= white ? "#000000" : "#FFFFFF";
}

/**
 * Return `fg` if it meets AA contrast against `bg`; otherwise return the
 * closest safe color (black or white) that does.
 *
 * This is the primary utility templates should call: pass the brand color
 * you want to use, get back a color that is guaranteed to be readable.
 */
export function ensureContrast(fg: string, bg: string): string {
  return meetsAA(fg, bg) ? fg : safeTextColor(bg);
}
