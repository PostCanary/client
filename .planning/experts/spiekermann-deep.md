## Erik Spiekermann — Deep Research

### Origin Story
Spiekermann studied art history at Berlin's Free University, funding himself by running a letterpress press in his basement. This hands-on physical relationship with type shaped his entire methodology — type as engineered physical objects, not abstract shapes on screen. In 1985, Sedley Place Design Berlin (where Spiekermann worked) was commissioned to develop a corporate typeface for Deutsche Bundespost — West Germany's postal service and Europe's biggest employer (500,000+ employees). The brief was extreme: the typeface had to be legible at very small sizes, on rough recycled paper, with uneven inking, on low-resolution CRT typesetting systems, in telephone book listings where line after line has similar word shapes. Helvetica — the Bundespost's existing face — was failing under these conditions. This project crystallized Spiekermann's core methodology: start from physical constraints, measure existing solutions, define requirements analytically, then design to meet those requirements. "The answer is in the problem. I wouldn't call it inspiration — I would call it analysis." [paraphrased, from arvebaat.com interview]

### Core Methodology
1. **Start from constraints, not aesthetics.** Identify the physical conditions first: paper stock, print resolution, viewing distance, inking quality, space budget. These determine the typeface and typography decisions, not personal preference.
2. **Measure before designing.** For the Bundespost project, they "measured various proportions: x-height to cap-height, stroke thickness to cap-height, average width, dimensions of ascenders, descenders and figures" across six existing typeface families before designing anything. [direct quote from Bundespost PDF]
3. **Design for the worst case.** "Pretty shapes viewed at large sizes are thus less important than the fact that individual characters work well within words and fulfil their purpose within the constraints of that particular brief." [direct quote, Bundespost PDF]
4. **Information hierarchy is the primary job.** Typography's purpose is leading the reader's eye to the most critical information first. Logo, headline, offer, CTA, fine print — each has a role in the hierarchy, determined by the communication goal, not by what looks balanced.
5. **Track and space are the invisible levers.** "Text is usually set too tightly and with too big a wordspace... increase tracking by at least 2 units for sizes under 12pt. If that makes the copy run too long, simply decrease the size by 0.1 or 0.2pt. That actually increases space between lines and by giving the type a little more room to breathe, makes it more legible even though it's a little smaller." [direct quote, Typographic Rules blog]
6. **Character distinctiveness over beauty.** Characters need to be "individual enough to avoid mix-up with similar characters but not over-designed." Legibility at small sizes requires distinct letterforms (open counters, flared joins, squared-off counters for clarity).
7. **Separate display from text weights.** The Bundespost needed a text weight with small-size optimizations AND a display weight "without all the limitations of a typeface for very small sizes... legible in large sizes and from a distance." Different optical sizes serve different hierarchy tiers.

### Decision Rules (MOST IMPORTANT SECTION)

**Type sizing and hierarchy:**
- If designing a 4-tier type hierarchy for print at arm's length (~18-24"), then separate display tiers (headlines) from text tiers (body, fine print) — they need different optical treatments.
- If text is under 12pt, then increase tracking by at least 2 units (10 in InDesign). Do NOT set small text at default tracking.
- If increasing tracking makes copy too long, then reduce type size by 0.1-0.2pt rather than tightening tracking. Slightly smaller + properly tracked > larger + cramped.
- If the headline size is chosen, then the hierarchy gap between tiers should be perceptible at a glance — the reader must instantly know what's most important without reading.
- If choosing between a condensed version of a wide face and a natively narrow face, choose the natively narrow face. Electronically condensing a typeface "doesn't help much to enhance the original design."

**Print-specific legibility:**
- If printing on coated card stock at 300 DPI (our case), then stroke weight can be thinner than rough paper — but counters (interior white spaces) still need to be open enough to not fill in.
- If setting figures/numbers (prices, phone numbers), then figures should be "clearly distinguishable from each other and somewhat smaller than caps to avoid groups of figures sticking out and looking bigger than type." [direct quote, Bundespost PDF]
- If using reverse type (light on dark), limit to headlines and short labels — reverse type depresses readership for body copy (convergence with Whitman).
- If x-height is too small relative to cap-height, then small-size legibility suffers. A "relatively large" x-height aids reading at small sizes.
- If curves and joins are sharp/tight, they will "fill in" at small sizes and poor print quality. Use "curves, indentations, flares and open joins... to counteract bad definition, overinking and optical illusions." [direct quote]

**Typeface selection:**
- If choosing a typeface for print postcards, select based on: (1) legibility at the smallest size you'll use, (2) availability of clearly distinguishable weights (regular + bold minimum), (3) high x-height, (4) open counters, (5) distinct numerals.
- If choosing between a "neutral" face (Helvetica) and one with "character," prefer character — neutral faces fail to distinguish the brand. Spiekermann's entire Bundespost argument was that Helvetica was too generic.
- If the face needs to work across variable content (different business names, headlines of varying length), then it needs a narrow-but-not-condensed proportion — space-efficient without looking squeezed.

**Spacing and composition:**
- If setting unjustified text, then optimum wordspace should be 80% or less of the default.
- If line length exceeds ~10 words per line at the chosen size, the column is too wide — narrow it or reduce type size.
- If the design has competing elements at similar visual weight, then the hierarchy is broken — one element must clearly dominate.

### Key Concepts & Vocabulary
| Term | What it means | When it applies |
|------|--------------|-----------------|
| x-height | Height of lowercase letters (like 'x') relative to cap-height | Type selection — higher x-height = better small-size legibility |
| Counter | Interior white space inside letters (inside 'o', 'e', 'a') | Print legibility — open counters prevent fill-in at small sizes |
| Tracking | Uniform spacing between all characters | Always — Spiekermann's #1 micro-typography adjustment |
| Optical sizing | Different type designs for different sizes (display vs text) | 4-tier hierarchy — headlines need different treatment than body |
| Information hierarchy | Visual ordering of content by importance | Every postcard — what does the reader see first/second/third? |
| Wordspace | Space between words (distinct from tracking/letter spacing) | Body text — typically set too wide by default |

### Specific Techniques

**The Bundespost Analysis Method (adapted for postcards):**
1. Collect 6+ reference postcards/mail pieces that work well at the target size
2. Measure: headline pt size, body pt size, fine print pt size, line spacing, tracking, margins
3. Measure type proportions: x-height to cap-height ratio, stroke weight, counter openness
4. Identify which properties correlate with legibility at your viewing distance
5. Define your hierarchy tiers with specific measurements derived from the analysis
6. Test at actual print size (not on screen) — hold it at arm's length and check: can you read tier 4? Does tier 1 grab attention?

**The 95/5 Rule:**
95% of a typeface is the shared, agreed-upon framework of letterforms. The remaining 5% is where expression and brand character live. For PostCanary templates: the 95% (legibility, hierarchy, spacing) is systemized by rules. The 5% (which specific faces, what brand character they convey) is where customer brand identity enters.

### Quotes That Reveal Their Thinking

1. "Pretty shapes viewed at large sizes are thus less important than the fact that individual characters work well within words and fulfil their purpose within the constraints of that particular brief." — Bundespost PDF, spiekermann.com [verbatim]

2. "Text is usually set too tightly and with too big a wordspace. One of the legacies of Quark Xpress. Always set the optimum wordspace to 80% or less in unjustified setting." — Typographic Rules blog post, 2004 [verbatim]

3. "The answer is in the problem. I wouldn't call it inspiration — I would call it analysis." [paraphrased, from interview at arvebaat.com]

4. "Identify a problem — like space saving, bad paper, low resolution, on-screen use — then find typefaces that almost work but could be improved. Study them. Note what's wrong. Fix those problems." [paraphrased, from Coroflot PDF]

---
*Research depth: Read depth (2 Exa searches + 1 Firecrawl scrape of primary source)*
*Primary source read: spiekermann.com/en/typographic-rules/ + Bundespost PDF highlights from Exa*
*Session 44, 2026-04-13*
