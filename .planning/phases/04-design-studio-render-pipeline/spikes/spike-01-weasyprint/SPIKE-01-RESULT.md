# Spike 01 — WeasyPrint hello-world on Linux

**Status:** ✅ PASS
**Date:** 2026-04-14
**Session:** 48
**Time to complete:** ~5 minutes (planning + writing + build + run + verify)

## Goal

Prove that WeasyPrint renders HTML→PDF inside a Linux Docker container (Railway-equivalent environment), not on Drake's Windows dev machine. Per Phase 04 PLAN.md v6.

## Setup

- **Base image:** `python:3.11-slim`
- **apt packages:** `libpango-1.0-0`, `libpangoft2-1.0-0`, `libcairo2`, `libgdk-pixbuf-2.0-0`, `libffi-dev`, `shared-mime-info`, `fonts-dejavu-core`
- **pip package:** `weasyprint==63.1`
- **Page size:** 9in × 6in (matches V1 spec 6×9 postcard)
- **HTML content:** heading, paragraph, chip div with border-radius + padding, footer with 1px top border

## Results

| Metric | Value |
|--------|-------|
| Docker build time | ~27s (apt 14.7s + pip 8.2s + layers 4.4s) |
| Container start + render + exit | <1s |
| Render time (WeasyPrint only) | **140 ms** |
| Output PDF size | **8960 bytes** |
| PDF version | 1.7 |
| Header check | `%PDF-` present ✓ |

## What worked

- WeasyPrint installed cleanly on `python:3.11-slim` with only the 5 standard apt deps + fonts-dejavu-core for a default sans fallback
- `@page { size: 9in 6in; margin: 0 }` produces an exact 9×6 inch page
- Background colors, padding, border-radius, absolute positioning, border-top all render correctly
- Writing to a mounted volume (`/output`) from host works with Docker Desktop path translation on Windows via `MSYS_NO_PATHCONV=1` + `pwd -W`
- `HTML(filename=...).write_pdf(...)` is the canonical render call — minimal API surface

## Gotchas caught

1. **Windows path mount.** Bare `$(pwd)` under git bash + Docker Desktop on Windows mis-translates to an MSYS path. Used `MSYS_NO_PATHCONV=1 docker run -v "$(pwd -W)/output:/output"` which forces the Windows-style absolute path through untouched. Not a Linux-production concern — Railway won't see this.
2. **Pip-as-root warning.** Harmless inside a container. If we want clean-room, add `useradd -m app && USER app` before `pip install`. Deferred — not a demo blocker.
3. **Font fallback.** Used `DejaVu Sans` because no custom fonts loaded. Spike 2 will cover `@font-face` with Oswald Bold / Bebas Neue / Instrument Sans.

## What this spike did NOT test

- `@font-face` with self-hosted fonts (→ Spike 2)
- `clip-path: polygon()` for the diagonal cut (→ Spike 3)
- Jinja templating with variable substitution (→ Spike 4 / production code)
- CMYK conversion via Ghostscript + GRACoL (→ deferred post-demo)
- veraPDF PDF/X-1a validation (→ deferred post-demo)
- Image fills, QR code generation, real brand kit data (→ Spikes 5/6)

## Ready to proceed to Spike 2?

**Yes.** WeasyPrint works on Linux with standard deps. Build is fast (<30s). Render is fast (<200ms for trivial HTML — will be 1-5s for real postcard). No environmental blockers.

## Files

- `Dockerfile` — image definition
- `hello.html` — minimal test HTML with CSS
- `render.py` — WeasyPrint render call with verification
- `.dockerignore` — keeps output/ and results out of build context
- `output/hello.pdf` — generated PDF (8960 bytes)

## Reproducibility

```bash
cd ~/postcanary/client/.planning/phases/04-design-studio-render-pipeline/spikes/spike-01-weasyprint
docker build -t postcanary-weasyprint-spike .
mkdir -p output
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W)/output:/output" postcanary-weasyprint-spike
# verify: file output/hello.pdf
```
