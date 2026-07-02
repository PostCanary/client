# Non-Browser Screenshot Approaches: Research Scan

**Date:** 2026-04-09
**Problem:** Playwright (browser-based) keeps crashing on Windows. Need approaches that bypass the browser entirely for HTML-to-image rendering.

---

## Executive Summary

There are exactly TWO viable non-browser approaches for HTML-to-image conversion:
1. **Satori + resvg-js** (the clear winner for card/component rendering)
2. **Sharp SVG pipeline** (for SVG-only input, not raw HTML)

Everything else either wraps a browser under the hood or runs client-side only. The fundamental truth the research confirms: **rendering arbitrary HTML/CSS to an image without a browser engine is an unsolved problem**. What Satori does is solve it for a useful *subset* of HTML/CSS.

---

## Tier 1: Genuinely Browser-Free

### 1. Satori + resvg-js (RECOMMENDED)

**What it is:** Vercel's library that converts JSX/HTML to SVG using its own layout engine (Yoga/React Native flexbox). Combined with `@resvg/resvg-js` (Rust-based SVG rasterizer), produces PNG output. No browser process at all.

**Pipeline:** JSX/HTML -> Satori -> SVG string -> resvg-js -> PNG buffer

**NPM:**
- `satori` (v0.26.0, Mar 2026) - 912K weekly downloads
- `satori-html` - accepts HTML strings instead of raw JSX
- `@resvg/resvg-js` (v2.6.2) - Rust-based, precompiled binaries

**Performance:**
- 50-200ms per image (vs 1-3 seconds for Playwright/Puppeteer)
- 15-20x faster than headless browser approaches
- ~50MB memory footprint (vs ~250MB for Playwright)
- Serverless/edge-compatible

**CSS Support (CRITICAL LIMITATION):**
- YES: Flexbox (uses Yoga layout engine from React Native)
- YES: Basic text styling, colors, backgrounds, gradients, borders, border-radius
- YES: Google Fonts (must provide font ArrayBuffer manually)
- YES: Custom properties / CSS variables (partial)
- YES: `background-image`, `linear-gradient`
- NO: CSS Grid
- NO: `position: absolute/fixed` (limited support)
- NO: `transform`, `animation`, `transition`
- NO: `box-shadow` (limited/no support)
- NO: `overflow: hidden` with border-radius (partial)
- NO: Pseudo-elements (`::before`, `::after`)
- NO: Media queries
- NO: Full `calc()` support
- NO: `z-index` layering

**Vue SFC compatibility:** Cannot render Vue SFCs directly. Requires pre-rendering Vue components to HTML/JSX first. `satori-html` can accept an HTML string, but the HTML must use only Satori's supported CSS subset.

**Windows stability:** Excellent. Both satori and resvg-js use precompiled WASM/native binaries. resvg-js has full Windows x64/x32/arm64 support matrix. No native compilation needed (no node-gyp).

**Image quality:** Good but not pixel-perfect to browser rendering. Text rendering is very close. Complex layouts may differ. For card-style layouts (OG images, social cards, postcards) the quality is more than sufficient.

**Verdict:** Best option IF the CSS subset is sufficient for postcard rendering. The flexbox-only constraint is the deal-breaker question.

### 2. Sharp (SVG input only)

**What it is:** High-performance Node.js image processing library built on libvips (C library). Can rasterize SVG to PNG, but only accepts SVG input -- not raw HTML/CSS.

**NPM:** `sharp` (v0.34.3) - 9M+ weekly downloads

**Performance:**
- 25x faster than alternatives for image processing
- For SVG-to-PNG specifically: 1.9-3.5x faster than resvg-js in bulk conversion benchmarks
- Extremely mature and stable

**CSS Support:** N/A -- Sharp doesn't parse CSS. It rasterizes SVG files. If you construct your postcard as an SVG (manually or via Satori), Sharp can convert it to PNG with excellent quality and DPI control.

**Windows stability:** Excellent. Precompiled binaries, heavily tested, 9M weekly downloads.

**Possible pipeline:** Satori -> SVG -> Sharp -> PNG (use Sharp instead of resvg-js for the rasterization step, potentially better DPI control)

**Verdict:** Not a standalone solution for HTML-to-image. Useful as the rasterizer in a Satori pipeline, or if you can construct SVGs directly.

### 3. html2pic (Python, experimental)

**What it is:** Python proof-of-concept that renders a subset of HTML/CSS to images using Skia (the same graphics library Chrome uses, but without the browser). Uses BeautifulSoup4 + tinycss2 for parsing.

**Status:** Self-described as "toy project / proof-of-concept" and "absolutely not a browser replacement." Supports "a tiny fraction of HTML/CSS." AI-generated code.

**Verdict:** Not production-ready. Interesting proof of concept showing the Skia-without-browser approach is theoretically possible, but years from being usable.

---

## Tier 2: Browser Under the Hood (Disguised)

These tools market themselves as "HTML to image" solutions but ALL use a headless browser internally. They would have the same crash problems as Playwright.

### 4. node-html-to-image
- Uses Puppeteer (headless Chromium) under the hood
- 23K weekly downloads
- Full CSS support (it's a real browser)
- **Same crash risk as Playwright**

### 5. wkhtmltoimage / wkhtmltopdf
- Uses headless WebKit (Qt WebKit engine)
- Deprecated/unmaintained upstream project
- Old WebKit engine -- poor modern CSS support
- Binary distribution headaches on Windows
- **Still a browser engine, just an old one**

### 6. Gotenberg
- Docker-based conversion service using Chromium
- Good for PDF, supports images
- **Still Chromium under the hood**, just containerized
- Adds Docker dependency

### 7. Umay Render / ImageRender.cloud / ConvertAPI
- SaaS/API services that render HTML to images
- All use headless browsers on their servers
- Adds network dependency, latency, and cost
- **Not offline-capable**

### 8. coreimr (Python)
- Claims "zero-dependency" but actually uses system Chrome/Edge
- Just a CLI wrapper around `chromium --headless --screenshot`
- **Literally just a browser**

---

## Tier 3: Client-Side Only (Require a Running Browser DOM)

These CANNOT run in Node.js on a server. They require a live browser DOM to work.

### 9. html-to-image
- 3.1M weekly downloads (very popular)
- Fork of dom-to-image
- Converts DOM nodes to SVG/PNG using `<foreignObject>` trick
- **Requires browser DOM** -- cannot run in Node.js without a browser

### 10. dom-to-image-more
- 182K weekly downloads
- Same `<foreignObject>` SVG approach
- **Requires browser DOM**

### 11. html2canvas
- Classic library, widely used
- Re-implements CSS rendering on Canvas (doesn't use actual browser rendering)
- **Requires browser DOM**

### 12. snapDOM
- Newer library (2026), fast DOM-to-SVG capture
- Supports pseudo-elements, external images
- **Requires browser DOM**

---

## Tier 4: Not Applicable

### 13. pageres-cli / capture-website
- Both use Puppeteer under the hood
- `pageres` is basically a Puppeteer wrapper with CLI
- `capture-website` same story

### 14. Inkscape CLI
- `inkscape input.svg --export-type=png` -- SVG to PNG only
- Full SVG spec support but heavy install (~200MB)
- Cannot accept HTML input
- Overkill for this use case

### 15. librsvg / rsvg-convert
- C library for SVG rendering
- Linux-focused, Windows support is poor
- SVG only, not HTML

---

## The Fundamental Problem

Converting arbitrary HTML/CSS to an image requires a layout engine that understands the full CSS specification (cascade, specificity, box model, flexbox, grid, floats, positioning, text shaping, font loading, etc.). The only things that do this correctly are **browser engines** (Blink/Chromium, WebKit, Gecko).

Satori sidesteps this by implementing a *subset* -- specifically the Yoga/React Native flexbox model -- which is enough for card-style layouts but not for arbitrary web pages.

**There is no tool that renders full HTML/CSS to an image without a browser engine.** This is a fundamental constraint, not a tooling gap.

---

## Recommendation for PostCanary

### Primary approach: Satori + resvg-js (or Sharp)

**Architecture:**
```
Vue SFC (postcard template)
    |
    v
Pre-render to HTML string (Vite SSR or @vue/server-renderer)
    |
    v
Convert to Satori-compatible JSX/HTML (satori-html)
    |
    v
Satori renders to SVG
    |
    v
resvg-js (or Sharp) rasterizes SVG to PNG
```

**Key constraints to validate:**
1. Can the postcard design be expressed within Satori's CSS subset? (flexbox yes, grid no, limited positioning)
2. Google Fonts loading -- must fetch font files as ArrayBuffers and pass to Satori
3. Image embedding -- external images must be base64-encoded or fetched as buffers
4. The postcard templates would need to be authored in Satori-compatible markup, NOT arbitrary Vue templates

**Risk:** If the postcard design requires CSS Grid, absolute positioning, box-shadow, or pseudo-elements, Satori cannot render it. In that case, the options narrow to:
- Fix Playwright crashes on Windows (different Chromium flags, `--no-sandbox`, `--disable-gpu`, etc.)
- Use Playwright in a Docker container (isolates the browser process)
- Use an API service (htmlcsstoimage.com, etc.) as a fallback

### Fallback: Fix Playwright instead of replacing it

Common Playwright Windows crash fixes worth trying before abandoning the browser approach:
- `--disable-gpu` flag
- `--no-sandbox` flag
- `--disable-dev-shm-usage` (shared memory issues)
- `--single-process` flag
- Use `chromium` channel instead of default
- Pin a specific Playwright version known to work on Windows
- Increase `timeout` values
- Use `playwright-core` with system-installed Chrome/Edge instead of bundled Chromium

---

## Performance Comparison Table

| Approach | Render Time | Memory | Browser? | Modern CSS | Windows | Offline |
|----------|------------|--------|----------|------------|---------|---------|
| Satori + resvg-js | 50-200ms | ~50MB | No | Subset (flexbox only) | Excellent | Yes |
| Sharp (SVG input) | <50ms | ~30MB | No | N/A (SVG only) | Excellent | Yes |
| Playwright | 1-3s | ~250MB | Yes | Full | Crashes | Yes |
| Puppeteer | 1-3s | ~230MB | Yes | Full | Crashes | Yes |
| wkhtmltoimage | ~500ms | ~100MB | Yes (WebKit) | Poor (old) | Fragile | Yes |
| API services | 500-2000ms | N/A | Remote | Full | N/A | No |

---

## Sources

- Satori GitHub: https://github.com/vercel/satori (v0.26.0, Mar 2026)
- resvg-js npm: https://www.npmjs.com/package/@resvg/resvg-js
- DevTools Guide benchmark: https://devtoolsguide.com/screenshot-and-og-image-tools/
- Sharp performance: https://sharp.pixelplumbing.com/performance
- sharp-vs-resvgjs benchmark: https://github.com/privatenumber/sharp-vs-resvgjs
- html2pic (Python/Skia PoC): https://github.com/francozanardi/html2pic
- SVG to PNG guide: https://www.svgai.org/blog/export-svg-as-png-programmatically
- SO discussion on browserless conversion: https://stackoverflow.com/questions/65914148
