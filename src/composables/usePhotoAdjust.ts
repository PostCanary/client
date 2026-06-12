/**
 * usePhotoAdjust — S81 on-canvas photo position/crop state machine.
 *
 * S80 shipped an "Adjust position" mini-frame inside the drawer/popover. Dustin's
 * feedback: every nudge waited on a server re-render (slow), and the mini-frame
 * was small and hard to use. S81 moves positioning ONTO THE CANVAS — direct
 * manipulation over the rendered card, instant client-side preview (pure CSS),
 * with the authoritative server render reconciling afterward (the text-overlay
 * pattern).
 *
 * This composable owns the adjust-mode state:
 *   - which slot is being adjusted (field + the photo src + zone box + aspect)
 *   - the LIVE crop ({x,y,zoom}) driven by drag / zoom / reset, applied instantly
 *   - a debounced commit (~800ms after the last interaction) that persists the
 *     crop via the host's onCommit (the S80 update-field flow) so the server
 *     re-renders — without blocking the next adjustment
 *   - reconcile bookkeeping: the overlay stays visible until the fresh render
 *     lands (caller clears it on previewUrl change), so there is no flicker.
 *
 * Pan/zoom MATH is reused from utils/photoCrop (applyDrag / applyZoom) so the
 * client preview mirrors the worker byte-for-byte. Kept DOM-free where possible;
 * the drag handlers take pixel deltas + the zone rect size (measured by the
 * component) so the math stays unit-testable.
 */

import { ref, computed, type Ref } from "vue";
import type { PhotoCrop } from "@/types/campaign";
import type { ZoneBox } from "@/composables/usePopoverAnchor";
import {
  applyDrag,
  applyZoom,
  cropToOverride,
  normalizeCrop,
  CROP_IDENTITY,
} from "@/utils/photoCrop";

/** A request to enter adjust mode for one photo slot. */
export interface PhotoAdjustTarget {
  /** Override key the crop is persisted to (photoCrop | beforePhotoCrop | afterPhotoCrop | backPhotoCrop). */
  field: string;
  /** Resolved photo URL (already media-resolved by the host). */
  src: string;
  /** The photo zone's percentage box on the card (left/top/width/height 0-100). */
  zone: ZoneBox;
  /** Starting crop (override → resolved → identity). */
  crop?: PhotoCrop | null;
  /** Human label for the chip / a11y. */
  label?: string;
}

export interface UsePhotoAdjustOptions {
  /**
   * Persist a crop for `field` (undefined = reset to cover-center). This is the
   * S80 update-field flow; the host wires it to updateCrop / updateBack so the
   * server re-render fires. Called on the debounced commit AND on exit.
   */
  onCommit: (field: string, crop: PhotoCrop | undefined) => void;
  /** Debounce window before a commit fires (default 800ms). */
  debounceMs?: number;
}

export function usePhotoAdjust(opts: UsePhotoAdjustOptions) {
  const debounceMs = opts.debounceMs ?? 800;

  /** The slot under adjustment, or null when not in adjust mode. */
  const target: Ref<PhotoAdjustTarget | null> = ref(null);
  /** The live crop applied to the overlay (instant, pre-server). */
  const crop = ref<PhotoCrop>({ ...CROP_IDENTITY });
  /** Timestamp of the last interaction — used by the reconcile guard. */
  const lastInteractionAt = ref(0);
  /**
   * True from the first commit until the host clears it on the next render.
   * Keeps the overlay mounted across the reconcile so there's no flicker.
   */
  const awaitingRender = ref(false);
  /**
   * True after the user pressed Done/exited but a committed render is still in
   * flight. The host keeps the overlay PAINTED (non-interactive) during this
   * window so the card never flashes the old crop before the new PNG lands.
   */
  const lingering = ref(false);

  /** Interactive adjust mode (drag/zoom respond, chip shown). */
  const active = computed(() => target.value !== null && !lingering.value);
  /**
   * Overlay should be PAINTED — either actively adjusting OR lingering until the
   * reconciling render arrives. The host binds the overlay's visibility to this.
   */
  const overlayVisible = computed(
    () => target.value !== null && (!lingering.value || awaitingRender.value),
  );
  const field = computed(() => target.value?.field ?? null);

  let commitTimer: ReturnType<typeof setTimeout> | null = null;
  function clearCommitTimer() {
    if (commitTimer) {
      clearTimeout(commitTimer);
      commitTimer = null;
    }
  }

  /** When the most recent commit was issued (for the lingering reconcile). */
  let committedAt = 0;

  /** Persist the current crop now (no debounce). */
  function commitNow() {
    clearCommitTimer();
    if (!target.value) return;
    awaitingRender.value = true;
    committedAt = Date.now();
    opts.onCommit(target.value.field, cropToOverride(crop.value));
  }

  /** Schedule a debounced commit; resets on every interaction. */
  function scheduleCommit() {
    lastInteractionAt.value = Date.now();
    clearCommitTimer();
    commitTimer = setTimeout(commitNow, debounceMs);
  }

  /** Enter adjust mode for a slot. Re-entering on the same/other slot is fine. */
  function enter(t: PhotoAdjustTarget) {
    clearCommitTimer();
    target.value = t;
    crop.value = normalizeCrop(t.crop);
    lastInteractionAt.value = Date.now();
    awaitingRender.value = false;
    lingering.value = false;
  }

  /**
   * Apply a pointer-drag pan. dxPx/dyPx are RAW pointer deltas since the drag
   * start; the component passes the zone rect size for the pan-room math. The
   * grab-and-drag inversion (photo follows the cursor) is applied here so both
   * the overlay and any future caller share one convention.
   */
  function panBy(
    startCrop: PhotoCrop,
    dxPx: number,
    dyPx: number,
    zoneWidthPx: number,
    zoneHeightPx: number,
  ) {
    // Moving the pointer right should reveal content to the LEFT of the photo
    // (focal moves left) so the photo follows the cursor — invert the delta.
    crop.value = applyDrag(startCrop, -dxPx, -dyPx, zoneWidthPx, zoneHeightPx);
    scheduleCommit();
  }

  /** Set the zoom (keeps focal); from the slider or the scroll wheel. */
  function setZoom(zoom: number) {
    crop.value = applyZoom(crop.value, zoom);
    scheduleCommit();
  }

  /** Nudge zoom by a delta (scroll wheel). */
  function zoomBy(delta: number) {
    setZoom(crop.value.zoom + delta);
  }

  /** Reset to cover-center / no-zoom and commit immediately. */
  function reset() {
    crop.value = { ...CROP_IDENTITY };
    if (!target.value) return;
    clearCommitTimer();
    lastInteractionAt.value = Date.now();
    awaitingRender.value = true;
    committedAt = Date.now();
    opts.onCommit(target.value.field, undefined);
  }

  /**
   * Commit (if there is a pending change) and exit adjust mode. To avoid a
   * flash of the OLD crop, the painted overlay LINGERS until the committed
   * render lands (awaitingRender) — interaction stops immediately, but the
   * pixels stay until reconcile. With nothing in flight, we clear at once.
   */
  function exit() {
    // Flush any pending debounced change so nothing is lost on exit.
    if (commitTimer) commitNow();
    if (awaitingRender.value) {
      // Keep the overlay painted (frozen) until the render reconciles.
      lingering.value = true;
    } else {
      target.value = null;
      lingering.value = false;
    }
  }

  /**
   * Reconcile hook: the host calls this when a fresh server render arrives.
   * If we were awaiting a render AND the debounce window has closed, the new
   * PNG already carries the crop — drop the awaiting flag. A render that raced a
   * newer interaction keeps awaiting until its follow-up lands (mirrors the
   * text-overlay slack). When the user already exited (lingering), the cleared
   * flag also tears down the now-redundant overlay.
   */
  function onRenderArrived() {
    if (!awaitingRender.value) return;
    if (lingering.value) {
      // User already exited — no interaction can race this render. The first
      // render that lands after the commit carries the final crop, so clear
      // immediately (no slack needed) → overlay tears down without lingering
      // forever when only one render fires.
      if (Date.now() >= committedAt) {
        awaitingRender.value = false;
        target.value = null;
        lingering.value = false;
      }
      return;
    }
    // Still actively adjusting: keep the overlay until the debounce window has
    // closed, so a render that raced a NEWER nudge doesn't clear prematurely.
    if (Date.now() - lastInteractionAt.value > debounceMs + 100) {
      awaitingRender.value = false;
    }
  }

  function dispose() {
    clearCommitTimer();
  }

  return {
    // state
    target,
    crop,
    active,
    overlayVisible,
    lingering,
    field,
    awaitingRender,
    lastInteractionAt,
    // actions
    enter,
    panBy,
    setZoom,
    zoomBy,
    reset,
    exit,
    commitNow,
    onRenderArrived,
    dispose,
  };
}
