# Phase 04 — Template Headline Design Decisions (Session 52)

## Problem

Session 52 smoke test of Phase 4B render-worker on a real Desert Diamond HVAC draft produced a visually broken PDF. Blue headline slot designed for 2-word shouts rendered a 6-word phrase wrapped across 5 stacked lines, breaking at `/` in `A/C` and overflowing into the offer strip. Red headline OK, bridge OK, photo OK, QR OK, offer strip OK, info panel OK — only the blue shouted headline is broken.

Input: `"Phoenix Homeowners — Stay Cool This Summer With A New A/C System!"` (9 words after dash).

Splitter output (correct per algorithm, wrong for template):
- blue_1 = `"Summer With A"` (3 words — too wide at 81pt Oswald Bold in 282px slot)
- blue_2 = `"New A/C System!"` (4 words — too wide)

CSS at 81pt forces wrap at spaces and at `/`, giving 5 physical lines per 2 logical lines.

## Panel input (loaded deep files)

| Expert | Relevant rule |
|---|---|
| **Gendusa** — 130K+ clients, 270K+ postcards | Headline = 15-25% of front. 2-second comprehension test. Clarity > cleverness. 80% of readers see ONLY the headline. |
| **Caples** — 35 tested formulas | "Long headlines that say something outpull short headlines that say nothing." Short (<3 words) = expert-only, high failure rate. Self-interest > news > curiosity. |
| **Halbert** — A-pile / AIDA | One central selling idea in the headline. Benefit-driven. Clarity over brevity. |
| **Draplin** — template aesthetic | If the design requires complex effects (like radical font-shrinking) to work, the underlying form is weak → redesign. Economy of form. Don't stretch type. |
| **Whitman** — print psychology | ≤5 words → ALL CAPS (shouted). Longer → Initial Caps. Body caption under photo gets 200% more readership. Z-pattern eye flow. |
| **Template-pipeline rules** (Abyssale/Lob synthesis) | Auto-resize cascade + floor is the industry standard for variable text in fixed-dimension slots. Applies to EVERY variable text slot, not just business name. |

## Convergence

1. **The HAC-1000 blue slot is a shouted accent, not a sentence.** Figma template defaults are `"NEW A/C"` / `"SYSTEM!"` — 2 words per line max. This is consistent with Whitman's ≤5-word ALL CAPS rule and Draplin's economy-of-form.
2. **The splitter must enforce the template's visual contract.** Producing 6 blue words for a 4-word container is a splitter bug, not a rendering bug. Caples + Gendusa agree: clarity and eye-flow come from matching message structure to visual structure.
3. **Cascade as safety net, not primary mechanism.** Shrinking "Summer With A" to 40pt to fit violates Draplin (underlying form is weak) and degrades the shout (Whitman). The primary fix is at construction, with cascade as a second defense.
4. **Bridge absorbs excess.** Long customer input should flow into bridge (which has more room and soft-wraps gracefully), preserving the punchy 2-word blue shout.

## Decision rules

### R1 — Splitter enforces blue-slot word caps
- `blue_1` max: **2 words** (word-balanced with blue_2)
- `blue_2` max: **2 words**, last word shouted
- **Excess words from blue → promoted back to bridge** (bridge has 241.8px width + can soft-wrap)
- Emit warning `HEADLINE_BLUE_OVERFLOW_TO_BRIDGE` when this fires

### R2 — Splitter caps red slot similarly
- `red_1` + `red_2` combined: max **4 words** total (word-balanced)
- Excess → truncate with warning `HEADLINE_RED_TRUNCATED`
- Alternative: cap is only relevant for degenerate input since Case A typically gives 2-3 red words

### R3 — Measurement cascade as safety net
- Add `decide_headline_line(text, font_path, slot_width_px, size_ladder)` to `text_overflow.py`
- Size ladder blue: `[81, 72, 64, 56, 48]` pt (floor 48 preserves shout impact per Gendusa 15-25%)
- Size ladder red: `[78, 70, 62, 54, 48]` pt (same floor)
- Pick largest pt where single-line measurement fits within slot width
- If even 48pt overflows → truncate with ellipsis + warning `HEADLINE_LINE_CASCADED`
- Apply result via inline `style="font-size: Xpt"` on the `<p>` (overrides CSS default)

### R4 — Template CSS adds word-break guard
- Add `word-break: keep-all; overflow-wrap: normal;` to `.headline-blue-1`, `.headline-blue-2`, `.headline-red-1`, `.headline-red-2`
- Rationale: prevents WeasyPrint from breaking at `/` in tokens like `A/C`, `24/7`. The cascade + splitter caps should make this a belt-and-suspenders defense rather than load-bearing.

### R5 — Warnings surface to cards_output
- Orchestrator already plumbs warnings through `cards_output[].warnings`. Client will display them in StepDesign next to the Generate Proof button (Phase 4D task 28) so Drake/users see when the content is being reshaped.

## Rejected alternatives

**Pure cascade** (just shrink the font): rejected by Draplin. "Summer With A" at 40pt breaks the shout's visual dominance (Gendusa 15-25% rule, Whitman Z-pattern entry point).

**Pure template redesign** (make the blue slot 800px wide): rejected as scope creep. The Figma template is approved Session 47 and validated by 57 passing worker tests. The template's ≤2-word-per-line contract is correct; the splitter has to respect it.

**Keep the current splitter and fix at AI-generation time**: rejected because (a) customers edit headlines post-generation per PLAN.md key decision 1 ("Renderer consumes persisted draft content, NOT fresh AI calls"), (b) the splitter must be robust to any input, (c) this pushes the failure mode to Phase 4D-visible failures.

## Implementation plan

1. **headline_splitter.py** — update `_split_case_a` and Case B to cap blue at 4 words total (2 per line), promote excess to bridge. Add `HEADLINE_BLUE_OVERFLOW_TO_BRIDGE` warning.
2. **text_overflow.py** — add `decide_headline_line(text, font_path, slot_width_px, size_ladder) -> Layout`. Mirror `decide_business_name` shape.
3. **postcard_renderer.py** — wire cascade for red_1, red_2, blue_1, blue_2. Pass computed `font_size_pt` to template.
4. **hac-1000-front.html** — accept `{{ blue_1_size_pt }}` etc. as inline-style overrides. Add `word-break: keep-all` to the 4 headline classes.
5. **Tests** — add splitter test for the 6-word blue overflow case. Add cascade unit tests at 4 size steps. Add renderer snapshot test regenerated with fixture input matching the Session 52 smoke test.
6. **Re-smoke** on same draft. PDF should render 2-word shouts per blue line at a readable size, with warnings surfaced.

## Out of scope for this session

- CMYK / veraPDF / 1 Vision (PLAN.md deferred)
- Back-of-postcard (Phase 4 front-only)
- Long-term AI prompting changes to generate template-shaped headlines (future — tune the AI prompts in `app/services/claude_generation.py` to produce em-dash-separated ≤4-blue-word output)
