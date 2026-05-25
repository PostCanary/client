# PostCanary Postcard Back — Deep Spec

> **What this is:** The same obsessively-detailed treatment the front got in POSTCARD-DEEP-SPEC.md, but for the BACK of the postcard. Synthesized from PostcardMania case studies, Postalytics "double-front" methodology, SwipeFile color analysis, Modern Postcard guidelines, and PrintLabelAndMail two-sided samples. Expert panel rules from experts-design-panel.md applied throughout.

---

## THE CRITICAL INSIGHT: "DOUBLE-FRONT" PRINCIPLE

The back of a postcard is NOT the "B-side." Postalytics research: "you'll want to 'double-front' your postcard so your offer stands out regardless of which side someone sees first." The address panel (back) is the side most often seen first — it's face-up in the mailbox because the carrier places it address-visible. The back must sell as hard as the front.

**Implication for PostCanary:** The back is not an afterthought information dump. It is a SECOND SELLING SURFACE with its own visual hierarchy, offer presentation, and CTA.

---

## PART 1: UNIVERSAL BACK PATTERNS (extracted from 10+ pro references)

### Pattern B-01: Solid Colored Background for Content Column

Pro postcard backs use the brand's PRIMARY DARK COLOR as the background for the entire content column. NOT white. Navy blue, dark green, charcoal, or bold brand color fills the column edge-to-edge. White text on dark background.

**Why:** White background with colored boxes on top = "web page printed out" / SaaS dashboard. Solid dark background with white text = "printed sales piece" / physical mail.

**SwipeFile color analysis of PostcardMania card:** Corporate Blue 45%, Clean White 30%. The blue is the DOMINANT color — it's the background, not an accent.

**Our current problem:** Our back uses white background with orange OfferBox and orange CTABox floating on it. This is the #1 reason it looks like stacked Vue components instead of a pro postcard.

### Pattern B-02: Content Column = One Continuous Block

Sections inside the content column do NOT have visible borders, separate backgrounds, or gaps between them. They flow as one continuous vertical stack on the colored background. The only visual separators are:
- Thin horizontal rules (1pt, white at 30% opacity)
- Section padding differences (tighter within sections, slightly wider between)
- Typography changes (size/weight shifts signal section boundaries)

**No borders around the offer.** No separate background color for the CTA. No "card inside a card" appearance.

### Pattern B-03: Offer Headline is Reverse-Color Accent Bar

The offer headline ("$277 VALUE FOR JUST $79") gets a CONTRASTING accent bar — typically the brand's secondary/bright color (orange, green, yellow) as a full-width bar within the content column. This is the ONE element that breaks the dark background, making it impossible to miss.

**Structure:**
```
[FULL-WIDTH ACCENT BAR — bright color, white bold text]
$277 VALUE FOR JUST $79
```

This mirrors the front's green offer strip — one bright non-matching color element on an otherwise dark surface.

### Pattern B-04: Value Stack = Simple List on Dark Background

The itemized value stack (checkmarks + items + values) renders directly on the dark background in white text. No box around it. No border. No separate background. Just white text on the column background with checkmarks in the accent color.

```
✓ 23-Point Safety Check .................. $49 value
✓ Condenser Coil Cleaning ................ $79 value
✓ Refrigerant Level Check ................ $59 value
✓ Free Estimate on Any Repair ........... priceless
```

Checkmarks in the accent color (orange/green). Labels in white. Values in white bold. Dot leaders or space between label and value.

### Pattern B-05: Phone Number = LARGEST Element on Back

The phone number on the back is 32-40pt — the single largest text element. It sits on the dark background in white. No box around it. No separate CTA container. Just massive white text on the dark column.

Above it: "CALL NOW" or "Call Today" in smaller caps (12-14pt).
Below it: website URL in smaller text (10-11pt).
To its right: QR code on a small white pad.

### Pattern B-06: Testimonial = Short Quote, Stars Visible

One-line or two-line testimonial in italic white text on the dark background. Stars rendered before the quote or above it. Reviewer name after the quote.

```
★★★★★  "Fixed our AC in under an hour on a 108-degree day." — Sarah M.
```

### Pattern B-07: Trust Badges = Compact Row at Bottom

Small filled-color badges in a horizontal row at the very bottom of the content column. Same treatment as current (filled brand colors), but sitting ON the dark background — not on white.

### Pattern B-08: Urgency/Deadline = Accent Color Bar

The deadline ("OFFER EXPIRES MAY 15, 2026") gets a second accent bar — same bright color as the offer headline bar. Full-width within the content column. This creates visual bookends: accent bar at top (offer) + accent bar at bottom (deadline) with dark content in between.

### Pattern B-09: Return Address = Top Strip, Separate from Content

The return address and PRSRT STD indicia sit in a thin strip at the very top of the card, spanning full width. This strip is typically white or very light gray — creating a visual break between "postal infrastructure" and "sales content" below it.

### Pattern B-10: USPS Column = White/Light, Clean

The right column (address block, barcode) remains white/light. The visual contrast between dark-background content column and white USPS column creates a natural "this is for you to read / this is for the post office" divide.

---

## PART 2: IMPLEMENTATION — Exact Changes to PostcardBack.vue

### Change 1: Dark Background for Content Column

Add a dark background (brand primary or navy) to the content column `<div>`. All child text becomes white.

```
backgroundColor: primary (the dark brand color)
color: '#FFFFFF'
```

Remove individual borders from OfferBox and CTABox. They no longer need their own backgrounds — they inherit the column background.

### Change 2: OfferBox Simplification

- Remove the outer border
- The headline bar KEEPS its accent background (this is the B-03 contrasting accent bar)
- The value stack items become white text on dark background (no white inner background)
- Checkmarks in accent color
- Savings in accent color
- Deadline bar KEEPS its accent background (B-08 bookend)

### Change 3: CTABox Dissolution

The CTABox should NOT be a separate visual box. Instead:
- "CALL NOW" label in white caps on the column background
- Phone number in massive white type on the column background
- Website in smaller white below
- QR code on a small white pad to the right
- A thin horizontal rule (1pt white at 30%) separates this from the section above

### Change 4: Rating + Review Integration

Stars + rating + review quote all sit on the dark background in white/accent. No separate container. The stars can be in the accent color (orange/gold).

### Change 5: Trust Badges Stay Filled

Trust badges remain as filled color blocks — but now they sit on a dark background instead of white, which actually makes them POP more.

---

## PART 3: EXPERT PANEL ALIGNMENT

| Expert | Back Requirement | How This Spec Meets It |
|--------|-----------------|----------------------|
| Gendusa | Max 6 visual blocks, each scannable in 1 second | 5 blocks: offer, value stack, CTA, review, badges |
| Draplin | Color blocks > whitespace, no soft shadows, border-radius 0 | Dark background fills column, zero borders/shadows |
| Whitman | F-pattern for text-heavy back | Key info in first two lines (offer headline), important words left-aligned |
| Halbert | Value stack with anchored pricing | $277 VALUE FOR JUST $79 with itemized breakdown |
| Caples | Specific numbers beat vague claims | $79, $277, 4.9/5, 2423 customers, May 15 deadline |
| Heath | 5/5 SUCCESs on back: Simple ✓ Unexpected ✓ Concrete ✓ Credible ✓ Emotional ✓ | One offer, value-anchored, specific numbers, trust badges, "don't wait" urgency |
| Wathan | All values from tokens | Existing print-scale.css tokens sufficient |
| Drasner | One layout mode per component | Flex column, no mixing with absolute |
| Comeau | Measure actual render | Verify after implementation |

---

## PART 4: VALIDATION CHECKLIST

After implementation, verify:

- [ ] Content column has DARK background (brand primary or navy), NOT white
- [ ] Offer headline bar is the ONE bright accent element in the column
- [ ] Value stack items are white text on dark background — no box around them
- [ ] Phone number is the LARGEST text on the back (32pt+)
- [ ] Phone number sits directly on the dark background — no separate CTA box
- [ ] Testimonial is visible as white italic text on dark background
- [ ] Trust badges are filled color blocks on dark background
- [ ] Deadline bar matches the offer headline accent color (visual bookends)
- [ ] No visible "card inside a card" or component-boundary appearance
- [ ] USPS column remains white/light
- [ ] Return address strip at top is white/light (postal infrastructure)
- [ ] Overall impression: ONE integrated dark sales panel, not 4 stacked widgets
- [ ] 3-second test: recipient can identify offer + phone + deadline in 3 seconds

---

*Written: 2026-04-10 Session 36*
*Sources: PostcardMania case studies, Postalytics methodology, SwipeFile analysis, Modern Postcard guidelines, PrintLabelAndMail two-sided samples, Hook Agency hierarchy, Ballpoint Marketing formula*
*Experts consulted: Gendusa, Draplin, Whitman, Halbert, Caples, Heath, Wathan, Drasner, Comeau*
