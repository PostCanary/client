# Spike 02 — @font-face with Oswald / Bebas Neue / Instrument Sans

**Status:** ✅ PASS (with one deprecation warning — benign)
**Date:** 2026-04-14
**Session:** 48

## Goal

Prove that WeasyPrint can load custom fonts via `@font-face` (self-hosted OFL fonts in a `fonts/` directory) and render text at the Figma-matching sizes. Per Phase 04 PLAN.md v6.

## Setup

- **Fonts downloaded from `github.com/google/fonts` (SIL OFL):**
  - `Oswald[wght].ttf` — variable weight 200-700 (172 KB)
  - `BebasNeue-Regular.ttf` — static 400 (61 KB)
  - `InstrumentSans[wdth,wght].ttf` — variable width + weight (194 KB)
- **Total font payload:** ~427 KB (fine for production)

## Results

| Metric | Value |
|--------|-------|
| Build | ~0.3s (layers cached from Spike 1) |
| Render | **221 ms** (vs 140ms for Spike 1 — font loading adds ~80ms) |
| Output size | **14931 bytes** (vs 8960 for Spike 1 — +6 KB embedded font subset) |
| All 3 font families | Rendered correctly |

## Samples rendered

All at Figma-matching point sizes:

- Oswald Bold 78pt red headline ("THE SUMMER HEAT IS HERE")
- Oswald Bold 81pt blue headline ("NEW A/C SYSTEM!")
- Bebas Neue Regular 42pt ("DESERT DIAMOND HVAC")
- Oswald Bold 66pt ("1-800-628-1804")
- Instrument Sans Bold 48pt ("$750 OFF")
- Instrument Sans Regular 21pt + Bold 24pt (body + CTA)

## Gotchas caught

1. **Variable font deprecation warning.** WeasyPrint internally uses fontTools' `instantiateVariableFont` which is deprecated — should switch to `fontTools.varLib.instancer.instantiateVariableFont`. **Warning only, output is correct.** Not our problem to fix; upstream WeasyPrint issue. Suppress if noisy.
2. **`format("truetype-variations")`** is the CSS hint for variable fonts. WeasyPrint accepts `format("truetype")` too for variable fonts, but the hint helps matching.
3. **`base_url` parameter on `HTML(...)`** is how WeasyPrint resolves relative `url(...)` paths in `@font-face` declarations. Set it to the HTML file's parent dir. Without this, `url("fonts/...")` in CSS would fail to resolve.
4. **Font subsetting happens automatically.** Embedded font data is only 6 KB on top of the ~9 KB base PDF — WeasyPrint only embeds the glyphs actually used. Good for production PDF size at scale.

## What this spike did NOT test

- `clip-path: polygon()` for diagonal cut (→ Spike 3)
- Multi-page PDFs (demo is single-page only)
- Right-to-left text (not applicable)
- Text overflow cascade with `ImageFont.getbbox()` (→ Spike 5)

## Ready to proceed to Spike 3?

**Yes.** Custom font loading works, variable fonts work (with deprecation warning), render time acceptable.

## Reproducibility

```bash
cd ~/postcanary/client/.planning/phases/04-design-studio-render-pipeline/spikes/spike-02-fonts
docker build -t postcanary-weasyprint-spike-02 .
mkdir -p output
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)/output:/output" postcanary-weasyprint-spike-02
```
