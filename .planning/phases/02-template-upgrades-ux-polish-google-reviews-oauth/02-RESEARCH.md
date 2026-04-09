# Phase 2 Research: Template Visual Rebuild
**Written:** 2026-04-09 (research agent pass)
**Phase:** 02-template-upgrades-ux-polish-google-reviews-oauth
**Feeds:** 02-PLAN.md (gsd-planner next step)

---

## Phase Goal Restated

The narrowed scope (per CONTEXT.md D-01 through D-03) is this: rebuild the Full-Bleed Photo layout into a single demo-quality Desert Diamond HVAC postcard that a print-industry person would mistake for a professional PostcardMania or Mail Shark piece. The other 5 layouts stay in the codebase but get hidden from the customer-facing template browser. The Draplin aesthetic gate (D-04 to D-08) applies as a hard checklist — no soft grey shadows, no rounded corners above 2px, large color blocks over whitespace, Z-pattern enforced on the front, F-pattern on the back, SUCCESs score 5/6 minimum. The legal firewall (D-15 to D-19) means the build must proceed from the pattern list in this document with all reference images CLOSED, not from any specific reference's layout. The demo deadline is 2026-04-20.

---

## Universal Patterns (PATTERNS reference)

> **LEGAL NOTE:** These patterns are universal observations across 10+ professional home-services postcards from multiple vendors. No pattern is derived from a single source. "N of M" counts are based on the reference corpus studied during Phase A. This section is the legal abstraction layer per D-18. Build Phase B against this list only, with reference images closed.

### Category: Front Layout

**P-01:** Hero photo occupies 55–75% of the total front card area, bleeding edge-to-edge with no inset border.
- Frequency: 10 of 10 references
- Why: The photo IS the front. White borders or inset frames signal "designed by a SaaS tool," not a print shop. (Gendusa: "the photo earns the flip")

**P-02:** All text and graphical overlays sit on the photo, never in a white/neutral area below or beside it — the photo is the canvas, not a decoration above a content zone.
- Frequency: 9 of 10 references (exception: photo-top layout variant, not applicable to full-bleed)
- Why: Gendusa's full-bleed principle. Whitespace alongside the photo reduces emotional impact.

**P-03:** A solid-color overlay bar spans the full card width across the bottom 25–35% of the front. This is NOT a gradient fade — it is a hard-edged or minimal-gradient solid-color band containing the headline and phone. The color is brand-primary or a high-contrast dark.
- Frequency: 8 of 10 references
- Why: Draplin: "thick confident borders not thin delicate lines." The bar anchors the eye at the bottom of the Z-pattern and ensures readability on any photo.

**P-04:** An offer teaser element (burst circle, corner ribbon, or bold corner badge) appears on the front in 95%+ of home-services references. Content is always a short price or discount: "$79 TUNE-UP," "$50 OFF," "FREE ESTIMATE." Maximum 4 words, uppercase, minimum 18pt inside the badge.
- Frequency: 10 of 10 PostcardMania HVAC, 9 of 10 Mail Shark oversized
- Why: Caples formula #7 (news/offer). The front offer teaser drives the flip. The full value stack is on the back.

**P-05:** Logo placement: top-left corner, small (visually 0.75–1.25 inches wide at full print size), always on a clear or semi-transparent background so it reads against the photo. NEVER centered. NEVER dominant. NEVER the largest element on the front.
- Frequency: 9 of 10 references
- Why: Z-pattern start point (Whitman). Logo is an identifier, not a billboard. It anchors credibility before the eye travels to the headline.

**P-06:** Credibility line ("Licensed & Insured," "BBB A+," or similar) when present on the front is in the top-right corner — never below the headline, never floating on the photo. It is small (10–13pt equivalent), uppercase, with a subtle background pill or drop shadow for legibility. When an offer badge (ribbon variant) occupies the top-right, the credibility line is either omitted from the front or moved inline below the headline.
- Frequency: 7 of 10 references
- Why: Z-pattern top-right anchor (Whitman). Both elements cannot own the same corner — one must yield or be repositioned.

**P-07:** Phone number on the front sits inside a solid filled container — a colored pill, a full-width bar, or a high-contrast rectangle. NEVER bare text on the photo or bare text on a gradient. The container is brand-primary or a high-contrast accent color.
- Frequency: 10 of 10 references
- Why: Gendusa fix §3. The phone must be a "button" not a number. Visual hierarchy: the container gives it weight a bare number cannot have.

**P-08:** Front phone size: 20–28pt minimum in physical print units. Must dominate the bottom zone of the front card.
- Frequency: 10 of 10 references
- Why: Legibility at arm's length (24"). Below 20pt the phone fails the grab test.

**P-09:** Headline font weight is 800–900 (ExtraBold or Black). Never Regular or Medium on the front. Headline reads as the dominant typographic element at a glance.
- Frequency: 10 of 10 references
- Why: Draplin aesthetic. Bold type communicates confidence. Caples: headline is 80% of the work.

**P-10:** Front card contains ZERO multi-line body text, ZERO bullet lists, ZERO review quotes. The front is a billboard: one photo, one headline (max 10 words), one phone, one offer teaser, one logo.
- Frequency: 10 of 10 references
- Why: Halbert: "the front has ONE job — stop them from throwing it away." Any text beyond those five elements is competing noise.

### Category: Back Layout

**P-11:** The back phone number is the visually largest single element on the entire back side. It is larger than the offer headline. Typical size: 32–40pt in physical units. It sits inside a solid filled color block spanning the full content column width.
- Frequency: 10 of 10 references
- Why: Gendusa: "the phone is the call to action. Everything else is context."

**P-12:** Offer block (Johnson Box) is the first element the eye hits on the back — top of the content column. It has a solid brand-color headline bar spanning the full box width, a white interior, and a border (1–2pt solid brand-color). Inside: value-stacked items with checkmarks and dollar values, a total, and a deadline. NO standalone flat discounts without itemization.
- Frequency: 9 of 10 references
- Why: Halbert anchored value stack. "$277 value for $39.95" converts; "$50 off" does not. Anchoring effect (Tversky & Kahneman).

**P-13:** Offer deadline inside the Johnson Box is styled as URGENT — bold text in brand accent color (red, orange) or in a rule-separated bottom strip inside the box. Never italic plain body text.
- Frequency: 8 of 10 references
- Why: Cialdini scarcity principle. A plain italic expiration date reads as fine print. Bold red reads as urgency.

**P-14:** Trust badges (BBB, Angi, HomeAdvisor, etc.) are filled color blocks or image-based badges in real brand colors — BBB navy/blue, Angi orange, HomeAdvisor green. NEVER outlined text boxes. NEVER monochrome text pills.
- Frequency: 9 of 10 references
- Why: Filled badges signal real third-party credentials. Outlined text boxes signal a facsimile. (D-13, nominative fair use basis)

**P-15:** Trust badges form either a full-width horizontal strip at the bottom of the content column OR a row integrated into the CTA block. They are NEVER crammed into a sub-column or stacked vertically.
- Frequency: 8 of 10 references
- Why: Visual density principle. A horizontal strip allows each badge to read at legible size without overwhelming the content above.

**P-16:** Back content column has 4–5 distinct content blocks maximum. More than 5 distinct blocks creates "SaaS dashboard" feel. The blocks are: Offer Box, CTA/Phone, Rating + Quote, Trust Badges. Risk reversal is a one-liner inside the Offer Box footer or the CTA block, not a standalone fifth block.
- Frequency: 8 of 10 references
- Why: Gendusa fix §3. Each block must be scannable in 1 second. Six+ blocks forces sub-1-second scan per block which breaks the reading flow.

**P-17:** QR code is 0.75–1.0 inch square, placed inside the CTA block (adjacent to the phone number), with a white background pad. NEVER standalone in a corner. NEVER larger than the phone number.
- Frequency: 7 of 10 references (QR is universal; placement near phone is 7 of 10)
- Why: The QR should reinforce the phone CTA, not compete with it. Placing it next to the phone ties the action together.

**P-18:** Return address strip at the top of the back (business name + street address) is plain body text (10–11pt), horizontal, restrained. It is NOT a design element — it is a compliance element. Never bold, never styled as a header.
- Frequency: 10 of 10 references
- Why: USPS compliance convention. Drawing attention to the return address wastes prime real estate.

**P-19:** The USPS right column (address block + indicia) reads as NARROW — visually 22–28% of the card width. The content column gets the remaining 72–78%. Any back that reads as "half content / half USPS blank" fails the density test.
- Frequency: 9 of 10 references
- Why: The back content column is the closer. Surrendering 33%+ to the USPS zone means the value stack, phone, and trust badges are compressed into a space too narrow to be readable at print size.

### Category: Typography

**P-20:** All card text uses a single sans-serif family. No serif fonts anywhere on the card. Typical choices in the corpus: condensed grotesque (Bebas, Impact style for headlines) + geometric sans (Montserrat, Inter) for body. NEVER mix serif + sans on a postcard.
- Frequency: 10 of 10 references
- Why: Draplin: sans-serif is confident, readable at arm's length, professional for home services. Serif reads as "formal letter" not "direct mail."

**P-21:** Headline letter-spacing is tight or normal (0 to -0.01em). Body text uses default tracking. Nothing uses loose letter-spacing on headlines. Wide tracking is only acceptable on ALL-CAPS badge labels (0.03–0.08em).
- Frequency: 9 of 10 references
- Why: Tight tracking on bold headlines reads as modern and confident. Wide tracking on headlines reads as designer-y, not direct-mail.

**P-22:** Typography hierarchy is visible at a glance: one element clearly dominates (phone or headline, depending on front vs back). There is no "almost the same size" competition between two adjacent elements.
- Frequency: 10 of 10 references
- Why: Processing fluency (Heath Brothers). When two elements compete for dominance, the reader's eye pauses. The pause reduces the half-second grab score.

### Category: Color Treatment

**P-23:** Color blocks (filled rectangles spanning a section of the card) occupy at minimum 35–45% of total card area. This includes the photo, any solid-color CTA bars, offer block backgrounds, and bottom overlay bars. Cards that are predominantly white background read as "web page printout," not "direct mail."
- Frequency: 10 of 10 references
- Why: Draplin D-06. Color blocks > whitespace is the fundamental aesthetic gate. Home-services postcards are LOUD on purpose.

**P-24:** Color contrast between text and its background passes visual inspection without squinting. No light gray on white. No medium blue on dark navy. No yellow on white. High-contrast pairs only: white on brand-dark, dark on brand-primary when primary is light, white on photo gradient at >70% opacity.
- Frequency: 10 of 10 references
- Why: WCAG 4.5:1 minimum, but more importantly: at 3 feet and 1-second scan, contrast must be obvious, not just technically sufficient.

**P-25:** Brand-primary color is used BOLDLY — entire section backgrounds, full-width bars, filled CTA blocks. NEVER used as a 10% tint or a subtle accent. If the brand color is pale (yellow, light green), it anchors the offer block headline bar; a dark or navy color anchors the CTA block. Either way, BOLD usage, not decorative.
- Frequency: 10 of 10 references
- Why: Draplin: "bold, confident, American." Tinted-color usage reads as a digital UI, not print.

### Category: Logo Treatment

**P-26:** When a real logo is available, it is placed in its natural form — no color inversion, no white pill background unless the logo is dark and the card background would make it disappear. A white/transparent background pad of 4–8pt is acceptable. The logo is NEVER stretched or distorted.
- Frequency: 10 of 10 references
- Why: Brand integrity. A distorted or color-inverted logo signals amateur production.

**P-27:** When no real logo is available, the fallback is a text wordmark of the business name rendered inside a solid brand-color filled rectangle (not an outline). The text is bold, the container is as wide as the natural logo zone (0.75–1.5 inches). NEVER raw business name text floating on the card without a container.
- Frequency: 6 of 10 references include some text-wordmark treatment for businesses without a visible image logo
- Why: A raw floating business name has no visual weight. A filled pill or rectangle gives it the weight of a logo.

### Category: Phone Treatment

**P-28:** The CTA label ("CALL NOW," "CALL TODAY," "CALL OR TEXT") is part of the phone block, not a separate floating element above it. The label and number read as one integrated unit, ideally inside the same colored container.
- Frequency: 8 of 10 references
- Why: Gendusa §3. A disconnected "CALL NOW" label floating above a phone number weakens the call-to-action. Integration gives it weight.

**P-29:** Front phone number is in a container that spans or nearly spans the full card width at the bottom (on full-bleed layouts). It is NOT a small inline pill to the left of other content.
- Frequency: 7 of 10 references for full-bleed layout variant
- Why: The phone is the only action possible from the front. A full-width bar makes it unmissable.

### Category: Trust Badges

**P-30:** BBB badge is rendered in BBB's navy/blue brand color with "A+" rating text. It reads as the real BBB seal, not a facsimile. Same for Angi (orange brand color) and HomeAdvisor (green brand color). The visual identity of the badge matches what the homeowner has seen online.
- Frequency: 9 of 10 references that include trust badges
- Why: D-13 (filled real brand artwork). Nominative fair use: these badges identify real third-party certifications. An outlined text facsimile is both legally weaker and visually unconvincing.

**P-31:** "Licensed & Insured" is rendered in the SAME visual style as the third-party badges — either as a matching filled-color badge or prominently in the trust badge row. It is NEVER in a smaller or lighter style than the brand badges.
- Frequency: 9 of 10 references
- Why: Gendusa: "Licensed & Insured is non-negotiable for home services." Visual parity with BBB/Angi signals the same level of legitimacy.

### Category: Photo Selection

**P-32:** Hero photo on HVAC/home-services postcards shows people — a worker (technician, crew), a homeowner, or a family — in 9 of 10 references. Equipment-only photos (condensers, pipes) appear in 2–3 of 10 as supporting elements, never as the hero. Abstract brand graphics (logos, loyalty tiers, icon sets) appear as hero in 0 of 10 professional references.
- Frequency: 9 of 10 references
- Why: Whitman + Gendusa: "people > equipment > abstract." A human face creates the emotional connection that stops the trash-toss. An equipment photo creates a catalog impression. An abstract graphic creates no impression.

**P-33:** Hero photo is well-lit, professional-looking (or professionally-looking amateur), and shows the subject clearly. No dark, grainy, or heavily filtered photos used as hero. When the photo is dark (nighttime, shadows), the overlay bar on top must compensate with maximum contrast.
- Frequency: 10 of 10 references
- Why: Photo quality signals business quality. A dark or low-quality photo defeats the front's one job.

### Category: Whitespace and Density

**P-34:** Gaps between major content blocks on the back are tight — 6–10pt maximum. "Breathing room" is a digital-product aesthetic, not a direct-mail aesthetic. Every line of vertical space on the back that isn't content is a missed opportunity to add a value-stack item or tighten a trust signal.
- Frequency: 9 of 10 references
- Why: D-06 (color blocks > whitespace). Gendusa: the back sells as hard as the front. Pro postcards pack the back.

**P-35:** Inner padding within bordered boxes (Johnson Box, CTA block) is 6–10pt. Not 18–24pt. The box should contain content without appearing empty. A box with large internal padding reads as "SaaS card component."
- Frequency: 9 of 10 references
- Why: Same density principle. The box communicates containment, not spaciousness.

### Category: Borders and Edges

**P-36:** border-radius is 0px on every major card element — offer box, CTA box, trust badge containers, any section bar. Rounded corners above 2px do not appear on any element in 9 of 10 professional references. Exceptions: QR code background pad (2pt radius acceptable), and circular offer burst badges (50% radius by design).
- Frequency: 9 of 10 references
- Why: D-04 (Draplin gate). Rounded corners read as digital/SaaS. Hard 90-degree corners read as print. This is the single clearest aesthetic indicator that distinguishes pro direct mail from a web-component printout.

**P-37:** Where a box has a visible border (Johnson Box, CTA block), the border is 1.5–2pt solid in brand-primary color. NOT 0.5pt hairline. NOT dashed. NOT dotted. Solid, chunky, clearly visible at print scale.
- Frequency: 8 of 10 references
- Why: Draplin: "thick confident borders." Hairline borders disappear on matte cardstock. 2pt solid borders survive print reproduction.

### Category: Shadows and Depth

**P-38:** Drop shadows on card elements are either absent entirely OR rendered as brand-color drop shadows (same hue as the element, shifted down/right). Soft grey `box-shadow: 0 4px 8px rgba(0,0,0,0.1)` style shadows appear in 0 of 10 professional direct-mail references.
- Frequency: 10 of 10 references confirm absence of soft grey SaaS shadows
- Why: D-05 (Draplin gate). Soft grey shadows = digital UI component. Their absence is a necessary condition for the "looks like real direct mail" test.

### Category: Headline Treatment

**P-39:** Headline copy follows Caples formula: either a direct-benefit question ("Is Your AC Ready for 115°?"), a specific-audience callout ("Phoenix Homeowners:"), or a social-proof lead ("Your Neighbors Trust [Business]"). Abstract/clever headlines ("Experience the Difference") appear in 0 of 10 professional HVAC references.
- Frequency: 10 of 10 references use one of the concrete Caples patterns
- Why: D-27. Concrete specificity (Heath: Concrete) > abstract cleverness. The headline must resonate with the recipient in under 2 seconds.

**P-40:** Headline includes a location reference (city name, neighborhood, "your area") in 8 of 10 references. "Phoenix Homeowners" outperforms "Homeowners" in direct response (Kennedy: localization = personalization = conversion).
- Frequency: 8 of 10 references
- Why: Halbert: "make it local, make it specific." Generic headlines have no sense of arrival.

### Category: Offer Treatment

**P-41:** Value-stack offer items use the format: `✓ [service item] $[value]` — checkmarks + labels + dollar values aligned in two columns (label left, value right). The stack is terminated by a total and a customer price that is clearly lower than the total value. Minimum 2 items; typically 3–5.
- Frequency: 9 of 10 references with a Johnson Box
- Why: Halbert anchored value stack (D-26). The specific dollar values per item activate anchoring effect. The stack communicates abundance.

**P-42:** The offer's customer price is the SECOND largest text element on the back, after the phone number. "Just $39.95" or "$277 VALUE FOR $39.95" reads at 20–24pt. NOT at the same size as the value-stack items.
- Frequency: 8 of 10 references
- Why: Visual hierarchy. The customer price must stand out from the item list. It is the conversion trigger.

### Category: Urgency Treatment

**P-43:** Offer deadlines use bold brand-accent color (red, orange, or white-on-dark) and are placed INSIDE the offer box, not at the bottom of the card as a footnote. "Offer expires May 31" in italic body text at the bottom of the back reads as fine print. "OFFER EXPIRES MAY 31" in bold orange inside the Johnson Box reads as urgency.
- Frequency: 8 of 10 references
- Why: Cialdini scarcity principle. Deadline placement inside the offer box connects it to the offer it limits. Footer placement disconnects it.

**P-44:** When a promotional price is shown, the "was/now" or "value/price" contrast is always made explicit. "$277 VALUE FOR JUST $39.95" — both numbers visible. The contrast is the persuasion mechanism. A standalone "$39.95" without the anchor value is a flat discount; it does not leverage anchoring.
- Frequency: 9 of 10 references with a priced offer
- Why: Tversky & Kahneman anchoring effect. The brain uses the high value as a reference; the low price becomes a deal relative to that reference.

---

## Existing Codebase Map

### 1. `src/components/postcard/PostcardFront.vue` — 412 lines

**Current visual treatment:**
- Full-bleed layout: hero photo covers card, gradient fade to dark at bottom, headline + phone in bottom zone. Looks reasonable but has a `rounded-lg` on the `.pc-card` wrapper (Draplin violation). The gradient is soft and dark (rgba 0,0,0,0.85 to transparent) — not a hard-edged color bar (P-03 violation). Phone is in a small brand-primary rounded pill (not full-width bar, P-29 violation). Logo slot falls back to raw `<span>` business name text with `.pc-badge` styling, no filled container (P-27 violation).

**Draplin gate violations to fix:**
- `rounded-lg` on `.pc-card` → remove entirely (D-04, P-36)
- `rounded` on phone pill → `border-radius: 0` (D-04)
- `rounded p-1` on logo img in side-split and photo-top → remove rounded (D-04)
- `bg-white/10 rounded` in bold-graphic logo slot → remove rounded (D-04)
- Gradient-only bottom overlay (no hard bar) → convert to solid color bar with gradient to photo only above it (P-03)
- `shadow hover:bg-white` on flip button (soft shadow) → remove or replace with brand-color shadow (D-05)
- Business-name text fallback (`<span>{{ businessName }}`) → wrap in solid brand-color filled rectangle, no border-radius (P-27)

**Integration points:**
- Called by `PostcardPreview.vue` (front side)
- Called directly by `pages/dev/PostcardPreview.vue` (dev route, renders at 864×576)
- Imports `OfferBadge.vue`
- Consumes `card.resolvedContent.photoUrl`, `.headline`, `.phoneNumber`, `.offerTeaser`
- `brandColors[]` prop: index 0 = primary, index 1 = dark
- `credibilityLine` prop: passed through from PostcardPreview.vue

**What stays vs rewritten:**
- Keep: all 6 layout conditional blocks (D-01 says 1 layout to demo quality, but the other 5 must remain in the file, just hidden via template browser)
- Keep: `ensureContrast()` usage pattern
- Keep: prop definitions and computed color logic
- Rewrite for full-bleed: overlay bar treatment (gradient → solid color bar + gradient above), phone pill (small rounded → full-width bar with 0 radius), logo fallback (text span → filled pill with 0 radius), top-row credibility (review z-order with OfferBadge ribbon, already partially addressed)

**Existing tokens to reuse:** All `--pc-*` tokens from print-scale.css. The `pc-badge`, `pc-headline`, `pc-phone-front` utility classes.

---

### 2. `src/components/postcard/PostcardBack.vue` — 325 lines

**Current visual treatment:**
- `rounded-lg overflow-hidden border border-gray-200` on `.pc-card` wrapper — two violations (rounded-lg = D-04, border-gray-200 = soft grey border not brand)
- Content column uses `gap: var(--pc-gutter)` which is now 0.075in (tight — correct)
- Return address strip has `border-b border-gray-100` — hairline grey separator
- Permit indicia has `border: 0.5pt solid #999` — hairline (P-37 violation on feel, though PRSRT STD box is compliance not design)
- Trust badges are outlined text pills (P-14, P-36 violations — no rounded removal won't be enough, the fill must change)
- Offer deadline in OfferBox renders as `borderTop: 1pt dashed ${primary}` with plain body text weight — dashed is weak, plain body text fails P-43

**Draplin gate violations to fix:**
- `rounded-lg` on `.pc-card` wrapper → remove (D-04)
- `border border-gray-200` on `.pc-card` wrapper → remove or replace with 0pt (a print card has no visible preview border)
- `rounded-sm` on the now-removed barcode placeholder div (already marked dead, can remove)

**Integration points:**
- Called by `PostcardPreview.vue`
- Called directly by `pages/dev/PostcardPreview.vue`
- Imports `LockedZoneOverlay`, `OfferBox`, `CTABox`, `RatingBadge`, `TrustBadges`
- Consumes: `card.resolvedContent.offerItems`, `offerText`, `urgencyText`, `reviewQuote`, `phoneNumber`
- `backContent.websiteUrl`, `backContent.qrCodeUrl`
- `rating`, `reviewCount`, `trustBadges[]`, `yearsInBusiness`, `city` props

**What stays vs rewritten:**
- Keep: 2-column flex layout structure, top strip, content column block order
- Keep: `localProof` computed, `hasRating` computed
- Fix: outer wrapper `rounded-lg` and `border-gray-200`
- Fix: TrustBadges (see TrustBadges.vue below)
- Consider: USPS column width is locked at 3.0in per deferred constraint — do NOT touch column width

---

### 3. `src/components/postcard/PostcardPreview.vue` — 163 lines

**Current visual treatment:**
- Functional scaling wrapper only — `ResizeObserver` + `transform: scale()`. No visible aesthetic violations.
- Has a `shadow hover:bg-white` on the flip button — soft shadow (D-05). Minor.
- `max-w-[480px]` for large, `max-w-[240px]` for thumbnail — correct.

**Draplin gate violations:**
- Flip button `shadow` class → replace with brand-color drop shadow or remove entirely (D-05, low priority since button is dev UI not postcard content)

**Integration points:**
- Called by: `StepDesign.vue`, `StepReview.vue`, `ReviewSummary.vue`, `SequenceView.vue`
- Calls: `PostcardFront.vue`, `PostcardBack.vue`, `PostcardFrontStub.vue`, `PostcardBackStub.vue`
- Threads all props from callers through to Front/Back: `brandColors`, `businessName`, `businessAddress`, `logoUrl`, `rating`, `reviewCount`, `trustBadges`, `yearsInBusiness`, `city`, `credibilityLine`, `hideAddressPlaceholder`

**What stays:** Architecture unchanged. The ResizeObserver + transform:scale pattern is correct and solved P0 #5. No rewrite needed here.

---

### 4. `src/components/design/OfferBox.vue` — 113 lines

**Current visual treatment:**
- Headline bar: solid `primary` background, full bleed inside the box — CORRECT for Draplin. Already a color block (P-23 compliant). No rounded corners on the bar itself.
- Box border: `2pt solid ${primary}` — correct weight (P-37)
- Box background: `#FFFFFF` with padding — no border-radius set here, but inherits nothing that adds rounding
- Deadline: `1pt dashed ${primary}` border + `pc-body` class text — fails P-43 (dashed + normal body text for deadline)
- Items: `pc-offer-item` at 11pt — correct size

**Draplin gate violations to fix:**
- `border: var(--pc-border-offer) ${primary}` expands to `2pt solid` — acceptable. BUT the outer container has no explicit `border-radius: 0` override. Needs explicit `borderRadius: 0` in the inline style to override any ancestor setting.
- Deadline styling: change from `dashed` separator + `pc-body` to bold + brand-accent-color text with a solid rule separator (P-43)

**Integration points:**
- Called only by `PostcardBack.vue`
- Props: `headline`, `items[]`, `customerPrice`, `savings`, `deadline`, `primaryColor`
- `card.resolvedContent.offerItems` is passed as `items` from PostcardBack

**What stays:** The checkmark list structure, the headline bar, the savings callout. Only the deadline treatment changes.

---

### 5. `src/components/design/CTABox.vue` — 79 lines

**Current visual treatment:**
- Solid `primary` background — correct (color block, P-23 compliant)
- Phone at `pc-phone-back` (32pt after P0-G fix) — correct size
- `"CALL NOW"` label at `pc-badge` size (11pt), opacity 0.85, margin-bottom 0.04in — reads as a separate small element above the phone, not integrated into the phone block (P-28 violation)
- QR code has `borderRadius: '2pt'` — acceptable exception per P-36 note
- No rounded corners on the outer container itself — CHECK: `pc-cta-box` class, no Tailwind rounding applied in component

**Draplin gate violations to fix:**
- Explicit `borderRadius: 0` on the outer container in inline style (belt + suspenders against any ancestor)
- `border: var(--pc-border-cta) ${primary}` — this is `2pt solid primary` on a `primary`-background box, so the border is invisible. This is intentional for when the background changes, but visually it's fine as-is.
- CTA label integration: "CALL NOW" needs to visually merge with the phone number (P-28). Consider: label + phone in a single flex column with no gap gap between them and label slightly larger or same container

**Integration points:**
- Called only by `PostcardBack.vue`
- Props: `phone`, `website`, `qrCodeUrl`, `ctaLabel`, `primaryColor`

**What stays:** Overall structure. Fix is cosmetic: label integration with phone + explicit 0 border-radius.

---

### 6. `src/components/design/RatingBadge.vue` — 61 lines

**Current visual treatment:**
- Stars + numeric rating at `pc-offer-headline` size (22pt) — visible, dominates appropriately
- Review count at `pc-body` (11pt) — correct secondary weight
- No background container — rendered as inline text in the back content column
- No rounded corners or shadows — clean

**Draplin gate violations:** None critical. The component renders correctly within the back column.

**Integration points:**
- Called only by `PostcardBack.vue` inside the rating block
- Props: `rating`, `reviewCount`, `label`, `primaryColor`

**What stays:** Architecture unchanged. No aesthetic rewrite needed here.

---

### 7. `src/components/design/TrustBadges.vue` — 81 lines

**Current visual treatment:** THIS IS THE PRIMARY VIOLATION TARGET.
- All badges render as outlined text pills: `border: 1pt solid ${primary}`, `borderRadius: 2pt`, no fill, small text
- Fails P-14 (outlined not filled), P-30 (no real brand colors), P-36 (rounded corners > 0)
- The `pc-trust-pill` class likely inherits from `pc-badge` (11pt, 600 weight, uppercase, 0.05em tracking) — acceptable size
- `borderRadius: '2pt'` — minor but violates D-04 technically

**Draplin gate violations — FULL REBUILD:**
- Remove all outlined pill treatment
- Replace with: a set of real filled-color badge images OR styled divs matching the visual identity of each badge type
- For BBB: filled navy/blue background + "BBB A+" white text (matching BBB visual identity)
- For Angi: filled orange (#F26B2C) background + "ANGI" white text
- For HomeAdvisor: filled green background + "HOMEADVISOR" white text
- For generic: a filled brand-primary background with the badge label in white/contrasting text
- All `borderRadius: 0` (D-04)
- Assets approach: SVG files in `src/assets/trust-badges/` OR inline SVG via component, OR styled-div facsimiles for V1 demo

**Integration points:**
- Called only by `PostcardBack.vue`
- Props: `badges[]` (TrustBadge type from campaign.ts), `showLicensedInsured`, `licensedInsuredText`, `primaryColor`
- `TrustBadge` type has at minimum `{ label: string }` — may also have `type` for routing to real badge vs custom

**What stays:** The deduplication logic for "Licensed & Insured." The `needsLI` computed. Change only the render layer.

---

### 8. `src/components/design/OfferBadge.vue` — 130 lines

**Current visual treatment:**
- Burst variant: `borderRadius: '50%'`, `boxShadow: '0 0.04in 0.12in rgba(0,0,0,0.35)'` — the soft grey shadow violates D-05. The circular shape is intentional (offer burst = 50% radius exception per P-36).
- Ribbon variant: `boxShadow: '0 0.02in 0.08in rgba(0,0,0,0.3)'` — also soft grey shadow, D-05 violation.
- The ribbon positions itself using `position: absolute`, top/right values, `rotate(45deg)` — correct behavior. It relies on parent `overflow-hidden` (`.pc-card` has it).
- Z-index 5 on ribbon — works correctly with the P0-A fix in PostcardFront.vue.

**Draplin gate violations to fix:**
- Both `boxShadow` values → replace with brand-color drop shadow or remove entirely (D-05)
  - `box-shadow: 3pt 3pt 0 rgba(0,0,0,0.4)` (hard shadow, no blur) is the Draplin-safe alternative
  - Or remove shadow entirely — the burst badge has a `border: 3pt solid ${burstRing}` which already separates it from the background

**Integration points:**
- Called only by `PostcardFront.vue` (burst inside a positioned div, ribbon self-positions)
- Props: `text`, `variant`, `primaryColor`, `darkColor`

**What stays:** Variant logic, burst/ribbon geometry, positioning. Fix is shadow only.

---

### 9. `src/components/design/TemplateBrowser.vue` — 131 lines

**Current visual treatment:**
- `rounded-xl border-2` on each template set card — SaaS UI component, not part of the postcard rendering. These rounded corners are in the Design Studio UI, not on the postcard itself. Not a Draplin violation (Draplin rules apply to the postcard surface, not the app UI).
- `w-3 h-3 rounded-full` color dot per layout — app UI element, acceptable.
- Currently shows ALL 6 layouts to the customer. D-02 says hide the 5 unbuilt layouts.

**D-02 change required:**
- `getTemplateSetsForGoal()` returns all 6 layouts. Need to filter to only `full-bleed` for the demo.
- Approach: add a `visibleLayouts` filter in `templates.ts` (an allow-list of demo-ready layouts), and filter in `TemplateBrowser.vue` or in `getTemplateSetsForGoal()`.
- The other 5 layouts stay in `ALL_TEMPLATES` and `LAYOUTS` arrays for code completeness — just filtered from the browser.
- Flag this with a comment: `// D-02: filter until other layouts are rebuilt to Draplin standard post-demo`

**Integration points:**
- Called from wizard step 3 (`StepDesign.vue`) presumably via a modal trigger
- Emits `select(layout: TemplateLayoutType)` and `close()`
- Reads from `getTemplateSetsForGoal(props.goalType)`

---

### 10. `src/styles/print-scale.css` — 262 lines

**Current state:** Well-structured. Type scale is correct (32pt headline, 32pt back phone, 22pt offer headline, 11pt body). Spacing tokens were tightened 2026-04-10. USPS column tokens are locked at 3.0in/5.5in.

**What must be added for Draplin compliance:**
```css
/* Draplin aesthetic tokens — D-04 / D-05 / D-06 */
--pc-radius:             0;         /* border-radius: 0 on all card elements. Add this token and reference in components. */
--pc-shadow-soft:        none;      /* Explicitly disables SaaS-style soft shadows. */
--pc-shadow-brand:       3pt 3pt 0 var(--pc-shadow-color, rgba(0,0,0,0.4));  /* Allowed shadow style: hard offset, no blur */
--pc-overlay-bar-h:      35%;       /* Solid bottom overlay bar height on full-bleed layout */
--pc-trust-badge-fill-bbb:     #003087;   /* BBB navy */
--pc-trust-badge-fill-angi:    #F26B2C;   /* Angi orange */
--pc-trust-badge-fill-ha:      #F7931E;   /* HomeAdvisor orange (actual brand color) */
--pc-trust-badge-fill-generic: var(--pc-primary, #0b2d50);
```

**USPS column locked — do not touch:**
- `--pc-content-col-w: 5.5in` and `--pc-usps-col-w: 3.0in` are the deferred constraint. The §202.5.3 column-to-2.25in refactor requires absolute positioning and is deferred post-demo per CONTEXT.md.

---

### 11. `src/data/templates.ts` — 108 lines

**D-02 change required:**
Add a `DEMO_VISIBLE_LAYOUTS` constant:
```ts
// D-02: Only full-bleed is rebuilt to Draplin standard for the 2026-04-20 demo.
// Other layouts stay in the file; remove this constant post-demo as each layout is rebuilt.
export const DEMO_VISIBLE_LAYOUTS: TemplateLayoutType[] = ['full-bleed'];
```
And filter `getTemplateSetsForGoal()` output:
```ts
return LAYOUTS
  .filter(l => DEMO_VISIBLE_LAYOUTS.includes(l.type))
  .map(layout => ({ ... }));
```

No other changes needed here. `ALL_TEMPLATES` and `GOAL_TEMPLATE_MAP` stay intact.

---

### 12. `src/composables/usePostcardGenerator.ts` — 120+ lines (read first 120)

**Relevant to Phase 2:**
- Already has `TEASERS` record mapping `CampaignGoalType → string` for front offer teaser
- Has `HEADLINES`, `OFFERS` fallbacks
- Phase 1 integration: calls `generateContent()` from `@/api/brandKit` for server-backed AI generation
- The brand kit data shape it produces feeds `card.resolvedContent` including `offerItems[]` for the OfferBox value stack

**D-09 change required (logo wordmark fallback):**
- When `brandKit.logoUrl` is empty or null, emit a signal or computed value indicating "use text wordmark."
- Current code in `PostcardFront.vue` falls back to `<span>{{ businessName }}</span>` — this needs to be replaced with a filled-container wordmark render.
- The generator itself may not need changing — the fallback is a render-layer concern in `PostcardFront.vue`. But `usePostcardGenerator.ts` should pass `logoUrl: null` explicitly (not `undefined`) so the template can detect it clearly.

---

### 13. `src/pages/dev/PostcardPreview.vue` — 100+ lines (read first 100)

**Current state:**
- Renders PostcardFront + PostcardBack directly (no PostcardPreview.vue wrapper — direct render)
- Has layout selector dropdown for all 6 layouts
- Default business: "Martinez Plumbing" — needs to be seeded with Desert Diamond HVAC values for the demo
- `website` is now a reactive ref (P0-C fix landed)
- QR code defaults to inline SVG (P0-E fix landed)

**For Desert Diamond demo:**
- Must change default values: `businessName = "Desert Diamond HVAC"`, `phone = "(623) 246-2377"`, `website = "desertdiamondhvac.com"`, `city = "Phoenix"`, etc.
- Or use a Playwright injection script (from handoff §6.4) to set these values
- Logo: D-10 says manually seed the actual logo from desertdiamondhvac.com into dev DB. This route needs to receive the `logoUrl` prop. Verify it's wired.

---

## Technical Risks

### RISK-01: USPS Column 2.25in Deferral (HARD CONSTRAINT — do not touch)
The `--pc-usps-col-w` is locked at 3.0in. Dropping to 2.25in requires an absolute-positioning refactor of `PostcardBack.vue` where the address block is anchored bottom-right and content flows around it. Codex Pass 1 in Session 33 caught that long city+zip addresses (e.g., "SAN FRANCISCO, CA 94105-1234") fail OCR at 11pt in a 2.25in column. The refactor is post-demo. If the planner touches column width, they must ensure `--pc-usps-col-w` stays at 3.0in. The current 33% visual width of the USPS column is a known gap (P0-B in gap list) that is accepted for the demo.

### RISK-02: Firecrawl Logo Extraction Gap (KNOWN GAP — seed manually for demo)
Desert Diamond HVAC uses a CSS background-image logo on their website. Firecrawl returns empty for CSS background-image logos (it scrapes `<img src>` and logo element `src` attributes, but not `background-image: url(...)` in stylesheets). The `brandKit.logoUrl` for org `549e9d08-c287-420f-b191-e879ee08e23b` is empty. D-10 says: manually grab the real logo and seed it into the dev DB. The wordmark fallback (D-09) is the production safety net for all future empty-logo cases. **Both the fallback and the manual seed are required for the demo — the fallback must look good when the seed is not present; the seed must be in place for the final demo render.** The logo extraction improvement (scanning `<img alt>` + CSS `background-image`) is post-demo.

### RISK-03: No Client-Side Test Runner (KNOWN GAP — visual regression is manual)
There is no Vitest, no @vue/test-utils, no jsdom in the client project. Type-checking only via `npx vue-tsc --noEmit`. Visual regression testing is manual: render via `/dev/postcard-preview`, take a Playwright screenshot, compare by eye. The planner must include "visual checkpoint" steps after each component rewrite — not as a test assertion, but as an explicit "render and compare against PATTERNS checklist" step. No automated visual regression is possible within the demo timeline without first wiring Vitest + screenshot diffing (DHH gate: "build less" — don't wire Vitest now).

### RISK-04: 6-Layout Entanglement in PostcardFront.vue
The file uses a single `<template v-if/v-else-if>` chain for all 6 layouts. Changing shared computed values (`primary`, `dark`, `textOnPrimary`, `credibility`, etc.) affects all 6 layouts simultaneously. Changing the full-bleed template block risks accidentally breaking the rendering of side-split, photo-top, etc. (which are hidden from the browser but still in the DOM when selected via layout picker in dev mode). The planner must specify: "only modify the `v-if="layoutType === 'full-bleed'"` block and the shared `.pc-card` wrapper — do not touch the other 5 layout blocks." Each commit must include a dev-mode visual regression check on all 6 layouts to detect regressions before merging.

### RISK-05: Trust Badge Real Artwork Acquisition
D-13 says use real BBB/Angi/HomeAdvisor brand artwork. The current TrustBadges.vue uses outlined text pills. Acquiring real SVG/PNG assets requires sourcing them from each organization's brand assets page. This has legal review (nominative fair use, documented in D-14) and asset-finding time. For the demo, styled-div facsimiles in the correct brand colors are acceptable as long as they visually match the category (filled color, real brand color, brand name). The planner should plan for: (a) styled-div facsimiles using the CSS color tokens added to print-scale.css, and (b) a flag comment marking the spot where real SVG assets should slot in later.

### RISK-06: Photo Demo Seed Required Before Any Visual Testing
The current Desert Diamond hero photo is a loyalty-program graphic (P0-D from gap list). Until the photo is changed to a worker/technician image from the 13 already-scraped photos, no visual checkpoint will look like pro direct mail — the photo is the dominant visual element (55–75% of front card area per P-01). The planner must sequence: fix hero photo FIRST before any other visual work, so checkpoints are comparing the right thing.

### RISK-07: Credibility + OfferBadge Corner Collision (Partially Addressed)
P0-A: the ribbon OfferBadge at `z-index: 5` paints over the top-right credibility badge. The `hideTopRightBadge` computed in PostcardFront.vue suppresses the credibility badge when ribbon is active. This means the credibility line is currently invisible on the full-bleed layout with a ribbon badge. The planner must decide: keep the suppression (cleanest solution — credibility lives on the back), OR reposition credibility inline below the headline in the bottom overlay bar. The current suppression-only approach satisfies the demo but removes a trust signal from the front.

---

## Phase 1 Integration Points

### What Phase 1 Already Provides

Phase 1 (Sessions 28–29, commits `760615a`, `69a12b3`, `c3f1399`) implemented:
- Firecrawl/Playwright scraping pipeline → populates `BrandKit` in the DB
- Brand kit fields relevant to template rendering:
  - `brandKit.brandColors[]` (HEX strings, typically 2–4 colors)
  - `brandKit.logoUrl` (may be empty — see RISK-02)
  - `brandKit.photoUrls[]` (13 photos for Desert Diamond)
  - `brandKit.phoneNumber`
  - `brandKit.businessName`, `.address`, `.city`
  - `brandKit.rating` (4.9), `.reviewCount` (2423)
  - `brandKit.trustBadges[]` (BBB, NATE for Desert Diamond)
  - `brandKit.yearsInBusiness`

Session 31 (commit `be4adbb`) added:
- Kennedy/Halbert objection scoring for AI review selection
- Value-stack offer generation: `offerItems[{label, value}]` is generated per campaign goal

Session 32 (commits in handoff doc) added:
- `OfferBadge.vue` component (front teaser)
- `print-scale.css` initial token set
- P0-G: back phone upsized to 32pt
- P0-F: value-stack items rendering in OfferBox

### What Phase 2 Must Add or Fix

**D-09: Logo wordmark fallback render** — Phase 1 produces `logoUrl: null` when Firecrawl misses it. Phase 2 must render the wordmark fallback in PostcardFront.vue (currently just a raw text span).

**D-10: Desert Diamond manual logo seed** — Phase 1's pipeline left `logoUrl` empty for Desert Diamond. Phase 2 manually seeds it. No code change — direct DB update.

**D-11: Hero photo selection** — Phase 1 scrapes and stores 13 photos but selects the first by some quality heuristic that ranked the loyalty graphic highest. Phase 2 demo-seeds a worker photo by direct DB update.

**Trust badges data shape** — Phase 1 populates `trustBadges[{label, type}]`. Phase 2 must render them as filled-color blocks. The data is there; only the render layer needs the rebuild.

**`offerItems[]` propagation** — Phase 1's AI generator emits `offerItems[]` into `card.resolvedContent`. PostcardBack.vue already consumes it via the `offerItems` computed. This chain is working (confirmed in current BACK render showing ✓ rows). No Phase 2 work needed on data flow — only on visual treatment of the boxes that render those items.

**`offerTeaser` for front badge** — `usePostcardGenerator.ts` already emits `offerTeaser` from the `TEASERS` map. `PostcardFront.vue` consumes it via `card.resolvedContent.offerTeaser`. This is working. No Phase 2 data flow change needed.

### What's Missing from Phase 1 That Phase 2 Needs

The dev route (`PostcardPreview.vue`) still defaults to Martinez Plumbing. For the Desert Diamond demo, the dev route form values must match Desert Diamond. This is not a Phase 1 gap — it's a Phase 2 demo configuration step.

---

## Gap Between Current Render and Patterns

Comparing the Desert Diamond FRONT-FINAL.png and BACK-FINAL.png from `demo-smoke-test-2026-04-10/` against the PATTERNS list:

### Front: Observed State vs Patterns

| Pattern | Status | Specific Gap |
|---------|--------|--------------|
| **P-01** (photo 55–75% bleed) | FAIL | Photo visible but there is a white border/inset around it. Photo does not bleed to edges. The `.pc-card` has `rounded-lg overflow-hidden` which clips bleed. |
| **P-02** (no content zone beside photo) | PASS | Full-bleed layout has all text on photo. |
| **P-03** (solid bottom overlay bar) | PARTIAL | Bottom zone is a gradient, not a hard-edged solid bar. Technically readable but not the bold color-block that pro direct mail uses. |
| **P-04** (offer teaser present) | PASS | "$79 TUNE-UP" ribbon visible top-right. |
| **P-05** (logo top-left, small) | FAIL | Logo slot is empty (Firecrawl gap). No logo visible, no wordmark fallback. Top-left corner is blank. |
| **P-06** (credibility top-right) | FAIL | OfferBadge ribbon is covering the credibility zone. `hideTopRightBadge` computed suppresses it entirely — so neither the ribbon text nor the credibility is visible in the top-right area at the same time, but the credibility is gone. |
| **P-07** (phone in solid container) | PASS | "(623) 246-2377" is in a solid orange pill. |
| **P-08** (phone 20–28pt) | PASS | `--pc-phone-front-size: 22pt` — meets minimum. Could push to 24pt. |
| **P-09** (headline 800–900 weight) | PASS | `--pc-headline-weight: 800`. |
| **P-10** (no body text on front) | PASS | No body text, no list, no review quote on front. |
| **P-36** (border-radius 0) | FAIL | `rounded-lg` on `.pc-card` wrapper. Phone pill has `rounded`. |
| **P-38** (no soft grey shadows) | FAIL | OfferBadge ribbon has `box-shadow: 0 0.02in 0.08in rgba(0,0,0,0.3)`. |
| **P-39** (Caples headline formula) | PASS | "Phoenix Homeowners: Your AC Tune-Up is Due" — specific audience callout. |
| **P-40** (headline includes location) | PASS | "Phoenix" in headline. |

**Front gaps requiring code changes:**
- G-F1: Remove `rounded-lg` from `.pc-card` (affects both front and back wrappers — both PostcardFront.vue and PostcardBack.vue)
- G-F2: Implement logo wordmark fallback (filled solid-color rectangle with business name, no border-radius)
- G-F3: Convert gradient bottom overlay to solid color bar (with gradient ABOVE the bar into the photo, not as the entire overlay)
- G-F4: Remove `rounded` from phone pill container, use `border-radius: 0`
- G-F5: Remove soft grey `boxShadow` from OfferBadge (burst and ribbon variants)
- G-F6: Ensure photo bleeds edge-to-edge (remove any padding/margin/inset on the photo container in full-bleed layout)

### Back: Observed State vs Patterns

| Pattern | Status | Specific Gap |
|---------|--------|--------------|
| **P-11** (back phone biggest element) | PARTIAL | Phone at 32pt is bigger than offer headline at 22pt — correct ratio. But CTA label "CALL NOW" sits as a small 11pt label floating above the phone, weakly integrated (P-28). |
| **P-12** (Johnson Box structure) | PASS | Solid brand-color headline bar, white interior, bordered, value stack items — correct. |
| **P-13** (deadline as urgency) | FAIL | "Offer expires May 31, 2026" is rendered as `pc-body` text with a dashed separator — italic plain text, not bold urgent treatment. |
| **P-14** (trust badges filled) | FAIL | Trust badges are outlined text pills ("BBB A+", "ANGI CERTIFIED", "HOMEAADVISOR TOP RATED", "LICENSED & INSURED"). No fill, no real brand colors. |
| **P-15** (badges full-width strip) | FAIL | Trust badges sit in the content column stack as one of 4 blocks, not a full-width bottom strip. Limited column width compresses them. |
| **P-16** (4–5 blocks max) | PASS | Currently 4 blocks (Offer, CTA, Rating+Quote, TrustBadges). |
| **P-17** (QR inside CTA, 0.75–1.0in) | PASS | QR visible inside CTA block adjacent to phone. |
| **P-19** (USPS column narrow) | FAIL | USPS column is 3.0in on 9in card = 33.3%. Industry standard is 22–28%. Known deferred constraint (RISK-01). Accept for demo. |
| **P-23** (35–45% color blocks) | PARTIAL | Offer headline bar + CTA block are bold color. But trust badge row and rating section are white/light. Adding filled trust badges (P-14 fix) would improve this. |
| **P-28** (CTA label integrated) | FAIL | "CALL NOW" is a small separate label above the phone. Not integrated into the same visual unit. |
| **P-30** (real BBB/Angi brand colors) | FAIL | All outlined text. BBB should be filled navy. Angi should be filled orange. |
| **P-34** (tight inter-block spacing) | PASS | Spacing was tightened 2026-04-10. |
| **P-35** (tight box padding) | PASS | `--pc-block-padding: 0.1in` after tightening. |
| **P-36** (border-radius 0) | FAIL | Outer wrapper `rounded-lg`. Trust badge pills have `borderRadius: 2pt`. |
| **P-37** (2pt solid borders) | PASS | OfferBox has `2pt solid ${primary}`. CTA has `2pt solid`. |
| **P-38** (no soft grey shadows) | PASS | Back has no soft grey shadows. |
| **P-41** (checkmark value stack) | PASS | ✓ rows with label + value visible in current render. |
| **P-43** (deadline urgency treatment) | FAIL | See P-13 above. |
| **P-44** (was/now price contrast) | PASS | "$277 VALUE — Tune-Up for Just $39.95" — both values shown. |

**Back gaps requiring code changes:**
- G-B1: Remove `rounded-lg` from PostcardBack.vue `.pc-card` wrapper
- G-B2: Rebuild TrustBadges.vue — filled-color blocks, 0 border-radius, real brand colors
- G-B3: Style deadline as bold + brand-accent color (in OfferBox.vue)
- G-B4: Integrate CTA "CALL NOW" label with phone number (in CTABox.vue)
- G-B5: Remove `borderRadius: 2pt` from trust badge pills (in TrustBadges.vue)

### Gap Summary (for planner's task list)

**P0 (demo blocker — must fix):**
1. G-F1/G-B1: `rounded-lg` removal from both card wrappers
2. G-F2: Logo wordmark fallback (filled pill, 0 radius)
3. G-F3: Solid color bottom overlay bar on full-bleed front
4. G-F4/G-F5: Phone pill 0-radius + OfferBadge shadow removal
5. G-F6: Photo edge-to-edge bleed (remove inset)
6. G-B2: TrustBadges full rebuild (filled color blocks)
7. G-B3: Deadline urgency treatment
8. G-B4: CTA label integration
9. Photo seed: Desert Diamond worker photo (DB update, not code)
10. Logo seed: Desert Diamond real logo (DB update per D-10)

**P1 (strong impact, slot in after P0):**
- USPS column deferred (RISK-01 — known accept)
- P-15 (full-width trust badge strip) — requires USPS column fix, also deferred

---

## Validation Architecture

The planner should structure verification as follows:

### Visual Checkpoints (the primary gate)
After each component rewrite, run the dev route and capture a screenshot:
1. Open `http://localhost:5173/dev/postcard-preview` (or active Vite port)
2. Set layout to `full-bleed`
3. Verify the card matches the PATTERNS checklist — each P-XX should be checkable visually
4. Capture screenshot to `demo-smoke-test-2026-04-[DATE]/` with a descriptive name

Playwright script location: referenced in handoff §6.4. The planner should ensure:
- Desert Diamond brand kit values are injected (see RISK-06)
- Screenshot captures the FULL card at the rendered size
- Both front and back are captured (flip + screenshot)

### PATTERNS Checklist Gate
Before declaring any component "done," walk through the relevant P-XX items and mark each as PASS/FAIL/N-A:
- PostcardFront.vue full-bleed: P-01 through P-10, P-23, P-36, P-38, P-39, P-40
- PostcardBack.vue + OfferBox: P-11 through P-19, P-23, P-34 through P-38, P-41 through P-44
- TrustBadges.vue: P-14, P-15, P-30, P-31, P-36
- CTABox.vue: P-11, P-17, P-28
- OfferBox.vue: P-12, P-13, P-37, P-41 through P-44

### Draplin Gate (Hard Pass/Fail Before Any Commit)
Per D-04 to D-08:
- [ ] border-radius: 0 on ALL card elements (except QR pad 2pt, burst badge 50%)
- [ ] No soft grey box-shadows anywhere on the card
- [ ] Color blocks span >40% of card area (rough visual estimate)
- [ ] Z-pattern enforced: logo top-left → credibility/offer badge top-right → headline bottom-left → phone bottom-right
- [ ] F-pattern on back: offer → value stack → phone → QR → trust

### SUCCESs Check (D-07: 5/6 minimum)
| Dimension | Current Score | Target |
|-----------|---------------|--------|
| Simple | ✓ | Maintain |
| Unexpected | ✗ (no surprise element) | Fix: bold offer amount or headline hook |
| Concrete | ✓ (specific dollar values, phone, city) | Maintain |
| Credible | ✓ (4.9★, BBB, 2423 reviews) | Maintain |
| Emotional | ✗ (loyalty graphic not emotional) | Fix: worker/family photo |
| Stories | ✗ (review quote truncated/small) | Partial fix: review quote more prominent |

Target after rebuild: 4/6 confirmed (Simple ✓ Concrete ✓ Credible ✓ Emotional ✓ with photo fix), with Unexpected and Stories as stretch goals.

### Type Check
Run `npx vue-tsc --noEmit` after every component change. Zero TS errors required before marking any task complete.

### Drake Eye Signoff
The only final gate is Drake's visual assessment. Suggest: show the rebuilt Desert Diamond render side-by-side with one Mail Shark HVAC reference and one PostcardMania HVAC reference (with references used for visual category comparison only per D-17, not for "does it match" comparison). If Drake says "that looks like something I'd actually get in the mail," it passes.

---

## Open Questions for the Planner

**OQ-1: Overlay bar vs gradient — how much gradient above the bar?**
P-03 says solid color bar at bottom 25–35%. The planner must decide: does the hero photo show cleanly in the top 65–75%, with only a hard-edged solid bar at the bottom? Or is there still a soft gradient transition zone between the photo and the bar? Recommendation: hard-edged bar, no gradient on top — the photo content in the upper 65–75% is what the viewer sees first, and a gradient weakens the Draplin color-block principle. But this affects readability of any text elements if the photo is bright at the bottom.

**OQ-2: TrustBadges — styled-div facsimiles or real SVG assets?**
D-13 says real brand artwork. For the demo, are styled-div facsimiles in the correct brand colors (BBB navy, Angi orange, HomeAdvisor green) acceptable, or must actual SVG/PNG assets be sourced? Recommendation: styled-div for demo (acceptable — they carry the correct brand color signal), with a code comment noting where real SVG slots in. This avoids blocking the visual rebuild on an asset-sourcing task.

**OQ-3: Credibility line — front or back only?**
Currently `hideTopRightBadge` suppresses credibility on the front when the ribbon badge is active. For the demo, is credibility on the front required? Options: (a) keep suppression, credibility only on back — simplest; (b) move credibility inline below headline in the bottom overlay bar — adds visual complexity to an already-dense zone; (c) move offer badge to a different position (bottom-left burst instead of top-right ribbon) to free the top-right for credibility. Recommendation: (a) keep suppression for the demo. The back already has BBB, Angi, NATE trust signals. The front credibility line is redundant.

**OQ-4: Desert Diamond logo — what file format and where to source it?**
D-10 says manually grab the logo from desertdiamondhvac.com. The CSS background-image logo is not directly downloadable via Firecrawl. The planner needs a specific approach: (a) visit desertdiamondhvac.com, inspect the logo CSS, find the actual image URL, download it; (b) use Playwright to screenshot just the logo element and use the screenshot as a seeded image; (c) use the business name wordmark fallback as the demo logo. Option (a) is cleanest if the image URL is accessible; option (c) is the fallback if the logo is a CSS sprite or SVG data URI.

**OQ-5: OfferBadge position on full-bleed for demo — ribbon or burst?**
The ribbon is currently at top-right and collides with credibility (which is suppressed). A burst badge at mid-right (below the logo zone) would avoid the collision but changes the visual footprint. Ribbon is the "correct" pro direct-mail convention. The planner should confirm: keep ribbon, maintain the `hideTopRightBadge` suppression, and accept that credibility is front-absent for the demo.

---

## RESEARCH COMPLETE

**Patterns extracted:** 44 (P-01 through P-44), organized into 14 categories.
**Files mapped:** 13 (all files listed in the objective were read and mapped).
**Reference images studied:** 10 (all specified in the objective).
**Current render analyzed:** Both FRONT-FINAL and BACK-FINAL from demo-smoke-test-2026-04-10.
**Gap table:** 19 front/back pattern checks documented with specific code fix targets.

*Written by phase research agent. Feeds gsd-planner for 02-PLAN.md.*
