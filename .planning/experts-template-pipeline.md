# Template Pipeline — Figma Plugin + Variable Data + Print Production Decision Rules

> **Load when:** Building, configuring, or debugging the PostCanary postcard template system — Figma plugin development, variable data handling, text/logo/color adaptation, or print production pipeline (RGB→CMYK, bleed, preflight).
>
> **Load alongside:** `experts-design-panel.md` (Gendusa/Draplin/Whitman/Halbert/Caples/Heath — what the card should look like) + `experts-implementation-bridge.md` (Wathan/Drasner/Comeau — how to translate design to code)
>
> **Research depth:** Read depth. Figma: 19 official doc pages scraped. VDP: 18 sources across Lob, Abyssale, PCM, XMPie. Pre-press: 10 sources incl. Ghostscript docs, Lob preflight, Printery plugin.
>
> **Writing format rules** (from `research-prompt-engineering-experts.md` — 7 principles):
> 1. Behavioral descriptions over expertise claims
> 2. Positive framing — "do X" outperforms "don't do Y"
> 3. Specific on constraints, general on reasoning
> 4. Examples beat rules for format/tone calibration
> 5. Explicit failure modes for every capability
> 6. Priority ordering — most critical rules at top and bottom
> 7. Concise — every sentence earns its place

---

## How This File Works

Three domains, each owning a specific phase of the template pipeline. When domains overlap, follow the order: Figma Plugin (creation) → Variable Data (adaptation) → Print Production (output).

| Domain | Phase | Activation |
|--------|-------|------------|
| **Figma Plugin API** | Template creation — building postcard layouts programmatically | When writing plugin code, choosing node types, handling fonts/images/variables |
| **Variable Data Templates** | Content adaptation — making one template work for any business | When handling variable-length text, logos, brand colors, photos, template variants |
| **Print Production** | Output pipeline — getting from Figma RGB to print-ready CMYK PDF | When exporting, converting colors, setting bleed, validating for print partner |

**Project constraint (drake-memory ID 188):** Print partner is **1 Vision**, not Lob. Lob patterns are reference architecture; 1 Vision's specific requirements are unknown until the April 20 demo call.

---

## 1. FIGMA PLUGIN RULES — Template Creation

**Source:** Figma Plugin API documentation (19 official pages scraped, April 2026). Plugin API is the only way to create design content programmatically in Figma — REST API is read-only for nodes.

### Node Creation

- If creating a postcard frame, use `figma.createFrame()` with `resize(1875, 2775)` for 6x9" with 0.125" bleed at 300 DPI (72 DPI equivalent: 450×666 px). Set `clipsContent = true`.
- If creating zone backgrounds (offer strip, info bar), use `figma.createRectangle()` with solid fills. Set `cornerRadius = 0` (Draplin rule: sharp corners = print, rounded = SaaS).
- If creating text elements, call `figma.loadFontAsync()` for EVERY font variant BEFORE setting `.characters`. Failure to load throws a blocking error.
- If loading Google Fonts (Oswald, Instrument Sans), use `loadFontAsync({ family: "Oswald", style: "Bold" })`. Google Fonts are available by default in Figma — no import step needed.

### Text Handling

- If text has variable length, set `textAutoResize = 'HEIGHT'` to auto-expand vertically while keeping width fixed. This prevents text from clipping on longer business names.
- If text must not exceed its container, use `textAutoResize = 'TRUNCATE'` for ellipsis fallback.
- If applying mixed styles within one text node (e.g., red headline + navy sub-headline), use `setRangeFontSize()`, `setRangeFills()`, `setRangeFontName()` on character ranges. Each range's font must be pre-loaded.

### Image Handling

- If loading a business photo from URL, use `figma.createImageAsync(url)`. Apply the image as a fill on a rectangle: `rect.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }]`.
- If loading a logo, use `scaleMode: 'FIT'` to prevent distortion (logos have variable aspect ratios).
- If an image exceeds 4096×4096 pixels, resize before loading — Figma rejects oversized images.
- If image format is not PNG, JPG, or GIF, convert first — Figma rejects SVG, WebP, and TIFF via plugin image API.

### Variables (Template Data)

- If representing template fields (headline, phone, business name), create Figma Variables of type STRING and bind them to text node `.characters` via `variable.setValueForMode()`.
- If representing brand colors, create Figma Variables of type COLOR and bind to fill properties.
- If swapping images per business, use Component INSTANCE_SWAP properties — there is no IMAGE variable type.
- If the template needs >4 business variants in one file, Enterprise plan is required (Free: 1 mode, Pro: 4 modes, Enterprise: 40).

### Export

- If exporting for screen preview, use `node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } })` for 2x resolution.
- If exporting for print, use `node.exportAsync({ format: 'PDF' })`. Output is RGB — CMYK conversion is a separate step (see Print Production rules below).
- If the pipeline must run without Figma open, templates must be pre-built. Only REST API reads/exports work headlessly.

### Failure Modes

- Fails when: plugin tries to run headlessly — Figma must be open. MITIGATION: pre-build templates during design phase; automate only the export/conversion steps.
- Fails when: font not loaded before text operation — throws blocking error. MITIGATION: load ALL font variants in a single async batch at plugin startup.
- Fails when: CORS blocks image loading from PostCanary CDN — fails silently. MITIGATION: use base64-encoded image data via `figma.createImage(uint8Array)` to bypass CORS entirely.
- Fails when: many nodes created without cleanup — Figma slows. MITIGATION: use `figma.group()` and delete unused nodes.

---

## 2. VARIABLE DATA RULES — Content Adaptation

**Sources:** Lob Help Center (merge variables, Handlebars templating), Abyssale Developer Hub (text overflow properties), PostcardMania/PCM Integrations (VDP methodology), Linemark VDP Guide, XMPie design best practices. 18 sources total.

### Text Overflow (the #1 template challenge)

- If business name is 1-20 characters, render at full font size on a single line.
- If business name is 21-35 characters, auto-resize the font down to a floor of 24pt, single line.
- If business name exceeds 35 characters, auto-resize + allow 2-line wrapping, floor at 20pt.
- If text still overflows at 20pt on 2 lines, truncate with ellipsis AND flag for manual review — the template cannot accommodate this edge case automatically.
- If testing templates, ALWAYS test with "AB" (2 chars) AND "Johnson & Smith Professional HVAC Services LLC" (46 chars). Both extremes must look professional. (Source: Linemark stress-testing methodology)

### Logo Adaptation

- If logo aspect ratio is 0.75–1.33 (roughly square), use a 1" × 1" container.
- If logo aspect ratio is 1.34–2.5 (landscape), use a 2" × 0.75" container.
- If logo aspect ratio is 2.51–4.0 (wide), use a 2.5" × 0.6" container.
- If logo aspect ratio exceeds 4.0 or is below 0.75 (extreme), flag for manual review.
- If placing any logo, use `object-fit: contain` (or Figma `scaleMode: 'FIT'`) to preserve proportions.
- If the logo is text-only (no icon), treat it as a text element with the business name in a brand font — often renders cleaner than a tiny raster image.

### Color Adaptation

- If the contrast ratio of brand color against white text is >= 4.5:1, use brand color as background with white text. This is the standard case.
- If contrast ratio is 3.0–4.5:1, use brand color as background with white BOLD text (added weight compensates for reduced contrast).
- If contrast ratio is below 3.0:1 (brand color too light for white text), flip to dark text (#1A1A1A) on the brand-colored background.
- If the brand color is within deltaE 15 of a template zone color (e.g., brand navy ≈ info bar navy), shift the template zone color by at least deltaE 30 to maintain visible zone boundaries. Two adjacent zones in the same color look like a design error.
- If applying brand colors, use solid fills only for print — gradients with transparency cause inconsistent CMYK conversion.

### Photo Handling

- If the photo's shortest dimension is below 1500px, show a quality warning to the user. Below 1000px, block usage — the print output will show visible pixelation.
- If the photo's aspect ratio differs from the template zone, crop with a user-adjustable focal point (center-of-interest detection). For HVAC postcards, the subject is typically on the right — default crop anchor to right-center.
- If the photo comes from Google Places API, strip EXIF orientation data before passing to the renderer. (Source: Lob known bug with non-zero EXIF rotation)
- If the client provides no usable photo, use a stock industry image with an offer-dominant template variant instead.

### Template Variant Selection

- If the business provides a high-quality hero photo (>= 1500px shortest side), default to the photo-dominant variant (HAC-1000 style: photo fills Zone 1).
- If the business has a strong offer but weak photo, default to the offer-dominant variant (larger offer strip, smaller photo).
- If no hero photo is available, use stock industry imagery and auto-select the offer-dominant variant.
- If the business has a strong Google review (4.5+ stars, compelling quote), surface the review-forward variant.
- If template selection happens automatically, always allow manual override.

### Failure Modes

- Fails when: a business name is extremely long AND includes a tagline — the auto-resize cascade produces unreadably small text. MITIGATION: separate business name from tagline, display tagline only if space permits.
- Fails when: brand color is very similar to the photo's dominant color — the text overlay on the photo becomes invisible. MITIGATION: add a text shadow or semi-transparent background overlay when luminance contrast against the photo is below 3:1.
- Fails when: the logo is a low-resolution JPEG with compression artifacts — it looks unprofessional at print scale. MITIGATION: request SVG or PNG at minimum 600px width. Flag JPEGs below 300px as unusable.
- Fails when: this is treated as a universal-brand system (PostCanary's approach is novel — no existing platform does this). MITIGATION: extensive edge-case testing with diverse real businesses. Build a test suite of 20+ real business profiles covering every variable combination.

---

## 3. PRINT PRODUCTION RULES — Output Pipeline

**Sources:** Ghostscript Color Management docs (v10.08.0), Printery plugin for Figma (33K+ users), Lob Preflight Checklist, Figma Print FAQ (Johannes Ippen, 2025), PDF/X standard documentation. 10 sources.

### Dimensions (6x9" postcard)

| Zone | Dimensions | Purpose |
|------|-----------|---------|
| Bleed (document size) | 6.25" × 9.25" | Background extends past trim edge |
| Trim (final card) | 6.0" × 9.0" | Physical cut line |
| Safe area | 5.875" × 8.875" | All text/logos/QR codes stay inside |

- If setting up a Figma frame for print, create at bleed dimensions (1875×2775 px at 300 DPI or 450×666 px at 72 DPI).
- If placing text, logos, phone numbers, or QR codes, keep them inside the safe area — at least 0.125" (9 px at 72 DPI) inside the trim edge on all sides.

### Color Conversion (RGB→CMYK)

- If converting Figma's RGB output to CMYK, use Ghostscript with an ICC profile:
  ```bash
  gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
     -dPDFSETTINGS=/prepress -sOutputICCProfile=/path/to/GRACoL2006_Coated1v2.icc \
     -sColorConversionStrategy=CMYK -dProcessColorModel=/DeviceCMYK \
     -sOutputFile=output_cmyk.pdf input_rgb.pdf
  ```
- If choosing an ICC profile for US direct mail, use GRACoL 2006 (Coated) as default — Lob's specified profile. Ask 1 Vision which profile they use at the April 20 demo.
- If the design uses bright blues, vivid greens, or neon colors, verify the CMYK equivalent renders acceptably — these shift the most during conversion. Pull a test print before any campaign.
- If black text converts to "rich black" (C:75 M:68 Y:67 K:90 instead of pure K:100), add `-dBlackPtComp=1` to the Ghostscript command. Rich black on thin text causes registration issues.

### For the Demo (April 20)

- If exporting for the 1 Vision demo, use the Printery plugin: select frame → CMYK mode → GRACoL 2006 ICC → 300 DPI → enable bleed → export PDF. This is the simplest path with highest fidelity.
- If Printery is unavailable or a manual process is unacceptable, use the Ghostscript pipeline above.

### PDF Standard

- If submitting to any print partner, use PDF/X-1a for maximum compatibility. CMYK only, flattened transparency, universally accepted.
- If the print partner specifically requests PDF/X-4, use that instead — it preserves live transparency and is more modern.

### Fonts for Print

- If using Oswald or Instrument Sans, both are SIL Open Font License — free for commercial print, no licensing issues, embedding permitted.
- If guaranteeing exact font rendering, flatten text to vector outlines in Figma (Cmd+E / Ctrl+E) before export. Eliminates font substitution risk entirely.

### Preflight Validation

- If validating a print-ready PDF, check these in order: (1) CMYK color space, (2) fonts embedded or outlined, (3) all images at 300 DPI, (4) correct dimensions with bleed, (5) transparency flattened, (6) single layer, (7) file size under 5MB, (8) no printer marks (unless specifically requested by 1 Vision).

### Failure Modes

- Fails when: 1 Vision requires a different ICC profile or PDF standard than expected — the CMYK conversion shifts colors. MITIGATION: ask 1 Vision for exact specs at the April 20 demo before producing final files.
- Fails when: Ghostscript version changes black handling behavior — different versions treat rich black differently. MITIGATION: pin a specific Ghostscript version in the production pipeline and test with PostCanary's specific color palette.
- Fails when: the Printery plugin is used for production automation — it requires Figma UI interaction and cannot be scripted. MITIGATION: use Printery for demo/one-off exports; use Ghostscript for automated production pipeline.
- Fails when: screen preview and print output look different — screens are 10-15% brighter than print. MITIGATION: design 10-15% more saturated than the desired print appearance. Use Printery's CMYK preview for soft proofing.

---

## Expert Convergence (where 2+ domains agree)

| Finding | Domains | Confidence |
|---------|---------|------------|
| All dimensions in inches or points for print, never px/rem/em | Figma Plugin + Print Production + Implementation Bridge (Wathan tokens) | HIGH |
| Solid fills only for print — gradients with transparency produce inconsistent CMYK output | Variable Data + Print Production | HIGH |
| Test with extreme edge cases ("AB" and 46-char names) before shipping any template | Variable Data (Linemark) + Design Panel (Gendusa 3-second test) | HIGH |
| Logo uses contain/fit mode, never stretch | Figma Plugin (scaleMode FIT) + Variable Data (object-fit contain) | HIGH |
| Font loading is a prerequisite, not an afterthought — missing fonts cause silent failures or blocking errors | Figma Plugin (loadFontAsync) + Print Production (embedding) + Variable Data (Lob font restrictions) | HIGH |
| CMYK conversion happens OUTSIDE Figma — Figma is RGB-only, post-processing is always required | Figma Plugin (limitation) + Print Production (pipeline) | HIGH |

## Expert Conflicts

| Conflict | Resolution for PostCanary |
|----------|--------------------------|
| Figma agent recommended Lob HTML templates; drake-memory ID 188 says print partner is 1 Vision, not Lob | Use Lob patterns as reference architecture for template structure + variable data. Actual delivery format TBD based on 1 Vision's requirements. Ask at demo. |
| Abyssale had best text overflow system (auto_resize, min_font_size, text_harmony); Abyssale was rejected in Session 36 (ID 187) | Extract Abyssale's overflow patterns and implement them in the Figma plugin. Use the PATTERN, not the platform. |
| VDP research says "no platform does universal templates" (PostCanary's novel approach); industry standard is per-brand templates | Acknowledge this is uncharted territory. Build comprehensive edge-case test suite with 20+ real business profiles. Budget extra time for adaptation failures. |

---

## Known Gaps

1. **1 Vision specifications** — ICC profile, PDF standard, crop mark preference, file format, max file size. Unknown until April 20 demo call.
2. **AI photo composition scoring** — no tool found for automatically evaluating whether a photo works within a template zone. May need to build or skip for demo.
3. **Automated preflight** — no free CLI tool for PDF/X-1a validation found. Acrobat Pro is GUI-only. Investigate `verapdf` (Java) or `pdfcpu` (Go).
4. **Figma Plugin + Printery chaining** — unclear if Printery can be triggered programmatically from a custom plugin. If not, the demo export is a 2-step manual process.
5. **Color deltaE calculation** — CIE76, CIE94, or CIEDE2000? CIEDE2000 is the current standard but no VDP-specific guidance found.
6. **Variable mode limits** — Free Figma plan has only 1 variable mode. If PostCanary needs to preview multiple businesses in one file, Pro (4 modes) or Enterprise (40) is required.

---

*Synthesized: 2026-04-12 Session 43*
*Research: 3 files (research-figma-plugin-api.md, research-variable-data-templates.md, research-prepress-print-production.md)*
*Research depth: Read depth (~47 sources across 3 domains)*
*Domains: Figma Plugin API, Variable Data Template Systems, Pre-press/Print Production*
*Cross-references: experts-design-panel.md (Gendusa/Draplin/Whitman/Halbert/Caples/Heath), experts-implementation-bridge.md (Wathan/Drasner/Comeau)*
