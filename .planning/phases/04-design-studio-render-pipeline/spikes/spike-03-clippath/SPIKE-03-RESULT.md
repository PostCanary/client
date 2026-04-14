# Spike 03 — CSS clip-path diagonal cut

**Status:** ❌ Approach A fails, but doesn't matter (see below)
**Date:** 2026-04-14
**Session:** 48

## Goal

Prove that WeasyPrint can render a diagonal cut between two zones via CSS `clip-path: polygon()`. Per Phase 04 PLAN.md v6 pre-execution spikes.

## Result

**CSS `clip-path: polygon()` is NOT supported in WeasyPrint 63.1.** The property is silently ignored. Rendered output shows two rectangular zones meeting at a plain vertical line, no diagonal cut.

Confirmed visually: white zone on left, blue-gradient zone on right, straight vertical edge — not the target 82.6%/30.4% diagonal.

## Why this doesn't block the pipeline

Session 48 discovered that `get_design_context` (Figma MCP) exports diagonal-cut shapes **as PNGs with the cut baked in**, not as CSS clip-path or SVG. The production HTML will use `<img src="...figma-asset-url...">` tags, and `<img>` renders trivially in WeasyPrint (proven in Spike 1).

Concretely, the HAC-1000 Figma template's `{{photo}}` and `{{text_zone}}` nodes were exported as:
- `imgPhotoPhotoDiagonalRight` — PNG with diagonal left edge
- `imgTextZoneWhiteDiagonalLeft` — PNG with diagonal right edge

No hand-coded clip-path needed.

## SVG fallback (Spike 3.2) — NOT RUN

Deferred. If figma:figma-implement-design ever produces a diagonal shape WITHOUT a PNG (e.g., it outputs an `<svg>` polygon or tries CSS clip-path), we'd need to test inline-SVG-with-clipPath. For now, skipped.

## Gotcha captured

WeasyPrint 63.1 silently ignores unsupported CSS (no warning). Be skeptical of CSS features outside what WeasyPrint explicitly supports. Reference: WeasyPrint CSS Module Compliance docs.

## Ready for Spike 4

**Yes.** Spike 4 (`figma:figma-implement-design` on the 6×9 template) is now the critical gate: does the skill's HTML/CSS output use PNG-baked shapes (no clip-path needed)? Or does it try to output CSS clip-path / SVG masks?
