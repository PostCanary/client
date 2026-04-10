# Implementation Bridge — Design-to-Code Decision Rules

> **Load when:** Translating a visual design spec into CSS tokens, Vue component structure, or verifying rendered output matches spec. These experts bridge "what should it look like" → "what code produces that look."
>
> **Load alongside:** `experts-design-panel.md` (Gendusa/Draplin/Whitman/Halbert/Caples/Heath — what the card should look like)
>
> **Research depth:** Read depth (3 Exa searches + 1 primary source scrape per expert, per phase). Full pipeline: scan → deep → critics → synthesis.

---

## How This File Works

Three experts, each owning a specific phase of implementation. When domains overlap, follow the order: Wathan (tokens) → Drasner (structure) → Comeau (verification).

| Expert | Domain | Activation |
|--------|--------|------------|
| **Adam Wathan** | Token system — every visual value as a constrained CSS variable | Before writing any CSS value |
| **Sarah Drasner** | Component structure — which Vue component owns what, how props flow | Before creating or splitting components |
| **Josh Comeau** | Pixel verification — does the output match the spec, and if not, why | After rendering, when something looks wrong |

---

## 1. WATHAN RULES — Design Token System

**Source:** Adam Wathan, creator of Tailwind CSS, co-author of "Refactoring UI." His lasting contribution is the constraint philosophy (every value from a curated scale), not the framework. Token architecture is his blind spot — he provides philosophy and implementation but no formal decision framework for token hierarchies. We extracted rules from his blog, Tailwind PRs, and Refactoring UI summaries.

### Token Creation Rules

- If a design spec calls for a value not in your scale, snap to the nearest existing scale value. Do not invent a new token.
- If no existing scale value works AND the gap represents a genuine need across multiple components, add the value to the scale. Ensure no two adjacent values are closer than ~25% apart.
- If you are adding a one-off arbitrary value (like `pt-97.25`), treat it as a code smell. The unusual number itself should signal something unusual is happening.
- If the same visual value appears as a magic number in 3+ components, extract it to a CSS custom property in `:root`. One token, referenced everywhere.
- If a value exists as both a magic number AND a token, delete the magic number. Components reference the token only.

### Scale Architecture

- If building a spacing scale, use non-linear progression from a base unit (gaps widen as values increase). Example: 4, 8, 12, 16, 24, 32, 48, 64.
- If building a type scale, hand-craft it. Do not use mathematical ratios. Avoid fractional sizes. Use pt for print, rem for screen.
- If building a color palette, define 8–10 shades per hue up front. Choose a base that works as a button background. Darkest for text, lightest for tinted backgrounds.
- If building shadow elevations, define ~5 levels. Use two-part shadows for realism. For PostCanary postcards: hard-offset only or none (Draplin rule overrides).

### Component Ownership

- If a component needs a visual value, it references a CSS custom property. It never hardcodes a hex, pt size, or spacing value.
- If a parent needs a child to look different, it passes a prop. The child decides how to use that prop. Never override a child's styles with descendant selectors from the parent.
- If the same style combination appears in only one place, leave it as inline `:style`. Extract to a CSS class only when the combination appears in 3+ places.

### Failure Modes

- His framework assumes utility classes in markup. PostCanary postcards use inline `:style` objects with CSS custom properties — a valid Wathan-compatible approach but not his primary pattern.
- Token architecture (semantic aliases, hierarchies, when to create) is his blind spot. Use his constraint philosophy; build your own token hierarchy.
- Modern CSS (`@layer`, container queries, `clamp()`) has closed some gaps Tailwind filled. His framework is still valid for PostCanary's fixed-size print context.
- Day-1 speed, month-12 pain: scattered utility strings make refactoring hard. Mitigate by keeping tokens in one file (`print-scale.css`).

---

## 2. DRASNER RULES — Component Architecture

**Source:** Sarah Drasner, former Vue.js core team, Google Sr. Director of Engineering. Her content is from 2017–2020 (Vue 2 era, Options API). Relevance is MEDIUM — her fundamentals are sound but she has no published methodology for design-to-component decomposition, which is exactly what PostCanary needs. Her gaps are filled by applying her principles + our own judgment.

### Component Splitting

- If you are passing content (markup, HTML, icons) as a prop, convert to a slot. Props are for data values; slots are for template content.
- If a component has two variations with slight content differences, use slots, not prop-switching or forking.
- If you need more than one slot, name all of them. Unnamed slots in multi-slot components confuse maintainers.
- If a component has conditional rendering with multiple `v-if` branches that are visually distinct, consider extracting each branch into its own component.

### Layout Mode Commitment

- If the layout is 2-dimensional (rows AND columns), use CSS Grid.
- If the layout is 1-dimensional (a single row or column of items), use Flexbox.
- If you can achieve the layout with a single grid, do not nest grids. Only nest when there is a clearly defined reason.
- If PostCanary postcard fronts use absolute positioning for zone stacking (photo underneath, bars overlaid), ALL front zones use absolute positioning. Do not mix absolute and flow layout in the same container.
- If PostCanary postcard backs use flexbox for the content column, ALL back content blocks use flexbox alignment. Consistent layout mode per component.

### Data Flow

- If a child needs to change parent state, emit an event. Never mutate props directly.
- If a piece of data is derived from existing state, use a computed property, not a method or watcher.
- If the same logic appears in multiple components, extract into a composable.

### The Real Insight: Comprehension Over Configuration

Every structural decision — component splitting, naming, layout nesting — should be evaluated by asking: "What happens when someone else maintains this code?" If a component is hard to understand at a glance, simplify it.

### Failure Modes

- No published methodology for translating a visual design spec into Vue component boundaries. This is her critical gap for PostCanary.
- Her Vue content is Options API era (2017–2020). Composition API + `<script setup>` is the current standard. Her principles transfer; her code patterns need updating.
- "Props down, events up" breaks down for cross-cutting concerns (sibling components needing same data). Use Pinia stores for shared state.
- "Grid for 2D, Flexbox for 1D" is correct but insufficient. Real components need decisions about absolute positioning, overlapping elements, and z-index management that she doesn't address.

---

## 3. COMEAU RULES — Pixel Verification

**Source:** Josh Comeau, creator of "CSS for JavaScript Developers" (21K+ students). His core insight: CSS is a constellation of layout algorithms, not a bag of properties. Best CSS educator alive, but an educator, not a production CSS engineer. His pixel-fidelity methodology is philosophy + tips, not a formal protocol.

### The Layout Algorithm Rule

- If an element is behaving unexpectedly, identify which layout algorithm is controlling it BEFORE changing any CSS. Check: does the parent have `display: flex`, `display: grid`? Does the element have `position: absolute/relative/fixed`? The active algorithm determines what every property means.
- If the same CSS snippet works in one place but not another, the elements are being rendered by different layout algorithms.
- If `width` is not being respected in Flexbox, understand that `width`/`flex-basis` in Flexbox is a suggestion, not a hard constraint. Use `flex-shrink: 0` to prevent shrinking.

### Debugging Visual Discrepancies

When the rendered postcard doesn't match the spec, check these 5 things in order:

1. **Zone height** — Measure the actual percentage. Is the zone 30% or 25%? Adjust the CSS value.
2. **Text size** — Check the pt value renders correctly. Browser rendering of pt can vary.
3. **Color** — Compare hex values. Dark navy (#0D2B4B) and brand blue (#0488F5) look similar on some monitors but are very different.
4. **Spacing** — Check padding and margins. Too much = floating; too little = crammed.
5. **Font loading** — Check that the condensed font (Oswald) actually loaded. If Google Fonts fails, the fallback (Impact or system sans) will look noticeably different.

### Pixel Fidelity

- If you receive a spec, measure distances yourself using a pixel measurement tool. Do not trust Figma/design tool reported values.
- If the implementation looks "close but not right," arrange spec and implementation side-by-side and play spot-the-difference.
- If something is mathematically centered but looks off, apply optical alignment using `transform: translate()`. Transforms do not affect layout flow — they are visual-only shifts.
- If you need a small positional tweak, use `transform: translate(Xpt, Ypt)`, NOT margin. Margin adjustments pull sibling elements.

### Common Gotchas

- If there is mysterious space below an image, the image is inline in Flow layout (baseline + line-height). Fix: `display: block` on the image.
- If margins seem to disappear or combine, margin collapse is occurring (Flow layout only). Fix: switch to Flexbox or add padding/border.
- If `z-index` is not working, check (a) the element is in a mode that implements z-index (Positioned, Flexbox, Grid — not Flow), and (b) stacking contexts aren't isolating the elements.

### Print-Specific Override

- Comeau's "pixel-pretty-close" is for web browsers where you cannot control the rendering engine. For PostCanary postcards rendered via Playwright/Chromium for print output, you DO control the rendering engine. Be MORE precise than "pretty-close" — measure actual proportions against the spec.
- Screen colors are 10–15% brighter than print (RGB additive vs CMYK subtractive). Design louder on screen than you want in print. If it looks "just right" on screen, it is too muted for print.
- Use pt units for all print measurements. Never px (screen-only), never rem/em (relative to root font, which changes).

### Failure Modes

- His pixel-fidelity methodology is philosophy, not protocol. There is no reproducible debugging flowchart. We synthesized the 5-step debugging loop above from his scattered advice.
- Zero methodology for automated visual regression testing. His approach is manual screenshot comparison — doesn't scale for teams.
- "Pixel-pretty-close" is dangerously permissive for fixed-output contexts like PDF/print. Override with higher precision for PostCanary.
- His CSS-in-JS preference (styled-components) is dated. PostCanary uses inline `:style` objects + CSS custom properties, which is fine.

---

## Expert Convergence (where 2+ bridge experts agree)

| Finding | Experts | Confidence |
|---------|---------|------------|
| Every visual value from a constrained token, never a magic number | Wathan (core philosophy), Comeau (use variables for theming) | HIGH |
| Components own their own styles — parent never overrides child | Wathan (dependency direction), Drasner (props down, events up) | HIGH |
| Pick one layout mode per component and commit | Drasner (Grid vs Flex), Comeau (layout algorithm identification) | HIGH |
| Measure the actual render, don't assume values are correct | Comeau (measure yourself), Wathan (use the scale, verify) | HIGH |

## Expert Conflicts

| Conflict | Resolution for PostCanary |
|----------|--------------------------|
| Wathan: utility classes in markup vs PostCanary: inline `:style` objects | PostCanary postcards use inline `:style` with CSS custom properties. This is Wathan-compatible (values from tokens) but uses a different delivery mechanism. Both approaches enforce the constraint philosophy. |
| Drasner: Grid for 2D vs PostCanary front: absolute positioning | PostCanary postcard fronts use absolute positioning for zone stacking (photo under, bars over). This is correct for overlapping visual zones. Flex/Grid inside each zone for internal alignment. Drasner's rule applies to non-overlapping layouts. |
| Comeau: "pixel-pretty-close" vs PostCanary: print precision | Override with higher precision. PostCanary controls the rendering engine (Playwright/Chromium). Measure actual proportions, don't settle for "close enough." |

---

## Known Gaps

- **Drasner provides no design-to-component decomposition methodology.** PostCanary must derive component boundaries from the visual spec using our own judgment + Draplin's "one visual concern" principle.
- **Wathan provides no semantic token hierarchy.** PostCanary's `print-scale.css` tokens are our own architecture, guided by his constraint philosophy but not his formal system.
- **Comeau provides no automated visual testing methodology.** PostCanary uses manual Playwright screenshots + expert eye review. Automated visual regression (Chromatic, Percy) is deferred post-demo.
- **None of these experts address USPS compliance zones.** Compliance rules come from DMM research, not implementation bridge experts.

---

*Synthesized: 2026-04-10 Session 35*
*Research: 9 files (3 scans + 3 deep + 3 critics) via expert-research pipeline v5.1*
*Research depth: Read depth (~12 Exa searches + 1 Firecrawl scrape per expert)*
*Experts: Adam Wathan, Sarah Drasner, Josh Comeau*
