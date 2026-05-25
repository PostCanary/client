# Research: Pre-press and Print Production Pipeline (Figma → Print-Ready PDF)

**Date:** 2026-04-12
**Purpose:** Define the exact pipeline from Figma-designed postcards (RGB) to print-ready PDFs (CMYK, 300 DPI, bleed) for PostCanary's print partner (1 Vision).

**Sources:**
- [Figma for Print FAQs — Johannes Ippen](https://johannesippen.com/2025/figma-print-faq/) — Figma's print limitations, unit conversion, bleed workarounds
- [Printery Plugin — Print for Figma](https://print-for-figma.com/features/pdf-print) — CMYK conversion, ICC profiles, bleed/crop marks, PDF/X-1a export
- [Ghostscript Color Management — Artifex (v10.08.0)](https://ghostscript.readthedocs.io/en/latest/GhostscriptColorManagement.html) — ICC-based color conversion, command flags, PDF output limitations
- [ghostscript-pdf-rgb2cmyk — filipnet (GitHub)](https://github.com/filipnet/ghostscript-pdf-rgb2cmyk) — Production script wrapping Ghostscript for RGB→CMYK
- [PDF Preflight Checklist — Lob Help Center](https://help.lob.com/print-and-mail/designing-mail-creatives/creative-formatting/pdf-preflight-checklist) — Lob's PDF/X-1a requirements, font embedding, resolution, no printer marks
- [Lob 6x9 Postcard Template](https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/postcards/6x9_postcard.pdf) — Bleed/trim/safe zone dimensions
- [PDF/X-1a vs PDF/X-4 — Hybrid Helix](https://blog.hybridhelix.com/pdf-x-1a-vs-pdf-x-4-whats-the-difference-and-which-should-you-use-in-2025/) — Standard comparison
- [RGB vs CMYK — JukeboxPrint](https://www.jukeboxprint.com/blog/rgb-vs-cmyk-for-print) — Color shift analysis, compensation strategies
- [Oswald — Google Fonts](https://fonts.google.com/specimen/Oswald) — SIL OFL license verification
- [Instrument Sans — GitHub](https://github.com/Instrument/instrument-sans) — SIL OFL license verification

---

## 1. Figma Export Capabilities

**What Figma exports natively:**
- **Formats:** PNG, JPEG, SVG, PDF
- **Color mode:** RGB only. Figma supports RGB, Hex, HSL, HSB — no CMYK.
- **PDF export:** Creates a valid, printable PDF, but in RGB color space. No ICC profile embedding, no bleed, no crop marks.
- **Multi-page PDF:** File → Export frames to PDF exports all frames on a canvas left-to-right.
- **Font handling:** Fonts are embedded in PDF but NOT as fully editable fonts. To guarantee fidelity, flatten text to vector shapes (Cmd+E / Ctrl+E) before export.
- **Resolution:** Figma works in 72 DPI base. 1 inch = 72 pixels. For print-quality export, use Printery plugin or export at higher multiplier.

**Unit conversion for 6x9" postcard at 72 DPI:**

| Zone | Inches | Figma Pixels (72 DPI) |
|------|--------|-----------------------|
| Trim (final card) | 6" × 9" | 432 × 648 px |
| Bleed (0.125" each side) | 6.25" × 9.25" | 450 × 666 px |
| Safe area (0.125" inside trim) | 5.875" × 8.875" | 423 × 639 px |

**Key limitation:** Figma's native PDF is suitable for screen proofing. For commercial print production, use a print plugin (Printery) or post-process with Ghostscript.

---

## 2. RGB to CMYK Conversion

**Why it matters:** Print uses CMYK subtractive color mixing. Submitting RGB to a commercial printer causes color shifts or outright file rejection.

**Colors most affected by conversion:**

| Color Range | RGB→CMYK Shift | Severity |
|-------------|----------------|----------|
| Bright blues (high B value) | Turn dull/flat | HIGH — most dramatic shift |
| Vivid/neon greens | Shift to olive/muted | HIGH |
| Fluorescent colors | Lose all vibrancy | HIGH — outside CMYK gamut entirely |
| Bright reds | Lean orange | MEDIUM |
| Purples | Turn muddy/brown | MEDIUM |
| Warm neutrals, earthy tones | Minimal change | LOW |
| Blacks and dark grays | Minimal change (with proper K handling) | LOW |

**Screen vs print brightness:** Screens are 10-15% brighter than print output (RGB additive light vs CMYK subtractive ink). If a design looks "just right" on screen, it will appear muted in print. Design 10-15% louder/more saturated than the target print appearance.

**PostCanary-specific concern:** The HAC-1000 reference uses bright green (#43A047) for the offer strip and deep navy (#0D2B4B) for the info bar. Green is in the HIGH shift category — verify the CMYK equivalent renders acceptably in test prints.

---

## 3. ICC Color Profiles

**Standard profiles for US direct mail printing:**

| Profile | Use Case | Notes |
|---------|----------|-------|
| **GRACoL 2006** (Coated) | US commercial printing on coated stock | Lob's preferred profile. Recommended for PostCanary. |
| **US Web Coated (SWOP) v2** | US web offset printing | Most common US profile. Good default. |
| **GRACoL 2013** | Updated GRACoL for modern presses | Newer alternative, check if 1 Vision supports. |
| **FOGRA39** | European coated offset | NOT for US printing. |
| **ISO Coated v2** | International standard | European/international, not US standard. |

**Recommendation for PostCanary:** Use **GRACoL 2006** as primary profile (Lob's specification). Fall back to **US Web Coated SWOP v2** if 1 Vision specifies it. ASK 1 Vision during the April 20 demo call which profile they use.

**How ICC profiles work:** The profile maps RGB values to the nearest reproducible CMYK value for a specific paper/ink/press combination. Using the wrong profile shifts colors — right profile + right paper = predictable color.

---

## 4. Ghostscript Pipeline

### Basic RGB→CMYK Conversion

```bash
gs -dSAFER -dBATCH -dNOPAUSE -dNOCACHE \
   -sDEVICE=pdfwrite \
   -sColorConversionStrategy=CMYK \
   -dProcessColorModel=/DeviceCMYK \
   -sOutputFile=output_cmyk.pdf \
   input_rgb.pdf
```

### With ICC Profile (recommended for print)

```bash
gs -dSAFER -dBATCH -dNOPAUSE \
   -sDEVICE=pdfwrite \
   -r2400 \
   -dOverrideICC=true \
   -sOutputICCProfile=/path/to/GRACoL2006_Coated1v2.icc \
   -sColorConversionStrategy=CMYK \
   -dProcessColorModel=/DeviceCMYK \
   -dRenderIntent=3 \
   -sOutputFile=output_cmyk.pdf \
   input_rgb.pdf
```

### High-Quality Prepress (preserves image quality)

```bash
gs -dSAFER -dBATCH -dNOPAUSE \
   -sDEVICE=pdfwrite \
   -dPDFSETTINGS=/prepress \
   -dEncodeColorImages=false \
   -dEncodeGrayImages=false \
   -dEncodeMonoImages=false \
   -sColorConversionStrategy=CMYK \
   -dProcessColorModel=/DeviceCMYK \
   -sOutputICCProfile=/path/to/GRACoL2006_Coated1v2.icc \
   -sOutputFile=output_cmyk.pdf \
   input_rgb.pdf
```

### Flag Reference

| Flag | Purpose |
|------|---------|
| `-sDEVICE=pdfwrite` | Output format: PDF |
| `-sColorConversionStrategy=CMYK` | Convert all colors to CMYK color space |
| `-dProcessColorModel=/DeviceCMYK` | Process using DeviceCMYK model |
| `-sOutputICCProfile=path` | ICC profile for color conversion accuracy |
| `-dOverrideICC=true` | Override any embedded ICC profiles in input |
| `-dRenderIntent=3` | Absolute colorimetric rendering (most accurate) |
| `-dPDFSETTINGS=/prepress` | High-quality prepress output (300 DPI images, no downsampling) |
| `-dEncodeColorImages=false` | Preserve original image encoding (prevents recompression) |
| `-r2400` | Rendering resolution for vector rasterization |
| `-dNOCACHE` | Disable glyph caching (prevents font rendering artifacts) |
| `-dSAFER` | Sandboxes file system access |
| `-dBATCH -dNOPAUSE` | Non-interactive batch mode |

### Known Gotchas

- **Rich black problem:** RGB black (#000000) can convert to "rich black" in CMYK (C:75 M:68 Y:67 K:90) instead of pure K:100. This uses excess ink and causes registration issues. Fix: add `-dBlackPtComp=1` or pre-process blacks. (Source: [Ghostscript Bug 698723](https://gs-bugs.ghostscript.narkive.com/XJlIZEO4/bug-698723-ghostscript-convert-rgb-pdf-to-cmyk-with-icc-profile-yields-wrong-black))
- **PDF output limitations:** Ghostscript PDF output supports only a subset of color management options — you can set the default input profile and output profile, but black generation (UCR/GCR) control is limited compared to InDesign or Acrobat.
- **Transparency:** Ghostscript flattens transparency during conversion, which is actually desired for PDF/X-1a compliance.
- **Performance:** A single-page 6x9" postcard converts in under 2 seconds. Batch processing of 100+ postcards is feasible without concurrency concerns.

---

## 5. Bleed, Trim, and Safe Zones (6x9" Postcard)

```
┌───────────────────────────────────────┐
│            BLEED (0.125")             │
│  ┌─────────────────────────────────┐  │
│  │          TRIM (cut here)        │  │
│  │  ┌───────────────────────────┐  │  │
│  │  │       SAFE AREA           │  │  │
│  │  │   (all text/logos here)   │  │  │
│  │  │                           │  │  │
│  │  │     5.875" × 8.875"       │  │  │
│  │  │                           │  │  │
│  │  └───────────────────────────┘  │  │
│  │         6" × 9"                 │  │
│  └─────────────────────────────────┘  │
│           6.25" × 9.25"              │
└───────────────────────────────────────┘
```

| Zone | Width | Height | Purpose |
|------|-------|--------|---------|
| **Bleed** (document size) | 6.25" | 9.25" | Extends colors/images past trim to prevent white edges |
| **Trim** (final card) | 6.0" | 9.0" | Where the card is physically cut |
| **Safe area** | 5.875" | 8.875" | All text, logos, phone numbers, QR codes stay inside this |

**Bleed standard:** 0.125" (1/8") on all four sides. This is universal for US commercial printing.

**How to set up in Figma:** Create the artboard at bleed size (450×666 px at 72 DPI, or 1875×2775 px at 300 DPI). Extend all background colors/images to fill the full bleed area. Keep all text/logos inside the safe area (0.25" = 18px from edge at 72 DPI).

**Print partner expectations:** Most commercial printers (including Lob) expect the submitted file to include bleed — the full 6.25×9.25" artwork. The printer trims to 6×9".

---

## 6. Crop Marks and Registration Marks

**For Lob:** Do NOT include crop marks, trim marks, bleed marks, slug lines, registration marks, or color bars. Lob treats all content as part of the design. Their production facilities add marks during processing. (Source: [Lob Preflight Checklist](https://help.lob.com/print-and-mail/designing-mail-creatives/creative-formatting/pdf-preflight-checklist))

**For other printers (1 Vision):** ASK the print partner. Many modern digital printers add their own marks. Some commercial printers still expect them. Default to NO marks unless specifically requested.

**If marks are needed:** Ghostscript does not add crop marks natively. Use Printery plugin (adds them automatically) or compose marks manually in the PDF.

---

## 7. Font Embedding

**PostCanary fonts:**
- **Oswald** (headlines, condensed): SIL Open Font License 1.1. Free for commercial use including print. Embedding permitted. (Source: [Google Fonts](https://fonts.google.com/specimen/Oswald))
- **Instrument Sans** (body, app): SIL Open Font License 1.1. Same permissions. (Source: [GitHub](https://github.com/Instrument/instrument-sans))

**No licensing issues for commercial print production.** Both fonts can be embedded in PDFs and used in printed postcards without restriction.

**Figma font embedding behavior:** Figma embeds fonts in PDF export, but NOT as fully editable embedded fonts. The safest approach for print fidelity:
1. **Preferred:** Flatten text to vector outlines (Cmd+E) before export. Guarantees exact rendering regardless of font availability.
2. **Alternative:** Use Printery plugin which handles font embedding properly during PDF/X-1a export.
3. **If using Ghostscript pipeline:** The PDF from Figma will have embedded font subsets. Ghostscript preserves them during CMYK conversion.

---

## 8. PDF/X Standards

| Standard | Color | Transparency | Compatibility | Use Case |
|----------|-------|-------------|---------------|----------|
| **PDF/X-1a** | CMYK only | Flattened (required) | Universal — works with all printers | Direct mail, Lob, legacy workflows |
| **PDF/X-4** | CMYK + ICC-based | Preserved (live) | Modern digital presses | Modern workflows with ICC management |

**Recommendation for PostCanary:** Use **PDF/X-1a**.
- Lob explicitly requires PDF/X-1a (Coated GRACoL 2006).
- Maximum compatibility with any print partner including 1 Vision.
- Forced flattening eliminates transparency-related print issues.
- More constrained = fewer surprises in production.

**When to use PDF/X-4:** Only if the print partner specifically supports and prefers it. PDF/X-4 preserves live transparency and supports ICC-based color spaces, resulting in smaller files and better quality for complex designs with gradients and blending modes.

---

## 9. Resolution / DPI

| DPI | Quality | Use Case |
|-----|---------|----------|
| **300 DPI** | Standard commercial print quality | All direct mail postcards. Required by Lob. |
| **200-299 DPI** | Acceptable for large-format or viewed at distance | NOT acceptable for postcards (viewed at arm's length) |
| **Below 200 DPI** | Visible pixelation at arm's length | Reject the image — find higher resolution source |
| **Above 300 DPI** | Diminishing returns, larger file size | Acceptable but watch file size (Lob limit: 5MB) |

**For 6x9" postcard at 300 DPI:**
- Required image resolution: 1800 × 2700 pixels minimum (for full-bleed coverage)
- With bleed (6.25×9.25"): 1875 × 2775 pixels

**Figma DPI handling:** Figma works at 72 DPI base. To export at 300 DPI for print:
- Use Printery plugin (handles DPI conversion), OR
- Export at 4x multiplier (72 × 4.17 ≈ 300 DPI), OR
- Create the Figma frame at 300 DPI dimensions directly (1875 × 2775 px for 6.25×9.25" with bleed)

**Printery's DPI verification:** The plugin checks all raster images in the design meet 300 DPI threshold and warns if any images are below resolution. Use this check before export.

---

## 10. Screen-to-Print Color Shift

**The fundamental gap:** Screens emit light (RGB additive), print absorbs light (CMYK subtractive). Every color appears duller, less saturated, and slightly darker in print than on screen.

**Compensation strategy for PostCanary:**
- Design with colors 10-15% more saturated than the desired print output
- For the HAC-1000 offer strip green (#43A047): verify the CMYK equivalent (approximately C:70 M:0 Y:85 K:0) renders bright enough on coated stock
- For deep navy (#0D2B4B): dark colors convert well — minimal shift expected
- For red headlines (#E53935): reds shift toward orange — test print to verify

**Practical approach:** Design in RGB in Figma (it's the only option). Use Printery's CMYK preview to check appearance before committing to print. Order a small test print before any large campaign.

---

## 11. Print-Ready PDF Validation Checklist

Based on Lob's preflight requirements (applicable to most commercial printers):

- [ ] **PDF/X-1a compliant** — use Printery export or Acrobat Preflight → Convert to PDF/X-1a (Coated GRACoL 2006)
- [ ] **CMYK color space** — no RGB, no spot colors unless specifically requested. SWOP v2 or GRACoL 2006 profile.
- [ ] **Transparency flattened** — PDF/X-1a requires this. Printery and Ghostscript both flatten automatically.
- [ ] **Single layer** — no hidden layers, no layer groups. Flatten all layers.
- [ ] **Fonts embedded or outlined** — all fonts fully embedded or converted to vector outlines. No missing/substituted fonts.
- [ ] **Images at 300 DPI** — all raster images meet 300 PPI at final print size.
- [ ] **Correct dimensions** — 6.25" × 9.25" (with bleed) or exactly as print partner specifies.
- [ ] **No printer marks** — no crop marks, registration marks, color bars (Lob adds their own; verify with 1 Vision).
- [ ] **Page boxes consistent** — ArtBox, CropBox, TrimBox, MediaBox all the same size.
- [ ] **File size under 5MB** — Lob's limit. Compress images if needed. Most single-page postcards are well under this.
- [ ] **Content within safe area** — all text, logos, phone numbers, QR codes at least 0.125" inside the trim edge.

**Validation tools:**
- **Printery plugin:** DPI verification built-in, warns about low-res images
- **Adobe Acrobat Pro:** Preflight tool with PDF/X-1a profile — comprehensive check
- **freetoolonline.com/preflight-pdf:** Free online preflight check for basic validation
- **mailpro.org/tools/file-check:** Free PDF preflight specifically for direct mail

---

## 12. Pipeline Comparison

| Pipeline | CMYK? | Bleed? | Automated? | Complexity | Best For |
|----------|-------|--------|------------|------------|----------|
| **Figma → Printery Plugin → PDF** | Yes (ICC) | Yes | Manual (UI) | LOW | Demo, one-off designs |
| **Figma → RGB PDF → Ghostscript → CMYK PDF** | Yes (ICC) | Must add manually | Fully scriptable | MEDIUM | Production automation |
| **Figma Plugin API → Export PNG 300 DPI → Ghostscript → PDF** | Yes (ICC) | Bake into design | Fully scriptable | MEDIUM-HIGH | Variable data at scale |
| **Figma → Playwright (HTML render) → Ghostscript** | Yes (ICC) | Set in HTML/CSS | Fully scriptable | HIGH | Bypass Figma for rendering |
| **Figma → Abyssale API** | Native CMYK | Native | Fully scriptable | LOW-MEDIUM | Outsourced rendering |
| **PrinceXML (HTML → PDF)** | Native CMYK in CSS | CSS @page rules | Fully scriptable | MEDIUM | If we go HTML template route |

---

## Recommended Pipeline for PostCanary

### Demo (April 20) — Manual Path
1. Design postcard in Figma (via custom plugin or manual design)
2. Export using **Printery plugin** → CMYK PDF with ICC profile (GRACoL 2006), bleed, 300 DPI
3. Validate with Acrobat Preflight or online tool
4. Deliver to 1 Vision for print test

### Production — Automated Path
1. **Figma Plugin** creates personalized postcard design (variable data injected)
2. **Figma REST API** exports the frame as PNG at 4x resolution (≈300 DPI)
3. **Ghostscript** converts PNG to CMYK PDF with embedded ICC profile:
   ```bash
   gs -dSAFER -dBATCH -dNOPAUSE \
      -sDEVICE=pdfwrite \
      -dPDFSETTINGS=/prepress \
      -sOutputICCProfile=/path/to/GRACoL2006_Coated1v2.icc \
      -sColorConversionStrategy=CMYK \
      -dProcessColorModel=/DeviceCMYK \
      -sOutputFile=postcard_cmyk.pdf \
      postcard_rgb.pdf
   ```
4. **Automated preflight** validates: CMYK mode, 300 DPI, correct dimensions, fonts embedded
5. Deliver to print partner API (Lob or 1 Vision)

### Questions for 1 Vision (April 20 demo call)
- Which ICC profile do you use? (GRACoL 2006? SWOP v2?)
- Do you accept PDF/X-1a or prefer PDF/X-4?
- Do you want crop marks included or do you add your own?
- What is your maximum file size per postcard?
- Do you accept PDF or need another format?
- §202.5.3 IMb placement — do you support in-block barcode? (from USPS research)

---

## Decision Rules (draft)

### Export & Color
- If exporting from Figma for print production, use Printery plugin or Ghostscript post-processing. Native Figma PDF is RGB only and will cause color shifts at the printer.
- If choosing an ICC profile for US direct mail, use GRACoL 2006 (Coated) as default. Fall back to US Web Coated SWOP v2 if the printer specifies it.
- If a design color is bright blue, vivid green, or neon — verify the CMYK equivalent before committing. These shift the most during conversion. Pull a test print.

### Dimensions & Bleed
- If creating a 6x9" postcard in Figma, set the artboard to 450×666 px (72 DPI) or 1875×2775 px (300 DPI) to include 0.125" bleed on all sides.
- If placing text, logos, phone numbers, or QR codes, keep them inside the safe area: at least 0.125" (9 px at 72 DPI) inside the trim edge on all sides.
- If the background color or image should extend to the card edge, extend it to fill the full bleed area. The printer trims 0.125" from each side.

### Fonts
- If using Oswald or Instrument Sans for print postcards, no licensing concern — both are SIL OFL, free for commercial print including embedding.
- If guaranteeing exact font rendering in the final PDF, flatten text to vector outlines in Figma (Cmd+E) before export. This eliminates font substitution risk.

### Resolution
- If an image will be used in the postcard, verify it is at least 1800×2700 pixels (300 DPI at 6×9"). Below 200 DPI produces visible pixelation at arm's length — reject the image.
- If file size exceeds 5MB after CMYK conversion, compress images using Ghostscript's `-dPDFSETTINGS=/prepress` (preserves quality while optimizing file size).

### PDF Standard
- If submitting to Lob, use PDF/X-1a (Coated GRACoL 2006). This is their explicit requirement.
- If submitting to 1 Vision or another printer, ask which standard they require. Default to PDF/X-1a for maximum compatibility.
- If the printer rejects the file, check (in order): CMYK mode, font embedding, transparency flattening, dimensions, DPI.

### Printer Marks
- If submitting to Lob, include NO crop marks or printer marks. Lob adds their own and treats any marks as part of the design.
- If submitting to another printer, ask first. Default to NO marks unless they specifically request them.

### Black Handling
- If the design uses black text or elements, verify Ghostscript converts to pure K:100 (not rich black C:75 M:68 Y:67 K:90). Rich black uses excess ink and causes registration issues on thin text. Add `-dBlackPtComp=1` to the Ghostscript command if needed.

---

## Known Gaps

1. **1 Vision's specific requirements** — unknown until the April 20 demo call. ICC profile, PDF standard, crop mark preference, file format, max file size.
2. **Ghostscript black handling** — the rich black problem is documented but the exact `-dBlackPtComp` flag behavior varies across Ghostscript versions. Test with PostCanary's specific color palette.
3. **Automated preflight** — no free command-line tool for PDF/X-1a validation identified. Adobe Acrobat Pro is the standard but requires a license and GUI. Investigate: `pdfcpu` (Go), `verapdf` (Java), or Ghostscript's built-in preflight capabilities.
4. **Printery plugin programmatic access** — unclear if Printery can be triggered from a custom Figma plugin. If not, the automated pipeline must bypass Printery and use Ghostscript directly.
5. **Color proof accuracy** — how to show Drake an on-screen preview that approximates CMYK appearance without access to a calibrated monitor. Soft-proofing tools exist in Photoshop/Acrobat but not in Figma.

---

*Researched: 2026-04-12 Session 43*
*Method: Direct research — WebSearch (6 queries) + Firecrawl scrapes (4 sources) + synthesis*
*Depth: Read depth — primary documentation + practitioner blogs + industry references*
