import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePhotoAdjust, type PhotoAdjustTarget } from "./usePhotoAdjust";

function makeTarget(over: Partial<PhotoAdjustTarget> = {}): PhotoAdjustTarget {
  return {
    field: "photoCrop",
    src: "http://example.com/p.jpg",
    zone: { left: 0, top: 0, width: 100, height: 50 },
    crop: { x: 50, y: 50, zoom: 1 },
    label: "Photo",
    ...over,
  };
}

describe("usePhotoAdjust", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts inactive and becomes active on enter", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit });
    expect(a.active.value).toBe(false);
    a.enter(makeTarget());
    expect(a.active.value).toBe(true);
    expect(a.field.value).toBe("photoCrop");
  });

  it("enter seeds the live crop from the target's starting crop", () => {
    const a = usePhotoAdjust({ onCommit: vi.fn() });
    a.enter(makeTarget({ crop: { x: 20, y: 80, zoom: 2 } }));
    expect(a.crop.value).toEqual({ x: 20, y: 80, zoom: 2 });
  });

  it("panBy updates the crop INSTANTLY (no commit yet) and inverts the drag", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit, debounceMs: 800 });
    a.enter(makeTarget({ crop: { x: 50, y: 50, zoom: 2 } }));
    // Drag the photo left (dx=-50) → focal x increases past 50.
    a.panBy({ x: 50, y: 50, zoom: 2 }, -50, 0, 200, 150);
    expect(a.crop.value.x).toBeGreaterThan(50);
    // No commit before the debounce elapses.
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("debounces the commit ~800ms after the last interaction", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit, debounceMs: 800 });
    a.enter(makeTarget());
    a.setZoom(2);
    vi.advanceTimersByTime(500);
    a.setZoom(2.2); // resets the debounce
    vi.advanceTimersByTime(700);
    expect(onCommit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200); // 800ms after the LAST interaction
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("photoCrop", expect.objectContaining({ zoom: 2.2 }));
  });

  it("reset commits undefined immediately and restores identity", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit });
    a.enter(makeTarget({ crop: { x: 10, y: 10, zoom: 2 } }));
    a.reset();
    expect(a.crop.value).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(onCommit).toHaveBeenCalledWith("photoCrop", undefined);
  });

  it("exit flushes a pending commit and clears the target", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit, debounceMs: 800 });
    a.enter(makeTarget());
    a.setZoom(1.8);
    expect(onCommit).not.toHaveBeenCalled();
    a.exit();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(a.active.value).toBe(false);
  });

  it("exit with no pending change does not commit", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit });
    a.enter(makeTarget());
    a.exit();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("sets awaitingRender on commit and clears it once the render lands after the window", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit, debounceMs: 800 });
    a.enter(makeTarget());
    a.setZoom(2);
    vi.advanceTimersByTime(800);
    expect(a.awaitingRender.value).toBe(true);
    // A render that arrives too soon (before window+slack) keeps the overlay.
    a.onRenderArrived();
    expect(a.awaitingRender.value).toBe(true);
    // After the window closes, the render reconciles and the overlay can clear.
    vi.advanceTimersByTime(1000);
    a.onRenderArrived();
    expect(a.awaitingRender.value).toBe(false);
  });

  it("lingers the painted overlay after exit until the render reconciles (no flicker)", () => {
    const onCommit = vi.fn();
    const a = usePhotoAdjust({ onCommit, debounceMs: 800 });
    a.enter(makeTarget());
    a.setZoom(2);
    vi.advanceTimersByTime(800); // commit fires → awaitingRender true
    expect(a.awaitingRender.value).toBe(true);
    a.exit(); // user clicks Done while the render is in flight
    expect(a.active.value).toBe(false); // interaction stops immediately
    expect(a.overlayVisible.value).toBe(true); // ...but pixels stay
    expect(a.lingering.value).toBe(true);
    // The reconciling render lands after the window: overlay tears down.
    vi.advanceTimersByTime(1000);
    a.onRenderArrived();
    expect(a.overlayVisible.value).toBe(false);
    expect(a.target.value).toBeNull();
  });

  it("exit with nothing in flight clears the overlay immediately", () => {
    const a = usePhotoAdjust({ onCommit: vi.fn() });
    a.enter(makeTarget());
    a.exit();
    expect(a.overlayVisible.value).toBe(false);
    expect(a.lingering.value).toBe(false);
    expect(a.target.value).toBeNull();
  });

  it("zoomBy nudges zoom and clamps within range", () => {
    const a = usePhotoAdjust({ onCommit: vi.fn() });
    a.enter(makeTarget({ crop: { x: 50, y: 50, zoom: 2.4 } }));
    a.zoomBy(0.5);
    expect(a.crop.value.zoom).toBe(2.5); // clamped to CROP_MAX_ZOOM
    a.enter(makeTarget({ crop: { x: 50, y: 50, zoom: 1.1 } }));
    a.zoomBy(-0.5);
    expect(a.crop.value.zoom).toBe(1); // clamped to CROP_MIN_ZOOM
  });
});
