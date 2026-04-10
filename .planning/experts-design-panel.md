# Design Panel — Postcard Design Decision Rules

> **Load when:** Designing, reviewing, or scoring any PostCanary postcard template. These rules govern what goes on the card, where it goes, how it looks, and how to verify it works.
>
> **Load alongside:** `experts-implementation-bridge.md` (Wathan/Drasner/Comeau — how to translate these rules into code)
>
> **Research depth:** Read depth (3 Exa searches + 1 primary source scrape per expert, per phase). Not study depth.

---

## How This File Works

Six experts, each owning a specific domain. Rules are if/then format. When domains overlap, the expert listed first takes precedence unless noted.

| Expert | Domain | Activation |
|--------|--------|------------|
| **Joy Gendusa** | Element checklist — what must be on the card | Every postcard, every time |
| **Aaron Draplin** | Aesthetic gate — does it look like pro print or SaaS | Every postcard, every time |
| **Drew Eric Whitman** | Eye flow — where elements go on the card | Layout decisions |
| **Gary Halbert** | Copy structure — what the words say and how they're ordered | Headline, offer, CTA copy |
| **John Caples** | Headline formulas — which headline type for which situation | Headline generation |
| **Heath Brothers** | Stickiness scoring — does the message stick in 2 seconds | Post-design verification |

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

## Expert Convergence (where 2+ experts agree)

These findings carry the highest confidence because they emerge from independent expert domains:

| Finding | Experts Who Agree | Confidence |
|---------|------------------|------------|
| Headline is the #1 element — 50–80% of readers see only it | Gendusa, Whitman, Caples, Halbert | HIGH |
| Benefits over features in all prospect-facing copy | Gendusa, Halbert, Caples | HIGH |
| One offer per card — multiple offers split attention | Gendusa, Halbert, Heath (Simple) | HIGH |
| Specific numbers beat vague claims ($79 > "affordable") | Gendusa, Caples, Heath (Concrete) | HIGH |
| Social proof (reviews, ratings) materially increases trust | Gendusa, Halbert, Heath (Credible) | HIGH |
| Deadline/urgency drives action | Gendusa, Halbert, Caples | HIGH |
| Photo with human face outperforms equipment/abstract | Whitman (Guillotine), Gendusa, Heath (Emotional) | HIGH |
| CTA in a contrasting color that appears nowhere else on the card | Gendusa (explicit rule), Draplin (color block principle) | MEDIUM-HIGH |
| Card must work at arm's length / 2-second scan | Gendusa (3-second test), Heath (SUCCESs), Caples (headline-is-the-ad) | HIGH |

## Expert Conflicts (where experts disagree)

| Conflict | Expert A | Expert B | Resolution for PostCanary |
|----------|----------|----------|--------------------------|
| Aesthetics vs. function | Draplin: bold, loud, color-block dominance | Gendusa: "pretty postcard = worst postcard" | Both are right for different reasons. Draplin's aesthetic IS functional for print. Use Draplin's visual rules + Gendusa's element checklist together. |
| Headline length | Caples: long headlines that say something outpull short ones | Modern data: first 2 words carry 80% of weight | Front-load the benefit in the first 2–3 words, then extend if needed. |
| White space | Whitman: white space boosts attention by 76% | Draplin: color blocks dominate, minimal whitespace | For postcards, Draplin wins. Pro direct mail is dense. Whitman's white-space rule is for magazine ads, not postcards. |
| Curiosity headlines | Caples: curiosity alone consistently fails | BuzzFeed era proved curiosity can work | Caples is right for direct mail postcards — pair curiosity with self-interest. |

---

## Known Gaps

- No expert addresses **USPS compliance** as a design variable. Compliance rules come from DMM research, not these experts.
- No expert provides **platform-specific postcard rules** (standard vs. oversized, 4x6 vs. 6x9). Gendusa says oversized stands out; no other expert addresses size.
- No expert provides **variable data personalization** rules. Halbert's personalization was envelope-based; modern VDP on postcards is unaddressed.
- No expert provides rules for **multi-card sequences** (Card 1 vs. Card 2 vs. Card 3 in a series). Kennedy's escalation framework in `postcanary-v1-build-decisions.md` covers this.
- Whitman's eye-flow research is **thin** — his Z-pattern and F-pattern coverage is brief, not a deep treatment. Treat as starting defaults.
- All experts have **survivorship bias** in their evidence. No controlled experiments exist for any of these design rules.

---

## Quality Checks

**Application check:** These rules were applied to the 44 universal patterns in `02-RESEARCH.md` and the HAC-1000 reference analysis in `POSTCARD-DEEP-SPEC.md`. All 44 patterns trace back to at least one expert's rules.

**Taleb check (when rules fail):**
1. Rules fail for digital-only contexts (Draplin, Whitman rules assume physical media)
2. Rules fail for luxury/sophisticated brands (Draplin's bold aesthetic, Halbert's aggressive copy)

**Munger check (connections):**
- Reinforces: `experts-implementation-bridge.md` (Wathan tokens implement Draplin's color rules; Comeau measures Whitman's proportions)
- Conflicts with: Generic SaaS UI design principles (rounded corners, soft shadows, whitespace-heavy layouts)

---

*Synthesized: 2026-04-10 Session 35*
*Research: 18 files (6 scans + 6 deep + 6 critics) via expert-research pipeline v5.1*
*Research depth: Read depth (~12 Exa searches + 1 Firecrawl scrape per expert)*
*Experts: Gendusa, Draplin, Whitman, Halbert, Caples, Heath Brothers*
