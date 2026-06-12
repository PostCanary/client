import { describe, it, expect } from "vitest";
import {
  applyDrag,
  applyZoom,
  clampPercent,
  clampZoom,
  cropImgStyle,
  cropToOverride,
  isIdentityCrop,
  normalizeCrop,
  CROP_IDENTITY,
} from "./photoCrop";

describe("photoCrop clamps", () => {
  it("clamps percent to 0-100 and guards NaN", () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(NaN)).toBe(50);
  });

  it("clamps zoom to 1-2.5 and guards NaN", () => {
    expect(clampZoom(0.2)).toBe(1);
    expect(clampZoom(9)).toBe(2.5);
    expect(clampZoom(1.8)).toBe(1.8);
    expect(clampZoom(NaN)).toBe(1);
  });
});

describe("normalizeCrop / isIdentityCrop", () => {
  it("defaults to center/no-zoom", () => {
    expect(normalizeCrop(null)).toEqual(CROP_IDENTITY);
    expect(normalizeCrop(undefined)).toEqual(CROP_IDENTITY);
  });

  it("identifies the identity crop", () => {
    expect(isIdentityCrop({ x: 50, y: 50, zoom: 1 })).toBe(true);
    expect(isIdentityCrop(null)).toBe(true);
    expect(isIdentityCrop({ x: 20, y: 50, zoom: 1 })).toBe(false);
    expect(isIdentityCrop({ x: 50, y: 50, zoom: 1.5 })).toBe(false);
  });
});

describe("applyDrag", () => {
  const frame = { w: 200, h: 150 };

  it("dragging right increases focal x", () => {
    const start = { x: 50, y: 50, zoom: 2 };
    const next = applyDrag(start, 50, 0, frame.w, frame.h);
    // pan room x = (2-1)*200 = 200; 50px => +25% => 75
    expect(next.x).toBeCloseTo(75, 5);
    expect(next.y).toBe(50);
    expect(next.zoom).toBe(2);
  });

  it("dragging down increases focal y", () => {
    const start = { x: 50, y: 50, zoom: 2 };
    const next = applyDrag(start, 0, 75, frame.w, frame.h);
    // pan room y = (2-1)*150 = 150; 75px => +50% => 100
    expect(next.y).toBeCloseTo(100, 5);
  });

  it("clamps the focal point at the photo edge", () => {
    const start = { x: 90, y: 10, zoom: 2 };
    const next = applyDrag(start, 1000, -1000, frame.w, frame.h);
    expect(next.x).toBe(100);
    expect(next.y).toBe(0);
  });

  it("higher zoom pans a smaller fraction per pixel", () => {
    const lowZoom = applyDrag({ x: 50, y: 50, zoom: 1.5 }, 50, 0, frame.w, frame.h);
    const highZoom = applyDrag({ x: 50, y: 50, zoom: 2.5 }, 50, 0, frame.w, frame.h);
    // At z=1.5 panRoom=100 → +50%; at z=2.5 panRoom=300 → ~+16.7%.
    expect(lowZoom.x - 50).toBeGreaterThan(highZoom.x - 50);
  });

  it("does not divide by zero at zoom 1", () => {
    const next = applyDrag({ x: 50, y: 50, zoom: 1 }, 50, 50, frame.w, frame.h);
    // No pan room → focal pegs to the edge but stays finite/clamped.
    expect(Number.isFinite(next.x)).toBe(true);
    expect(next.x).toBeGreaterThanOrEqual(0);
    expect(next.x).toBeLessThanOrEqual(100);
  });
});

describe("applyZoom", () => {
  it("sets zoom and preserves focal point", () => {
    const next = applyZoom({ x: 30, y: 70, zoom: 1 }, 2.2);
    expect(next).toEqual({ x: 30, y: 70, zoom: 2.2 });
  });
  it("clamps out-of-range zoom", () => {
    expect(applyZoom({ x: 50, y: 50, zoom: 1 }, 9).zoom).toBe(2.5);
  });
});

describe("cropImgStyle mirrors the worker technique", () => {
  it("emits object-position only when no zoom", () => {
    const s = cropImgStyle({ x: 20, y: 80, zoom: 1 });
    expect(s.objectPosition).toBe("20% 80%");
    expect(s.transform).toBeUndefined();
  });
  it("emits transform + origin at the focal point when zoomed", () => {
    const s = cropImgStyle({ x: 25, y: 25, zoom: 2 });
    expect(s.objectPosition).toBe("25% 25%");
    expect(s.transform).toBe("scale(2)");
    expect(s.transformOrigin).toBe("25% 25%");
  });
});

describe("cropToOverride", () => {
  it("returns undefined for the identity crop", () => {
    expect(cropToOverride({ x: 50, y: 50, zoom: 1 })).toBeUndefined();
  });
  it("rounds and returns a non-identity crop", () => {
    expect(cropToOverride({ x: 33.3333, y: 66.6666, zoom: 1.23456 })).toEqual({
      x: 33.33,
      y: 66.67,
      zoom: 1.235,
    });
  });
});
