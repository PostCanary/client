/**
 * useDesignKeyboard — S79 Phase-3 keyboard navigation for the design step.
 *
 * Arrow Left/Right  → cycle card position (offer → proof → last_chance).
 * F                 → toggle Front/Back side.
 * Escape            → close popover first, then drawer (in that order).
 * Enter (on a focused zone hotspot) → handled by the zone button natively.
 *
 * Guard: keys are IGNORED when:
 *   - the focus is inside an input, textarea, select, or [contenteditable] element
 *   - a zone popover OR context drawer is currently open
 *     (Esc is the ONLY key that works when either panel is open, so the user
 *     can dismiss without reaching for the mouse)
 *
 * This keeps keyboard nav from colliding with:
 *   - typing in any editor field inside the popover/drawer
 *   - the wizard's Tab/Enter/Back/Next navigation
 *   - browser shortcuts that use F or arrow keys (e.g. in inputs)
 */

import { onMounted, onBeforeUnmount } from "vue";

/** Returns true when the keyboard event target is a text-input context */
export function isTypingTarget(ev: KeyboardEvent): boolean {
  const target = ev.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  // role="textbox" (e.g. ProseMirror, custom rich-text)
  if (target.getAttribute?.("role") === "textbox") return true;
  return false;
}

/** Returns true when a modal-like panel (popover or drawer) is open */
export function isPanelOpen(popoverOpen: boolean, drawerOpen: boolean): boolean {
  return popoverOpen || drawerOpen;
}

export interface DesignKeyboardOptions {
  /** number of cards in the sequence */
  cardCount: () => number;
  /** 0-based index of the active card */
  activeCardIndex: () => number;
  /** callback to change the active card index */
  setActiveCardIndex: (index: number) => void;
  /** current active side */
  activeSide: () => "front" | "back";
  /** callback to toggle the side */
  setActiveSide: (side: "front" | "back") => void;
  /** whether the zone popover is currently open */
  popoverOpen: () => boolean;
  /** whether the context drawer is currently open */
  drawerOpen: () => boolean;
  /** close the popover (called by Esc when popover is open) */
  closePopover: () => void;
  /** close the drawer (called by Esc when drawer is open and popover is closed) */
  closeDrawer: () => void;
}

export function useDesignKeyboard(opts: DesignKeyboardOptions) {
  function onKeydown(ev: KeyboardEvent) {
    const popoverOpen = opts.popoverOpen();
    const drawerOpen = opts.drawerOpen();

    // Esc: close popover first, then drawer — works even inside panels.
    if (ev.key === "Escape") {
      if (popoverOpen) {
        ev.preventDefault();
        opts.closePopover();
        return;
      }
      if (drawerOpen) {
        ev.preventDefault();
        opts.closeDrawer();
        return;
      }
      return; // nothing open — let the event propagate
    }

    // All other shortcut keys are gated: never fire when typing or when a
    // panel is open (Esc above already handled the panel-open case).
    if (isTypingTarget(ev)) return;
    if (isPanelOpen(popoverOpen, drawerOpen)) return;

    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      const n = opts.cardCount();
      if (n <= 1) return;
      const next = (opts.activeCardIndex() - 1 + n) % n;
      opts.setActiveCardIndex(next);
      return;
    }

    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      const n = opts.cardCount();
      if (n <= 1) return;
      const next = (opts.activeCardIndex() + 1) % n;
      opts.setActiveCardIndex(next);
      return;
    }

    if (ev.key === "f" || ev.key === "F") {
      // Only act if a plain F press (no modifier that might be a browser shortcut)
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      ev.preventDefault();
      opts.setActiveSide(opts.activeSide() === "front" ? "back" : "front");
      return;
    }
  }

  onMounted(() => document.addEventListener("keydown", onKeydown));
  onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));

  // Exposed for tests (direct invocation without DOM event dispatch)
  return { onKeydown };
}
