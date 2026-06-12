import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PhotoAdjustOverlay from "./PhotoAdjustOverlay.vue";

const baseProps = {
  src: "http://example.com/p.jpg",
  zone: { left: 0, top: 0, width: 50, height: 40 },
  viewport: {
    width: 600,
    height: 400,
    offsetX: 20,
    offsetY: 10,
    containerWidth: 640,
    containerHeight: 420,
  },
  crop: { x: 50, y: 50, zoom: 1 },
  label: "Photo",
};

describe("PhotoAdjustOverlay", () => {
  it("positions the overlay on the zone pixel rect (incl. card-box offset)", () => {
    const w = mount(PhotoAdjustOverlay, { props: baseProps });
    const overlay = w.find('[data-testid="photo-adjust-overlay"]');
    const style = overlay.attributes("style") || "";
    // left = offsetX(20) + 0% of 600 = 20; top = offsetY(10) + 0 = 10
    expect(style).toContain("left: 20px");
    expect(style).toContain("top: 10px");
    // width = 50% of 600 = 300; height = 40% of 400 = 160
    expect(style).toContain("width: 300px");
    expect(style).toContain("height: 160px");
  });

  it("applies the worker-mirroring crop CSS to the img", () => {
    const w = mount(PhotoAdjustOverlay, {
      props: { ...baseProps, crop: { x: 25, y: 75, zoom: 2 } },
    });
    const style = w.find('[data-testid="photo-adjust-img"]').attributes("style") || "";
    expect(style).toContain("object-position: 25% 75%");
    expect(style).toContain("scale(2)");
  });

  it("renders the zoom slider, Reset, and Done in the chip", () => {
    const w = mount(PhotoAdjustOverlay, { props: baseProps });
    expect(w.find('[data-testid="photo-adjust-zoom"]').exists()).toBe(true);
    expect(w.find('[data-testid="photo-adjust-reset"]').exists()).toBe(true);
    expect(w.find('[data-testid="photo-adjust-done"]').exists()).toBe(true);
  });

  it("emits pan with the raw delta and rect size on drag", async () => {
    const w = mount(PhotoAdjustOverlay, {
      props: { ...baseProps, crop: { x: 50, y: 50, zoom: 2 } },
    });
    const overlay = w.find('[data-testid="photo-adjust-overlay"]');
    vi.spyOn(overlay.element, "getBoundingClientRect").mockReturnValue({
      width: 300,
      height: 160,
      top: 10,
      left: 20,
      right: 320,
      bottom: 170,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);
    await overlay.trigger("pointerdown", { clientX: 100, clientY: 80, pointerId: 1 });
    await overlay.trigger("pointermove", { clientX: 60, clientY: 80, pointerId: 1 });
    const ev = w.emitted("pan");
    expect(ev).toBeTruthy();
    const payload = ev![ev!.length - 1]![0] as { dx: number; dy: number; w: number; h: number };
    expect(payload.dx).toBe(-40);
    expect(payload.w).toBe(300);
    expect(payload.h).toBe(160);
  });

  it("emits zoom from the slider input", async () => {
    const w = mount(PhotoAdjustOverlay, { props: baseProps });
    const slider = w.find('[data-testid="photo-adjust-zoom"]');
    (slider.element as HTMLInputElement).value = "2";
    await slider.trigger("input");
    const ev = w.emitted("zoom");
    expect(ev).toBeTruthy();
    expect(ev![ev!.length - 1]![0]).toBe(2);
  });

  it("emits zoom-by on wheel (up = zoom in)", async () => {
    const w = mount(PhotoAdjustOverlay, { props: baseProps });
    await w.find('[data-testid="photo-adjust-overlay"]').trigger("wheel", { deltaY: -100 });
    const ev = w.emitted("zoom-by");
    expect(ev).toBeTruthy();
    expect((ev![0]![0] as number)).toBeGreaterThan(0);
  });

  it("emits reset on double-click and on Reset click", async () => {
    const w = mount(PhotoAdjustOverlay, {
      props: { ...baseProps, crop: { x: 10, y: 10, zoom: 2 } },
    });
    await w.find('[data-testid="photo-adjust-overlay"]').trigger("dblclick");
    await w.find('[data-testid="photo-adjust-reset"]').trigger("click");
    expect(w.emitted("reset")!.length).toBe(2);
  });

  it("disables Reset at the identity crop", () => {
    const w = mount(PhotoAdjustOverlay, { props: baseProps });
    const btn = w.find('[data-testid="photo-adjust-reset"]').element as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("emits done on Done click", async () => {
    const w = mount(PhotoAdjustOverlay, { props: baseProps });
    await w.find('[data-testid="photo-adjust-done"]').trigger("click");
    expect(w.emitted("done")).toBeTruthy();
  });
});
