# Coding Brief #7: Figma Postcard Plugin

> **Goal:** A Figma plugin that assembles print-ready 6×9" postcards from a morphological element catalog, parameterized for any client's brand. Demo: one HVAC template, one business, professional output.
>
> **Architecture:** Gerstner morphological box. Template = JSON selecting one component per parameter. Plugin reads template def + brand data → assembles card from component library.
>
> **Branch:** `feat/figma-plugin`
>
> **Expert panels:** `experts-design-panel.md` (9 experts), `experts-implementation-bridge.md`, `experts-template-pipeline.md`
>
> **Skill output:** After first template works, codify process into `/postcard-template-design` skill for reuse.

---

## Key Decision: 72 DPI Canvas

| Measurement | Value | Why |
|------------|-------|-----|
| Frame (with bleed) | 450 × 666 units | 6.25" × 9.25" |
| Trim | 432 × 648 units | 6.0" × 9.0" |
| Safe area | 423 × 639 units | 0.0625" inside trim all sides |
| Export scale | 4.1667x | → 1875 × 2775px at 300 DPI |
| Type at 36pt | 36 units | Intuitive — no conversion needed |

---

## Architecture: Morphological Assembly

```
template-definition.json          →  selects components per parameter
  +                                     ↓
brand-data.json (colors, logo,   →  Plugin assembles card:
  photo, name, phone, offer)         1. Grid (zones from template def)
  +                                  2. Color check (Albers validation)
component-library.fig             →  3. Populate zones (components + brand data)
  (pre-designed Figma components)    4. Validate (Gendusa + Heath)
                                     5. Output (complete branded postcard)
```

### Template Definition Format (JSON)

Each template selects one component per morphological parameter:

```json
{
  "name": "HAC-1000 HVAC",
  "layout": {
    "zones": 3,
    "orientation": "horizontal",
    "proportions": [63, 14, 23],
    "transitions": "hard-edge"
  },
  "hero": {
    "photo": "full-bleed",
    "overlay": "dark-gradient-bottom",
    "headline_position": "left",
    "headline_style": "multi-tier-mixed-color"
  },
  "offer": {
    "background": "solid-brand",
    "badge": "inline-mixed-weight",
    "price_format": "$X OFF",
    "urgency": "expiration-date"
  },
  "info": {
    "background": "dark-brand",
    "phone": "large-plain",
    "logo": "left",
    "trust": ["star-rating"],
    "qr": "right",
    "services": "pipe-separated"
  },
  "decorative": {
    "badges": [],
    "dividers": "none",
    "icons": ["phone"],
    "borders": "none"
  },
  "typography": {
    "headline_face": "condensed-black",
    "body_face": "geometric-sans",
    "price_treatment": "oversized-bold"
  }
}
```

### Brand Data Format (JSON)

```json
{
  "business_name": "Desert Diamond HVAC",
  "phone": "(623) 246-2377",
  "website": "desertdiamondhvac.com",
  "colors": {
    "primary": "#E53935",
    "secondary": "#0D2B4B",
    "accent": "#43A047"
  },
  "logo_url": "...",
  "photo_url": "...",
  "headline": "THE SUMMER\nHEAT IS HERE",
  "sub_headline": "—stay comfortable with a\nNEW A/C\nSYSTEM!",
  "offer": "$750 OFF",
  "offer_detail": "a full A/C system replacement",
  "offer_fine_print": "With this card. Offer expires 30 days from mail date.",
  "services": ["AC", "FURNACE", "REPAIR", "REPLACE", "MAINTENANCE"],
  "review": { "stars": 4.8, "count": 127, "quote": "Best service we've ever had!" },
  "cta": "Call today to schedule your service!"
}
```

---

## File Structure

```
figma-plugin/
  manifest.json
  package.json
  tsconfig.json
  src/
    code.ts                    — entry point + orchestrator
    types.ts                   — TemplateDefinition + BrandData interfaces
    constants.ts               — fixed measurements, baseline grid, element checklist
    grid.ts                    — frame + zone positioning (Brockmann)
    typography.ts              — font loading + tier presets (Spiekermann)
    color-check.ts             — brand×zone diagnostics (Albers)
    color-adapt.ts             — adjustment suggestions
    zones/
      hero.ts                  — photo + overlay + headline
      offer.ts                 — colored bar + offer content
      info.ts                  — dark bar + business info
      back.ts                  — card back (stretch)
    elements/
      badges.ts                — starburst, circle, ribbon, shield
      phone-display.ts         — plain, pill, icon+number
      dividers.ts              — straight, angled, wave
      icons.ts                 — phone, email, map-pin, etc.
      overlays.ts              — gradient, tint, pattern
      trust-signals.ts         — star rating, review quote
      qr-code.ts               — pre-generated QR image
      price-display.ts         — $X OFF, X%, value stack
    templates/
      hac-1000-hvac.json
    demo/
      desert-diamond.json
  code.js                      — esbuild output
```

---

## Build Order (10 tasks)

### Pre-Task 0: Environment
- Drake installs Figma desktop (%TEMP%\FigmaSetup.exe)
- Source HVAC stock photo from Pexels (subject right, sky left)
- Time: 15 min (Drake, manual)

### Task 1: Hello World + Font Verification (20 min)
manifest.json, src/code.ts (minimal). Creates rectangle + text. Verifies Oswald/Bebas Neue + Instrument Sans load. Logs available fonts.

### Task 2: Types + Constants + Color Check (45 min)
types.ts, constants.ts, color-check.ts. Interfaces, fixed measurements, Albers diagnostic engine. Test: feed demo brand colors → console logs pass/warn/fail per zone pair.

### Task 3: Grid Engine (30 min)
grid.ts. Reads TemplateDefinition → creates frame → zone rectangles at exact proportions → colors from BrandData. Test: 3 colored bands at 63/14/23.

### Task 4: Typography Engine (30 min)
typography.ts. Batch font loading. Functions per tier with correct size/weight/tracking/color. Test: 4 visually distinct text tiers.

### Task 5: Element Constructors (90 min)
All elements/*.ts files. Each exports parameterized constructor: createStarburst(text, color, size), createPhonePill(number, bg, text), createGradientOverlay(w, h, direction, opacity), createStarRating(stars, count), createPhoneIcon(color, size), createPriceTag(amount, format, color), createQRPlaceholder(size). Test: element gallery in Figma.

### Task 6: Hero Zone (45 min)
zones/hero.ts. Photo rect (z:bottom) → gradient overlay (z:middle) → headline stack (z:top). Position at left 8%. Test: readable headline on photo.

### Task 7: Offer Strip (30 min)
zones/offer.ts. Solid brand color rect → mixed-weight "$750 OFF" text → fine print at 85% opacity. Optional badge from elements. Test: price jumps out.

### Task 8: Info Bar (75 min)
zones/info.ts. Dark rect → services strip → logo (left) → CTA + phone + website + QR (right). Test: phone dominates right side.

### Task 9: Orchestrator (30 min)
code.ts (full), templates/hac-1000.json, demo/desert-diamond.json. Reads template + brand → color check → grid → zones → validate (Gendusa checklist + Heath score). Test: complete front, compare to HAC-1000.

### Task 10 (Stretch): Back + Skill (120 min)
zones/back.ts: USPS zone + content column. /postcard-template-design skill draft: morphological box, expert rules, construction methods, template format.

---

## Color Adaptation Flow

1. Extract brand colors from brand data
2. Per brand color × zone color pair: vanishing (ΔL*<15)? vibrating (complement+chroma>40)? WCAG (<4.5:1 body, <3:1 headline)?
3. FAIL → suggest adjustment. WARN → log, Drake decides.
4. After adjustments → re-check Bezold cascade
5. Output adjusted color map for zone builders

---

## Expert Encoding Map

| Expert | Module | Rules |
|--------|--------|-------|
| Gerstner | types.ts + architecture | Morphological box → template def → component assembly |
| Brockmann | grid.ts | Ratio zones, proportional margins, baseline grid |
| Spiekermann | typography.ts | 4-tier hierarchy, tracking, display vs text |
| Albers | color-check.ts | Vanishing/vibrating detection, Bezold, WCAG |
| Draplin | constants.ts + builders | cornerRadius=0, solid fills, bold, no shadows |
| Gendusa | code.ts validation | Element checklist |
| Whitman | zones/hero.ts | Z-pattern, headline left |
| Halbert | templates/*.json | AIDA, value stack, specific CTA |
| Caples | templates/*.json | Self-interest + news, specific numbers |
| Heath | code.ts scoring | SUCCESs dimensions |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Figma not installed | Drake runs installer manually |
| Complex shapes | createStar() + pre-designed components |
| Font names wrong | Task 1 verifies, we adapt |
| Brand colors clash | Color check before assembly (Task 2) |
| Time overrun | Tasks 1-7 are demo-critical; 8-10 stretch |

---

*Session 44, 2026-04-13. Approved: .planning/figma-plugin/APPROVED.md*
*Total: Tasks 1-9 ≈ 6-8 hours. Task 10 stretch ≈ +2 hours.*
