# Postcard Visual Taste Audit — 2026-04-09

Status: **Item 1 of 7 on the demo critical path.** Unblocks Item 2 (USPS back
layout) and Item 3 (visual bug fixes). This doc decides what the print-partner
demo on 2026-04-20 actually shows.

Audit method: pulled reference postcards from three pro direct-mail vendors,
rendered our current `PostcardFront.vue` + `PostcardBack.vue` through the
`/dev/postcard-preview` route across 6 layouts, compared side-by-side. All
screenshots live in `./visual-audit-2026-04-09/`.

---

## TL;DR

1. **Our templates read as "clean enterprise SaaS," not "direct mail that gets
   opened."** We're closer to Stripe than to PostcardMania. For this demo bar
   ("crisp, pro-made"), clean is fine but we are under-selling the pieces the
   print partner will actually judge: headline weight, offer prominence, phone
   dominance, photo treatment.
2. **Typography conflict resolved: plan v2 wins (22/26pt).** Pro postcards at
   9×6 absolutely go bigger than V1 build decisions' 14-18pt range. The current
   `print-scale.css` numbers (32pt headline, 22pt front phone, 26pt back phone)
   are in the right neighborhood — don't shrink them. *Fix the V1 build
   decisions doc to match the code, not the other way around.*
3. **We are out-of-step with the industry by putting the offer on the back
   only.** 100% of PostcardMania HVAC samples and ~90% of Mail Shark oversized
   samples put a discount/price teaser on the front, usually as a badge or
   corner burst. Current code comment explicitly removes it ("NO offer text on
   front — offer belongs on back (Gendusa fix)"). This was a misread of the
   Gendusa principle. Reinstate front-offer as a small teaser badge; the full
   stacked offer still lives on the back.
4. **USPS right column is over-reserved** — Drake's instinct was correct. We
   lock the whole 4.25″ right half. USPS only strictly requires ~2.75-3.25″ of
   reserved horizontal for the address block and IMb barcode clear zone. We
   can reclaim ~1.0-1.5″ for content (biggest-element phone, QR, guarantee
   band). This feeds Item 2 — DMM 201 has to confirm exact numbers.
5. **Both known visual bugs are confirmed visible in rendered output.** The
   credibility-line clip reproduces with a realistic longer string ("Licensed,
   Bonded & Insured · Family-Owned Since 2014"). The back-overflow repros at
   any preview scale below 1.0. Both get fixed in Item 3 with concrete
   approaches listed below.

---

## Reference corpus

Sources pulled 2026-04-09 via Playwright. Screenshots preserved in
`./visual-audit-2026-04-09/`.

| Source | URL | Samples observed | Style |
|---|---|---|---|
| **PostcardMania** HVAC gallery | `postcardmania.com/designs/heating-air-conditioning-marketing/` | 18+ | Loud, offer-stacked, family-photo heavy, yellow/red/blue color blocking |
| **Wise Pelican** roofing templates | `wisepelican.com/wise-pelican-roofing-services-templates/` | 4 | Clean, real-estate-influenced, minimal, hero photo + one offer |
| **Mail Shark** oversized samples | `themailshark.com/product-samples/postcards/` | 30+ (front+back pairs) | Split front/back shown together, big price badges, testimonial-driven backs |

Size note: Wise Pelican is 6×9 jumbo (matches ours). PostcardMania gallery is
mostly 6×9. Mail Shark's headline samples are 5.5×10.5 oversized and 8.5×10.5
jumbo — different aspect ratio, but the typographic principles transfer.

---

## What the pros are doing

Patterns that showed up across ≥80% of the reference corpus:

**Front (the billboard — 1-second recognition):**
- ONE dominant hero photo, ~50-70% of card area
- Massive headline — reads from arm's length. Measured by eyeballing these at
  their native print size, headlines are clearly 30-40pt equivalent, NOT the
  14-18pt the V1 build decisions doc proposed.
- Phone number in a **colored box** (not bare text) — high contrast against
  its container. 20-28pt equivalent. Often takes the full bottom bar.
- Offer teaser — "$50 OFF", "20% OFF", "$79 TUNE-UP" — as a sunburst badge, a
  corner ribbon, or inline with the headline. Present on front of almost
  every card.
- Logo top-left OR top-right, small (~0.75-1.25″ wide). Never dominant.
- Credibility/trust line is either absent from front or tiny (<11pt). When
  present, it's "Licensed & Insured" style, <4 words.
- Color contrast is LOUD. No subtle pastels on the front. Yellow on navy,
  white on red, black on yellow. Every front reads from 3 feet.
- **No white space for its own sake.** The front is crowded on purpose —
  every square inch earns its keep.

**Back (the closer — 10-second read):**
- Phone number is the **biggest single element**. Bigger than the offer
  headline. Often 28-40pt in a colored CTA box spanning the full width.
- Offer box (Johnson box style — bordered, labeled) with stacked items
  (e.g., "$79 A/C Tune-Up · $150 OFF New System · Free Inspection"). Usually
  3-5 offer lines.
- Real testimonial with star rating and customer name. Italic or offset.
- Trust badges row: BBB, Angi, HomeAdvisor, Google, NATE, etc. Always at the
  bottom or as a horizontal strip.
- "Licensed & Insured" / "Free Estimate" small-print line for risk reversal.
- QR code in a corner — small (~0.75-1″), clean, with "Scan for more" label.
- Return address is tiny top-left. Indicia is tiny top-right. USPS zone is
  compressed as tightly as possible to hand over maximum space to content.

**What the pros are NOT doing:**
- Not putting "Serving [city] since [year]" as a credibility line on the
  front. That's a back-of-card detail on pro postcards.
- Not using review quotes on the front (they're all on the back when used).
- Not being subtle. There is no "minimalist" direct-mail postcard that
  actually works at scale.
- Not treating the back like a second-priority surface — the back sells as
  hard as the front.

---

## Our current state, per layout

Screenshots in the `visual-audit-2026-04-09/` folder.

### Front — `full-bleed` (default)
- Photo fills the card, gradient fades to dark at bottom, headline + phone
  layered on the gradient.
- Logo top-left, credibility top-right — both in small uppercase badges.
- **Strong:** clean, readable, pro-looking in isolation.
- **Gaps vs references:**
  - Phone sits as plain white text, not in a colored block. Every reference
    puts the phone in a colored bar or box. Add a teal or brand-primary
    container around it.
  - Headline weight feels appropriate. No change.
  - **No offer teaser anywhere.** Pros have a badge or corner burst saying
    "$79 TUNE-UP" or "$50 OFF". We have nothing. Add one.
  - Credibility badge reads as a small generic label, not a trust anchor.
    Either make it the offer teaser instead, or drop it to the back.
  - Logo is a text fallback ("MARTINEZ PLUMBING") when no real logo provided —
    it looks awkward. The fallback needs to be either (a) a branded box with
    a generated wordmark or (b) drop entirely and use the business name as the
    headline's credibility line.

### Front — `side-split`
- Left half photo, right half dark navy column with badges, headline, phone
  stacked.
- **Strong:** gives the headline more breathing room than full-bleed.
- **Gaps:** the phone has even less visual weight here than in full-bleed —
  it's bare text in a dark column, no contrast container. Same offer gap.
  The credibility badge at the top of the right column competes with the
  headline for attention.

### Front — `photo-top`
- Photo 60% top, content 40% bottom on white with colored phone pill.
- **Strong:** this is the best current layout for phone prominence — the
  phone sits in a teal pill that actually pops.
- **Gaps:** content area feels empty. Room for an offer badge next to the
  phone. Headline on white competes with the photo for visual center.

### Front — `bold-graphic` (no photo)
- Solid navy background, centered headline, centered phone in teal pill.
- **Strong:** simplest, most legible at a glance.
- **Gaps:** feels corporate, not "home services." The references' no-photo
  variants are usually yellow-on-black with the offer HUGE in the center
  (the "IMPORTANT REMINDER" PostcardMania card is the archetype). Ours reads
  like a conference-badge, not a marketing piece. Needs an offer-first
  reorganization for this layout specifically.

### Front — `before-after`
- Split photos with overlay bar.
- **Not observed in the pro corpus as a common front.** Before/after is a
  classic roofing/remodeling pattern, but it's rare on home-services
  postcards specifically — most home services use emotion (family, comfort)
  not transformation. Keep the layout but lower its recommendation weight
  in the template picker.

### Front — `review-forward`
- Photo with star badge top-right, headline + review quote at bottom.
- **Strong:** the concept is good and appears in ~10% of references.
- **Gaps:** review quote at 12pt italic is very hard to read against the
  dark gradient. In references, review quotes on the front are always in
  a callout box with padding and high contrast — never floating on a photo
  gradient. And no one puts the review quote directly under the headline —
  it's usually in a corner badge or a pull-quote treatment.

### Back — 6-block layout
- Top strip: return address + indicia
- Left column (4.25″): OfferBox, CTABox, Rating + quote, TrustBadges, Risk
  reversal, Local proof
- Right column (4.25″): locked-zone overlay + address block + IMb barcode
- **Strong:** OfferBox and CTABox are the best pieces we ship. These compare
  favorably to the references. Don't touch them.
- **Gaps:**
  - **Over-reserved USPS column** — whole right 4.25″ is locked, but only
    the bottom-right 4.75″×0.625″ (IMb clear zone) and the address block
    (~2.75″×1.5″) are actual hard requirements. Above the address and to
    the left of the barcode zone, content is allowed. Reclaim ~1-1.5″ of
    content width for the left column, which relieves the overflow bug.
  - **6 blocks is too many.** The pros use 3-4 content blocks on the back.
    Our block 5 (risk reversal) and block 6 (local proof) should either
    merge into the OfferBox footer or drop entirely.
  - **Phone prominence** — our CTABox phone is good, but in the references
    the back phone is often 2× bigger than the offer headline. Our current
    26pt back phone vs 22pt offer headline ratio is close but could push
    the phone harder to 28-32pt.
  - **Trust badges row is cramped** — three badge boxes (BBB, Angi,
    HomeAdvisor) squeezed into a ~3.5″ row. References give trust badges a
    full-width strip at the bottom. Reshape as a full-bleed bottom strip
    once we reclaim width from the USPS column.
  - **Review quote under the rating is redundant** — the rating is already
    social proof, the quote adds noise. Pick one per card, not both.

---

## Ranked visual gap list (action items)

Ordered by demo impact. All numbers are physical print sizes assuming 9×6
card.

### P0 — must fix before demo

1. **Add a front-of-card offer teaser element.** New component
   `OfferBadge.vue` — a ~1.25″ circular burst or a corner ribbon. Position:
   top-right on full-bleed/side-split, next to phone on photo-top, centered
   above phone on bold-graphic. Content: AI-generated short offer ("$79
   TUNE-UP" / "$50 OFF REPAIR" / "FREE ESTIMATE"). 18-24pt inside the badge.
   *Est: 2-3 hours.* **This is the single highest-impact change.**

2. **Reclaim USPS right column width.** Drop `--pc-usps-col-w` from 4.25″
   to 2.75″ and `--pc-content-col-w` from 4.25″ to 5.75″. Verify the
   address block + barcode clear zone still satisfy USPS DMM 201 (Item 2
   task). Relieves back overflow and gives the content column breathing
   room for the CTA phone upsize + full-width trust badge strip.
   *Est: 1 hour for the CSS change, 2-3 hours once DMM numbers are
   confirmed.*

3. **Put the front phone in a colored container on every layout.** Wrap
   `pc-phone-front` in a `.pc-phone-container` class that is:
   - full-width bottom bar on full-bleed (currently the gradient, change to
     solid brand-primary or brand-dark)
   - teal pill on side-split and photo-top (only photo-top has this now)
   - teal pill centered on bold-graphic (already has it)
   The phone must never be bare text on a gradient.
   *Est: 1 hour.*

4. **Fix the credibility-line clip bug.** Current code clips "LICENSED,
   BONDED & INSURED · FAMILY-OWNED SINCE 2014" on every front layout.
   Simplest fix: `max-width: 45%` + `text-overflow: ellipsis` on the badge
   container — truncates gracefully instead of overflowing. Better fix:
   constrain the AI-generated credibility string to ≤4 words at extraction
   time, add to the `scraper` prompt. *Est: 0.5 hour for CSS fix; 1-2
   hours for the extraction-side constraint.*

5. **Fix the back overflow at preview scale < 1.0.** Wrap the preview card
   in a container that applies `transform: scale()` instead of relying on
   pt units shrinking. `PostcardPreview.vue` already uses this for the
   full preview — the issue is inside `StepDesign.vue` where the card is
   rendered inside the wizard at a smaller size. Apply the same
   transform-scale pattern to `StepDesign.vue`'s preview container.
   *Est: 1 hour.*

### P1 — high impact, can slip if P0 takes over

6. **Drop 6-block back layout to 4 blocks.** Merge risk-reversal into the
   OfferBox footer as a small italic line; merge local-proof into the
   return-address strip at the top as "Serving [city] since [year]" appended
   after the address line. Remaining blocks: Offer, CTA, Rating/Quote,
   TrustBadges. *Est: 1-2 hours.*

7. **Upsize back phone from 26pt → 30pt.** Makes the CTABox visually
   dominant over the OfferBox. Requires reclaimed column width from P0 #2.
   *Est: 15 minutes once column width is reclaimed.*

8. **Full-width trust badge strip at the bottom of the back.** Once the
   content column is 5.75″ wide, move TrustBadges out of the column stack
   into a full-bleed-below-content horizontal strip. Use image badges when
   available, text fallback when not. *Est: 1-2 hours.*

9. **Improve review quote treatment on review-forward front layout.**
   Either put the quote in a bordered white callout box, or move it to a
   corner pull-quote treatment. Current floating-on-gradient treatment is
   illegible. *Est: 1 hour.*

### P2 — polish, skip if short on time

10. **Drop `before-after` layout recommendation weight.** Not part of the
    common pro home-services postcard vocabulary. Template picker should
    show it last, only for roofing/remodeling service types. *Est: 15
    minutes in the template metadata.*

11. **Logo text-fallback treatment.** When no logo is extracted, don't
    render "MARTINEZ PLUMBING" as raw text in a badge slot. Either
    auto-generate a simple wordmark or drop the slot and give the space
    back to the headline. *Est: 1-2 hours.*

12. **Bold-graphic layout re-composition.** Currently looks corporate.
    Reorganize so the offer is the centered hero element (not the
    headline) — this is the "IMPORTANT REMINDER" archetype. *Est: 2-3
    hours.*

Total P0 estimate: ~6-8 hours. Total P0+P1 estimate: ~12-16 hours. Both fit
inside today's budget if Items 2-3 overlap with these changes.

---

## Typography verdict (resolves the 14-18pt vs 22-26pt conflict)

**Plan v2 wins. Keep the current `print-scale.css` values.** The 14-18pt
range from the V1 build decisions doc is wrong for 9×6 at arm's length. Here
is the reasoning, measured against the reference corpus.

Legibility test — what a human can comfortably read at arm's length (~24
inches) on matte cardstock:
- Body text: 10pt minimum, 11-12pt comfortable
- Readable caption: 11-13pt
- Subheadline / secondary: 14-18pt
- Headline (glance-and-grasp): 22-36pt
- Phone / CTA (must dominate): 24-40pt
- Massive price/offer ("$79"): 48-96pt

The V1 build decisions numbers (14-18pt body, 16-20pt phone) would put the
phone number in the *subheadline* legibility band, which is why none of the
pro postcards use numbers that small. Our current code is correct.

Specifically, `print-scale.css` today sets:
- `--pc-headline-size: 32pt` — **correct** (28-36pt pro range)
- `--pc-phone-front-size: 22pt` — **correct floor**, recommend push to 24pt
- `--pc-phone-back-size: 26pt` — **correct floor**, recommend push to 30pt
  (after P0 #2 reclaims column width)
- `--pc-offer-headline-size: 22pt` — **correct**
- `--pc-credibility-size: 13pt` — **correct**
- `--pc-body-size: 11pt` — **correct**
- `--pc-badge-size: 11pt` — **correct**

**Action:** Update `postcanary-v1-build-decisions.md` to replace the 14-18pt
body / 16-20pt phone numbers with the current `print-scale.css` values. The
spec should reflect the code, not the other way around — because the code
went through the Draplin/Gendusa review in Brief #6 and those numbers
already passed expert validation. The V1 build decisions doc was written
earlier without measuring against pro postcards.

---

## Offer-on-front decision (contradicts current code comment)

`PostcardFront.vue` line 14: `// NO offer text on front — offer belongs on
back (Gendusa fix)`

This should be **reversed** based on the reference audit:
- 100% of PostcardMania HVAC samples show an offer on the front
- ~90% of Mail Shark oversized samples show a price/discount on the front
- 50% of Wise Pelican samples show an offer on the front (they're cleaner)

The correct interpretation of the Gendusa principle is: *the front is not a
place for a long offer STACK (the stacked "$79 + $150 off + Free Inspection"
list belongs on the back). But a single short offer TEASER on the front is
not just permitted — it's the norm.*

**Action:** Reinstate a single front-offer teaser element (the new
`OfferBadge.vue` component in P0 #1). The back keeps the full stacked
OfferBox. Update the code comment to reflect the distinction.

---

## Feeds into Item 2 — USPS back layout research

This audit confirms Drake's instinct. Item 2's research task is now
well-scoped:

1. Pull USPS DMM 201 (Marketing Mail Letters & Flats Postcard specs).
2. Measure exact clear zone requirements for a 9×6 Marketing Mail card:
   - Address block minimum dimensions + position
   - IMb barcode clear zone (4.75″×0.625″ standard, bottom-right)
   - Permit indicia minimum size + position
   - Safe margin around locked elements
3. Confirm the theoretical reclaim of ~1.0-1.5″ horizontal from the current
   4.25″ USPS column.
4. Rebuild `PostcardBack.vue` with the new column ratios and the 4-block
   content structure from P1 #6.
5. Run the rebuilt back through the `/dev/postcard-preview` route with
   multiple brand kits.

---

## Feeds into Item 3 — Visual bug fixes

Both known bugs confirmed visible in the audit screenshots:

1. **Credibility line clip** — reproduces with any credibility string
   longer than ~25 characters ("Licensed, Bonded & Insured · Family-Owned
   Since 2014" in the stress screenshot). Fix approach in P0 #4 above.
   Saves 0.5 hours compared to the more involved extraction-side constraint,
   which should still happen as a follow-up.
2. **Back overflow at preview scale** — reproduces at any `previewScale <
   1.0`. Root cause confirmed: `StepDesign.vue` uses CSS scale but the pt
   units inside the card don't shrink with the container, so the content
   physically doesn't fit even though the container is rendered smaller.
   Fix approach in P0 #5 above.

---

## Next actions (in order)

1. ~~Item 1 audit — THIS DOC~~ ✅
2. **Start P0 #1 (OfferBadge)** — highest demo leverage. ~2-3 hours.
3. Start Item 2 (USPS DMM 201 research) — can run in parallel with P0
   #1 since they don't touch the same files.
4. P0 #2 (column width reclaim) — requires Item 2 finishing first to get
   the confirmed DMM numbers.
5. P0 #3-5 (phone container + credibility clip + back overflow) — can
   batch with P0 #2.
6. P1 items if there's time.
7. Item 4 (Desert Diamond HVAC E2E smoke test) — after visuals are locked.
8. Items 5-7 (mail-campaigns endpoint, PDF export, demo rehearsal).

---

## Screenshots reference

All at `./visual-audit-2026-04-09/`:

| File | What |
|---|---|
| `ref-postcardmania-hvac-gallery*.png` | PostcardMania HVAC gallery, 3 scroll positions |
| `ref-wisepelican-roofing*.png` | Wise Pelican roofing templates gallery |
| `ref-mailshark-samples.png` | Mail Shark oversized postcard gallery full page |
| `ref-mailshark-oversized-*.png` | Mail Shark samples, 3 scroll positions (front+back pairs visible) |
| `our-postcard-full-bleed.png` | Our full-bleed layout, real HVAC-ish photo |
| `our-postcard-side-split-full.png` | Our side-split layout |
| `our-postcard-photo-top.png` | Our photo-top layout |
| `our-postcard-bold-graphic.png` | Our bold-graphic layout (no photo) |
| `our-postcard-review-forward.png` | Our review-forward layout |
| `our-postcard-credibility-stress.png` | Credibility clip bug repro |

---

## Done criteria for this audit

- [x] Pulled 8-10 reference postcards
- [x] Rendered current PostcardFront across all 6 layouts
- [x] Rendered current PostcardBack at physical scale
- [x] Side-by-side comparison documented
- [x] Ranked gap list (12 items, P0/P1/P2)
- [x] Typography verdict written
- [x] Offer-on-front decision written
- [x] Feeds Item 2 and Item 3 tasks
- [x] Screenshots preserved in `visual-audit-2026-04-09/`
