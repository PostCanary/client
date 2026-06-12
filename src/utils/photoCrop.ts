/**
 * S80 photo positioning/cropping math (pure functions).
 *
 * The customer drags a visible "window" over a photo inside a mini frame and
 * adjusts a zoom slider; the result is a {x, y, zoom} focal crop applied by the
 * worker via `object-position: x% y%` + `transform: scale(zoom)` on the photo
 * img. These helpers convert drag pixels → focal percents and produce the
 * live-preview CSS that MIRRORS the worker's render so the mini frame matches
 * the printed card.
 *
 * Keeping the math pure (no DOM, no Vue) so it is unit-testable on its own.
 */

import type { PhotoCrop } from "@/types/campaign";

export const CROP_MIN_ZOOM = 1;
export const CROP_MAX_ZOOM = 2.5;
export const CROP_IDENTITY: PhotoCrop = { x: 50, y: 50, zoom: 1 };

export function clampPercent(v: number): number {
  if (Number.isNaN(v)) return 50;
  return Math.max(0, Math.min(100, v));
}

export function clampZoom(v: number): number {
  if (Number.isNaN(v)) return CROP_MIN_ZOOM;
  return Math.max(CROP_MIN_ZOOM, Math.min(CROP_MAX_ZOOM, v));
}

export function normalizeCrop(crop?: Partial<PhotoCrop> | null): PhotoCrop {
  if (!crop) return { ...CROP_IDENTITY };
  return {
    x: clampPercent(crop.x ?? 50),
    y: clampPercent(crop.y ?? 50),
    zoom: clampZoom(crop.zoom ?? 1),
  };
}

export function isIdentityCrop(crop?: Partial<PhotoCrop> | null): boolean {
  const c = normalizeCrop(crop);
  return (
    Math.abs(c.x - 50) < 0.05 &&
    Math.abs(c.y - 50) < 0.05 &&
    Math.abs(c.zoom - 1) < 0.005
  );
}

/**
 * Translate a pointer drag (delta in CSS px within the mini frame) into a new
 * focal {x, y}. Dragging the window RIGHT reveals content to the right, i.e.
 * the focal point moves right → x% increases. The pannable percent-per-pixel
 * scales with zoom: at higher zoom a given drag pans a smaller fraction of the
 * (larger) photo, so the gesture feels proportional.
 *
 * At zoom z the photo is z× the frame, so the overshoot on each axis is
 * (z - 1) × frame. The full focal range (0→100%) corresponds to panning that
 * whole overshoot. Hence percent-per-pixel = 100 / ((z - 1) × frameSize), and
 * at z = 1 there is no pan room (range collapses) — we guard against /0.
 */
export function applyDrag(
  start: PhotoCrop,
  dxPx: number,
  dyPx: number,
  frameWidthPx: number,
  frameHeightPx: number,
): PhotoCrop {
  const zoom = clampZoom(start.zoom);
  const panRoomX = Math.max(1e-6, (zoom - 1) * Math.max(1, frameWidthPx));
  const panRoomY = Math.max(1e-6, (zoom - 1) * Math.max(1, frameHeightPx));
  // Dragging the window right (dx>0) shifts the focal point right.
  const nextX = start.x + (dxPx / panRoomX) * 100;
  const nextY = start.y + (dyPx / panRoomY) * 100;
  return {
    x: clampPercent(nextX),
    y: clampPercent(nextY),
    zoom,
  };
}

/**
 * Set the zoom while keeping the current focal point. Clamps to range. When
 * zoom returns to 1 the focal point still matters only cosmetically (there is
 * no pan room), but we preserve x/y so re-zooming feels continuous.
 */
export function applyZoom(start: PhotoCrop, zoom: number): PhotoCrop {
  return { x: clampPercent(start.x), y: clampPercent(start.y), zoom: clampZoom(zoom) };
}

/**
 * Live-preview CSS for the mini frame, MIRRORING the worker's render
 * technique exactly. The frame element shows the photo as a background:
 *
 *   background-size: cover            (zoom 1 baseline = object-fit: cover)
 *   background-position: x% y%        (pan)
 *
 * and zoom is layered as a scale of the cover baseline. CSS `background-size`
 * has no direct "cover × N", so we express the zoomed cover as a percentage of
 * the frame: at zoom z the image covers z×(cover). We approximate cover-zoom by
 * scaling background-size from "cover" using the `${z * 100}%` trick on the
 * LONGER axis is unreliable for arbitrary photos, so the preview instead uses
 * an <img> with the same object-fit/position/transform the worker uses — see
 * cropImgStyle(). This function returns the background fallback for environments
 * that prefer a single element.
 */
export function cropBackgroundStyle(crop: PhotoCrop): Record<string, string> {
  const c = normalizeCrop(crop);
  return {
    backgroundPosition: `${c.x}% ${c.y}%`,
    backgroundSize: c.zoom <= 1.0001 ? "cover" : `${c.zoom * 100}%`,
    backgroundRepeat: "no-repeat",
  };
}

/**
 * The img-based preview style — byte-for-byte the same CSS the worker emits
 * (`object-fit: cover` + `object-position` + `transform: scale` with
 * `transform-origin` pinned to the focal point). Use this on an <img> inside
 * an `overflow:hidden` mini frame so the preview matches the printed crop.
 */
export function cropImgStyle(crop: PhotoCrop): Record<string, string> {
  const c = normalizeCrop(crop);
  const style: Record<string, string> = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${c.x}% ${c.y}%`,
  };
  if (c.zoom > 1.0005) {
    style.transform = `scale(${c.zoom})`;
    style.transformOrigin = `${c.x}% ${c.y}%`;
  }
  return style;
}

/**
 * Reduce a crop to the wire shape, or `undefined` when it is the identity crop
 * (so the override is omitted and the card renders today's cover-center photo).
 */
export function cropToOverride(crop: PhotoCrop): PhotoCrop | undefined {
  if (isIdentityCrop(crop)) return undefined;
  const c = normalizeCrop(crop);
  return { x: round2(c.x), y: round2(c.y), zoom: round3(c.zoom) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
