# Design Panel — Postcard Design Decision Rules

> **Load when:** Designing, reviewing, or scoring any PostCanary postcard template. These rules govern what goes on the card, where it goes, how it looks, and how to verify it works.
>
> **Load alongside:** `experts-implementation-bridge.md` (Wathan/Drasner/Comeau — how to translate these rules into code)
>
> **Research depth:** Read depth (3 Exa searches + 1 primary source scrape per expert, per phase). Not study depth.
>
> **Writing format rules** (from `research-prompt-engineering-experts.md` — 7 principles):
> 1. Behavioral descriptions over expertise claims — describe operational context, not "you are an expert"
> 2. Positive framing — "do X" outperforms "don't do Y"
> 3. Specific on constraints, general on reasoning — precise WHAT, flexible HOW
> 4. Examples beat rules for format/tone calibration
> 5. Explicit failure modes — "when this fails, the result is Y" for every capability
> 6. Priority ordering — most critical rules at top and bottom (U-shaped attention)
> 7. Concise — every sentence earns its place, no filler

---

## How This File Works

Nine experts across two groups. Rules are if/then format. When domains overlap, the expert listed first takes precedence unless noted.

**Group A: Content & Messaging** — what goes on the card
| Expert | Domain | Activation |
|--------|--------|------------|
| **Joy Gendusa** | Element checklist — what must be on the card | Every postcard, every time |
| **Aaron Draplin** | Aesthetic gate — does it look like pro print or SaaS | Every postcard, every time |
| **Drew Eric Whitman** | Eye flow — where elements go on the card | Layout decisions |
| **Gary Halbert** | Copy structure — what the words say and how they're ordered | Headline, offer, CTA copy |
| **John Caples** | Headline formulas — which headline type for which situation | Headline generation |
| **Heath Brothers** | Stickiness scoring — does the message stick in 2 seconds | Post-design verification |

**Group B: Visual Craft** — how the card looks (added Session 44)
| Expert | Domain | Activation |
|--------|--------|------------|
| **Erik Spiekermann** | Print typography — type hierarchy, sizing, spacing for physical media | Type selection, sizing, hierarchy decisions |
| **Josef Albers** | Color interaction — how colors change perception in context | Brand color adaptation, zone color pairing |
| **Josef Müller-Brockmann** | Grid proportions — mathematical basis for layout structure | Layout construction, zone proportions, spacing |

---

## 1. GENDUSA RULES — Element Checklist

**Source:** Joy Gendusa, PostcardMania founder. 27 years, 126K+ clients, 270K+ campaigns tracked by internal Results Department. Rules are practitioner-derived, not academically validated. Survivorship bias present — all data is internal.

### Front Elements

- If the headline occupies less than 15–25% of the front face area, enlarge it. 80% of recipients read only the headline.
- If the headline takes more than 2 seconds to understand, rewrite it. Use plain language, not industry jargon.
- If the main image does not directly reinforce the headline's message, replace it.
- If photos show people facing away from the copy, flip or replace. People face toward the text (eye trail).
- If there is no offer teaser on the front (price, discount, or "free"), add one. The front offer drives the flip.
- If the company logo is larger or more prominent than the offer, reduce the logo.
- If the CTA color matches other colors on the card, change it to a color that appears nowhere else. Override designer resistance — they want everything to match; that kills the CTA.

### Back Elements

- If there is no sub-headline on the back, add one. A wall of text without an entry point gets skipped.
- If the copy states features instead of benefits, rewrite. "Low interest rates" → "Save money on your mortgage."
- If copy is longer than what can be scanned in 5 seconds, convert to bullet points.
- If the offer has no expiration date or urgency language, add one.
- If there are multiple offers competing for attention, pick one. Two offers = send two postcards.
- If there is no review, testimonial, or star rating, add one. 92% of consumers read reviews.
- If you have a verifiable number (years in business, customers served), include it. Hard numbers beat vague claims.

### Anti-Patterns (remove these)

- If the headline is clever but unclear, rewrite for clarity. "Never sacrifice clarity for cleverness."
- If a decorative graphic element does not serve the message, remove it.
- If a photo is low-resolution or pixelated, do not print. Low-quality images = low-quality business perception.

### Failure Modes

- Fails for non-local, non-service businesses. Rules optimized for high-LTV local service (HVAC, dental, plumbing).
- Fails when the list is wrong. Design cannot compensate for bad targeting. Gendusa's methodology overweights design relative to list quality.
- Fails for audiences that require trust-building over time (B2B, enterprise, luxury).

---

## 2. DRAPLIN RULES — Aesthetic Gate

**Source:** Aaron Draplin, Draplin Design Co. Print-first designer, mid-century American vernacular aesthetic. Rules extracted from interviews, book "Pretty Much Everything," and Skillshare classes. He is a practitioner who refuses to systematize — we did the codification.

### The Physical-Object Test

- If a design element does not survive at stamp size, remove it. Scalability is the first test.
- If you can remove an element and the design still communicates, remove it. Economy of form.
- If the design requires gradients, soft drop shadows, or transparency effects to look good, the underlying form is weak. Redesign with solid shapes.
- If the line weights are inconsistent or thin, thicken and unify them. Thick uniform lines signal durability and professionalism.
- If the design looks like it could only exist on a screen, it is not done. It should feel like it belongs on a sticker, patch, hat, or envelope.

### Color and Type

- If choosing between bold/saturated and muted/safe colors, choose bold. Draplin's palette is warm, high-saturation (oranges, yellows, deep reds) with contrasting darks.
- If using gradients, replace with flat solid color fills. Color blocks, not transitions.
- If a typeface needs to be stretched to fit, use a different weight or face instead. Never stretch type.
- If choosing between a trendy display font and a workhorse sans-serif (Futura Bold, Oswald), choose the workhorse. Trendy fonts date; workhorses endure.

### Print vs. Digital Indicators

- If border-radius is above 0px on any card element (except QR pad 2pt, burst badge 50%), set to 0. Rounded corners = SaaS/digital. Sharp corners = print.
- If soft grey box-shadows exist (the `0 4px 8px rgba(0,0,0,0.1)` pattern), remove them. Either use hard-offset brand-color shadows (3pt 3pt 0) or no shadows at all.
- If whitespace exceeds 55% of card area, add color blocks. Pro direct mail is LOUD — color blocks dominate, whitespace is minimal. Cards that are mostly white read as "web page printout."

### Failure Modes

- Fails for digital product design. His rules assume physical reproduction (screen printing, embroidery). Not applicable to dashboards, mobile apps.
- Fails for brands requiring sophistication or subtlety (luxury, fashion, healthcare). Bold ≠ always appropriate.
- Fails when nostalgia crosses into pastiche. No guardrails for when retro tips from authentic into costume.
- His "principles" are actually "preferences backed by experience." Use as heuristics for PostCanary's print context, not universal laws.

---

## 3. WHITMAN RULES — Eye Flow & Layout

**Source:** Drew Eric Whitman, "CA$HVERTISING" (2008). Synthesizer of Ogilvy, Cialdini, Starch/Gallup readership studies. Not an original researcher. NLP credentials are pseudoscience — his EXPLANATIONS for why techniques work are unreliable, but some techniques work for other reasons. Book is 90% copy, 10% layout.

### Layout Structure

- If designing a print postcard front, default to the Ogilvy Layout: photo fills top 60–67% of the card, headline directly under the photo, phone/CTA at the bottom. Logo in the lower area.
- If the ad is image-heavy, use Z-pattern element placement: hook at top-left (logo), supporting element at top-right (credibility), hero visual center, CTA at bottom-right.
- If the ad is text-heavy (back of postcard), use F-pattern: key information in the first two lines, important words at the start of each line.
- If the eye jumps around the layout without a clear path, reduce the number of separate elements until a single focal flow emerges.

### Photo Rules

- If choosing a photo, select one with a human face looking directly at the reader (Guillotine Principle). Smiling is preferable.
- If a photo appears on the card, place a selling caption or headline directly adjacent to it. Photo captions get 200% more readership than body copy.

### Typography

- If using print, use a maximum of 2–3 typefaces. One or two is ideal.
- If text is white/light on a dark background (reverse type), limit it to headlines and short labels. Reverse type depresses readership for body copy.
- If the headline is 4–5 words or fewer, ALL CAPS is acceptable. Otherwise use Initial Caps.

### Failure Modes

- His eye-flow content is thin — Z-pattern and F-pattern are brief mentions, not deep treatments. Treat as starting defaults.
- Book is from 2008, pre-social-media. Rules are validated for static print pages, not feeds or screens.
- NLP foundation is pseudoscience. Use his layout heuristics; ignore his explanations of WHY they work.
- Percentage claims (+76% attention from white space, +25% from quoted headlines, +200% caption readership) are from old Starch/Gallup studies — treat as directional, not precise.

---

## 4. HALBERT RULES — Copy Structure

**Source:** Gary Halbert (1938–2007). Direct mail copywriter, "The Boron Letters," 7.3M claimed customers (unverifiable). Criminal record: two mail fraud convictions, deceptive advertising injunction, SEC investigation. Use his psychology; do not sanitize his history.

### The A-Pile Principle (adapted for postcards)

- If the postcard looks like every other piece of junk mail in the stack, it will be trashed. The sorting decision for postcards is "read vs. trash" — visual design must do the work that envelope disguise does for letters.
- If the offer is weak, strong copy cannot save it. Spend more time on the offer than on any other element. "Strong copy will not overcome a weak offer."

### Copy Structure (AIDA)

- If writing postcard copy, follow AIDA strictly: Attention (headline grabs), Interest (first line feeds interesting fact), Desire (describe benefits so reader pictures ownership), Action (explicit CTA — exactly what to do, phone number, deadline).
- If closing / asking for action, be absurdly specific: tell them what to do, how to do it, and when to do it by. Vague CTAs ("call for more info") lose to specific ones ("Call (623) 246-2377 before May 15 for your $79 tune-up").

### Offer Construction

- If constructing an offer, stack value until saying "no" feels irrational: core service + itemized value + total value + customer price + guarantee + deadline. The value stack IS the persuasion mechanism.
- If the offer price is shown without an anchor value, add one. "$277 VALUE FOR JUST $79" converts; "$79 tune-up" alone does not leverage anchoring (Tversky & Kahneman).
- If there is no guarantee, add one. Counter-intuitively, longer guarantee windows produce fewer refunds.

### Failure Modes

- His entire framework assumes envelope-based mail. Postcards cannot be made to look "personal" in the Halbert sense — they show the commercial message immediately.
- Fails in reputation-sensitive markets (professional services, luxury, enterprise B2B). Aggressive direct response damages brands that depend on long-term trust.
- His specific infrastructure advice (SRDS, lettershops, live stamps) is functionally dead. Use his psychology, not his playbook.
- He dismissed the internet entirely in his late career. Spectacularly wrong.

---

## 5. CAPLES RULES — Headline Formulas

**Source:** John Caples (1900–1990). 49 years at BBDO. Originator of split-run headline testing. "Tested Advertising Methods" (use 4th edition, 1974 — the 5th edition was corrupted by posthumous edits). No academic scrutiny in 90+ years. His PRINCIPLES hold; his specific FORMULAS are decaying through overuse.

### Headline Quality Hierarchy

- If you have a clear benefit the reader receives, use a **Self-Interest headline**. This is the default — strongest performer across decades of testing.
- If launching something new, use a **News headline** ("Announcing," "New," "Now," "At Last"). Second-strongest type.
- If you can combine news AND self-interest, do so. The combination outperforms either alone.
- If tempted to use curiosity alone, STOP. Pair it with self-interest or news. Curiosity alone consistently failed in Caples's testing.

### Headline Writing Rules

- If stuck, default to a keyword starter: "How To," "Why," "Which," "Who Else," "If," "Wanted." These never wear out.
- If you can address a specific audience in the headline, do so. "Phoenix Homeowners:" outperforms generic headlines because it self-selects the right reader.
- If choosing between a long headline that says something and a short headline that says nothing, choose long. Clarity beats brevity.
- If the headline is clever, abstract, or punny without promising a benefit, rewrite it. Clever headlines that don't deliver substance consistently fail.
- If the headline can include a specific number, include it. "$79" is more credible than "affordable." "52.7%" beats "more than half."

### Failure Modes

- His specific formula wordings ("How To," "Announcing") are now pattern-matched as marketing-speak by sophisticated audiences. Use the PRINCIPLES (self-interest, specificity, news value) to generate original structures, not the formulas as templates.
- HubSpot/Outbrain data (3.3M headlines): classic direct-response words ("Free," "Amazing," "Secret") now DECREASE click-through. Decades of formulaic use trained consumers to see them as spam signals.
- Modern scroll behavior: recipients process the first 2 words of a headline in 300–500ms. Front-load benefit words. Formulas that start with low-information words ("Announcing," "Introducing") waste the most valuable real estate.
- His testing measured coupon returns only — not brand recall, purchase intent, or word-of-mouth. A "winning" headline by his single metric might harm brand perception.

---

## 6. HEATH RULES — Stickiness Scoring (SUCCESs)

**Source:** Chip Heath (Stanford) & Dan Heath (Duke). "Made to Stick" (2007). Framework is retrospective pattern-matching on winners — no prospective validation exists. No visual dimension. Severe survivorship bias. The Curse of Knowledge insight is more valuable than the checklist itself.

### The 5-Dimension Postcard Score (Stories excluded — cannot fit on a postcard)

Score each dimension PASS / PARTIAL / FAIL:

**SIMPLE** — One message a 10-year-old could repeat back.
- If the postcard communicates one clear offer/message visible from the headline + image alone (without reading body copy), PASS.
- If it tries to communicate 3+ offers or services simultaneously, FAIL.

**UNEXPECTED** — Breaks the junk mail pattern.
- If the headline violates a common assumption ("Your AC is making you sick" vs. "Quality HVAC Service"), PASS.
- If it looks and reads like every other postcard in the mailbox, FAIL.

**CONCRETE** — Specific, tangible language with numbers.
- If the postcard uses dollar amounts, percentages, star ratings, review counts, or specific scenarios, PASS.
- If it uses vague abstractions ("quality service you can trust," "excellence in every detail"), FAIL.

**CREDIBLE** — Carries its own proof.
- If the postcard includes testable trust signals (Google rating with count, "Licensed & Bonded" with number, real customer quote, BBB badge), PASS.
- If trust relies solely on the business's own unverifiable claims, FAIL.

**EMOTIONAL** — Makes the recipient feel something about THEIR situation.
- If the postcard connects to the recipient's home, comfort, family, or wallet ("Your family deserves a cool home this summer"), PASS.
- If it talks about what the business cares about ("We're proud of our 20 years"), FAIL.

### Scoring Target

- 5/5 PASS = exceptional (rare for any single piece)
- 4/5 PASS = strong — ship it
- 3/5 PASS = acceptable for demo, needs improvement before production
- Below 3/5 = do not ship

### The Real Insight: Curse of Knowledge

Every business owner writing postcard copy is a "tapper" — they hear the full symphony of their business while the recipient hears disconnected taps. The SUCCESs checklist forces translation from tapper to listener. When reviewing any postcard, ask: "Would someone who knows NOTHING about this business understand the message in 2 seconds?"

### Failure Modes

- Framework is amoral — works equally well for lies (Schwartz critique). It measures stickiness, not quality.
- No visual dimension at all. Cannot evaluate layout, color, typography, or image selection.
- No prospective validation — all evidence is retrospective pattern-matching on winners.
- The "Stories" dimension is inapplicable to postcards. We exclude it from scoring.
- If everyone applies it simultaneously, no message stands out (arms race problem).

---

---

## 7. SPIEKERMANN RULES — Print Typography

**Source:** Erik Spiekermann (b. 1947). Typographer, information architect. Founded MetaDesign and FontShop. Designed typefaces for Deutsche Bundespost, Deutsche Bahn, Nokia, The Economist. His Bundespost project (1985) is the closest precedent to our postcard challenge: type that works on rough paper, small sizes, variable content. Rules extracted from Bundespost case study PDFs, Typographic Rules blog post, and secondary analysis.

### Type Hierarchy

- If designing a 4-tier hierarchy for print at arm's length (18-24"), then separate display tiers (headlines/offers) from text tiers (body/fine print) — they need different optical treatments, not just different sizes.
- If the hierarchy gap between tiers is not perceptible at a glance, then the gap is too small. The reader must instantly see what's most important without reading.
- If choosing between a condensed version of a wide face and a natively narrow face, choose the natively narrow face. Electronic condensing degrades the original design.
- If figures/numbers (prices, phone numbers) appear on the card, then set them somewhat smaller than caps to avoid groups of figures "sticking out and looking bigger than type."

### Spacing & Legibility

- If text is under 12pt, then increase tracking by at least 2 units. Do NOT use default tracking for small text.
- If increasing tracking makes copy too long, then reduce type size by 0.1-0.2pt rather than tightening. Slightly smaller + properly tracked > larger + cramped.
- If setting unjustified text, then set optimum wordspace to 80% or less of default. Text is usually set with too much wordspace.
- If line length exceeds ~10 words per line at the chosen size, the column is too wide.
- If using reverse type (light on dark), limit to headlines and short labels. Reverse type depresses readership for body copy. (Converges with Whitman.)

### Typeface Selection

- If choosing a typeface for postcards, select based on: (1) legibility at the smallest size used, (2) clearly distinguishable weights, (3) high x-height, (4) open counters, (5) distinct numerals.
- If the face needs to work across variable content (different business names, headline lengths), then use a narrow-but-not-condensed proportion — space-efficient without looking squeezed.
- If choosing between a "neutral" face and one with brand character, prefer character. Neutral faces fail to distinguish the brand.

### Failure Modes

- Fails to provide specific point-size tables for our exact use case. We need to derive sizes empirically: test at actual print size, arm's length distance.
- Fails for attention-grabbing — his rules optimize legibility and clarity, not visual excitement. Pair with Draplin (bold aesthetic) and Gendusa (element checklist).
- Fails when print quality is much higher than his Bundespost constraints. On coated card stock at 300 DPI, some of his extreme legibility measures (extra-heavy strokes, ultra-open counters) may be unnecessary.

---

## 8. ALBERS RULES — Color Interaction

**Source:** Josef Albers (1888-1976). Color theorist, Bauhaus/Yale educator. "Interaction of Color" (1963) is the foundational work on color relativity. His rules are framed as PHENOMENA TO CHECK FOR, not algorithmic rules — he philosophically refused formulas. Pair with CIELAB/WCAG for quantified thresholds.

### Color Phenomena Checklist

- If a brand color sits on a zone color with SIMILAR LIGHTNESS, then check for **vanishing boundaries** — the edge will blur and elements merge visually. Programmatic check: CIELAB |ΔL*| < 15 = risk.
- If a brand color sits on a zone color that is its COMPLEMENT (opposite hue), then check for **vibrating boundaries** — edges shimmer, text becomes unreadable. Programmatic check: hue angle difference 150-210° AND both chroma > 40 = risk.
- If the SAME brand color appears in TWO zones with different backgrounds, then it will appear as TWO DIFFERENT COLORS (**simultaneous contrast**). Perceptual consistency requires adjusting the hex code per zone.
- If a warm brand color (red/orange/yellow) is placed on a cool zone (navy/blue), the brand color will ADVANCE (pop forward). Cool on warm recedes. This affects visual hierarchy.
- If the template swaps ONE zone color (e.g., offer strip from green to brand primary), then ALL adjacent colors shift in appearance (**Bezold Effect**). Re-evaluate every zone boundary, not just the changed one.
- If both adjacent colors have very high saturation, then check for afterimage-induced phantom colors. At least one color in any pair should have reduced saturation.
- If text in brand color sits on a zone color, then verify contrast ratio: WCAG 4.5:1 minimum for body text, 3:1 for large text/headlines.

### Color Adaptation Process

1. Extract brand colors (primary, secondary, accent)
2. For each brand color × zone color pair, check: vanishing boundary? vibrating boundary? adequate contrast?
3. If any check fails, adjust the brand color for that specific zone (different hex, same perceived intent)
4. After all adjustments, verify the Bezold cascade — changes propagate

### Failure Modes

- Fails to provide algorithmic rules. Albers explicitly rejected formulas. MITIGATION: use CIELAB delta-E and WCAG contrast ratios as quantified proxies for his qualitative observations.
- Fails for digital-only color (his work assumes physical pigments on paper). MITIGATION: our postcards ARE physical print, so his observations apply more directly than for screen design.
- Fails when the goal is emotional impact over perceptual accuracy. Sometimes vibrating boundaries or high-contrast complementaries are WANTED for attention. Treat Albers' phenomena as a diagnostic checklist, not a ban list.

---

## 9. BROCKMANN RULES — Grid Proportions

**Source:** Josef Müller-Brockmann (1914-1996). Swiss graphic designer, codified the modular grid system. "Grid Systems in Graphic Design" (1981) is the canonical reference. His methodology makes layout "capable of analysis and reproduction" — exactly what programmatic template generation needs. Rules extracted from book text, philosophy essay, and Rune Madsen's programming-focused analysis.

### Grid Construction

- If designing a postcard layout, first define content zones by importance. The most important zone gets the most grid fields (rows).
- If the postcard has 3 horizontal zones, use a row-based grid. For a 9" card height: a 12-row grid = 0.75"/row. Hero = 8 rows (67%), Offer = 2 rows (17%), Info = 2 rows (17%). Adjust to taste — the HAC-1000 is closer to 9:2:3 (64%/14%/21%).
- If constructing margins, use a proportional system (Golden Section 1:1.618 or simpler ratios). Start with 0.25" margins on a 6×9" card.
- If setting column width, derive from type size: at 9-10pt body, optimal line = 7-10 words ≈ 45-75 characters. This determines column count for text-heavy zones.
- If elements need vertical alignment, lock ALL text to a baseline grid. Baseline increment = type size × line-height (e.g., 10pt/14pt → 14pt grid). ALL vertical spacing = multiples of this increment.

### Proportion Rules

- If the HAC-1000 uses 63/14/23, this approximates a Golden Section derivative: the hero zone is ~φ/(1+φ) ≈ 62% of the total height. Use ratio-based proportions (9:2:3 or similar), not strict equal-module grids.
- If the postcard format changes (4×6 vs 6×9), the grid RATIOS stay the same but absolute measurements change. Define proportions as ratios, not fixed units.
- If gutters between zones are needed, set vertical gutter = 1 baseline grid unit, horizontal gutter = 1em of body text.

### Variable Content Adaptation

- If business name length varies, define overflow rules: >24 chars → reduce from 14pt to 12pt. >36 chars → truncate with "..." or reflow to 2 lines.
- If headline length varies, the hero zone height stays FIXED. Use vertical alignment (center or bottom-align) within the zone rather than resizing.
- If an image doesn't fill complete grid fields, crop to fit. Elements that break the grid break the system.

### Failure Modes

- Fails for direct mail's attention needs. His aesthetic is "valid but deadly boring" (his own words). Use his STRUCTURE (grid, proportions, baseline alignment) with Draplin's ENERGY (bold color blocks, saturated palettes).
- Fails when content volume varies dramatically. His system assumes designer-controlled content. MITIGATION: define adaptation rules (text overflow, size reduction) that Brockmann doesn't provide.
- Fails if applied dogmatically. "The grid system is an aid, not a guarantee." Treat as a coordinate system for the plugin, not an aesthetic prescription.
- Conflicts with Draplin on visual quietness vs. loudness. Resolution: Brockmann governs STRUCTURE (where things go), Draplin governs ENERGY (how things look).

---

## Expert Convergence (where 2+ experts agree)

These findings carry the highest confidence because they emerge from independent expert domains:

| Finding | Experts Who Agree | Confidence |
|---------|------------------|------------|
| Headline is the #1 element — 50–80% of readers see only it | Gendusa, Whitman, Caples, Halbert, Spiekermann (hierarchy) | HIGH |
| Benefits over features in all prospect-facing copy | Gendusa, Halbert, Caples | HIGH |
| One offer per card — multiple offers split attention | Gendusa, Halbert, Heath (Simple) | HIGH |
| Specific numbers beat vague claims ($79 > "affordable") | Gendusa, Caples, Heath (Concrete) | HIGH |
| Social proof (reviews, ratings) materially increases trust | Gendusa, Halbert, Heath (Credible) | HIGH |
| Deadline/urgency drives action | Gendusa, Halbert, Caples | HIGH |
| Photo with human face outperforms equipment/abstract | Whitman (Guillotine), Gendusa, Heath (Emotional) | HIGH |
| CTA in a contrasting color that appears nowhere else on the card | Gendusa (explicit), Draplin (color block), Albers (contrast) | HIGH |
| Card must work at arm's length / 2-second scan | Gendusa, Heath, Caples, Spiekermann (viewing distance) | HIGH |
| Reverse type (light on dark) depresses body readership | Whitman (explicit), Spiekermann (explicit) | HIGH |
| Proportions should follow mathematical ratios, not eyeballing | Brockmann (grid system), Whitman (Ogilvy 60-67% photo) | MEDIUM-HIGH |
| Color context changes everything — test combinations, not isolates | Albers (color relativity), Draplin (bold contrast), Gendusa (CTA contrast) | HIGH |
| Start from constraints, not aesthetics | Spiekermann (Bundespost method), Brockmann (grid-from-content) | HIGH |
| Small text needs more tracking/spacing than default | Spiekermann (explicit rule), Brockmann (baseline grid) | HIGH |

## Expert Conflicts (where experts disagree)

| Conflict | Expert A | Expert B | Resolution for PostCanary |
|----------|----------|----------|--------------------------|
| Aesthetics vs. function | Draplin: bold, loud, color-block dominance | Gendusa: "pretty postcard = worst postcard" | Both are right for different reasons. Draplin's aesthetic IS functional for print. Use Draplin's visual rules + Gendusa's element checklist together. |
| Headline length | Caples: long headlines that say something outpull short ones | Modern data: first 2 words carry 80% of weight | Front-load the benefit in the first 2–3 words, then extend if needed. |
| White space | Whitman: white space boosts attention by 76% | Draplin: color blocks dominate, minimal whitespace | For postcards, Draplin wins. Pro direct mail is dense. Whitman's white-space rule is for magazine ads, not postcards. |
| Curiosity headlines | Caples: curiosity alone consistently fails | BuzzFeed era proved curiosity can work | Caples is right for direct mail postcards — pair curiosity with self-interest. |
| Visual quietness vs. loudness | Brockmann: "fewer size differences = quieter impression" | Draplin: bold, saturated, maximal contrast | Brockmann governs STRUCTURE (proportions, alignment, grid). Draplin governs ENERGY (color, weight, contrast). Use both — grid discipline with visual punch. |
| Symmetry | Brockmann: rejected symmetry (ideological) | HAC-1000 reference: uses centered elements effectively | Use symmetry when it serves the communication (centered headline, balanced offer strip). Brockmann's rejection was political, not perceptual. |
| Color rules vs. color experience | Albers: "no color system can develop sensitivity" — rules are insufficient | WCAG/CIELAB: quantified thresholds that algorithms can check | Use Albers' phenomena catalog (WHAT to check for) + WCAG/CIELAB (HOW to check). Neither alone is sufficient. |
| Type design vs. type usage | Spiekermann: designing FROM constraints | Draplin: choosing type by feel/heritage | Spiekermann's constraint-based approach governs SELECTION (which face for which job). Draplin's aesthetic governs EXPRESSION (bold weight, saturated color, no rounded corners). |

---

## Known Gaps

- No expert addresses **USPS compliance** as a design variable. Compliance rules come from DMM research, not these experts.
- No expert provides **platform-specific postcard rules** (standard vs. oversized, 4x6 vs. 6x9). Gendusa says oversized stands out; no other expert addresses size.
- ~~No expert provides variable data personalization rules.~~ **PARTIALLY ADDRESSED:** Brockmann's variable content adaptation rules + Spiekermann's type-at-size rules provide a framework. Full VDP template system rules still need practical testing.
- No expert provides rules for **multi-card sequences** (Card 1 vs. Card 2 vs. Card 3 in a series). Kennedy's escalation framework in `postcanary-v1-build-decisions.md` covers this.
- ~~Whitman's eye-flow research is thin.~~ **SUPPLEMENTED:** Brockmann's grid construction + Spiekermann's hierarchy rules provide structural backing for layout flow.
- All experts have **survivorship bias** in their evidence. No controlled experiments exist for any of these design rules.
- No expert provides **specific point-size tables** for 6×9" postcards at arm's length. Spiekermann provides the methodology (measure constraints → derive specs), but we need to do the empirical testing ourselves.
- Albers' color phenomena need **quantified thresholds** to become programmable. CIELAB delta-E and WCAG contrast ratios are the bridge — not currently codified in this panel.
- **Karl Gerstner** ("Designing Programmes") was identified as a strong candidate for programmatic design rules but was not researched due to agent budget constraints. Consider for future batch.
- **Dan Mall** was scanned (Medium-Low relevance) — his Content/Display pattern separation is useful conceptually (variable data = content patterns, visual treatments = display patterns) but his work is org-level design systems, not visual craft. Transferable concept noted, full pipeline skipped.

---

## Quality Checks

**Application check:** Original 6 experts applied to 44 universal patterns in `02-RESEARCH.md` and HAC-1000 reference in `POSTCARD-DEEP-SPEC.md`. New 3 experts specifically applied to the Figma plugin problem: Spiekermann's hierarchy rules map to the 4-tier headline system, Albers' color phenomena map to the brand color adaptation challenge, Brockmann's grid rules map to the 63/14/23 zone proportions.

**Taleb check (when rules fail):**
1. Rules fail for digital-only contexts (Draplin, Whitman, Spiekermann rules assume physical media)
2. Rules fail for luxury/sophisticated brands (Draplin's bold aesthetic, Halbert's aggressive copy)
3. Rules fail when applied dogmatically without creative judgment (Brockmann's own admission: "valid but deadly boring")
4. Albers' rules fail when the goal IS visual disruption (sometimes vibrating boundaries are wanted)

**Munger check (connections):**
- Reinforces: `experts-implementation-bridge.md` (Wathan tokens implement Draplin's color rules; Comeau measures Whitman's proportions)
- Reinforces: `experts-template-pipeline.md` (Figma Plugin API + VDP patterns)
- Conflicts with: Generic SaaS UI design principles (rounded corners, soft shadows, whitespace-heavy layouts)
- Internal conflict resolution: Brockmann's structure + Draplin's energy — documented in conflicts table above

**Naming-vs-Knowing check (Feynman):**
- Can I apply Spiekermann to a NOVEL situation? Yes: "given a 4×6" postcard at 4-foot viewing distance (rack display), Spiekermann says increase all sizes — the hierarchy gaps must be perceptible from further away. Body text needs even more tracking. High x-height faces become mandatory."
- Can I apply Albers to a NOVEL situation? Yes: "if a pest control company has bright yellow branding on our green offer strip, Albers predicts vibrating boundaries (complementary + similar value). Mitigation: reduce saturation of the green strip or add a dark separator line."
- Can I apply Brockmann to a NOVEL situation? Yes: "for a horizontal 9×6" postcard (landscape), the grid ratios stay the same but rotate — hero is now the left 64%, with offer strip and info bar stacked vertically on the right 36%."

**Graham check (practitioners):**
- Spiekermann: Deutsche Bahn (German Railways) system — won Gold at German Federal Design Prize. Long-term production deployment.
- Brockmann: IBM European identity system — international production use for decades. Web adaptation by Khoi Vinh at New York Times (2004-2013).
- Albers: No direct commercial deployment of his methodology as rules. His influence is indirect — through trained designers, not through codified systems. This is the weakest practitioner link.

---

*Synthesized: 2026-04-13 Session 44 (expanded from Session 35 base)*
*Research: 27 files (9 scans + 9 deep + 9 critics) via expert-research pipeline v5.2*
*Research depth: Read depth (~12 Exa searches + 1 Firecrawl scrape per expert)*
*Group A experts (Session 35): Gendusa, Draplin, Whitman, Halbert, Caples, Heath Brothers*
*Group B experts (Session 44): Spiekermann, Albers, Müller-Brockmann*
*Deferred: Karl Gerstner (scan-only), Dan Mall (scan-only, Medium-Low relevance)*
