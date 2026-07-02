# USPS DMM Clear Zone Research — 9x6 Landscape Postcard

**Task:** Measure USPS clear zone requirements for a 9" wide x 6" tall Marketing Mail postcard so PostcardBack.vue can reclaim horizontal space.
**Date:** 2026-04-09
**Researcher:** Claude (Opus 4.6, 1M)
**Confidence:** HIGH on DMM numbers (direct from DMM 202, updated 11-3-25 / 1-18-26). MEDIUM on final recommended column split — triangulated from 3 independent professional mailers (Lob, LettrLabs, PrintingForLess) but our print partner should confirm against their specific press tolerances before the 2026-04-20 demo.

---

## 1. Summary — Recommended Column Split

**Reclaim approximately 1.25 inches of horizontal space from the right column.** The DMM does NOT require the full right 4.25" to be USPS-reserved. The only hard horizontal lock is the barcode clear zone (**4.75" wide x 0.625" tall**, bottom-right only) and the indicia (~1.5" square, top-right only). The address block itself is industry-standard **4.0" W x 2.375" H** (Lob spec) sitting in the middle-right. Above the address block AND to the left of the barcode zone, there is reclaimable real estate.

**Recommended new tokens for `print-scale.css`:**
```css
--pc-content-col-w:  5.5in;    /* was 4.25in */
--pc-usps-col-w:     3.0in;    /* was 4.25in */
--pc-usps-address-h: 2.625in;  /* NEW — address block is only ~2.6in tall */
--pc-usps-barcode-h: 0.625in;  /* NEW — barcode clear zone from bottom */
```

This gives content 5.5" (+1.25") while keeping the USPS zone at 3.0" wide, which fully covers the 0.5" right-margin-of-OCR-area + 2.5" for address lines and indicia. The area **above** the address block (top-right ~1.5" of vertical space for indicia) and **below-left** the address block (bottom strip to the left of the 4.75" barcode clear zone) becomes available for trust badges / secondary content if the brief calls for it.

---

## 2. DMM 201/202 Citations (Authoritative, direct from pe.usps.com)

All sections cited from **Domestic Mail Manual, updated 11-3-25 and 1-18-26**, pe.usps.com/text/dmm300/202.htm and pe.usps.com/cpim/ftp/manuals/dmm300/202.pdf.

### §201 — Physical Standards (Commercial Letters and Cards)
- Postcards / cards must be **rectangular, four square corners, parallel opposite sides**.
- Aspect ratio (length / height) must be **1.3–2.5** inclusive. A 9"×6" card = 1.5 ratio. PASS.
- Minimum: 3.5" × 5" × 0.007" thick.
- Maximum letter-size (Marketing Mail letter rate): 6.125" × 11.5" × 0.25". A 9×6 postcard **qualifies as a letter-size mailpiece** at Marketing Mail letter rates. This is critical — all §202 letter-size rules apply.
- Cards > 4.25" × 6" must be **min 0.009" thick**.

### §202.1.1 — Clear Space
"A clear space must be available on all mail for the address, postage (permit imprint, postage stamp, or meter stamp), postmarks, and postal endorsements." (general; specifics follow).

### §202.2.1 — OCR Read Area (Address Placement for Letter-Size)
The **recommended** address placement is within the OCR read area, defined as:
- **Left:** 0.5" (½") from the left edge of the piece.
- **Right:** 0.5" (½") from the right edge of the piece.
- **Top:** 2.75" (2-¾") from the bottom edge of the piece.
- **Bottom:** 0.625" (⅝") from the bottom edge of the piece.

**KEY INSIGHT:** The OCR read area is **8 inches wide** on a 9" card (9 − 0.5 − 0.5 = 8.0). The address can legally sit anywhere in this 8"×2.125" box — it does NOT have to hug the right edge. The "put the address on the right side" convention is an industry best practice (makes automation easier) but is not a DMM requirement.

### §202.5.1.1 — Barcode Clear Zone (the only hard lock)
> "The barcode clear zone is a rectangular area in the lower right corner of the address side of cards and letter-size pieces defined by these boundaries:
> a. **Left: 4-3/4 inches from the right edge of the piece.**
> b. **Right: right edge of the piece.**
> c. **Top: 5/8 inch from the bottom edge of the piece.**
> d. **Bottom: bottom edge of the piece.**"

So the barcode clear zone is **4.75" wide x 0.625" tall**, in the lower-right. Drake's instinct (4.75 × 0.625) was exactly right.

"Each reference to letter or letter-size piece in 5.0 includes both letters and postcards." (§202.5.1.1 preamble — same rules apply to 9×6 postcards).

### §202.5.1.3 — Barcode Read Area (tighter sub-area inside the clear zone)
If the IMb is printed directly on the piece (our case), the bars must fall inside:
- **Horizontal:** leftmost bar between 3.5" and 4.25" from right edge (barcode itself is <1" wide).
- **Vertical:** bars between 3/16" (0.1875") and 0.5" from the bottom edge.

This means only a ~1" × 0.5" sub-strip inside the 4.75"×0.625" clear zone actually holds ink. The rest of the clear zone must be ink-free to ensure reflectance, but nothing requires it to be absent of a background color block — it just must stay ink-free for readable print contrast.

### §202.5.3 — Barcode in Address Block (alternative location — if we wanted it)
If we put the IMb inside the address block instead of the clear zone:
- Rightmost bar ≥ 0.5" from right edge.
- Leftmost bar < 10.5" from right edge AND ≥ 0.5" from left edge.
- Top of bars < 4" from bottom edge.
- Bottom of address block ≥ 0.625" from bottom edge.
- Min 0.125" clearance left/right of barcode.
- Min 0.028" between barcode and info lines.

This is an alternative — allows skipping the bottom-right clear zone entirely. We won't use it (our print partner will print the IMb in the standard lower-right) but noting it exists because it's what Lob does for tighter layouts.

### §202.3 — Permit Imprint Indicia Placement
Permit indicia must:
- Be placed in the **upper right corner** of the address side.
- Be at minimum **0.5" high × 0.5" wide** (DMM minimum).
- Content positioned **no more than 1.5"** below or left of the upper-right corner.
- Have **0.375" (3/8")** clear space around it.

Effective reserved region: ~**1.5" × 1.5" upper-right corner**. Not a full column — a corner box.

### §202.8 — FIM Clear Zone (NOT applicable to us)
Only required if using Facing Identification Marks (reply mail). The FIM clear zone is 3"–1.75" from right edge × 0.625" from top. **We are not sending reply mail; this does not apply to standard marketing postcards.** Noted here so we don't accidentally reserve space for something we don't need.

### §202.1.2 — Return Address
- Return address is **recommended, not required** on cards.
- If used, it must be placed in the **upper-left corner** of the address side, or above the delivery address.
- No DMM-specified size (must just be legible, generally 6pt+ by convention).
- For presorted Marketing Mail, return address is effectively required by the permit holder's business rules but not by §202 physical standards.

---

## 3. Measured Clear Zones — 9"×6" Landscape Card

```
                              9.0 inches wide
    ┌───────────────────────────────────────────────────────────┐
    │ 0.125" bleed                                               │ ▲
    │  ┌─────────────────────────────────────────────────────┐   │ │
    │  │ 0.25" safe inset                                    │   │ │
    │  │                                              ┌────┐ │   │ │
    │  │                                              │PMT │ │   │ │  1.5"
    │  │                                              │1.5×│ │   │ │  indicia
    │  │                                              │1.5"│ │   │ │  reserved
    │  │                                              └────┘ │   │ │  top-right
    │  │                                                     │   │ ▼
    │  │   USABLE CONTENT ZONE                               │   │
    │  │   (reclaimable — 5.5" wide)      ┌───────────────┐  │   │
    │  │                                  │ ADDRESS BLOCK │  │   │
    │  │                                  │ 4.0" × 2.625" │  │   │
    │  │                                  │ (Lob spec)    │  │   │  6.0"
    │  │                                  │               │  │   │  tall
    │  │                                  │ [return addr] │  │   │
    │  │                                  │ [name]        │  │   │
    │  │                                  │ [street]      │  │   │
    │  │                                  │ [city,ST zip] │  │   │
    │  │                                  └───────────────┘  │   │
    │  │                                                     │   │
    │  │ ├────── reclaimable ──────┤├─── barcode clear zone ─┤   │
    │  │                            │     4.75" × 0.625"     │   │
    │  │                            │  [||||||| IMb |||||||] │   │
    │  └─────────────────────────────────────────────────────┘   │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
       0.5"             safe zone 8.5 × 5.5             0.5"
```

**Answers to the specific measurements requested:**

| Question | Answer | DMM Cite |
|---|---|---|
| Recipient address block min dimensions | DMM has NO minimum size; industry standard is 4.0" W × 2.375" H (Lob) to 4.1" W × 2.62" H (LettrLabs) | §202.2.1 sets the containing OCR box, not the block itself |
| Recipient address block required position | Must fall inside OCR read area (0.5" from L/R, 2.75"–0.625" from bottom). Does NOT have to be right-aligned. | §202.2.1 |
| IMb clear zone dimensions | **4.75" × 0.625", bottom-right corner, extends to piece edge** | §202.5.1.1 |
| Permit indicia min size | 0.5" × 0.5", within 1.5" of upper-right corner, 0.375" clearance | §202.3 |
| Return address position | Upper-left OR above delivery address. Recommended not required. | §202.1.2 |
| "No print" zones | Only the 4.75"×0.625" barcode clear zone AND 0.125" around indicia. Address block area needs ink-free background but is NOT a no-print zone (content below/above is fine as long as OCR can read the address). | §202.5, §202.3 |
| How much of the right side is ACTUALLY reserved? | Horizontally: only the bottom 0.625" strip is 4.75" wide reserved. The address block is only ~4.0" wide. Vertically: address block is ~2.625" tall, sitting roughly 0.625"–3.25" from bottom. | §202.5.1.1, Lob spec |
| How far up does barcode zone extend? | **Only 0.625" from bottom edge.** Above that, no restriction. | §202.5.1.1 |
| Min gap between address block and barcode zone? | DMM min: 5/8" from bottom for address block bottom line. In practice: if address block bottom = 0.75" from piece bottom, gap between address block and barcode zone top = 0.125". Industry designs keep ~0.25" gap. | §202.5.3 (c for in-block barcode), general OCR read area |
| Usable space ABOVE the address block on right side? | **YES.** The indicia reserves only ~1.5"×1.5" top-right corner. Between the indicia (top ~1.5") and the address block (bottom ~3.25"), there is a ~1.5" vertical gap on the right side where content CAN go. | Derived from §202.2.1 + §202.3 |
| Usable space TO THE LEFT of barcode zone (below address block)? | **YES.** The barcode clear zone starts 4.75" from the RIGHT edge, i.e. at the 4.25" mark from LEFT on a 9" card. So everything from x=0 to x=4.25" in the bottom 0.625" strip is FREE for content. | §202.5.1.1 |

---

## 4. Competitor Layout Observations

Triangulated from three independent professional mail vendors who have shipped millions of 6"×9" postcards. **All three give the address panel far less than half the card.**

### Lob (API-first direct mail, ships millions/year)
Source: help.lob.com/print-and-mail/designing-mail-creatives/mail-piece-design-specs/postcards
- Ink-free zone for all 6"×9" and larger postcards: **4.0" W × 2.375" H**
- Offset: 0.275" from the right edge (incl. bleed), 0.25" from the bottom edge (incl. bleed)
- Note: Lob's no-ink zone SITS OVER THE BARCODE — meaning they print the IMb *inside* the address block (using §202.5.3 alternative), not in the clear zone. This is why they can use only 2.375" of height.
- Lob recommendation: "We do not recommend placing promotional address information in your creative in the bottom 2.375" of [the address side]."
- **Effective right-column reservation: 4.0" wide — much less than our 4.25".**

### LettrLabs (LLM-first direct mail SaaS)
Source: lettrlabs.com/help-guide/printed-postcard-specs-6-2-x-9-2
- Address block: **4.1" W × 2.62" H** (front side for their handwritten cards; on back for standard)
- Safe zone: 8.75" × 5.75" (same 0.125" inset as us)

### PrintingForLess (large commercial direct-mail printer)
Source: printingforless.com/templates/mailing/6X9_Postcard.pdf (title: ".625" h BARCODE ZONE PINK IS INK FREE AREA 4" w x 2.7" h 6" x 9" Postcard")
- Ink-free address area: **4.0" W × 2.7" H**
- Barcode zone: **0.625" h** (explicitly labeled)
- **This is the cleanest match to DMM specs from a printer that actually runs USPS automation.**

### Wise Pelican (real estate direct-mail, millions/year)
Source: wisepelican.com + help.wisepelican.com
- Uses jumbo 6"×9" only.
- Back layout reserves the **right half** for address/postage (no published exact dimensions for their mailing panel).
- Recommends designing at 8.5"×5.5" (matches safe zone) and placing content "to the LEFT of the address block" — confirming content CAN live left of the panel but they don't exploit the area above or below the panel on the right side.
- Wise Pelican is the conservative/hand-wavy end of the spectrum; Lob and PrintingForLess are the tight-spec end.

### Industry pattern summary

| Vendor | Address panel W × H | Right-column lock | Content left of panel? | Content above panel? |
|---|---|---|---|---|
| Lob | 4.0 × 2.375 | 4.0" | Yes | Yes |
| LettrLabs | 4.1 × 2.62 | 4.1" | Yes | Yes |
| PrintingForLess | 4.0 × 2.7 | 4.0" | Yes | Yes |
| Wise Pelican | ~4.5 × ~3.0 (conservative) | ~4.5" | Yes | Not typically |
| **PostCanary today** | **4.25 × 5.5 (full column)** | **4.25"** | **No** | **No** |

**Three of four commercial vendors reserve ~4.0" horizontally, NOT 4.25", and they do NOT lock the full vertical height of that column. They use the bottom ~2.7" of the right column for address, leaving the top ~3.3" of the right column available for logo / headline / indicia. We are currently locking all 4.25 × 5.5 = 23.4 sq in; compliant layouts use only 4.0 × 2.7 = 10.8 sq in (plus 4.75 × 0.625 = 3.0 sq in for the barcode and 1.5 × 1.5 = 2.25 sq in for the indicia). Total USPS-reserved on a tight layout ≈ 16 sq in, not 23.4. We have ~7+ sq in (~30%) of locked space we can reclaim.**

---

## 5. Recommended New CSS Values for print-scale.css

Replace lines 30–31 of the current file with:

```css
  /* Back layout — tuned to DMM 202 actual clear zones (2026-04-09 research).
   *
   * Before: content=4.25", usps=4.25". Locked the whole right half.
   * After:  content=5.5",  usps=3.0".  Reclaims 1.25" for headline/offer.
   *
   * DMM basis:
   * - §202.5.1.1 Barcode clear zone: 4.75" W × 0.625" H bottom-right only.
   * - §202.2.1 OCR read area: address can be anywhere 0.5" from L/R edges.
   * - §202.3 Permit indicia: 0.5" min, in ~1.5" square of upper-right corner.
   * - Industry address block (Lob/PrintingForLess): 4.0" × 2.625".
   *
   * The USPS column is now 3.0" wide (covers 4.0" address block minus
   * overlap with content col by 1.0"). Address block and barcode zone
   * are positioned absolutely within a dedicated USPS layer, so the
   * content column and the USPS column can overlap horizontally in the
   * top-right region above the address block.
   */
  --pc-content-col-w:     5.5in;     /* Left content column (was 4.25in) */
  --pc-usps-col-w:        3.0in;     /* Right USPS zone (was 4.25in) */

  /* USPS sub-zones (NEW — absolute positioning inside PostcardBack.vue) */
  --pc-usps-addr-block-w: 4.0in;     /* DMM-allowed address block width */
  --pc-usps-addr-block-h: 2.625in;   /* address block height */
  --pc-usps-addr-offset-b: 0.75in;   /* from bottom of safe area */
  --pc-usps-addr-offset-r: 0.25in;   /* from right of safe area */

  --pc-usps-barcode-w:    4.75in;    /* DMM §202.5.1.1 clear zone width */
  --pc-usps-barcode-h:    0.625in;   /* DMM §202.5.1.1 clear zone height */
  --pc-usps-barcode-offset-b: 0in;   /* at trim edge (clear zone touches bottom) */
  --pc-usps-barcode-offset-r: 0in;   /* at trim edge */

  --pc-usps-indicia-w:    1.5in;     /* permit indicia region */
  --pc-usps-indicia-h:    1.5in;     /* must be within 1.5" of UR corner */
  --pc-usps-indicia-offset-t: 0in;   /* from top of safe area */
  --pc-usps-indicia-offset-r: 0in;   /* from right of safe area */
```

### Required PostcardBack.vue refactor
The current 2-column flex layout where `usps-col` is a hard 4.25" box will NOT work with overlap. PostcardBack needs to shift to a stacked absolute layout:

1. **Content layer** (z=1): full 8.5" × 5.5" safe area, with flex/grid layout that respects a "keep-out" region = the address block + indicia only (not the full right column).
2. **USPS layer** (z=2): absolute positioned address block, barcode clear zone, and indicia over the content layer. These are the ONLY elements that cannot be overlapped.
3. Content elements (headline, offer, phone, trust badges) can sit anywhere in the safe area EXCEPT behind the three USPS sub-zones.

This gives us a usable content footprint of roughly:
- Top-right "above address block": **3.0" W × 1.5" H** (between indicia bottom and address block top)
- Bottom-left "beside barcode": **4.25" W × 0.625" H** (left of barcode clear zone, in the bottom 5/8")
- Full-width top band above indicia height: **5.5" W × 1.5" H** (left of the indicia)
- Main content middle-left: **5.5" W × 2.625" H** (left of the address block)

Total reclaimed content area vs. the current 4.25" × 5.5" = 23.4 sq in content col: approximately **~36 sq in available** for content (nearly 1.5× what we have now). Drake's instinct of ~1–1.5" reclaimable was correct — the arithmetic supports 1.25".

---

## 6. Risks / Caveats — Verify With Print Partner On Demo Call

1. **Automation tolerance is tighter than DMM minimums.** DMM says 0.5" from right edge for OCR; most automation vendors internally require 0.625"–0.75" for reliable read. Our recommended 3.0" USPS column is well within that. Verify.

2. **Address label insertion — are they using inkjet imprint or pre-printed panels?** If the print partner inkjets the address onto the card after the base print, they may require a larger ink-free background rectangle than the DMM minimum (for reflectance). Industry standard is a pure white rectangle at least 4.0" × 2.625". Our recommendation reserves exactly that. Verify the rectangle dimensions and whether they want it pure white or allow a very light tint.

3. **Barcode placement method.** If the partner prints the IMb in the clear zone (standard), we need the full 4.75" × 0.625" ink-free. If they print it inside the address block (Lob-style, §202.5.3), we only need 4.0" × 2.625" reserved and the barcode clear zone is irrelevant. **Ask which they do.** This changes whether the bottom-left-of-barcode area is usable or needs the barcode clear zone reserved.

4. **Reflectance/PCR standard (§204.1.3).** Any color or pattern in the barcode clear zone must have print contrast ratio <15% when measured in red/green spectrum. In practice this means: white or very pale background only in the clear zone. If we want to extend a background color into that area, test with the partner first.

5. **Indicia size is partner-dependent.** The DMM minimum is 0.5" × 0.5" but real permit indicia are usually 0.75"–1.0" tall with 3–5 lines of text. 1.5" × 1.5" reserved region is safe. If the partner uses a wider permit indicia block, widen to 1.75" × 1.5".

6. **Return address is optional but usually expected.** If our PostcardBack template assumes a return address at top-left, that eats ~1.5" × 0.5" of the left content area. Factor this into the content layout.

7. **6×9 is a letter-size mailpiece, not a flat.** A 9×6 card at 0.009"+ thickness qualifies as a letter-size piece at USPS Marketing Mail letter rates (§201, §202.5.1 preamble). Confirm our partner is actually mailing at letter rates, not flat rates — the clear zones are the same but the postage is 4–5× different.

8. **Indicia position if postage is printed by partner vs. meter.** If the partner uses a meter stamp (not permit imprint), the reserved area is different — meters are typically 1.5" × 0.75" and must be in the upper-right corner. Confirm.

9. **One-off vs automation mailing.** Our DMM citations are for automation-price letter mail (the cheap rate). If we ever fall back to nonautomation, §202.5.1 still requires the barcode clear zone if the piece is machinable. Not a change for us, just a note.

10. **The current safe inset is 0.25"; DMM §202.2.1 allows 0.125" on all Periodicals/Marketing Mail flats for delivery address placement but recommends 0.5" from L/R for OCR.** Our 0.25" safe inset is a *design* safe zone (trim tolerance), not the USPS clear space (which is 0.5" from edges for the address). The print partner may have a tighter trim tolerance that requires a larger safe inset. Verify.

---

## Sources (authoritative)

DMM (Domestic Mail Manual, pe.usps.com):
- §201 Physical Standards for Commercial Letters, Flats, and Parcels: https://pe.usps.com/text/dmm300/201.htm
- §202 Elements on the Face of a Mailpiece: https://pe.usps.com/text/dmm300/202.htm
- §202 PDF (updated 11-3-25 / 1-18-26): https://pe.usps.com/cpim/ftp/manuals/dmm300/202.pdf
- §204 Barcoding Standards (PDF, updated 1-18-26): https://pe.usps.com/cpim/ftp/manuals/dmm300/204.pdf
- DMM 201a Quick Service Guide: https://pe.usps.com/text/qsg300/q201a.htm
- Full DMM (updated 10-28-25): https://pe.usps.com/cpim/ftp/manuals/dmm300/full/mailingStandards.pdf

Professional mailer layout specs (for triangulation):
- Lob postcard specs: https://help.lob.com/print-and-mail/designing-mail-creatives/mail-piece-design-specs/postcards
- Lob 6x9 PDF template: https://s3-us-west-2.amazonaws.com/public.lob.com/assets/templates/postcards/6x9_postcard.pdf
- LettrLabs 6×9 specs: https://www.lettrlabs.com/help-guide/printed-postcard-specs-6-2-x-9-2
- PrintingForLess 6×9 template: https://www.printingforless.com/templates/mailing/6X9_Postcard.pdf
- PrintingForLess USPS mail layout index: https://www.printingforless.com/resources/usps-mail-layout-templates/
- Wise Pelican size guide: https://help.wisepelican.com/knowledge/what-size-are-the-postcards
- PostcardMania templates: https://www.postcardmania.com/submitting-art/templates/
- ShipScience clear zones explainer: https://shipscience.com/understanding-usps-postcard-clear-zones/
- ParcelPath clear zones: https://parcelpath.com/usps-postcard-clear-zones/

Secondary references:
- USPS BusinessMail101 permit indicia design: https://pe.usps.com/businessmail101?ViewName=PermitDesign
- AccuZIP indicia placement rules: https://www.accuzip.com/support/tech-notes/maildat-usps-business-customer-gateway/?id=287
- Mailing Systems Technology "10 most common mistakes in Mailpiece Design": https://mailingsystemstechnology.com/file-71-10-MOST-COMMON-MISTAKES-IN-MAILPIECE-DESIGN-notes.pdf
