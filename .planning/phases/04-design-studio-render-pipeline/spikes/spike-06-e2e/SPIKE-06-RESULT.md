# Spike 06 — E2E smoke test

**Status:** ✅ PASS
**Date:** 2026-04-14
**Session:** 48

## Goal

Prove end-to-end: BrandKit + offer fixture → text overflow cascade → Jinja2 template → WeasyPrint → PDF. Three fixtures with short/medium/long business names, each exercising a different tier of the cascade.

## Result — all 3 fixtures rendered cleanly

| Fixture | Business Name | Cascade Tier | Size | Lines | Render Time | PDF Size |
|---------|--------------|--------------|------|-------|-------------|----------|
| `short` | DESERT DIAMOND | 42pt fit | 42pt | 1 | 503 ms | 748 KB |
| `medium` | Phoenix Arizona Cooling Co | 24pt fit | 24pt | 1 | 448 ms | 748 KB |
| `long` | Associates of Greater Phoenix Heating and Air Conditioning | 20pt wrap | 20pt | 2 | 388 ms | 748 KB |

## Visual verification

Playwright screenshots captured of all 3 WeasyPrint PDFs + a fresh Figma native screenshot of the source template. Files:
- `spike-06-short.png` — Desert Diamond postcard render
- `spike-06-medium.png` — Phoenix Arizona Cooling Co render
- `spike-06-long.png` — Associates of Greater Phoenix render

**Visual quality:** all three match the Figma native render on: colors, fonts, diagonal cut, offer strip layout, photo placement, bottom info panel, QR + SCAN HERE area. The cascade correctly resizes the business name into the available panel width without overflow.

## Full pipeline proven

```
BrandKit(business_name, phone, website, ...)  +  Offer(amount, prefix, suffix, ...)
          ↓
    decide_business_name(name, font_path) → Layout(size_pt, lines, truncated)
          ↓
    RenderContext  (business_name_lines, business_name_size_pt, ...)
          ↓
    Jinja2 template (postcard.html.j2)  →  rendered HTML string
          ↓
    WeasyPrint  HTML(string=..., base_url=...).write_pdf()
          ↓
    PDF file  (~748 KB, render time ~400–500 ms)
```

## Gotchas captured

1. **`COPY cascade.py render.py ./`** — when adding a new Python module to the Docker build, both must be copied. Single `COPY render.py ./` leaves `ModuleNotFoundError: No module named 'cascade'`.
2. **Pillow is an explicit pip dep** for the cascade module. Added `Pillow==10.4.0` to the Dockerfile's pip install.
3. **CSS `letter-spacing: 1px` adds ~1px per character** not accounted for by `font.getbbox()`. For Bebas Neue at 42pt with 1px tracking, a 15-char name adds ~14px vs the measurement. Not breaking for the demo fixtures (the cascade has ~50px of headroom at each tier) but should be compensated for in production: `measured_width += letter_spacing_px * (len(text) - 1)`.
4. **Bebas Neue displays all-caps regardless of input case.** The font has lowercase glyphs designed to look like small caps. If production allows mixed-case business names, consider whether the visual treatment is intentional.

## All 6 pre-execution spikes complete

| Spike | Goal | Result |
|-------|------|--------|
| 01 | WeasyPrint hello-world on Linux | ✅ PASS |
| 02 | @font-face with Oswald/Bebas Neue/Instrument Sans | ✅ PASS |
| 03 | CSS clip-path diagonal cut | ❌ unsupported, but Figma exports PNG-baked diagonals (moot) |
| 04 | figma:figma-implement-design → WeasyPrint end-to-end | ✅ PASS |
| 05 | Text overflow cascade | ✅ PASS (with measurement-first refinement) |
| 06 | E2E smoke test — BrandKit → cascade → Jinja → WeasyPrint | ✅ PASS |

## Ready for Phase 4A foundation

**Yes.** The core architecture from PLAN.md v6 is validated end-to-end. No architectural surprises; all risks were addressable with inline fixes.

## Plan deviations worth flagging

1. **PLAN.md cascade was char-count-gated (1-20/21-35/36+); shipped measurement-first.** Strictly better — handles short-but-wide strings correctly. Documented in SPIKE-05-RESULT.md.
2. **PLAN.md assumed `clip-path` would work; fallback was SVG mask.** Turns out Figma exports PNG-baked diagonals so neither hand-coded approach applies. Documented in SPIKE-03-RESULT.md.
3. **MCP asset extension bug** — SVGs named `.png`. Documented in SPIKE-04-RESULT.md. One-time fix via sed-rename.

None of these invalidate PLAN.md or require replan. All three are execution-level refinements captured in the spike result docs for the actual Phase 4A implementation.

## Reproducibility

```bash
cd ~/postcanary/client/.planning/phases/04-design-studio-render-pipeline/spikes/spike-06-e2e
docker build -t postcanary-weasyprint-spike-06 .
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)/output:/output" postcanary-weasyprint-spike-06
# output/postcard-{short,medium,long}.pdf
```
