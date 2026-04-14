# Figma Template Rebalance Inventory — HAC-1000 Front @ 6×9

**Purpose:** Post-stretch assessment of the Figma template after Session 47's mechanical resize from 799×564 → 1200×800. Per `/postcard-design` skill iron law: no Figma edits without signed-off inventory.

**File:** `Dn4IQuj2hPdRe4NTSn3cxh`
**Main frame:** `1:2` — `HAC-1000 Front — {{template}}` at 1200×800 ✓
**Aspect:** 1.500 (6×9 landscape) ✓
**Stretch scale:** X=1.502, Y=1.418 — NON-uniform (this is the source of all damage)

## Overall verdict (from rendered screenshot)

**The layout held up better than the metadata suggested.** The 6×9 landscape (wider) actually suits the three-zone composition well. Colors, fonts, nested offer strip, diagonal cut, photo — all intact. Most issues are math-level aspect-ratio damage on small elements, not layout failures.

## Zone Boundaries (current state)

| Zone | Y Start | Y End | Height | % of card | Status |
|------|---------|-------|--------|-----------|--------|
| Top (headlines + photo) | 0 | 499 | 499px | 62% | OK, proportional |
| Offer strip OUTER | 499 | 620 | 121px | 15% | OK |
| Offer strip INNER (dark) | 517 | 601 | 84px | 10.5% | OK, inset preserved |
| Bottom info (lime green) | 624 | 800 | 176px | 22% | OK |

Note: small y=499→624 overlap: the offer strip OUTER ends at y=620 but the bottom info starts at y=624 — 4px gap visible as lime-green sliver. Minor, likely intentional transition.

## Colors — all intact ✓

| Element | Hex | Sampled from design context |
|---------|-----|------------------------------|
| Red headline | `#dc3228` | ✓ |
| Bright sky blue headline | `#3caad7` | ✓ |
| Offer strip outer | `#4dacd8` | ✓ |
| Offer strip inner (dark blue) | `#006db2` | ✓ with dashed white 2px border ✓ |
| Bottom lime green | `#a5cf47` | ✓ |
| Dark green (QR border) | `#1a4d0d` | ✓ |
| Business name text | `#323232` | ✓ |
| Bridge text "stay comfortable" | `#0d2b4b` | ✓ |

## Fonts — all intact ✓

| Element | Font | Weight | Size | Status |
|---------|------|--------|------|--------|
| "THE SUMMER / HEAT IS HERE" | Oswald | Bold | 78pt | ✓ |
| "NEW A/C / SYSTEM!" | Oswald | Bold | 81pt | ✓ (leading-[70px]) |
| "stay comfortable with a" | Instrument Sans | Regular | 21pt | ✓ |
| "$750 OFF" | Instrument Sans | Bold | 48pt | ✓ |
| "Get" / "a full A/C system replacement" | Instrument Sans | Regular | 39pt | ✓ |
| "1-800-628-1804" | Oswald | Bold | 66pt | ✓ |
| "Call today to schedule your service!" | Instrument Sans | Bold | 24pt | ✓ |
| "ABC" (business name placeholder) | Bebas Neue | Regular | 42pt | ✓ |
| "HEATING &" / "AIR" | Instrument Sans | Bold | 21pt | ✓ |
| "SCAN HERE" | Oswald | Bold | 24pt | ✓ |
| URL | Instrument Sans | Regular | 19.5pt | ✓ |
| Fine print | Instrument Sans | Regular | 16.5pt | ✓ |

## Variable Layer Names — all intact ✓

All 20+ layers still carry `{{variable}}` prefixes. Pipeline injection schema survived.

## Issues detected

### A. Aspect-ratio damage on should-be-square elements
| Element | Current | Should be | Fix |
|---------|---------|-----------|-----|
| `{{qr_code}}` | 129.16 × 121.99 | Square (129×129 or 122×122) | Pick one dim, match the other |
| `{{logo}}` | 72.09 × 68.09 | Likely square (icon slot) | 72×72 or 68×68 |
| `{{phone_icon}}` | 42.05 × 39.72 | Likely square (icon slot) | 42×42 or 40×40 |

### B. Frame-edge misalignment (−1px offsets)
The mechanical stretch left multiple elements at `x=-1` or `y=-1` instead of `x=0` / `y=0`:
- `{{photo}}` top=−1
- `{{text_zone}}` left=−1, top=−1
- `{{offer_strip_bg}}` left=−1
- `offer-strip-inner-dark` left=−1
- `{{info_bg}}` left=−1
- `{{logo_panel_bg}}` left=−1

Invisible in render (clipped by frame) but should be zeroed for clean export.

### C. Headline bounding-box overlap (cosmetic, not visible)
- Line 1 "THE SUMMER" y=33-143 (h=109)
- Line 2 "HEAT IS HERE" y=127-236 (h=109)
- Bounding boxes overlap 15px. Glyphs don't visibly overlap in render (text has extra leading in its box). Low priority.
- Lines 5/6 "NEW A/C"/"SYSTEM!" have `leading-[70px]` which compresses them intentionally — they look fine.

### D. Offer strip text width feels over-stretched (maybe)
- "Get" bounding box 67px at left=173
- "$750 OFF" bounding box 222px at left=253
- "a full A/C system replacement" bounding box 537px at left=487
- Total run x=173 → x=1024 on a 1200-wide strip (right margin 176px, left margin 173px — centered ✓)
- Readable in render. No fix needed unless Drake disagrees.

### E. 4px sliver between offer strip and bottom info
- Offer strip outer ends y=620
- Bottom info starts y=624
- 4px gap showing lime green. Minor. Maybe intentional transition band, maybe stretch artifact.

## Non-issues (verified OK)

- Diagonal cut between text zone and photo zone — survived, looks correct
- Nested offer strip structure (outer + inner with dashed border) — intact
- Photo content (real HVAC photo from Session 46) — rendered correctly
- SCAN HERE positioned below QR code (not rotated beside it) ✓ per gotcha #11
- Bottom info panel split: white logo panel left (486px wide) + lime green middle + QR right ✓
- Text colors ✓

## Proposed rebalance — TWO options

### Option 1: Minimum math fixes (autonomous, ~15 min)
Single `use_figma` batch:
1. Square-ify QR code (pick 129 or 122, apply both dims)
2. Square-ify logo placeholder (pick 72 or 68)
3. Square-ify phone icon (pick 42 or 40)
4. Zero all the −1 offsets
5. Remove/keep 4px sliver at y=620-624 (Drake's call)

Non-judgment math fixes only. Layout unchanged.

### Option 2: Full visual rebalance (Drake in Figma, ~?? min)
Drake's eye, Drake's call. What MIGHT warrant rebalance at 6×9 vs 4.25×6:
- Headlines could grow — 6×9 gives more horizontal room; "THE SUMMER" at 78pt might feel small
- Photo zone could be widened (currently 689px of 1200 = 57%)
- Offer strip proportions might want to shrink (currently 15% of height)
- Bottom info panel has a lot of horizontal real estate — could rebalance logo/CTA/QR widths

None of these are obviously broken. They're judgment calls.

## My recommendation

**Do Option 1 (math fixes) autonomously. Present updated screenshot to Drake. He decides if Option 2 is needed.**

Reasoning:
- The screenshot looks demo-ready. Don't invent problems.
- Option 1 is purely reversing stretch damage — no design choices.
- Option 2 needs Drake's eye on live Figma, not my blind coordinate guessing (Session 45 lesson).
- If Drake greenlights the screenshot as-is post-math-fixes, we move to Spike 4 and the rest of the pipeline. Freeze date 2026-04-16 holds.

**Drake signoff on this inventory + path forward:** ___________
