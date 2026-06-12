// usePopoverAnchor — pure positioning math for the S79 Phase-2 ZonePopover.
//
// A zone is a percentage box (left/top/width/height) inside the canvas
// viewport. We turn it into a pixel rect, then place a popover of a known
// size NEXT TO that zone, flipping/shifting so the popover is never clipped
// by the canvas viewport edges:
//   - default: open to the RIGHT of the zone; if it would overflow the right
//     edge, flip to the LEFT of the zone.
//   - vertically: align the popover top to the zone top, then clamp so it
//     stays fully inside the viewport (bottom-heavy zones effectively open
//     upward because the clamp pushes the box up).
//
// Kept side-effect-free and DOM-free so it can be unit-tested directly.

export interface ZoneBox {
  /** percentages 0-100 of the canvas */
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ViewportRect {
  /** canvas pixel size the zone percentages are relative to */
  width: number;
  height: number;
  /**
   * Offset of the artwork box within the positioning container (the canvas
   * region). Zone percentages are relative to the artwork box, but the popover
   * is absolutely positioned in the container, so we add this offset. The
   * clamp also uses the container bounds (containerWidth/Height) when given.
   */
  offsetX?: number;
  offsetY?: number;
  /** container bounds for clamping (defaults to width/height + offset). */
  containerWidth?: number;
  containerHeight?: number;
}

export interface PopoverSize {
  width: number;
  height: number;
}

export interface AnchorResult {
  /** popover position in canvas-pixel space (top-left origin) */
  left: number;
  top: number;
  /** which side of the zone the popover opened on */
  placement: "right" | "left";
  /** the zone's pixel rect (handy for an arrow/connector) */
  zoneRect: { left: number; top: number; width: number; height: number };
}

const GAP = 12; // px gap between the zone and the popover
const MARGIN = 8; // px min gap from the viewport edge

export function zonePixelRect(zone: ZoneBox, viewport: ViewportRect) {
  const ox = viewport.offsetX ?? 0;
  const oy = viewport.offsetY ?? 0;
  return {
    left: ox + (zone.left / 100) * viewport.width,
    top: oy + (zone.top / 100) * viewport.height,
    width: (zone.width / 100) * viewport.width,
    height: (zone.height / 100) * viewport.height,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function anchorPopover(
  zone: ZoneBox,
  viewport: ViewportRect,
  popover: PopoverSize,
): AnchorResult {
  const zoneRect = zonePixelRect(zone, viewport);
  // Clamp/flip against the positioning CONTAINER, which may be wider/taller
  // than the artwork box (the card is centered in a neutral surround). When no
  // container size is given, fall back to the artwork box.
  const boundsW = viewport.containerWidth ?? viewport.width;
  const boundsH = viewport.containerHeight ?? viewport.height;

  // Horizontal: prefer opening to the right of the zone.
  const rightLeft = zoneRect.left + zoneRect.width + GAP;
  const leftLeft = zoneRect.left - GAP - popover.width;

  const fitsRight = rightLeft + popover.width <= boundsW - MARGIN;
  const fitsLeft = leftLeft >= MARGIN;

  let placement: "right" | "left";
  let left: number;
  if (fitsRight) {
    placement = "right";
    left = rightLeft;
  } else if (fitsLeft) {
    placement = "left";
    left = leftLeft;
  } else {
    // Neither side fully fits (popover wider than the surround). Pick the
    // side with more room and clamp into the container.
    const rightRoom = boundsW - (zoneRect.left + zoneRect.width);
    const leftRoom = zoneRect.left;
    if (rightRoom >= leftRoom) {
      placement = "right";
      left = clamp(rightLeft, MARGIN, boundsW - popover.width - MARGIN);
    } else {
      placement = "left";
      left = clamp(leftLeft, MARGIN, boundsW - popover.width - MARGIN);
    }
  }

  // Vertical: align to the zone top, then clamp so the whole popover stays in
  // view. Bottom zones get pushed upward by the clamp.
  const desiredTop = zoneRect.top;
  const top = clamp(
    desiredTop,
    MARGIN,
    Math.max(MARGIN, boundsH - popover.height - MARGIN),
  );

  return { left, top, placement, zoneRect };
}
