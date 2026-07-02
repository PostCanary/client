# PostCanary Postcard Deep Spec — HAC-1000 Reference Analysis + Implementation Plan

> **What this is:** An obsessively detailed visual breakdown of PostcardMania's HAC-1000 HVAC postcard, analyzed through 6 expert design lenses, then translated into exact Vue/CSS implementation instructions. A developer reading ONLY this document should be able to produce a postcard that belongs in the same visual category as the PostcardMania reference without ever seeing the reference image.

> **Reference card:** PostcardMania HAC-1000 "New AC System Postcard" — 800×565px source at `postcardmania.com/wp-content/uploads/designs/img/HAC-1000.jpg`

---

## PART 1: THE REFERENCE CARD — ELEMENT-BY-ELEMENT AUTOPSY

### Overall Composition

The card is landscape orientation (wider than tall), standard postcard proportions (~9:6 or ~1.41:1 aspect ratio). It is divided into exactly **THREE horizontal zones** stacked top-to-bottom with ZERO gaps between them:

| Zone | Name | Height % | Background | Purpose |
|------|------|----------|------------|---------|
| 1 | Photo + Headline | ~63% | Full-bleed outdoor photo | Attention + Message |
| 2 | Offer Strip | ~14% | Solid bright GREEN | Offer + Urgency |
| 3 | Info Bar | ~23% | Solid deep NAVY BLUE | Brand + CTA + Contact |

**Critical observation:** These three zones use THREE DIFFERENT COLORS. The photo zone is image-dominant (warm outdoor tones). The offer strip is GREEN. The info bar is NAVY BLUE. At no point do two adjacent zones share the same color. This creates an immediate sense of "designed by a professional" — the eye reads three distinct bands of information, each with its own color identity.

**There is ZERO whitespace between zones.** Zone 1's bottom pixel touches Zone 2's top pixel. Zone 2's bottom pixel touches Zone 3's top pixel. The card is a seamless stack of color regions. No gaps, no margins, no breathing room between the major zones. Every pixel of the 9×6" card is either photo, green, or navy.

---

### ZONE 1: Photo + Headline (~63% of card height)

#### The Photo

- **Subject:** A residential outdoor air conditioning condenser unit (white/light grey metal cabinet, rectangular, with fan grille on top). The unit sits on a concrete pad beside a house.
- **Setting:** Exterior of a residential home. Light sage-green horizontal vinyl siding visible on the right side. Bright green grass in the foreground. Bright blue sky with fluffy white cumulus clouds in the background.
- **Lighting:** Full daylight, midday sun. Shadows are short and crisp. The photo is HIGH KEY — bright, optimistic, clean. No dark corners, no moody lighting, no indoor fluorescent.
- **Composition:** The AC unit is positioned in the RIGHT HALF of the photo (~55-75% from left edge). This leaves the LEFT HALF of the photo as a relatively open area (sky + siding + grass with no dominant subject) — creating a **natural text placement zone** on the left where headline text can overlay without competing with a complex subject.
- **Bleed:** The photo extends to ALL FOUR edges of the card. There is zero border, zero inset, zero frame, zero margin between the photo's pixels and the card's trim edge. At print, the photo would bleed 0.125" past the trim on all sides.
- **Quality indicators:** Sharp focus on the AC unit. Natural color grading (not filtered, not oversaturated, not HDR). The sky reads as genuinely blue, not artificially enhanced. The grass reads as genuinely green. This is either a professional photograph or a very high-quality stock photo. Minimum resolution at print: 300 DPI (at 9×6" = 2700×1800 pixels).

#### The Headline Text (overlaid on the photo)

The headline is a **FOUR-TIER typographic stack** positioned on the LEFT side of the photo. Each tier is a separate line of text with its own size, weight, and color. The headline block occupies approximately x: 8-55% of card width, y: 8-60% of card height — roughly the LEFT-CENTER quadrant of the photo zone.

**Line 1: "THE SUMMER"**
- Color: BRIGHT RED (#E53935 or #CC0000 range — a warm, true red, not orange-red and not maroon)
- Font: Condensed heavy sans-serif. Consistent with Impact, Bebas Neue Bold, or Franklin Gothic Extra Condensed. The letterforms are TALL and NARROW — condensed proportions where the height of each letter is roughly 3× its width.
- Weight: 800-900 (Extra Bold or Black). The strokes are THICK — the counters (holes inside letters like "E", "M") are noticeably narrow relative to the stroke width.
- Case: ALL CAPITALS
- Size: Approximately 36-42pt at print scale. On the 800px-wide image, the "THE SUMMER" text block is roughly 280px wide × 40px tall.
- Letter-spacing: TIGHT — 0 to -0.02em. Letters nearly touch each other. No airy tracking.
- Line-height: Not applicable (single line)

**Line 2: "HEAT IS HERE"**
- Identical styling to Line 1 (same red, same font, same weight, same case, same size)
- Positioned immediately below Line 1 with approximately 2-4pt of line gap (TIGHT)
- Combined, Lines 1+2 read as one unit: "THE SUMMER / HEAT IS HERE" — a 5-word headline split across 2 lines for maximum impact per line.

**Line 3: "—stay comfortable with a"**
- Color: BLACK or very dark grey (#1A1A1A)
- Font: Regular weight geometric sans-serif (Open Sans, Montserrat, or Lato family). NOT the same condensed font as Lines 1-2 — this is a CONTRASTING body font. The letterforms are rounded, open, and wider than the condensed headline.
- Weight: 400-500 (Regular to Medium)
- Case: lowercase with sentence-case start ("—stay")
- Size: Approximately 14-16pt — significantly SMALLER than the red headline lines. Maybe 40% of the headline size.
- Leading with an em dash "—" which signals "continuation" — this line BRIDGES from the headline above to the sub-headline below. It says "here's why that matters to you."
- Position: Immediately below Line 2, with the same tight vertical spacing

**Line 4: "NEW A/C"**
- Color: DEEP NAVY BLUE (#0D2B4B or #1A3A6A — the SAME blue as the info bar at the bottom of the card, creating visual linkage between the sub-headline and the brand zone)
- Font: The SAME condensed heavy sans-serif as Lines 1-2 (Impact/Bebas Neue style)
- Weight: 800-900
- Case: ALL CAPITALS
- Size: LARGER THAN LINES 1-2. Approximately 48-60pt. This is the BIGGEST TEXT ON THE ENTIRE CARD. "NEW A/C" dominates the bottom half of the photo zone. On the 800px image, these letters are roughly 55-65px tall.
- Letter-spacing: TIGHT

**Line 5: "SYSTEM!"**
- Identical to Line 4 in every way (same blue, same font, same size, same weight)
- Positioned immediately below Line 4
- Ends with exclamation mark — adds energy/urgency
- Combined, Lines 4+5 ("NEW A/C / SYSTEM!") is the ANCHOR text — the thing you remember after glancing at the card for 1 second

**The 4-tier headline hierarchy, summarized:**
```
THE SUMMER          ← RED, 38pt, condensed black — ATTENTION
HEAT IS HERE        ← RED, 38pt, condensed black — ATTENTION (continued)
—stay comfortable   ← black, 15pt, regular sans — BRIDGE (why it matters)
with a
NEW A/C             ← NAVY, 54pt, condensed black — ACTION (what to do)
SYSTEM!             ← NAVY, 54pt, condensed black — ACTION (continued)
```

**Why this works (expert analysis):**
- **Gendusa:** The headline fills ~25% of the card area. It's unmissable. The 3-second test passes — you know what this card is about instantly.
- **Draplin:** Two bold colors (red + navy) on a photo background. No soft tones, no pastels. Both colors SCREAM. The condensed type is THICK and LOUD.
- **Whitman:** The eye reads top-left to bottom-left (left-to-left within the headline block), then sweeps right along the offer strip. The Z-pattern starts here.
- **Halbert:** "THE SUMMER HEAT IS HERE" is an ANXIETY trigger. It's not informational ("your tune-up is due") — it's EMOTIONAL ("the heat is coming, are you ready?"). Then "NEW A/C SYSTEM!" is the SOLUTION. Problem → Solution in one visual unit.
- **Caples:** Formula: specific seasonal urgency ("summer heat") + specific solution ("new A/C system"). This is Caples' "news" formula (#7).
- **Heath Brothers:** Simple ✓ (one message). Unexpected ✓ (seasonal anxiety trigger). Concrete ✓ (specific product — AC system). Score: 3/6 on the headline alone.

---

### ZONE 2: Offer Strip (~14% of card height)

A SOLID BRIGHT GREEN bar (#43A047 or #4CAF50) spanning the FULL WIDTH of the card. No rounded corners. No gradient. No border. Pure solid green from left edge to right edge.

**Text content (centered in the green bar, white text):**
- "Get " — regular weight, white, ~14pt
- "**$750 OFF**" — EXTRA BOLD weight, white, ~20pt — the dollar amount is visually HEAVIER than the surrounding text. This is the only text in the entire green bar that's bolded. It JUMPS out.
- " a full A/C system replacement" — regular weight, white, ~14pt
- Below that, a second smaller line: "With this card. Offer expires 30 days from mail date." — ~10pt, regular weight, white, slightly less opaque (maybe 85% opacity)

**Why GREEN, not red or blue?**
The headline uses RED. The info bar uses BLUE. The offer strip uses GREEN — a THIRD color that appears NOWHERE else on the card. This is Joy Gendusa's "bright non-matching CTA color" rule. The green strip is a visual ANOMALY — the eye is drawn to it BECAUSE it doesn't match anything else. If the offer strip were red (matching the headline) or blue (matching the info bar), it would blend in. Green makes it POP.

**Dimensions and spacing:**
- Height: approximately 0.84" on a 6" card (14% × 6 = 0.84")
- Padding: approximately 0.12in top, 0.12in bottom — tight, just enough for the two text lines
- No internal borders, no internal dividers
- Text is CENTER-ALIGNED horizontally

---

### ZONE 3: Info Bar (~23% of card height)

A SOLID DEEP NAVY BLUE bar (#0D2B4B or #1A3A6A) spanning the full width of the card. This bar contains ALL the business information, brand identity, and contact details in one dense horizontal strip.

**The bar has TWO internal sub-sections arranged LEFT and RIGHT:**

#### LEFT sub-section (~40% of bar width)

**Services line (very top of the blue bar, spanning its full width):**
- A slightly LIGHTER or GREY-tinted micro-strip at the very top of the blue bar
- Text: "AC | FURNACE | REPAIR | REPLACE | MAINTENANCE"
- Style: ALL CAPS, ~7-8pt, letter-spacing 0.06em, PIPE-SEPARATED, white or light grey text
- This is a KEYWORD STRIP — it immediately tells the recipient ALL the services this company offers in one scannable line
- Height: approximately 0.15in — very thin, just one line of tiny text

**Company logo (below the services line, in the left portion):**
- An ACTUAL DESIGNED LOGO — not plain text. It consists of:
  - A GRAPHIC MARK: a stylized circle/snowflake-sun hybrid icon in RED and BLUE (the same two headline colors — brand consistency). The icon has radiating pointed elements suggesting both heat (sun rays) and cold (snowflake points).
  - Text mark below/beside the icon: "ABC" in large white bold sans-serif (~18pt), then "HEATING & AIR" in smaller white text (~10pt) below the "ABC"
- Total logo dimensions: approximately 1.4" wide × 0.6" tall
- The logo has a white or semi-transparent background pad that separates it from the navy blue — ensuring it reads clearly

#### RIGHT sub-section (~60% of bar width)

**CTA text (small, above the phone):**
- "Call today to schedule your service!" — white text, ~10-11pt, regular weight
- This is the INSTRUCTION — it tells the recipient what to DO

**Phone number (the hero element of this section):**
- A small WHITE PHONE HANDSET ICON (☎ or 📞 style) preceding the number
- "1-800-628-1804" in WHITE, BOLD, ~22-24pt — this is the LARGEST text in the blue bar
- The phone number is BOLDER than anything else in this zone — it dominates the right side
- Formatted with hyphens (1-800-628-1804), not parentheses

**Website (below the phone):**
- "website.com" in white text, ~10pt, regular weight
- Lowercase, clean, simple — not styled as a button or link

**QR code (far right edge):**
- A standard QR code, approximately 0.7" × 0.7"
- WHITE background square with black QR pattern
- Positioned at the FAR RIGHT edge of the blue bar, vertically centered
- No label below the QR (it's self-evident)

---

### COLOR PALETTE (exact values observed)

| Color | Hex (approximate) | Where used | % of card area |
|-------|--------------------|------------|----------------|
| Photo (warm neutrals) | n/a | Zone 1 background | ~63% |
| Bright Red | #E53935 | Headline lines 1-2 | text only |
| Deep Navy Blue | #0D2B4B | Headline lines 4-5 + Zone 3 bar | ~23% |
| Bright Green | #43A047 | Zone 2 offer strip | ~14% |
| White | #FFFFFF | All text on colored backgrounds | text only |
| Black | #1A1A1A | Bridge text line 3 | text only |

**The 3-color rule:** RED for attention, GREEN for offer, BLUE for trust/brand. Each color owns ONE zone. They never cross into each other's zones. This creates visual CLARITY — the recipient processes the card as three simple messages stacked vertically: "Here's the problem (red)" → "Here's the deal (green)" → "Here's who to call (blue)."

---

### TYPOGRAPHY SPECIFICATION

| Element | Font Family | Weight | Size (pt) | Case | Color | Tracking |
|---------|------------|--------|-----------|------|-------|----------|
| Headline L1-2 | Condensed grotesque (Impact/Bebas Neue) | 800-900 | 36-42 | UPPER | #E53935 red | -0.01em |
| Bridge text L3 | Geometric sans (Open Sans/Montserrat) | 400-500 | 14-16 | lower | #1A1A1A | 0 |
| Sub-headline L4-5 | Same as L1-2 | 800-900 | 48-60 | UPPER | #0D2B4B navy | -0.01em |
| Offer main | Geometric sans | 700 (bold) | 18-20 | Mixed | #FFFFFF | 0 |
| Offer fine print | Geometric sans | 400 | 9-10 | Sentence | #FFFFFF 85% | 0 |
| Services strip | Geometric sans | 600 | 7-8 | UPPER | #FFFFFF 80% | 0.06em |
| Logo "ABC" | Custom/brand | 800 | 18-20 | UPPER | #FFFFFF | 0.02em |
| Logo subtitle | Geometric sans | 500 | 9-10 | UPPER | #FFFFFF | 0.04em |
| CTA instruction | Geometric sans | 400 | 10-11 | Sentence | #FFFFFF | 0 |
| Phone number | Condensed or geometric sans | 700-800 | 22-24 | n/a | #FFFFFF | 0.02em |
| Website | Geometric sans | 400 | 10 | lower | #FFFFFF | 0 |

---

## PART 2: EXPERT PANEL — WHAT EACH EXPERT SAYS ABOUT HAC-1000

### Joy Gendusa (PostcardMania CEO)

"This is one of our best-performing HVAC designs. Here's why:

1. **Headline fills 25% of the card.** The recipient can read 'THE SUMMER HEAT IS HERE' from across the room. That's the test — can you read the main message at arm's length (24 inches)?
2. **Three distinct color zones.** Red/green/blue — each zone has its own job. The eye knows where to go.
3. **The offer is in a NON-MATCHING color (green).** Green appears NOWHERE else on the card. That's what makes it pop. If we'd made the offer strip blue (like the info bar), it would blend in.
4. **The phone number is the biggest text in the info bar.** Not the logo. Not the website. The PHONE. Because the phone is the action we want.
5. **Services strip above the logo.** 'AC | FURNACE | REPAIR | REPLACE | MAINTENANCE' — in 5 words, the recipient knows everything this company does. No paragraphs needed.
6. **Good eye trail.** The eye enters at the RED headline (top-left), drops to the BLUE sub-headline (center-left), sweeps right along the GREEN offer strip, then lands on the PHONE NUMBER (bottom-right). That's the Z-pattern in action."

### Aaron Draplin (Aesthetic)

"This card is BOLD. Here's what's right:
- **Zero rounded corners.** Every zone edge is a hard 90-degree cut. The green bar meets the navy bar with a SHARP horizontal line.
- **Thick type.** The condensed black is not just bold — it's HEAVY. The strokes fill the space. There's no polite thin-font energy here.
- **No soft shadows.** No drop shadow behind the text, no shadow under the photo overlay, no subtle gradients. Every color is FLAT and SOLID.
- **Color blocks dominate.** The green strip + navy bar together occupy ~37% of the card. Add the red/navy headline text area and you're at 50%+ of the card being LOUD COLOR. That's direct mail — not a white-space web page.
- **The photo is SECONDARY to the message.** Yes it's a nice photo, but the text dominates. The text TELLS you what to do. The photo just confirms 'this is about AC units.' On too many amateur postcards, the photo dominates and the text is a whisper."

### Drew Eric Whitman (Eye Flow / CA$HVERTISING)

"The Z-pattern on this card:
1. **Entry:** RED headline top-left. The red color is the highest-contrast element against the blue sky — the eye CANNOT miss it.
2. **Scan right:** The eye travels right across 'HEAT IS HERE' and sees the AC unit in the photo — visual confirmation of the message.
3. **Drop to bridge:** The small '—stay comfortable with a' pulls the eye DOWN to the blue sub-headline. The em dash acts as a visual arrow pointing downward.
4. **Land on sub-headline:** 'NEW A/C SYSTEM!' in GIANT NAVY is the gravitational anchor. It's the BIGGEST text and it sits center-left where the eye naturally falls after the Z sweep.
5. **Sweep across offer strip:** The GREEN bar is a visual highway — the eye follows it LEFT to RIGHT reading the offer.
6. **Terminal on phone number:** The eye arrives at the phone number in the bottom-right — the LAST thing the recipient reads is the phone number. This is intentional. The phone number is the LAST stop on the reading path because that's when the decision to call happens."

### Gary Halbert (Copy)

"'THE SUMMER HEAT IS HERE' — that's an A-pile headline. It's not selling, it's WARNING. It creates ANXIETY. The homeowner reads this and thinks 'oh crap, is MY AC ready?' Then 'NEW A/C SYSTEM!' is the ANSWER. Problem → Solution. That's Halbert 101.

The offer — '$750 OFF a full A/C system replacement' — is SPECIFIC. Not '10% off' (meaningless). Not 'great savings' (lazy). $750. A real number. The homeowner can calculate: 'if a new system costs $5000, I save $750, that's 15% off.' The brain does the math and concludes 'that's a real deal.'

The deadline — 'Offer expires 30 days from mail date' — is URGENCY without being sleazy. It's not 'ACT NOW!!!' It's calm: 'this offer has a lifespan.' The homeowner decides to call before they forget."

### John Caples (Headlines)

"This headline uses three formulas simultaneously:
1. **News formula (#7):** 'THE SUMMER HEAT IS HERE' — it's NEWS. It's timely. It's seasonal. The recipient thinks 'this is relevant to me RIGHT NOW.'
2. **How-to formula (#2):** Implied — 'how to stay comfortable' (the bridge line makes this explicit)
3. **Specific benefit (#1):** 'NEW A/C SYSTEM!' — not 'better cooling' or 'improved comfort,' but a SPECIFIC PRODUCT. 'New A/C System' is concrete and tangible.

The multi-tier structure is important: the RED lines are the HOOK (emotional), the bridge is the TRANSITION (rational), and the NAVY lines are the PRODUCT (concrete). Hook → Transition → Product. Three tiers, three jobs."

### Chip + Dan Heath (SUCCESs)

"Scoring HAC-1000:
- **Simple ✓** — One product (A/C system), one offer ($750 off), one action (call the number).
- **Unexpected ✓** — 'THE SUMMER HEAT IS HERE' creates a mild jolt. The reader wasn't thinking about their AC — now they are.
- **Concrete ✓** — $750, 1-800-628-1804, 30-day deadline, specific services listed. Everything is a number or a noun.
- **Credible ✓** — Professional photo, professional design, specific services list, QR code (signals tech-savvy business).
- **Emotional ✓** — 'Summer heat' triggers discomfort anxiety. 'Stay comfortable' triggers relief desire.
- **Stories ✗** — No customer testimonial, no before/after, no narrative. This is the one miss.

**Score: 5/6.** That's excellent. The only improvement would be adding a one-line customer quote somewhere — 'They installed our new system in one day!' — but at the cost of added density."

---

## PART 3: GAP ANALYSIS — OUR V3 vs HAC-1000

| Element | HAC-1000 | Our v3 | Gap | Severity |
|---------|----------|--------|-----|----------|
| **Photo subject** | AC unit on house exterior (industry-specific, bright daylight) | HVAC tech working on AC unit (✓ industry-specific, but dark/indoor-ish) | Minor — our photo is acceptable but less bright/optimistic | LOW |
| **Headline structure** | 4-tier: RED attention + black bridge + NAVY action. TWO sizes, TWO colors. | 2-tier: small lead-in + Oswald main line. ONE color (white on dark). | Major — we need the multi-color headline with RED attention lines | HIGH |
| **Headline size** | ~25% of card area. BIGGEST TEXT dominates the card. | ~12% of card area. Headline is readable but doesn't DOMINATE. | Major — needs to be 2× bigger | HIGH |
| **Zone structure** | THREE distinct color zones (photo / GREEN offer / NAVY info) | TWO zones (photo / dark-orange bottom). No distinct offer strip. | Critical — we're missing the middle zone entirely | CRITICAL |
| **Offer visibility** | "$750 OFF" in GREEN strip spanning full width — UNMISSABLE | "$79 TUNE-UP" in small rotated ribbon corner — easy to miss | Major — the offer needs its own full-width zone | HIGH |
| **Phone bar color** | NAVY BLUE (same as sub-headline — brand consistency) | Dark/orange (same hue family as the headline bar above it) | Moderate — phone bar should be a DISTINCT color from headline zone | MODERATE |
| **Logo** | Real designed logo with icon + text mark, ~1.4" wide | Plain text wordmark in a blue pill, ~1.0" wide | Moderate — wordmark needs more visual mass/design | MODERATE |
| **Services strip** | "AC \| FURNACE \| REPAIR \| REPLACE \| MAINTENANCE" micro-line | Not present | Minor — easy to add, high information value | LOW |
| **Color palette** | 3 colors (red, green, navy) each owning ONE zone | 2 colors (dark/orange) blending into one zone | Critical — need a 3rd distinct color for the offer zone | CRITICAL |
| **QR code** | Present in info bar, ~0.7" square | Present on back only | Minor for front (QR is more important on back) | LOW |

**The TWO critical gaps:**
1. We don't have a 3-zone structure. We have 2 zones (photo + one dark bottom section). We NEED a distinct colored OFFER STRIP between the photo and the phone bar.
2. We don't have multi-color headline text. We have white-on-dark. We NEED RED headline text on the photo + a bridge + NAVY action text — multiple colors creating visual hierarchy WITHIN the headline.

---

## PART 4: IMPLEMENTATION PLAN — Exact CSS/Vue Changes

### Who implements this

This plan is written for a Vue 3 + Tailwind CSS frontend developer working on `PostcardFront.vue` (the full-bleed layout branch). The developer reads this plan and writes the exact inline styles and template structure. No design decisions are left to the developer — every value is specified.

### Change 1: Add 3-zone structure to PostcardFront.vue full-bleed branch

Replace the current 2-zone layout (photo 57% + dark bar 43%) with a 3-zone layout:

```
ZONE 1: Photo + Headline text    — height: 60% of card
ZONE 2: Offer strip              — height: 14% of card  — background: BRIGHT GREEN #43A047
ZONE 3: Phone/brand info bar     — height: 26% of card  — background: DEEP NAVY #0D2B4B
```

**Zone 2 (NEW — the offer strip):**
```vue
<div
  class="absolute inset-x-0"
  :style="{
    bottom: '26%',
    height: '14%',
    backgroundColor: '#43A047',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 0.25in',
    color: '#FFFFFF',
    textAlign: 'center',
    borderRadius: 'var(--pc-radius)',
  }"
>
  <span :style="{ fontSize: '13pt', fontWeight: 400 }">
    Get
  </span>
  <span :style="{ fontSize: '18pt', fontWeight: 800, margin: '0 0.08in' }">
    {{ card.resolvedContent.offerTeaser }}
  </span>
  <span :style="{ fontSize: '13pt', fontWeight: 400 }">
    — Call Today!
  </span>
</div>
```

**Zone 3 (phone/brand bar) — reuse existing but change to NAVY:**
```vue
<div
  class="absolute inset-x-0 bottom-0"
  :style="{
    height: '26%',
    backgroundColor: '#0D2B4B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.1in 0.25in',
    color: '#FFFFFF',
    borderRadius: 'var(--pc-radius)',
  }"
>
  <!-- Left: wordmark/logo -->
  <div :style="{ flex: '0 0 auto' }">
    <!-- wordmark here -->
  </div>
  <!-- Right: phone number -->
  <div :style="{ textAlign: 'right' }">
    <div :style="{ fontSize: '10pt', fontWeight: 400, opacity: 0.9 }">
      Call today to schedule your service!
    </div>
    <div :style="{
      fontFamily: 'var(--pc-headline-family)',
      fontSize: '24pt',
      fontWeight: 700,
      letterSpacing: '0.02em',
    }">
      {{ card.resolvedContent.phoneNumber }}
    </div>
  </div>
</div>
```

### Change 2: Multi-color headline on the photo zone

Replace the current single-color headline with a 3-tier colored headline:

```vue
<!-- Headline block — positioned on the LEFT side of the photo zone -->
<div
  class="absolute flex flex-col justify-center"
  :style="{
    top: '8%',
    left: '5%',
    bottom: '42%',
    maxWidth: '55%',
  }"
>
  <!-- RED attention line (the HOOK) -->
  <div :style="{
    fontFamily: 'var(--pc-headline-family)',
    fontSize: '34pt',
    fontWeight: 700,
    color: '#E53935',
    lineHeight: 1.0,
    textTransform: 'uppercase',
    textShadow: '0 1pt 3pt rgba(0,0,0,0.3)',
  }">
    {{ headlineLead }}
  </div>
  <!-- Bridge line (the TRANSITION) -->
  <div :style="{
    fontSize: '13pt',
    fontWeight: 400,
    color: '#FFFFFF',
    lineHeight: 1.3,
    marginTop: '0.04in',
    marginBottom: '0.04in',
    textShadow: '0 1pt 2pt rgba(0,0,0,0.4)',
  }">
    — stay comfortable with
  </div>
  <!-- NAVY action line (the PRODUCT/ACTION) -->
  <div :style="{
    fontFamily: 'var(--pc-headline-family)',
    fontSize: '44pt',
    fontWeight: 700,
    color: primary,
    lineHeight: 0.95,
    textTransform: 'uppercase',
    textShadow: '0 1pt 3pt rgba(0,0,0,0.3)',
  }">
    {{ headlineMain }}
  </div>
</div>
```

**Data changes in PostcardPreview.vue:**
```ts
const headline = ref("Phoenix Homeowners:|Your AC Tune-Up Is Due");
// The "|" separator tells PostcardFront to split into lead + main
// Lead: "PHOENIX HOMEOWNERS:" (red, smaller)
// Bridge: "— stay comfortable with" (white, small, hardcoded)
// Main: "YOUR AC TUNE-UP IS DUE" (brand blue, LARGE)
```

### Change 3: Offer strip color in print-scale.css

Add a new token for the offer strip:
```css
--pc-offer-strip-bg: #43A047;  /* Bright green — Gendusa "non-matching CTA color" */
```

### Change 4: Services strip

Add a one-line services strip at the top of the info bar:
```vue
<div :style="{
  fontSize: '7pt',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  opacity: 0.8,
  marginBottom: '0.04in',
}">
  AC · FURNACE · REPAIR · REPLACE · MAINTENANCE
</div>
```

### Change 5: Wordmark in the info bar (not on the photo)

Move the wordmark from the photo zone TOP-LEFT to the info bar BOTTOM-LEFT. The photo zone should have NO text elements except the headline. The wordmark/logo lives in the info bar where it's on a solid background (navy) and reads cleanly.

This matches HAC-1000 exactly: the "ABC HEATING & AIR" logo sits in the bottom-left of the navy bar, not floating on the photo.

### Summary of changes in priority order

1. **Add Zone 2 (green offer strip)** — the single biggest visual improvement
2. **Multi-color headline** — RED attention + bridge + NAVY action
3. **Move wordmark to Zone 3** (info bar) instead of floating on photo
4. **Zone 3 = deep navy** (#0D2B4B), not the current dark/orange
5. **Add services strip** micro-line in Zone 3
6. **Increase headline size** to fill ~25% of card area
7. **Add "Call today to schedule your service!"** instruction above phone number

---

## PART 5: VALIDATION CHECKLIST

After implementation, verify each of these against the rendered card:

- [ ] THREE distinct horizontal color zones visible (photo / green / navy)
- [ ] Zero gaps between zones — each zone's bottom pixel touches the next zone's top pixel
- [ ] Headline text uses TWO colors (red + brand-color) — not one
- [ ] Headline fills ~20-25% of the card area
- [ ] Headline uses Oswald condensed font, ALL CAPS, weight 700
- [ ] Offer strip is BRIGHT GREEN (#43A047) — a color that appears NOWHERE else on the card
- [ ] Offer text shows the price/offer prominently ($79 TUNE-UP or similar)
- [ ] Info bar is DEEP NAVY (#0D2B4B) — noticeably DARKER than the brand blue (#0488F5)
- [ ] Phone number is the LARGEST text in the info bar (~24pt)
- [ ] Wordmark/logo is in the info bar (bottom-left), NOT floating on the photo
- [ ] Services strip ("AC · FURNACE · REPAIR · REPLACE · MAINTENANCE") visible in the info bar
- [ ] Phone number has a "Call today..." instruction line above it
- [ ] Zero rounded corners anywhere
- [ ] Zero soft grey shadows
- [ ] Card reads as 3 messages: "Here's the situation (headline)" → "Here's the deal (offer)" → "Here's who to call (phone)"
- [ ] 3-second test: a stranger can identify (1) it's HVAC, (2) there's a deal, (3) there's a phone number — within 3 seconds

---

*Written: 2026-04-10 Session 34*
*Reference: PostcardMania HAC-1000*
*Experts consulted: Gendusa, Draplin, Whitman, Halbert, Caples, Heath Brothers*
*Implementation target: PostcardFront.vue full-bleed branch + PostcardPreview.vue + print-scale.css*
