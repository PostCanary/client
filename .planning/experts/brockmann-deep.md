## Josef Müller-Brockmann — Deep Research

### Origin Story
Brockmann studied architecture, design, and art history in Zurich, then taught at the Hochschule für Gestaltung in Ulm (1963) and served as European design consultant for IBM (1967). He co-founded the trilingual journal *Neue Grafik* in 1958, which became the mouthpiece of the Swiss Style. His grid methodology emerged from a conviction that design should be "capable of analysis and reproduction" — not dependent on individual talent or intuition. "The use of the grid as an ordering system is the expression of a certain mental attitude inasmuch as it shows that the designer conceives his work in terms that are constructive and oriented to the future." [verbatim, Grid and Design Philosophy essay] His most famous applied work — the Musica Viva concert posters for Zurich Tonhalle — demonstrated that grids could produce expressive, dynamic compositions, not just orderly ones.

### Core Methodology
1. **Divide the surface into equally-sized modules (fields).** The canvas is split into a matrix of rectangular fields separated by consistent gutters. All content occupies one or more complete fields. The smallest element = one field. Larger elements span multiple fields.
2. **Fields correspond to text lines.** Field depth equals a specific number of lines of text. Field width equals column width. Both are measured in typographic units (points and ciceros). This locks visual elements to the text baseline grid.
3. **Margins use mathematical proportions.** "All the famous typographic works of previous centuries have marginal proportions which have been carefully calculated using the Golden Section or some other mathematical formula." [verbatim, Grid Systems book] Margins should not be arbitrary — they should follow a proportional system.
4. **Column width derives from readability.** "A well known rule by typographers is that as a set standard, seven words per line is a comfortable amount to read" at a viewing distance of 30-35cm. [paraphrased, via Typography Workshop] Column width is determined by type size × optimal word count, not by dividing space evenly.
5. **Fewer size differences = quieter impression.** "The rule: The fewer the differences in the size of the illustrations, the quieter the impression created by the design." [verbatim] For a busy direct-mail postcard, this might need to be inverted — more size contrast = more visual energy.
6. **The grid is an aid, not a guarantee.** "The grid system is an aid, not a guarantee. It permits a number of possible uses and each designer can look for a solution appropriate to his personal style. But one must learn how to use the grid; it is an art that requires practice." [verbatim]
7. **Grid serves the content, not the other way.** "Every piece of work must be studied very carefully so as to arrive at the specific grid network corresponding to its requirements." [verbatim] The grid is chosen to fit the content type, not imposed universally.

### Decision Rules (MOST IMPORTANT SECTION)

**Grid construction for a 6×9" postcard:**

- If designing a postcard layout, first determine the content zones (hero photo, offer strip, info bar) and their relative importance. The most important zone gets the most grid fields.
- If the postcard has 3 distinct horizontal zones, then consider a row-based grid where each zone occupies a defined number of rows. For a 9" height: a 12-row grid gives 0.75" per row (before margins). Hero = 7-8 rows (~63%), Offer = 2 rows (~17%), Info = 2-3 rows (~20%).
- If constructing margins, use the Golden Section ratio (1:1.618) between inner and outer margins. For a 6×9" card with 0.125" bleed: start with 0.25" inner margins, 0.4" outer margins as a baseline. Adjust based on content density.
- If setting column width, derive from the type size: at 9-10pt body text, optimal line length is 45-75 characters (7-10 words). On a 6" wide card minus margins, this typically yields 2-3 columns for text-heavy areas.
- If elements need to align vertically, lock all text to a baseline grid. The baseline grid increment = type size × line-height. At 10pt type with 14pt leading, the baseline grid = 14pt. ALL vertical spacing should be multiples of this increment.
- If the gutter between columns/rows is too small, elements will touch and legibility suffers. If too large, the layout fragments. Gutter = 1-2 lines of text vertically, one em-space horizontally.
- If an image/element doesn't fill complete grid fields, it breaks the system. Resize or crop to fit. "The pictorial elements are reduced to a few formats of the same size." [verbatim]

**Proportion analysis of HAC-1000 (63/14/23 split):**

- If the HAC-1000 uses 63/14/23 vertical proportions, this does NOT map to a clean modular grid. It approximates a 2:3 ratio for the hero (63% ≈ 5/8) with the remaining third split roughly 40/60. In a 12-field grid: hero = 7.5 fields, offer = 1.7, info = 2.8 — not clean.
- If proportions don't map to a modular grid, then use a RATIO-BASED approach instead: define zone heights as ratios (e.g., 9:2:3 for a 14-field equivalent) and compute pixel heights from the ratio. This is what the Figma plugin should do — compute from ratios, not from fixed field counts.
- If the ratio-based approach produces zones that feel visually "right," test whether the hero zone follows a near-Golden Section relationship with the full card height. 63% ≈ 1/(1+1/1.618) ≈ 62% — close enough that the Golden Section may be the underlying proportion at work.

**Variable content adaptation:**

- If business name length varies, then the grid must have rules for text overflow: truncate with ellipsis, reduce font size, or reflow to a second line — each with defined triggers (e.g., "if business name > 24 chars, reduce from 14pt to 12pt").
- If headline length varies, then the hero zone grid should accommodate 1-line and 2-line headlines without changing the zone's overall height. Use vertical alignment (center or bottom-align within the zone) rather than resizing the zone.
- If the postcard format changes (e.g., 4×6 vs 6×9), then the grid proportions (ratios) stay the same but the absolute measurements change. The grid system should be defined in ratios, not absolute units.

### Key Concepts & Vocabulary
| Term | What it means | When it applies |
|------|--------------|-----------------|
| Module (field) | The smallest unit of the grid — a rectangular cell | Grid construction — every element is 1+ modules |
| Gutter | Space between modules (horizontal and vertical) | Layout spacing — prevents elements from touching |
| Baseline grid | Invisible horizontal lines that text sits on | Vertical rhythm — all text and spacing aligns to this |
| Type area (Satzspiegel) | The rectangle within the margins where content lives | First step in grid construction — define margins first |
| Golden Section | Ratio of 1:1.618, used for margin and proportion calculations | Margin sizing, zone proportion verification |
| Modular grid | Grid of equal-sized fields in rows and columns | Brockmann's core system — fields combine to hold content |

### Specific Techniques

**Grid Construction Method (adapted from Brockmann for 6×9" postcards):**

1. **Define the format:** 6" × 9" with 0.125" bleed on all sides. Trim size = 6×9. Safe area = 5.75×8.75 (0.125" inset from trim).
2. **Set margins:** Using Golden Section — if inner margin = M, outer margin = M × 1.618. For a postcard (no binding), all margins can be equal. Start with 0.25" margins. Content area = 5.5" × 8.5".
3. **Choose a grid division:** For 3 horizontal zones, use a row-based grid. Divide 8.5" content height into rows. A 12-row grid → 0.708" per row. A 14-row grid → 0.607" per row.
4. **Assign zones to rows:** Hero photo = 8 of 12 rows (66.7%) or 9 of 14 (64.3%). Offer strip = 2 rows (16.7% or 14.3%). Info bar = 2-3 rows (16.7% or 21.4%).
5. **Lock to baseline grid:** Choose body text size (e.g., 10pt / 14pt leading). Baseline grid = 14pt. Verify that row heights are multiples of 14pt.
6. **Define column grid within zones:** The offer strip and info bar may need 2-3 columns for different content blocks. The hero zone is typically full-width (photo + headline overlay).
7. **Set gutters:** Vertical gutter = 14pt (one baseline unit). Horizontal gutter = 1em of body text (~10pt).

**The Rune Madsen Insight (from Programming Design Systems):**
Brockmann's modular grid is "absolutely uniform, created by dividing the canvas into equally-sized columns and rows. Designers could then use these basic building blocks — called modules — to flow text or images vertically along columns, horizontally along rows, or both." The key insight for programmatic generation: the grid is a COORDINATE SYSTEM. The plugin places elements at grid coordinates, not at pixel positions. This makes the system resolution-independent and adaptable.

### Quotes That Reveal Their Thinking

1. "The grid system is an aid, not a guarantee. It permits a number of possible uses and each designer can look for a solution appropriate to his personal style. But one must learn how to use the grid; it is an art that requires practice." — Grid Systems in Graphic Design [verbatim]

2. "The rule: The fewer the differences in the size of the illustrations, the quieter the impression created by the design." — Grid Systems in Graphic Design [verbatim]

3. "Work with the grid system means submitting to laws of universal validity. The use of the grid system implies the will to systematize, to clarify, the will to penetrate to the essentials, to concentrate." — Grid and Design Philosophy essay [verbatim]

4. "The use of the grid as an ordering system is the expression of a certain mental attitude inasmuch as it shows that the designer conceives his work in terms that are constructive and oriented to the future." — Grid and Design Philosophy essay [verbatim]

---
*Research depth: Read depth (2 Exa searches + 1 Firecrawl scrape of Rune Madsen primary source)*
*Primary source read: programmingdesignsystems.com + Archive.org full text excerpts + neugraphic.com philosophy essay*
*Session 44, 2026-04-13*
