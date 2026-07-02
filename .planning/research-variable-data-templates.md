# Research: Variable Data Template Systems for Print Postcards
Date: 2026-04-12
Purpose: Catalog template system patterns, constraints, and decision rules for building PostCanary's universal 6x9" postcard template system.

## Sources
| Source | URL | What it provided |
|--------|-----|-------------------|
| Lob Help Center - Dynamic Personalization | https://help.lob.com/print-and-mail/designing-mail-creatives/maximizing-engagement/dynamic-personalization | Merge variable system, Mustache/Handlebars templating, HTML template architecture, font handling, strictness settings |
| Lob Help Center - Creative Formatting | https://help.lob.com/print-and-mail/designing-mail-creatives/creative-formatting | File formats, DPI requirements, RGB-to-CMYK conversion behavior, Webkit rendering, font support matrix |
| Lob Help Center - Advanced Handlebars | https://help.lob.com/print-and-mail/designing-mail-creatives/maximizing-engagement/dynamic-personalization/advanced-templating-handlebars | Conditionals, loops, object access, template compilation API |
| Lob GitHub Examples | https://github.com/lob/examples/blob/master/postcards/4x6-back.html | Exact CSS for postcard body, safe area, ink-free zone dimensions |
| Abyssale Developer Hub - Designs | https://developers.abyssale.com/rest-api/designs | Design types (static, animated, printer, printer_multipage), layer architecture, format system |
| Abyssale Developer Hub - Text Properties | https://developers.abyssale.com/rest-api/generation/element-properties/text | auto_resize, min_font_size, max_lines, text_harmony, text_truncation, text_transform, variable substitution |
| Abyssale Developer Hub - Generation | https://developers.abyssale.com/rest-api/generation/ | Sync vs async generation, print-specific rendering, CMYK native support |
| Abyssale Blog - Print-Ready PDFs | https://www.abyssale.com/blog/automate-print-ready-pdf-generation-api | printer_multipage design type, CMYK profile handling, bleed zone management |
| Abyssale - Dynamic Images | https://developers.abyssale.com/dynamic-images/image-generation-via-url | URL-based parameter override for text, images, colors per layer |
| PCM Integrations - Direct Mail API | https://www.pcmintegrations.com/direct-mail-api/ | Variable data printing capabilities, unlimited personalization, dynamic images, webhook system, 1-day turnaround |
| PostcardMania - Static vs Variable | https://www.postcardmania.com/postcardmarketingmanual/two-types-of-postcards-static-and-variable/ | VDP progression: name-only to gender+offer+neighborhood, visual examples |
| Linemark - VDP Strategic Guide 2026 | https://www.linemark.com/variable-data-printing-vdp-the-strategic-guide-to-mass-customization-in-2026/ | Stress-testing methodology, data hygiene, PDF/VT format, hybrid offset+digital, design-for-variability principles |
| MPA - Variable Data Printing | https://www.mailpro.org/post/variable-data-printing/ | Template structure (InDesign + XMPie/FusionPro), conditional logic, proofing across edge cases |
| NextPage - VDP Technical Design | https://gonextpage.com/vdp-technical-design-prepress-a-guide-for-the-non-print-marketer/ | Static vs variable element separation, rule-based logic, text limits, image standardization |
| Poplar - Design Best Practices | https://docs.heypoplar.com/getting-started/creative-templates/design-best-practices | SVG logos, CMYK color mode, 0.125" bleed, PDF/X-4:2008, hierarchy/contrast/balance principles |
| CRSTNET - EDDM Postcard Design | https://blog.crst.net/eddm-postcard-design | Safe zone (0.25" inside trim), bleed (0.125"), visual hierarchy (Headline > Image > Copy > CTA), 3-second readability test |
| XMPie - VDP Design Best Practices | https://help.xmpie.com/KBA/0005/0005_Best_Practices_for_Variable_Data_Print_Design.htm | Transparency performance impact, image asset optimization (150-200 DPI for digital), CopyFit for overflow, Longest Line Test |
| CSS-Tricks - Fitting Text to a Container | https://css-tricks.com/fitting-text-to-a-container/ | FitText, textFit, fitty libraries; SVG viewBox approach; viewport unit limitations |
| Postalytics - Direct Mail Creative Tools | https://www.postalytics.com/blog/direct-mail-design/ | Variable data, variable images, variable logic personalization; template editor workflow |
| Mailjoy - HTML Postcard Templates | https://www.mailjoy.com/resources/guides/how-to-design-html-postcard-templates.html | Inline stylesheets only, absolute positioning, px/in units, solid colors only (no reliable gradients) |

---

## 1. Lob Template System

### Architecture
Lob templates are standard HTML/CSS documents with Mustache-style merge variables (`{{variable_name}}`). The rendering engine is Webkit-based (Safari). Templates are stored, versioned, and managed via API or dashboard.

### Template Dimensions (6x9" Postcard)
- **Body**: `width: 6.25in; height: 4.25in` (for 4x6) or `width: 9.25in; height: 6.25in` (for 6x9, with bleed)
- **Safe area**: 0.1875in inset from all edges (content must stay inside)
- **Ink-free zone** (back only): 3.2835in x 2.375in, positioned bottom-right with 0.275in right margin and 0.25in bottom margin -- reserved for address and postage
- **Image resolution**: Minimum 300 DPI. Formula: `(width in pixels) / (width in inches)`. A 6.25" wide postcard needs images at least 1875px wide.

### Merge Variable System
- Syntax: `{{tag_name}}` for simple values, `{{user.name}}` for nested objects
- Supports: strings, numbers, booleans, arrays, objects, null
- Max payload: 25,000 characters total for merge_variables JSON object
- Variable names: no whitespace, no special characters (`@`, `!`, etc.)
- Conditionals: `{{#condition}}...{{/condition}}` (truthy) and `{{^condition}}...{{/condition}}` (falsy)
- Loops: `{{#array}}{{property}}{{/array}}`
- Handlebars engine (opt-in via `engine: "handlebars"`): adds `{{#if}}`, `{{#each}}`, `{{#withGroup}}`, custom helpers
- **Strictness settings**: configurable at account or campaign level -- controls whether missing merge variables block sending or render blank

### Merge Variables in CSS (Key Pattern)
Variables work anywhere in HTML, including CSS properties:
```html
<html style="font-size: {{fontsize}}; color: {{color}}">
```
This means brand colors, font sizes, and image URLs are all injectable as merge variables.

### Font Handling
- Supported formats: TTF, SVG, EOT, Google Web Fonts, custom hosted fonts
- NOT supported: OTF (must convert to TTF), Type 1/3 fonts, Adobe Typekit fonts
- Google Fonts: link in `<head>`, reference in `font-family`
- Custom fonts: host on S3 or similar, use `@font-face` declaration
- All font links must be publicly accessible or rendering fails

### Rendering Constraints
- Inline styles or internal stylesheet only (no external stylesheets)
- Absolute positioning recommended (fixed canvas size)
- Avoid: `object-set` property, `img` with `opacity`, combined `background-image` + `border-radius` + `border`, gradients with transparency, `background-size: contain` without `background-repeat: no-repeat`
- JavaScript: partially supported but not guaranteed to fully execute before PDF generation -- test thoroughly
- **RGB only in HTML templates** -- CMYK conversion happens automatically during rendering. Colors may shift. For brand-critical colors, use PDF format instead.

### Figma Plugin
Lob offers a Figma-to-Lob plugin that converts Figma designs to HTML templates with merge variables. This is the recommended path for non-developer template creation.

### Template Versioning
Each edit creates a new version. The published version is used for all subsequent API calls referencing that template ID. Prior versions are viewable for rollback via copy-and-save.

---

## 2. Abyssale Template System

### Architecture
Abyssale uses a visual editor with typed layers (text, image, button, shape, logo, QR code, illustration, rating, audio, video). Each layer has configurable properties that serve as defaults, overridable at generation time via API. Designs support multiple formats (dimensions) from a single design.

### Design Types for Print
- `printer`: Single-page printable PDF output
- `printer_multipage`: Multi-page stitched PDF output
- Both output CMYK natively with proper bleed zones -- this is NOT achievable by adding a parameter to a standard design. The template must be created as a printer type from the start.
- Output format: printable PDF only (no PNG/JPEG for printer types)

### Text Layer Properties (Directly Relevant to VDP)
| Property | Behavior |
|----------|----------|
| `auto_resize: true` | Automatically shrinks font size to fit text within its container |
| `min_font_size` | Floor for auto_resize -- text will not shrink below this size |
| `max_lines` | Maximum number of lines allowed before truncation |
| `text_truncation: true` | If text still overflows after auto_resize, truncate with ellipsis (...) |
| `text_harmony: true` | Balances line lengths (max 20% variance between lines). Adjusts character spacing first (plus/minus 20), then reduces font size (up to -10px) |
| `text_transform` | Force uppercase, lowercase, titlecase, or capitalize |
| `font_size` | Override font size in pixels |
| `font` / `font_weight` | Override font by ID and weight (100-900) |
| `color` | Hex, linear gradient, or CMYK (`cmyka(89,51,0,13,100)`) |
| `alignment` | Two-axis: `"top left"`, `"middle center"`, `"bottom right"` |
| `payload` | Text content, max 2048 characters. Supports `\n` for line breaks |

### Variable Substitution in Text
Variables use `{variable_name}` syntax (single curly braces, unlike Lob's double). API passes `vars` object:
```json
{
  "elements": {
    "text_layer_name": {
      "vars": { "business_name": "Acme HVAC" }
    }
  }
}
```
Original template text: `Call {business_name} today!` renders as `Call Acme HVAC today!`

### Partial Text Decorations
Markup within text payload can colorize, underline, bold, or strike specific portions of text. Resembles HTML markup but is proprietary.

### Image Layer Properties (Inferred from API docs)
Images are referenced by URL in the `image_url` property. Layer dimensions are fixed in the design editor. The image fills the layer container according to its configured fit mode.

### Dynamic Image URLs
Abyssale generates a stable URL per design where query parameters override any layer property:
```
https://img.abyssale.com/{id}?text_title=Welcome&company_logo=https://...
```
This enables real-time image generation without API calls -- useful for previews.

### Key Advantage for PostCanary
Abyssale's `auto_resize` + `min_font_size` + `text_truncation` + `text_harmony` combination is a complete text overflow solution built into the platform. This is the pattern PostCanary needs regardless of which rendering engine is used.

---

## 3. PostcardMania / PCM Integrations

### PCM Integrations API
- Direct mail API with zero tech fees, pay-per-piece
- Variable data: unlimited fields -- names, images, dates, colors, custom fields
- Dynamic QR codes generated automatically
- Proofs: API returns JPG or PDF proof on demand
- Turnaround: 1 business day for postcards
- Supported formats: postcards, letters, self-mailers, brochures, flyers
- Template system: designs uploaded or created by PCM's design team. Templates shared across sandbox and production environments.
- Address validation: CASS, NCOA, DPV, and presort included at no cost
- Webhook system for mail tracking per recipient
- Multi-tenant support: separated accounts, permissions, templates, billing

### PostcardMania Variable Data Progression (documented pattern)
PostcardMania documents a clear progression of variable data complexity:
1. **Level 1 - Name only**: `{{first_name}}` inserted into headline or body
2. **Level 2 - Name + Gender**: Different hero image based on recipient gender
3. **Level 3 - Name + Gender + Offer**: Different discount/offer based on neighborhood or segment
4. **Level 4 - Full personalization**: Different images, offers, colors, and layouts per segment

This progression is relevant because PostCanary's use case (one template for ANY business) is fundamentally different -- the variable data is about the SENDER, not the recipient. PostCanary varies: business name, logo, phone, headline, offer, reviews, brand colors, hero photo. Most VDP platforms vary recipient data.

### PostcardMania VDP Guide (PDF reference)
- Variable data placed on its own layer in InDesign, titled "Variable"
- Separation of static and variable layers is critical for production workflow
- Template file + data file (CSV) are the two required inputs

---

## 4. VDP Industry Patterns

### Three-Pillar Architecture (Universal Pattern)
Every VDP system follows this structure:
1. **Master template** with static zones and variable zones clearly separated
2. **Data source** (CSV/Excel/database) with one row per piece, one column per variable
3. **Rules engine** applying if/then logic to select assets based on data values

Source: Linemark, MPA, NextPage all describe this identical pattern.

### Stress-Testing Protocol (Linemark -- Best Practice)
Before any production run, test with these edge cases:
- Shortest possible value (e.g., 4-char business name) -- verify design does not look empty
- Longest possible value (e.g., 46-char business name) -- verify no text overflow
- Missing/empty field -- verify template degrades gracefully
- Missing image reference -- verify template does not break
- Every branch of conditional logic -- verify each rule path renders correctly

Source: https://www.linemark.com/variable-data-printing-vdp-the-strategic-guide-to-mass-customization-in-2026/

### PDF/VT Format (ISO 16612-2)
The industry standard for variable data output files. Decreases Raster Image Processor (RIP) times by over 40% on complex jobs compared to standard PDF. Designed specifically for transactional and variable printing.

Source: Linemark

### Hybrid Approach (Offset + Digital)
For high-volume runs: offset-print static shells (brand framework), then digitally overprint variable data. Combines offset quality/cost for static elements with digital flexibility for variable elements.

Source: Linemark

### Data Hygiene Requirements
- UTF-8 encoding (prevents garbled characters)
- Deduplicated records
- CASS-certified addresses (USPS standardized, ZIP+4)
- NCOA processed (National Change of Address, within 95 days for Marketing Mail)
- No blank required fields
- Consistent formatting within columns

Source: MPA (https://www.mailpro.org/post/variable-data-printing/)

### Proofing Standard
Never approve from a single proof. Request proof sheets showing:
- Multiple variable versions across segments
- Longest text values
- Edge-case records
- At least one record from every branch of conditional logic
- Minimum 20-record proof set recommended

Source: MPA

---

## 5. Text Overflow Strategies

### The Problem
PostCanary business names range from 4 characters ("ACME") to 46 characters ("Johnson & Smith Professional HVAC Services LLC"). A single template must handle both without looking broken or empty.

### Strategy 1: Auto-Resize (Shrink-to-Fit)
**How it works**: Start at a maximum font size. If text overflows its container, reduce font size incrementally until it fits, down to a specified minimum.

**Abyssale implementation**: `auto_resize: true` + `min_font_size: 14` -- the platform handles this natively.

**CSS/JS implementation**: Libraries like fitty (https://github.com/rikschennink/fitty) or textFit measure container width, then binary-search for the largest font size that fits. SVG with `viewBox` also achieves this with zero dependencies.

**Failure mode**: When text is very long (40+ chars), font may shrink to illegible size. The `min_font_size` floor prevents this but may cause overflow at the minimum size.

**Decision rule**: Set maximum font size for the "ideal" case (15-25 char names). Set minimum font size at the smallest legible size for print (14px at 300 DPI = roughly 10.5pt, which is the floor for comfortable print readability). If text overflows at minimum font size, escalate to multi-line wrapping.

### Strategy 2: Multi-Line Wrapping
**How it works**: Allow text to break across 2 lines when it exceeds the container width at the target font size.

**Abyssale implementation**: `max_lines: 2` constrains wrapping to exactly 2 lines.

**CSS implementation**: Container has `word-wrap: break-word` and a fixed height accommodating 2 lines at the target font size.

**Failure mode**: Line break position may split words awkwardly. "Johnson & Smith Professional" might break as "Johnson & Smith" / "Professional" (good) or "Johnson & Smith Profes-" / "sional" (bad).

**Decision rule**: Combine auto-resize with max_lines: 2. First shrink font. If still overflows at minimum size, allow 2 lines. Design the container height to accommodate 2 lines at all times (visual space reserved even for 1-line names).

### Strategy 3: Truncation with Ellipsis
**How it works**: If text still overflows after resizing and wrapping, truncate and append "...".

**Abyssale implementation**: `text_truncation: true` -- truncates and adds ellipsis after auto_resize and max_lines are exhausted.

**CSS implementation**: `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` (single line) or `-webkit-line-clamp` (multi-line).

**Failure mode**: Truncation of a business name is almost always unacceptable. "Johnson & Smith Profess..." looks broken. This should be a last resort with manual review flagged.

**Decision rule**: Truncation is the safety net, not the strategy. If triggered, flag the record for manual review. The auto-resize + 2-line wrapping should handle 99%+ of cases.

### Strategy 4: Text Harmony (Abyssale-Specific)
**How it works**: `text_harmony: true` balances line lengths so no line is more than 20% longer/shorter than others. Adjusts character spacing (plus/minus 20 tracking units) first, then reduces font size (up to -10px).

**When to use**: Multi-line headlines where unbalanced rag looks unprofessional.

### Strategy 5: CopyFit (XMPie/AccurioPro Pattern)
**How it works**: VDP composition software automatically adjusts text size, tracking, and leading to fit variable text within a fixed frame. Parameters are configured per-frame: which adjustments are allowed, minimum sizes, priority order.

**Longest Line Test**: AccurioPro's pre-production check merges all records and identifies which record produces the longest text in each variable frame. Flags overset text before production.

Source: https://help.xmpie.com/KBA/0005/ and https://mercury.hesk.com/knowledgebase.php?article=316

### Character Threshold Guidelines (Inferred from Research)

For a 6x9" postcard with a business name in a prominent headline zone (~4 inches wide):
| Character Count | Behavior at 36pt | Recommended Strategy |
|----------------|-------------------|----------------------|
| 4-15 chars | Fits on 1 line comfortably | Display at maximum font size |
| 16-25 chars | Fits on 1 line, may need slight shrink | Auto-resize, stay on 1 line |
| 26-35 chars | Tight at large size | Auto-resize to ~28pt, allow 2 lines if needed |
| 36-46 chars | Overflows 1 line at any readable size | Auto-resize + 2-line wrap mandatory |

These thresholds are approximations dependent on font, weight, and container width. Must be validated with actual template measurements at 300 DPI.

---

## 6. Logo Adaptation Patterns

### The Problem
Logos arrive in wildly different aspect ratios: square (1:1), wide horizontal (3:1 or wider), tall vertical (1:2), text-only wordmarks (very wide and short), complex logos with taglines (variable).

### Container Strategy: Max-Width + Max-Height Box
**How it works**: Define a rectangular zone with both max-width and max-height constraints. Logo scales to fit within this zone while preserving aspect ratio.

**CSS implementation**:
```css
.logo-container {
  width: 2in;      /* maximum width */
  height: 0.75in;  /* maximum height */
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
```

**Behavior by aspect ratio**:
| Logo Type | Aspect Ratio | Result |
|-----------|-------------|--------|
| Square | 1:1 | Fills height, centered horizontally with space on sides |
| Wide horizontal | 3:1 | Fills width, centered vertically with space above/below |
| Tall vertical | 1:2 | Fills height, centered horizontally with significant space on sides |
| Text wordmark | 5:1+ | Fills width, very thin vertically, centered with large vertical gap |

**Failure mode**: Very wide logos (5:1+) render at a tiny height, making text illegible. Very tall logos (1:2+) waste horizontal space and may look oddly proportioned.

### Mitigation: Aspect Ratio Buckets
Pre-classify logos into buckets and use different container dimensions per bucket:

| Bucket | Aspect Ratio Range | Container Dimensions |
|--------|-------------------|----------------------|
| Square | 0.75:1 to 1.33:1 | 1in x 1in |
| Landscape | 1.34:1 to 2.5:1 | 2in x 0.75in |
| Wide | 2.51:1 to 4:1 | 2.5in x 0.6in |
| Extreme wide | 4:1+ | 2.5in x 0.5in (flag for review) |
| Portrait | below 0.75:1 | 0.75in x 1in (flag for review) |

This can be implemented with Handlebars conditionals on a `logo_aspect_ratio` merge variable:
```handlebars
{{#if logo_is_square}}
  <div class="logo-square">...
{{else if logo_is_landscape}}
  <div class="logo-landscape">...
{{/if}}
```

### Logo Format Requirements
- **SVG preferred** for vector crispness at any size (Poplar docs: "All logos should be SVG vector format for best results")
- **PNG with transparency** as fallback (minimum 300 DPI at print size)
- **JPEG acceptable** but cannot handle transparency -- requires white/solid background matching the container zone
- **Minimum resolution**: Logo should be at least 600px wide for print at 2" width (300 DPI)

Source: https://docs.heypoplar.com/getting-started/creative-templates/design-best-practices

### Logo Placement Rules (Industry Pattern)
- Logo belongs in a corner, not center of front face
- Logo appears on both front and back for brand reinforcement
- Maintain whitespace around logo (clear space = at least 50% of logo height on all sides)
- Logo should not compete with the hero image or headline for attention

Source: https://blog.crst.net/eddm-postcard-design

---

## 7. Color Adaptation Rules

### The Problem
PostCanary templates use brand colors from the business. When a brand color is too close to a template zone color (e.g., navy brand on navy info bar), elements become invisible. When brand colors have insufficient contrast against white text, readability suffers.

### RGB-to-CMYK Conversion (Lob-Specific)
Lob's HTML rendering engine works in RGB only. Colors undergo automatic RGB-to-CMYK conversion during print preparation. This conversion causes hue and saturation shifts. Lob advises: for brand-critical colors, use PDF format instead of HTML.

Source: https://help.lob.com/print-and-mail/designing-mail-creatives/creative-formatting

### CMYK Native Support (Abyssale)
Abyssale's printer/printer_multipage design types support CMYK natively: `cmyka(89,51,0,13,100)`. The rendering engine respects CMYK from design through output. No conversion artifacts.

Source: https://www.abyssale.com/blog/automate-print-ready-pdf-generation-api

### Contrast Requirements (WCAG-Derived, Applied to Print)
WCAG 2.1 Level AA requires:
- **4.5:1 contrast ratio** for normal text (below 18pt or 14pt bold)
- **3:1 contrast ratio** for large text (18pt+ or 14pt+ bold)

For print, these minimums should be treated as floors, not targets. Print introduces additional contrast reduction from ink absorption, paper texture, and viewing conditions. Practical minimum for direct mail: **5:1 for body text, 3.5:1 for headlines**.

### Color Adaptation Decision Rules

**Rule 1: Brand color as background**
When brand color is used as a background zone (e.g., header bar, CTA button):
- Calculate contrast ratio between brand color and white text
- If contrast >= 4.5:1 -- use white text
- If contrast >= 3:1 but < 4.5:1 -- use white text but increase font weight to bold
- If contrast < 3:1 (e.g., yellow, light green) -- use dark text (near-black, `#1a1a1a`) instead of white

**Rule 2: Brand color collision with template zone**
When brand color is perceptually similar to a template zone color (deltaE < 15):
- Option A: Shift the template zone color to a lighter/darker variant of the brand color
- Option B: Add a visible border or separator between brand zone and template zone
- Option C: Invert the relationship (use brand color for text, neutral for background)

**Rule 3: Gradients and transparency**
- Solid colors only for reliable print output (Mailjoy and Lob both warn against gradients)
- Lob specifically warns against gradients using transparency
- If gradients are used, test with physical print samples -- screen rendering does not predict print behavior

**Rule 4: Black in CMYK**
Standard RGB black (#000000) converts to a 4-color CMYK black that may appear muddy or uneven. True "rich black" in CMYK is typically `cmyka(60,40,40,100,100)` or similar. Abyssale handles this natively in printer mode.

Source: https://www.abyssale.com/blog/automate-print-ready-pdf-generation-api ("True CMYK Black: We handle color profiles natively. Your 'Black' text won't print as a muddy dark grey.")

---

## 8. Photo Composition Constraints

### Resolution Requirements
- Minimum 300 DPI at final print size
- For a 6x9" full-bleed postcard: minimum image dimensions of 2775px x 1875px (including bleed area)
- XMPie recommends 150-200 DPI as sufficient for digital print specifically (higher resolution adds file size without visible quality improvement on digital presses)
- Lob advises no need to exceed 300 DPI -- additional resolution is wasted

Source: Lob creative formatting docs, XMPie best practices

### Image Format Rules
- PNG: raster, supports transparency, higher quality. RGB only -- CMYK conversion happens automatically
- JPEG: raster, no transparency, good for photographs. Check EXIF orientation -- non-zero EXIF rotation causes rendering errors in Lob
- SVG: vector, ideal for logos and icons, scales without quality loss
- All image URLs must be publicly accessible or rendering fails silently

### Photo Composition for Variable Hero Images
No automated photo composition scoring system was found in the research. However, these constraints apply:

**Subject Positioning**:
- The hero photo occupies a defined zone in the template (e.g., left 50% of front, or full bleed behind text)
- When text overlays the photo, the photo's "quiet" areas (sky, blurred background) must align with text zones
- Photos with subjects centered may conflict with logo or text overlay zones

**Practical Constraints for PostCanary**:
- Hero photos come from the business (job site photos, team photos, equipment)
- Quality varies enormously -- some will be phone photos at low resolution
- Orientation varies -- landscape photos fit 6x9 postcards naturally; portrait photos require cropping or letterboxing

**Decision Rules**:
- Require minimum 1500px on the shortest dimension for any uploaded photo
- Crop to template aspect ratio on upload, with user-adjustable focal point
- If photo falls below resolution threshold, show warning but allow usage (many small businesses have limited photo assets)
- Pre-define a "text-safe zone" overlay in the template that shows the business which areas of the photo will have text overlay

### Image Aspect Ratio Handling
Lob states: "Submitted images must have the same length-to-width ratio as the chosen product. Images will not be cropped or stretched by the API." This means the application must handle cropping before passing to Lob.

Source: https://help.lob.com/print-and-mail/designing-mail-creatives/creative-formatting

---

## 9. Font Handling

### Fixed vs Brand Fonts
**Pattern observed across all platforms**: Templates use a fixed set of fonts for the template framework (body text, labels, small print) and allow one or two variable font slots for brand-specific typography (business name, headline).

**Practical approach for PostCanary**:
- Template framework fonts: 2-3 pre-selected fonts (e.g., one sans-serif for headlines, one serif or sans-serif for body, one for accent text). These are fixed and tested.
- Brand font slot: Allow the business to specify their brand font. If available as a Google Font or hostable TTF, inject it. If not available, fall back to the closest match from the template's font set.

### Font Loading in Lob
```html
<!-- Google Fonts -->
<head>
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
</head>

<!-- Custom hosted fonts -->
<style>
@font-face {
  font-family: 'BrandFont';
  font-style: normal;
  src: url('https://s3.amazonaws.com/fonts/brand-font.ttf') format('truetype');
}
</style>
```
All font URLs must be publicly accessible. Private/authenticated URLs cause silent rendering failures.

### Font Loading in Abyssale
Fonts are managed at the workspace level. The `GET /fonts` API returns available font IDs. Font override at generation time:
```json
{
  "font": "6156872a-33c5-11ea-9877-92672c1b8195",
  "font_weight": 500
}
```
If the requested weight does not exist in the font, the nearest available weight is used.

### Cross-Platform Consistency
Lob's renderer is Webkit-based. Font rendering differs between:
- Safari (closest to Lob's output)
- Chrome/Firefox (different hinting, kerning)
- Design tools like InDesign (completely different rendering engine)
- Point sizes are NOT universal -- "11pt" in InDesign renders differently than "11pt" in Webkit

**Decision rule**: Always validate with Lob's proof generation API or a test print. Never trust browser preview alone. Safari preview is the most accurate for Lob rendering.

### Font Size for Print
- Minimum readable body text: 8pt (but uncomfortable below 10pt)
- Recommended body text: 11-14pt
- Headlines: 18-36pt depending on length
- Minimum for fine print/disclaimers: 6pt (legal minimum varies by jurisdiction)
- At 300 DPI: 1pt = 4.17px, so 10pt = ~42px, 14pt = ~58px

---

## 10. Template Variant Strategy

### How Many Variants?
Observed pattern across platforms:
| Platform | Template Approach |
|----------|------------------|
| Lob Template Gallery | ~20 pre-designed templates covering common industries (real estate, healthcare, retail, etc.) |
| Postalytics | Pre-built templates by use case (thank you, welcome, win-back, etc.) |
| PostcardMania | Industry-specific template sets (HVAC, dental, auto repair, etc.) |
| Poplar | Template per campaign type, customer designs their own |
| PCM Integrations | Custom designs per client or client-designed uploads |

### Industry-Based Matching (PostcardMania Pattern)
PostcardMania offers template sets organized by industry:
- Each industry gets 5-10 pre-designed options
- Designs use industry-appropriate imagery (e.g., technician for HVAC, kitchen for remodeling)
- Color schemes vary within each industry set
- The business selects from their industry's set and customizes with VDP

### Content-Based Variants (Observed Pattern)
Templates vary by content intent:
- **Acquisition**: Aggressive offer, social proof, urgency
- **Retention**: Thank you messaging, loyalty rewards
- **Win-back**: "We miss you" + incentive
- **Seasonal/Event**: Holiday-specific, weather-triggered
- **New mover**: Welcome to the neighborhood

### PostCanary Variant Strategy (Synthesized Decision)
PostCanary's constraint is different: ONE template must work for ANY home services business. This means the template itself is not industry-specific, but the variable data creates the industry-specific experience.

**Recommended approach: 3-5 layout variants, same variable data schema**
- Variant A: Photo-dominant front (hero image fills 60%+ of front)
- Variant B: Offer-dominant front (large offer text/badge, smaller photo)
- Variant C: Trust-dominant front (reviews/ratings prominent, moderate photo)
- All variants accept the same set of merge variables (business name, logo, phone, headline, offer, reviews, brand colors, hero photo)
- Template selection is either automatic (based on which assets the business provides) or manual (business/operator chooses)

**How many is enough**: Start with 2 (one photo-dominant, one offer-dominant). These cover the two highest-performing direct mail formats per industry data. Add variants only when data shows a segment performs better with a different layout.

---

## Decision Rules (Draft)

### Text Overflow
- IF business_name.length <= 20 THEN render at max font size (e.g., 32pt), single line
- IF business_name.length > 20 AND <= 35 THEN auto-resize down to 24pt minimum, single line
- IF business_name.length > 35 THEN auto-resize + allow 2-line wrap, floor at 20pt
- IF text still overflows at 20pt on 2 lines THEN truncate with ellipsis AND flag for manual review
- ALWAYS test with "AB" (2 chars) and "Johnson & Smith Professional HVAC Services LLC" (46 chars) during template development

### Logo Placement
- IF logo aspect_ratio between 0.75 and 1.33 THEN use square container (1in x 1in)
- IF logo aspect_ratio between 1.34 and 2.5 THEN use landscape container (2in x 0.75in)
- IF logo aspect_ratio between 2.51 and 4.0 THEN use wide container (2.5in x 0.6in)
- IF logo aspect_ratio > 4.0 OR < 0.75 THEN flag for manual review (extreme ratio)
- ALWAYS use `object-fit: contain` to preserve aspect ratio
- REQUIRE SVG or PNG at minimum 600px width

### Color Adaptation
- IF contrast_ratio(brand_color, white) >= 4.5 THEN use brand_color as background with white text
- IF contrast_ratio(brand_color, white) >= 3.0 AND < 4.5 THEN use brand_color as background with white bold text
- IF contrast_ratio(brand_color, white) < 3.0 THEN use brand_color as background with dark text (#1a1a1a)
- IF deltaE(brand_color, template_zone_color) < 15 THEN shift template_zone_color by at least 30 deltaE from brand_color
- ALWAYS use solid colors for print (no gradients with transparency)

### Photo Handling
- IF photo.shortest_dimension < 1500px THEN show quality warning
- IF photo.aspect_ratio != template_zone.aspect_ratio THEN crop with user-adjustable focal point
- ALWAYS strip EXIF orientation data before passing to renderer (Lob bug with non-zero EXIF)

### Font Selection
- IF business has Google Font match THEN load via `<link>` in template head
- IF business has custom font file THEN host on S3 and load via `@font-face`
- IF no font specified THEN use template default (pre-tested sans-serif)
- NEVER use OTF format with Lob (convert to TTF first)
- NEVER use Adobe Typekit fonts with Lob (cannot whitelist domain)

### Template Variant Selection
- IF business provides high-quality hero photo (>= 1500px shortest side) THEN default to photo-dominant variant
- IF business provides strong offer text but weak photo THEN default to offer-dominant variant
- IF business does not provide hero photo THEN use stock/generic industry imagery with offer-dominant variant
- ALWAYS allow manual override of variant selection

---

## Known Gaps

### Not Found in Research
1. **Lob 6x9" specific template dimensions**: Exact body, safe area, and ink-free zone pixel dimensions for 6x9" postcards (the examples found were 4x6"). Lob's "Mail piece design specs" page likely has these but was not scraped. Expected pattern: body = 9.25in x 6.25in, safe area = 8.875in x 5.875in based on the 0.1875in inset pattern.

2. **Lob Figma plugin specifics**: How the plugin handles merge variables, what design constraints it imposes, and whether it supports conditional logic. The plugin exists and is referenced in docs but detailed documentation was not found.

3. **Abyssale image layer fit modes**: Exact behavior for image scaling/cropping within containers (equivalent of `object-fit` in CSS). The text layer docs are comprehensive but image layer property docs were not fully captured.

4. **AI-based photo composition scoring**: No platform or tool was found that automatically evaluates whether a photo's composition works well within a specific template zone. This capability may need to be built or may not exist commercially.

5. **PostcardMania VDP guide PDF content**: The PDF at postcardmania.com/design-templates/personalized-postcards/postcardmania-variable_data_guide.pdf was found but not scraped. It likely contains InDesign-specific VDP setup instructions.

6. **Exact color deltaE calculation method**: Whether to use CIE76, CIE94, or CIEDE2000 for perceptual color difference. CIEDE2000 is the current standard but implementation details for brand color comparison were not found in VDP-specific literature.

7. **Print-specific contrast ratio adjustments**: How much to derate WCAG contrast ratios for print (paper absorption, ink spread, viewing distance). The 5:1 recommendation above is an educated estimate, not an industry-documented standard.

8. **Lob rendering engine JavaScript execution timing**: Lob warns that JavaScript "may not fully execute" before PDF generation but does not specify timeout thresholds or which JS features are supported/unsupported.

9. **Multi-brand template galleries**: Whether any platform offers a single template that dynamically adapts to completely different brands (PostCanary's exact use case). All platforms found treat templates as per-brand or per-campaign, not as universal white-label systems.

10. **PCM Integrations API documentation detail**: The API docs at docs.pcmintegrations.com were referenced but not scraped. Specific endpoint schemas, variable data field limits, and image upload specifications are unknown.
