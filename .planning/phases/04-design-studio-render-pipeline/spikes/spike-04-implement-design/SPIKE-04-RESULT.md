# Spike 04 — figma:figma-implement-design end-to-end

**Status:** ✅ PASS
**Date:** 2026-04-14
**Session:** 48

## Goal

Prove that Figma's auto-bridged HTML/CSS (via `get_design_context` + `figma:figma-implement-design` skill workflow) can be translated to Jinja2 + WeasyPrint and render a pixel-faithful postcard.

## Result

Full postcard rendered end-to-end. Visual comparison vs Figma native render: all zones, colors, fonts, diagonals, and text positions match.

| Metric | Value |
|--------|-------|
| Render time | 378 ms |
| PDF size | 748 KB (photo dominates) |
| Template size | 7079 chars rendered (Jinja) |
| Manual conversion effort | ~20 min one-time |

## The translation pipeline that worked

1. `get_design_context(fileKey, nodeId)` → React + Tailwind reference code + asset URLs
2. Download assets via curl from `figma.com/api/mcp/asset/<uuid>` URLs (7-day TTL)
3. Convert React+Tailwind → plain HTML + CSS + Jinja2 `{{variable}}` syntax
4. WeasyPrint + Jinja2 inside `python:3.11-slim` Docker container
5. `HTML(string=rendered, base_url=...).write_pdf(...)`

## Key gotchas (save these for production code)

1. **MCP asset extensions lie.** Figma returns SVG content for vector shapes but the URLs don't expose the correct file extension. Downloaded 4 files as `.png` that were actually SVG (identified by `file` command). Rename to `.svg` before use. Photos ARE actual PNG.
2. **CSS variables inside SVG don't resolve in WeasyPrint.** The exported SVG uses `fill="var(--fill-0, white)"` which should fall back to `white`, but WeasyPrint renders it as transparent (shape appears as a black stroke outline on nothing). Fix: sed-replace `var(--fill-0, white)` → `#ffffff` in the SVG files, or inline the SVG directly.
3. **`HTML(string=rendered, base_url=path)` is required** for WeasyPrint to resolve relative `<img src="assets/...">` paths in the rendered template. Without `base_url`, images 404 and render blank.
4. **Jinja2 + WeasyPrint compose cleanly.** `env.get_template(...).render(**context)` → string → `HTML(string=...)` is a two-step pipeline with no adapter needed.

## Visual verification

Playwright screenshot at `.playwright-mcp/spike-04-postcard-v2.png` shows:
- All 4 headline lines (red + sky blue) correct font/color/position
- Bridge text "—stay comfortable with a" visible
- Blue offer strip with dashed white inner border
- Offer text centered correctly
- Bottom-left: yellow logo placeholder + DESERT DIAMOND + HEATING&AIR
- Bottom-center: green panel with CTA + phone + website
- Bottom-right: white QR with dark green border + SCAN HERE label
- Photo with diagonal cut baked in

## What this spike did NOT test

- Text overflow / too-long business names (→ Spike 5)
- Real brand kit data flowing through the pipeline end-to-end (→ Spike 6)
- CMYK conversion (deferred post-demo)
- PDF/X-1a validation (deferred post-demo)
- Real logo replacing the yellow circle placeholder (→ production integration)

## Ready for Spikes 5/6

**Yes.** The core architecture works. The template conversion is a ~20-minute manual step per Figma template change — acceptable since templates don't change often. Automation of the translation (MCP output → Jinja template) is a future optimization, not a demo blocker.

## Files

- `assets/photo-diagonal-right.png` — real photo, 812 KB
- `assets/text-zone-white-diagonal-left.svg` — fixed SVG with hardcoded white fill
- `assets/logo-panel-bg.svg` — fixed SVG
- `assets/logo-placeholder.svg` — yellow circle placeholder (SVG)
- `assets/phone-icon.svg` — white circle (SVG)
- `fonts/` — Oswald, Bebas Neue, Instrument Sans (copied from Spike 2)
- `templates/postcard.html.j2` — Jinja2 template
- `render.py` — Jinja2 + WeasyPrint pipeline
- `Dockerfile` — python:3.11-slim with weasyprint 63.1 + jinja2 3.1.4
- `output/postcard.pdf` — rendered PDF

## Reproducibility

```bash
cd ~/postcanary/client/.planning/phases/04-design-studio-render-pipeline/spikes/spike-04-implement-design
docker build -t postcanary-weasyprint-spike-04 .
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)/output:/output" postcanary-weasyprint-spike-04
```
