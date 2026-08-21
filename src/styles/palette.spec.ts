import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * POS-279 static guard.
 *
 * The runtime gate in tests/e2e/release-accessibility.spec.ts only measures
 * what /app/home renders. This scans the whole stylesheet surface instead, so
 * a bad pairing is caught even on a screen no e2e test visits.
 *
 * It exists because the original POS-279 migration matched only `#fff` and
 * `#ffffff` and silently skipped three rules written as `color: white`. The
 * verification sweep shared that blind spot and reported a clean result, so
 * the miss shipped. Enumerate every spelling here, not just the common one.
 */

const ROOT = join(__dirname, "..", "..");

/** Every way the codebase spells white or a near-white. */
const LIGHT_TEXT =
  /color\s*:\s*(#fff\b|#ffffff\b|white\b|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(?:0?\.[89]\d*|1(?:\.0)?)\s*\))/i;

/** Every teal in the codebase, token or literal. */
const TEAL_FILL =
  /background(?:-color)?\s*:\s*(?:var\(\s*--app-teal(?:-hover)?\s*[,)][^;]*|#47bfa9\b|#3aa893\b|#26afa3\b|#0f766e\b)/i;

/** Naive CSS rule splitter — good enough for scoped SFC blocks. */
const RULE = /([^{}\n][^{}]*)\{([^{}]*)\}/g;

/** Walk src/ for style-bearing files. No dependency needed for a guard. */
function styleFiles(dir = join(ROOT, "src")): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...styleFiles(path));
    } else if (/\.(vue|css)$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

describe("interactive palette", () => {
  it("never pairs a teal fill with light text", () => {
    const offenders: string[] = [];

    for (const file of styleFiles()) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(RULE)) {
        const selector = match[1] ?? "";
        const body = match[2] ?? "";
        if (!TEAL_FILL.test(body) || !LIGHT_TEXT.test(body)) continue;
        const line = source.slice(0, match.index ?? 0).split("\n").length;
        offenders.push(
          `${file.replace(`${ROOT}/`, "")}:${line} — ${selector.trim().replace(/\s+/g, " ").slice(0, 60)}`,
        );
      }
    }

    // White on --app-teal is 2.26:1 and on --app-teal-hover 2.92:1, both below
    // the 4.5:1 AA floor. Teal fills carry --app-on-teal; actionable surfaces
    // use --app-btn-bg with --app-btn-fg.
    expect(offenders).toEqual([]);
  });

  it("defines the interactive tokens exactly once", () => {
    const css = readFileSync(join(ROOT, "src/styles/index.css"), "utf8");
    for (const token of [
      "--app-btn-bg",
      "--app-btn-bg-hover",
      "--app-btn-fg",
      "--app-on-teal",
      "--app-focus-ring",
    ]) {
      const declarations = css.match(new RegExp(`^\\s*${token}\\s*:`, "gm")) ?? [];
      expect(declarations, `${token} should be declared once`).toHaveLength(1);
    }
  });

  it("keeps secondary text dark enough for AA on paper bg", () => {
    const css = readFileSync(join(ROOT, "src/styles/index.css"), "utf8");
    const bg = css.match(/--app-bg:\s*(#[0-9a-fA-F]{6})/)?.[1];
    const secondary = css.match(/--app-text-secondary:\s*(#[0-9a-fA-F]{6})/)?.[1];
    expect(bg).toBeTruthy();
    expect(secondary).toBeTruthy();

    function lum(hex: string) {
      const n = parseInt(hex.slice(1), 16);
      const channels = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
    }
    function ratio(a: string, b: string) {
      const L1 = lum(a);
      const L2 = lum(b);
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    }

    // .home-tagline uses --app-text-secondary on --app-bg; axe needs ≥4.5:1.
    expect(ratio(secondary!, bg!)).toBeGreaterThanOrEqual(4.5);
  });

  it("never rings focus with a teal that fails WCAG 1.4.11", () => {
    const offenders: string[] = [];
    const TEAL_RING =
      /(?:outline|outline-color)\s*:\s*[^;]*(?:var\(\s*--app-teal(?:-hover)?\s*[,)]|#47bfa9\b|#3aa893\b)/i;
    const TAILWIND_TEAL_RING = /focus-visible:(?:ring|outline)-\[#(?:47bfa9|3aa893)\]/i;

    for (const file of styleFiles()) {
      const source = readFileSync(file, "utf8");
      // Teal measures 2.01:1 and teal-hover 2.60:1 against --app-bg; the rule
      // needs 3:1. Rings use --app-focus-ring.
      if (TAILWIND_TEAL_RING.test(source)) {
        offenders.push(`${file.replace(`${ROOT}/`, "")} — Tailwind teal focus ring`);
      }
      for (const match of source.matchAll(RULE)) {
        const selector = match[1] ?? "";
        const body = match[2] ?? "";
        if (!/:focus/.test(selector) || !TEAL_RING.test(body)) continue;
        const line = source.slice(0, match.index ?? 0).split("\n").length;
        offenders.push(
          `${file.replace(`${ROOT}/`, "")}:${line} — ${selector.trim().replace(/\s+/g, " ").slice(0, 60)}`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });
});
