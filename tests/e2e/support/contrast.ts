import type { Locator, Page } from "@playwright/test";

/**
 * POS-277: axe only evaluates the resting state, so a hover or focus
 * regression passes CI. POS-265 shipped a focus ring at 2.01:1 that way.
 * These helpers measure the states axe cannot reach.
 */

export type ContrastSample = {
  label: string;
  state: "rest" | "hover" | "focus";
  ratio: number;
  required: number;
  foreground: string;
  background: string;
};

/** WCAG 2.1 relative luminance. */
function luminance([r, g, b]: number[]): number {
  const channel = (raw: number) => {
    const v = raw / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: number[], bg: number[]): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
}

/**
 * Read an element's rendered text colour, its effective background (walking
 * ancestors past transparent fills), and the threshold WCAG 1.4.3 demands for
 * its own font size and weight.
 */
async function sample(target: Locator): Promise<Omit<ContrastSample, "state" | "label">> {
  return target.evaluate((element) => {
    const parse = (value: string): number[] | null => {
      const parts = value.match(/[\d.]+/g);
      return parts ? parts.slice(0, 3).map(Number) : null;
    };
    // Composite translucent fills over what is behind them rather than
    // treating a faint tint as its solid hue.
    const effectiveBackground = (start: Element): number[] => {
      const stack: Array<{ rgb: number[]; alpha: number }> = [];
      let node: Element | null = start;
      while (node) {
        const raw = getComputedStyle(node).backgroundColor;
        const rgb = parse(raw);
        if (rgb) {
          const match = raw.match(/rgba?\([^)]*,\s*([\d.]+)\)/);
          const alpha = match ? Number.parseFloat(match[1]) : 1;
          if (alpha > 0) {
            stack.push({ rgb, alpha });
            if (alpha >= 1) break;
          }
        }
        node = node.parentElement;
      }
      let base = [255, 255, 255];
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        const { rgb, alpha } = stack[i];
        base = base.map((channel, idx) => Math.round(rgb[idx] * alpha + channel * (1 - alpha)));
      }
      return base;
    };
    const style = getComputedStyle(element);
    const fontSize = Number.parseFloat(style.fontSize);
    const bold = Number.parseInt(style.fontWeight, 10) >= 700;
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && bold);
    return {
      foreground: style.color,
      background: `rgb(${effectiveBackground(element).join(", ")})`,
      required: isLarge ? 3 : 4.5,
    };
  });
}

function toRgb(value: string): number[] {
  const parts = value.match(/[\d.]+/g);
  return parts ? parts.slice(0, 3).map(Number) : [0, 0, 0];
}

/**
 * Measure one element in all three states. Hover and focus are driven for
 * real so the browser applies :hover / :focus-visible before we read styles.
 */
export async function measureStates(
  page: Page,
  target: Locator,
  label: string,
): Promise<ContrastSample[]> {
  const out: ContrastSample[] = [];

  const rest = await sample(target);
  out.push({ label, state: "rest", ...rest, ratio: contrastRatio(toRgb(rest.foreground), toRgb(rest.background)) });

  await target.hover();
  await page.waitForTimeout(200); // colour transitions are 150ms
  const hover = await sample(target);
  out.push({ label, state: "hover", ...hover, ratio: contrastRatio(toRgb(hover.foreground), toRgb(hover.background)) });

  // Move the pointer away so :hover does not leak into the focus reading.
  await page.mouse.move(0, 0);
  await target.focus();
  await page.waitForTimeout(200);
  const focus = await sample(target);
  out.push({ label, state: "focus", ...focus, ratio: contrastRatio(toRgb(focus.foreground), toRgb(focus.background)) });

  return out;
}

/**
 * WCAG 1.4.11: the focus indicator needs 3:1. With a positive outline-offset
 * the ring is drawn on the page, so the page background is the neighbour that
 * matters. At offset 0 it would be the element's own fill instead.
 */
export async function measureFocusRing(
  page: Page,
  target: Locator,
  label: string,
): Promise<ContrastSample | null> {
  await page.mouse.move(0, 0);
  await target.focus();
  await page.waitForTimeout(200);

  const ring = await target.evaluate((element) => {
    const parse = (value: string): number[] | null => {
      const parts = value.match(/[\d.]+/g);
      return parts ? parts.slice(0, 3).map(Number) : null;
    };
    const style = getComputedStyle(element);
    const width = Number.parseFloat(style.outlineWidth);
    if (!width || style.outlineStyle === "none") return null;
    const offset = Number.parseFloat(style.outlineOffset) || 0;

    // Composite a translucent fill over what sits behind it. A 0.08 alpha
    // tint is almost the parent colour, not the solid hue — reading it as
    // opaque makes the ring look far worse than it renders.
    const composite = (start: Element | null): number[] => {
      const stack: Array<{ rgb: number[]; alpha: number }> = [];
      let node: Element | null = start;
      while (node) {
        const raw = getComputedStyle(node).backgroundColor;
        const rgb = parse(raw);
        if (rgb) {
          const match = raw.match(/rgba?\([^)]*,\s*([\d.]+)\)/);
          const alpha = match ? Number.parseFloat(match[1]) : 1;
          if (alpha > 0) {
            stack.push({ rgb, alpha });
            if (alpha >= 1) break;
          }
        }
        node = node.parentElement;
      }
      let base = [255, 255, 255];
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        const { rgb, alpha } = stack[i];
        base = base.map((channel, idx) => Math.round(rgb[idx] * alpha + channel * (1 - alpha)));
      }
      return base;
    };

    // With a positive offset the ring is painted on whatever is behind the
    // element; at offset 0 it sits on the element's own fill.
    const neighbour = offset > 0 ? composite(element.parentElement) : composite(element);
    return { ring: style.outlineColor, neighbour: `rgb(${neighbour.join(", ")})` };
  });

  if (!ring) return null;
  return {
    label,
    state: "focus",
    foreground: ring.ring,
    background: ring.neighbour,
    required: 3,
    ratio: contrastRatio(toRgb(ring.ring), toRgb(ring.neighbour)),
  };
}

export function failures(samples: ContrastSample[]): string[] {
  return samples
    .filter((s) => s.ratio < s.required)
    .map((s) => `${s.label} [${s.state}] ${s.ratio}:1 (needs ${s.required}) — ${s.foreground} on ${s.background}`);
}
