import { describe, expect, it, vi } from "vitest";
import { isTypingTarget, isPanelOpen, useDesignKeyboard } from "./useDesignKeyboard";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  key: string,
  target?: Partial<HTMLElement>,
  modifiers?: Partial<KeyboardEventInit>,
): KeyboardEvent {
  const ev = new KeyboardEvent("keydown", { key, bubbles: true, ...modifiers });
  // Simulate .target by replacing the getter (KeyboardEvent.target is read-only).
  if (target) {
    Object.defineProperty(ev, "target", { value: target, writable: false });
  }
  return ev;
}

function makeInput(tag = "input"): Partial<HTMLElement> {
  return { tagName: tag.toUpperCase(), isContentEditable: false } as Partial<HTMLElement>;
}

function makeContentEditable(): Partial<HTMLElement> {
  return { tagName: "DIV", isContentEditable: true } as Partial<HTMLElement>;
}

function makeDiv(): Partial<HTMLElement> {
  return { tagName: "DIV", isContentEditable: false } as Partial<HTMLElement>;
}

// ── isTypingTarget ────────────────────────────────────────────────────────────

describe("isTypingTarget", () => {
  it("returns true for <input>", () => {
    const ev = makeEvent("a", makeInput("input"));
    expect(isTypingTarget(ev)).toBe(true);
  });

  it("returns true for <textarea>", () => {
    const ev = makeEvent("a", makeInput("textarea"));
    expect(isTypingTarget(ev)).toBe(true);
  });

  it("returns true for <select>", () => {
    const ev = makeEvent("a", makeInput("select"));
    expect(isTypingTarget(ev)).toBe(true);
  });

  it("returns true for contenteditable element", () => {
    const ev = makeEvent("a", makeContentEditable());
    expect(isTypingTarget(ev)).toBe(true);
  });

  it("returns false for a plain div", () => {
    const ev = makeEvent("a", makeDiv());
    expect(isTypingTarget(ev)).toBe(false);
  });

  it("returns false when target is null", () => {
    const ev = makeEvent("a");
    expect(isTypingTarget(ev)).toBe(false);
  });
});

// ── isPanelOpen ───────────────────────────────────────────────────────────────

describe("isPanelOpen", () => {
  it("returns true when popover is open", () => {
    expect(isPanelOpen(true, false)).toBe(true);
  });
  it("returns true when drawer is open", () => {
    expect(isPanelOpen(false, true)).toBe(true);
  });
  it("returns true when both are open", () => {
    expect(isPanelOpen(true, true)).toBe(true);
  });
  it("returns false when neither is open", () => {
    expect(isPanelOpen(false, false)).toBe(false);
  });
});

// ── useDesignKeyboard (direct handler invocation) ────────────────────────────

function makeOpts(overrides: Partial<Parameters<typeof useDesignKeyboard>[0]> = {}) {
  const state = {
    cardCount: 3,
    activeCardIndex: 0,
    activeSide: "front" as "front" | "back",
    popoverOpen: false,
    drawerOpen: false,
  };

  const setActiveCardIndex = vi.fn((i: number) => { state.activeCardIndex = i; });
  const setActiveSide = vi.fn((s: "front" | "back") => { state.activeSide = s; });
  const closePopover = vi.fn(() => { state.popoverOpen = false; });
  const closeDrawer = vi.fn(() => { state.drawerOpen = false; });

  const opts = {
    cardCount: () => state.cardCount,
    activeCardIndex: () => state.activeCardIndex,
    setActiveCardIndex,
    activeSide: () => state.activeSide,
    setActiveSide,
    popoverOpen: () => state.popoverOpen,
    drawerOpen: () => state.drawerOpen,
    closePopover,
    closeDrawer,
    ...overrides,
  };
  return { opts, state, setActiveCardIndex, setActiveSide, closePopover, closeDrawer };
}

describe("useDesignKeyboard — Esc ordering", () => {
  it("Esc closes popover first when both panel and popover are open", () => {
    const { opts, state, closePopover, closeDrawer } = makeOpts();
    state.popoverOpen = true;
    state.drawerOpen = true;
    // We test the handler directly (bypassing onMounted DOM attachment).
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("Escape", makeDiv());
    onKeydown(ev);
    expect(closePopover).toHaveBeenCalledTimes(1);
    expect(closeDrawer).not.toHaveBeenCalled();
  });

  it("Esc closes drawer when no popover is open", () => {
    const { opts, state, closePopover, closeDrawer } = makeOpts();
    state.drawerOpen = true;
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("Escape", makeDiv());
    onKeydown(ev);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(closePopover).not.toHaveBeenCalled();
  });

  it("Esc with no panels open does not call close callbacks", () => {
    const { opts, closePopover, closeDrawer } = makeOpts();
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("Escape", makeDiv());
    onKeydown(ev);
    expect(closePopover).not.toHaveBeenCalled();
    expect(closeDrawer).not.toHaveBeenCalled();
  });
});

describe("useDesignKeyboard — typing-context guard", () => {
  it("ArrowRight is ignored when focus is in an <input>", () => {
    const { opts, setActiveCardIndex } = makeOpts();
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("ArrowRight", makeInput("input"));
    onKeydown(ev);
    expect(setActiveCardIndex).not.toHaveBeenCalled();
  });

  it("ArrowLeft is ignored when focus is in a <textarea>", () => {
    const { opts, setActiveCardIndex } = makeOpts();
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("ArrowLeft", makeInput("textarea"));
    onKeydown(ev);
    expect(setActiveCardIndex).not.toHaveBeenCalled();
  });

  it("F is ignored when focus is in a contenteditable", () => {
    const { opts, setActiveSide } = makeOpts();
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("f", makeContentEditable());
    onKeydown(ev);
    expect(setActiveSide).not.toHaveBeenCalled();
  });

  it("ArrowRight is ignored when a popover is open", () => {
    const { opts, state, setActiveCardIndex } = makeOpts();
    state.popoverOpen = true;
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("ArrowRight", makeDiv());
    onKeydown(ev);
    expect(setActiveCardIndex).not.toHaveBeenCalled();
  });

  it("F is ignored when a drawer is open", () => {
    const { opts, state, setActiveSide } = makeOpts();
    state.drawerOpen = true;
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("f", makeDiv());
    onKeydown(ev);
    expect(setActiveSide).not.toHaveBeenCalled();
  });
});

describe("useDesignKeyboard — arrow navigation", () => {
  it("ArrowRight advances to the next card (wraps at the end)", () => {
    const { opts, state, setActiveCardIndex } = makeOpts();
    state.activeCardIndex = 2; // last card
    const { onKeydown } = useDesignKeyboard(opts);
    onKeydown(makeEvent("ArrowRight", makeDiv()));
    expect(setActiveCardIndex).toHaveBeenCalledWith(0); // wraps to first
  });

  it("ArrowLeft goes to the previous card (wraps at the start)", () => {
    const { opts, setActiveCardIndex } = makeOpts();
    // activeCardIndex = 0 (default)
    const { onKeydown } = useDesignKeyboard(opts);
    onKeydown(makeEvent("ArrowLeft", makeDiv()));
    expect(setActiveCardIndex).toHaveBeenCalledWith(2); // wraps to last
  });

  it("ArrowRight does nothing with a single card", () => {
    const { opts, state, setActiveCardIndex } = makeOpts();
    state.cardCount = 1;
    const { onKeydown } = useDesignKeyboard(opts);
    onKeydown(makeEvent("ArrowRight", makeDiv()));
    expect(setActiveCardIndex).not.toHaveBeenCalled();
  });
});

describe("useDesignKeyboard — F key flip", () => {
  it("F toggles from front to back", () => {
    const { opts, setActiveSide } = makeOpts();
    const { onKeydown } = useDesignKeyboard(opts);
    onKeydown(makeEvent("f", makeDiv()));
    expect(setActiveSide).toHaveBeenCalledWith("back");
  });

  it("F toggles from back to front", () => {
    const { opts, state, setActiveSide } = makeOpts();
    state.activeSide = "back";
    const { onKeydown } = useDesignKeyboard(opts);
    onKeydown(makeEvent("f", makeDiv()));
    expect(setActiveSide).toHaveBeenCalledWith("front");
  });

  it("Ctrl+F does NOT toggle (could be a browser find shortcut)", () => {
    const { opts, setActiveSide } = makeOpts();
    const { onKeydown } = useDesignKeyboard(opts);
    const ev = makeEvent("f", makeDiv(), { ctrlKey: true });
    onKeydown(ev);
    expect(setActiveSide).not.toHaveBeenCalled();
  });
});
