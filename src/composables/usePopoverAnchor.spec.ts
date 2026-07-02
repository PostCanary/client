import { describe, expect, it } from "vitest";
import {
  anchorPopover,
  zonePixelRect,
  type ZoneBox,
} from "./usePopoverAnchor";

const VIEWPORT = { width: 1000, height: 600 };
const POP = { width: 320, height: 300 };

describe("usePopoverAnchor — zone → pixel rect", () => {
  it("converts a percentage box to pixels against the viewport", () => {
    const zone: ZoneBox = { left: 10, top: 20, width: 30, height: 40 };
    expect(zonePixelRect(zone, VIEWPORT)).toEqual({
      left: 100,
      top: 120,
      width: 300,
      height: 240,
    });
  });
});

describe("usePopoverAnchor — placement", () => {
  it("opens to the RIGHT of a left-side zone", () => {
    // zone at left 0-30% → right edge 300px, plenty of room to the right.
    const zone: ZoneBox = { left: 0, top: 0, width: 30, height: 50 };
    const r = anchorPopover(zone, VIEWPORT, POP);
    expect(r.placement).toBe("right");
    // left = zoneRight(300) + gap(12)
    expect(r.left).toBe(312);
  });

  it("flips to the LEFT for a zone near the right edge (never clipped)", () => {
    // zone at left 75-100% → opening right would overflow; must flip left.
    const zone: ZoneBox = { left: 75, top: 0, width: 25, height: 50 };
    const r = anchorPopover(zone, VIEWPORT, POP);
    expect(r.placement).toBe("left");
    // popover fully on-screen: left >= margin and right edge <= viewport width
    expect(r.left).toBeGreaterThanOrEqual(8);
    expect(r.left + POP.width).toBeLessThanOrEqual(VIEWPORT.width - 8 + 0.001);
  });

  it("clamps a bottom zone upward so the popover stays in view", () => {
    // zone at the very bottom → top align would push the popover off-screen.
    const zone: ZoneBox = { left: 0, top: 90, width: 30, height: 10 };
    const r = anchorPopover(zone, VIEWPORT, POP);
    // top must be clamped so the whole 300px-tall popover fits in 600px.
    expect(r.top).toBeLessThanOrEqual(VIEWPORT.height - POP.height - 8);
    expect(r.top).toBeGreaterThanOrEqual(8);
  });

  it("never clips horizontally even when the popover is wider than both gutters", () => {
    const narrow = { width: 1000, height: 600 };
    const wide = { width: 700, height: 200 };
    // centered zone with little room on either side
    const zone: ZoneBox = { left: 30, top: 0, width: 40, height: 50 };
    const r = anchorPopover(zone, narrow, wide);
    expect(r.left).toBeGreaterThanOrEqual(8);
    expect(r.left + wide.width).toBeLessThanOrEqual(narrow.width - 8 + 0.001);
  });

  it("keeps the popover within the top margin for a top-aligned zone", () => {
    const zone: ZoneBox = { left: 0, top: 0, width: 30, height: 20 };
    const r = anchorPopover(zone, VIEWPORT, POP);
    expect(r.top).toBeGreaterThanOrEqual(8);
  });

  it("applies the artwork offset so the popover anchors to the CARD box, not the container", () => {
    // Card box is 800x600 sitting at x=100 inside a 1000-wide container.
    const vp = {
      width: 800,
      height: 600,
      offsetX: 100,
      offsetY: 0,
      containerWidth: 1000,
      containerHeight: 600,
    };
    const zone: ZoneBox = { left: 0, top: 0, width: 40, height: 50 };
    const r = anchorPopover(zone, vp, POP);
    // zone right edge in container space = offsetX(100) + 40%*800(320) = 420
    // popover opens right: left = 420 + gap(12) = 432
    expect(r.zoneRect.left).toBe(100);
    expect(r.left).toBe(432);
  });

  it("clamps against the container bounds (wider than the artwork box)", () => {
    const vp = {
      width: 800,
      height: 600,
      offsetX: 100,
      offsetY: 0,
      containerWidth: 1000,
      containerHeight: 600,
    };
    // a zone at the right of the card → flips left but clamps to container.
    const zone: ZoneBox = { left: 80, top: 80, width: 20, height: 20 };
    const r = anchorPopover(zone, vp, POP);
    expect(r.left).toBeGreaterThanOrEqual(8);
    expect(r.left + POP.width).toBeLessThanOrEqual(1000 - 8 + 0.001);
  });
});
