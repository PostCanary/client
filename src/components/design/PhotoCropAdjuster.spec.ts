import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PhotoCropAdjuster from "./PhotoCropAdjuster.vue";

function mountAdjuster(modelValue?: { x: number; y: number; zoom: number }) {
  return mount(PhotoCropAdjuster, {
    props: {
      src: "http://example.com/photo.jpg",
      modelValue,
      aspect: 1.5,
      debounceMs: 0,
    },
  });
}

describe("PhotoCropAdjuster", () => {
  it("renders the frame and zoom slider when a photo is present", () => {
    const w = mountAdjuster();
    expect(w.find('[data-testid="crop-frame"]').exists()).toBe(true);
    expect(w.find('[data-testid="crop-zoom"]').exists()).toBe(true);
    expect(w.find('[data-testid="crop-preview-img"]').exists()).toBe(true);
  });

  it("applies the crop CSS to the preview img (mirrors the worker)", () => {
    const w = mountAdjuster({ x: 25, y: 75, zoom: 2 });
    const img = w.find('[data-testid="crop-preview-img"]');
    const style = img.attributes("style") || "";
    expect(style).toContain("object-position: 25% 75%");
    expect(style).toContain("scale(2)");
  });

  it("emits a non-identity crop when the zoom slider changes", async () => {
    const w = mountAdjuster();
    const slider = w.find('[data-testid="crop-zoom"]');
    (slider.element as HTMLInputElement).value = "2";
    await slider.trigger("input");
    await new Promise((r) => setTimeout(r, 5));
    const emitted = w.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const calls = emitted!;
    const last = calls[calls.length - 1]![0] as { zoom: number } | undefined;
    expect(last?.zoom).toBe(2);
  });

  it("emits undefined (reset) when Reset is clicked", async () => {
    const w = mountAdjuster({ x: 10, y: 10, zoom: 2 });
    await w.find('[data-testid="crop-reset"]').trigger("click");
    const emitted = w.emitted("update:modelValue");
    const calls = emitted!;
    expect(calls[calls.length - 1]![0]).toBeUndefined();
  });

  it("disables Reset when already at the default crop", () => {
    const w = mountAdjuster({ x: 50, y: 50, zoom: 1 });
    const btn = w.find('[data-testid="crop-reset"]');
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("dragging pans the focal point and commits on release", async () => {
    const w = mountAdjuster({ x: 50, y: 50, zoom: 2 });
    const frame = w.find('[data-testid="crop-frame"]');
    // Force a known frame size for the pan math.
    vi.spyOn(frame.element, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 150,
      top: 0,
      left: 0,
      right: 200,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    await frame.trigger("pointerdown", { clientX: 100, clientY: 75, pointerId: 1 });
    await frame.trigger("pointermove", { clientX: 50, clientY: 75, pointerId: 1 });
    await frame.trigger("pointerup", { clientX: 50, clientY: 75, pointerId: 1 });

    const emitted = w.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const calls = emitted!;
    const last = calls[calls.length - 1]![0] as { x: number } | undefined;
    // Dragging the photo left (dx=-50) reveals content to the right →
    // focal x increases past 50 (invert handled in the component).
    expect(last).toBeTruthy();
    expect(last!.x).toBeGreaterThan(50);
  });

  it("shows the zoom-in hint at zoom 1 and the drag hint once zoomed in", () => {
    const atDefault = mountAdjuster({ x: 50, y: 50, zoom: 1 });
    expect(atDefault.find('[data-testid="crop-hint"]').text()).toContain(
      "Zoom in to reposition",
    );
    const zoomedIn = mountAdjuster({ x: 50, y: 50, zoom: 1.5 });
    expect(zoomedIn.find('[data-testid="crop-hint"]').text()).toContain(
      "Drag the photo to reposition it",
    );
  });

  it("shows a placeholder when no photo is set", () => {
    const w = mount(PhotoCropAdjuster, {
      props: { src: "", aspect: 1.5 },
    });
    expect(w.find('[data-testid="crop-preview-img"]').exists()).toBe(false);
    expect(w.text()).toContain("Pick a photo first");
  });
});
