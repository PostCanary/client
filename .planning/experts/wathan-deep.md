## Adam Wathan -- Deep Research

### Origin Story

Adam Wathan's path to utility-first CSS was not ideological -- it was empirical, driven by frustration accumulated across five distinct phases of CSS authorship. He started as a "semantic CSS" purist following CSS Zen Garden orthodoxy: name classes after content (`.author-bio`), keep all styling in CSS, never let presentational information touch HTML. But he noticed a coupling problem -- his CSS was a perfect mirror of his HTML structure. Even after adopting BEM to decouple selectors from DOM nesting, he hit the next wall: dealing with similar components. Two visually identical elements (an author bio and an article preview) needed completely separate CSS because they were "semantically" different. He tried `@extend`, duplication, and content-agnostic component names (`.media-card`), each exposing a new trade-off.

The pivot came from reading Nicolas Gallagher's "About HTML semantics and front-end architecture," which reframed the question from "separation of concerns" to **dependency direction**: either your CSS depends on HTML (semantic naming, restyleable but not reusable) or your HTML depends on CSS (utility naming, reusable but not restyleable). Wathan chose reusability. He found that as components became smaller and more content-agnostic, they converged on single-property utilities. He built out suites of utility classes, discovered he could build entirely new UI without writing new CSS, and the constraint system itself eliminated inconsistency. Tailwind CSS was released Halloween 2017 as the framework encoding this philosophy. "Refactoring UI" (co-authored with Steve Schoger, 2018) extended the methodology from CSS architecture into visual design decisions -- spacing systems, color palettes, typography scales -- giving developers concrete rules for the *values* behind the utilities.

### Core Methodology (5-7 numbered actionable principles)

1. **Optimize for reusable CSS, not restyleable HTML.** The fundamental architectural choice. Name classes after visual patterns (`.card`, `.btn--primary`, `.text-sm`), not content (`.author-bio`). Accept that your HTML will depend on your CSS vocabulary. This means when you need to change how something looks, you change the markup classes, not the stylesheet.

2. **Constrain every visual decision to a curated token scale.** Every value in the system -- spacing, font sizes, colors, shadows, border radii, opacity -- must come from a predefined, finite set. No arbitrary values. The constraint is the design system: "Is this `text-sm` or `text-xs`? Should I use `py-3` or `py-4`?" When everyone chooses from the same limited options, CSS stops growing linearly with project size.

3. **Build with utilities first; extract components only when duplication is proven and painful.** Start every piece of UI by composing utility classes directly in markup. Only extract a reusable component (CSS class or template partial) when you see the *same combination* of utilities repeated across *multiple instances* and maintaining them in sync becomes a real burden. Never pre-emptively abstract. A navbar used once does not need a `.navbar` component.

4. **Prefer composition over subcomponents.** When you need a variation (card with shadow, list aligned right), compose existing utilities or components rather than creating modifier classes. `.card` + `.shadow` + `.rounded` beats `.card--shadowed--rounded`. This keeps each piece small and reusable, avoids modifier explosion, and often means you write zero new CSS.

5. **Define all design scales up front before building.** Before writing any component code, define your spacing scale (non-linear, with no two adjacent values closer than ~25% apart), your type scale (hand-crafted, px or rem, no em units), your color palette (8-10 shades per hue, defined in HSL/OKLCH), your shadow elevation levels (typically 5), and your border-radius options. These become the closed vocabulary that utilities map to.

6. **Components are templates, not CSS classes.** When you do extract a repeating pattern, the abstraction should be a framework component (React/Vue/Svelte component or template partial), not a CSS class using `@apply`. The component owns both the markup structure and the utility composition. CSS-only abstractions (`.btn-purple { @apply ... }`) are acceptable only for truly tiny, leaf-level elements like buttons and badges, and only when a template component feels too heavy.

7. **Every line of new CSS is an opportunity for inconsistency.** This is the meta-principle behind everything else. Custom CSS means a blank canvas; a blank canvas means arbitrary values; arbitrary values mean drift. Real-world codebases without constraints end up with 400+ unique text colors and 50+ font sizes. The solution is never to write new CSS when you can compose existing utilities.

### Decision Rules (MOST IMPORTANT -- if/then rules)

**Dependency direction:**
- IF you need visual styles that will be used across many different content types THEN optimize for reusable CSS (utility/content-agnostic classes).
- IF you are building a one-off marketing page where the design will be completely replaced later THEN semantic/restyleable CSS may be appropriate. (Wathan considers this rare.)

**When to extract a component:**
- IF a utility combination appears only once in your codebase THEN leave it as composed utilities, even if the class list is long.
- IF the same combination of utilities is duplicated across multiple files and keeping them in sync is painful THEN extract to a template component (React/Vue/Svelte).
- IF the duplicated pattern is a tiny single-element widget (button, badge, form input) AND you are not using a component framework THEN extract to a CSS class using `@apply`.
- IF you are tempted to use `@apply` just to make markup "look cleaner" THEN stop -- you are just writing CSS again and losing all utility-first benefits.

**When to create a new token/scale value:**
- IF a design spec calls for a value not in your scale THEN pick the nearest scale value, do not invent a new one.
- IF no existing scale value works and the gap represents a genuine need across multiple components THEN add the value to the scale, ensuring no two adjacent values are closer than ~25% apart.
- IF you are adding a one-off arbitrary value THEN treat it as a code smell. The fractional/unusual number itself (like `pt-97.25`) should signal to the developer that something unusual is happening.

**Scale architecture:**
- IF building a spacing scale THEN use a non-linear progression from a base unit (e.g., 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 80...). The gaps widen as values increase.
- IF building a type scale THEN hand-craft it (do not use a mathematical ratio). Avoid fractional sizes. Use px or rem, never em.
- IF building a color palette THEN define 8-10 shades per hue up front. Choose a base color that works as a button background. Darkest shade is for text, lightest for tinted backgrounds. Increase saturation as lightness increases. Rotate hue up to 20-30 degrees to make lighter shades feel more natural.
- IF building a maxWidth scale THEN use a progressive (non-linear) scale, not a linear one. Values at the low end should be closer together; values at the high end spread out.
- IF building shadow elevations THEN define ~5 levels. Use two-part shadows for realism.

**Naming conventions (from Tailwind's internal rules):**
- IF a scale is proportional (values are multiples of a unit) THEN use numeric names (`spacing-4`, `spacing-8`).
- IF a scale is progressive (values have no mathematical relationship) THEN use t-shirt size names (`max-w-sm`, `max-w-md`, `max-w-lg`).
- IF a utility has no value suffix (bare `shadow`, `rounded`) THEN rename it to include an explicit size (`shadow-sm`, `rounded-sm`) -- bare names make the scale unpredictable.

**Component vs. utility boundary:**
- IF the styling involves a single CSS property or a very small set of independent properties THEN use a utility.
- IF the styling involves complex interactions between elements (e.g., changing a child's property on parent hover) THEN use a component or custom CSS -- utilities cannot express these relationships.
- IF you are writing a modifier like `.actions-list--left` that maps to a single CSS property THEN delete the component and use a utility (`.text-left`) instead.

**Design process:**
- IF starting a new design THEN design in grayscale first -- force hierarchy through spacing, contrast, and size before introducing color.
- IF an element feels too prominent THEN de-emphasize it rather than emphasizing the thing you want to stand out.
- IF choosing between emphasizing with size vs. weight vs. color THEN use all three dimensions together. Size for the biggest distinctions, weight for medium, color for fine-grained.

### Key Concepts and Vocabulary (table)

| Concept | Definition |
|---------|------------|
| Dependency direction | The fundamental framing: does CSS depend on HTML (semantic naming) or HTML depend on CSS (utility naming)? Replaces "separation of concerns" as the architectural question. |
| Utility-first | Build everything from single-purpose utility classes initially; only extract components after duplication is proven. Not "utility-only." |
| Blank canvas problem | Every new line of custom CSS is an unconstrained opportunity to introduce arbitrary values, leading to style drift. Utilities eliminate this by restricting choices to a curated set. |
| Content-agnostic components | Classes named after visual patterns (`.card`, `.media-card`) rather than content (`.author-bio`). Phase 3 in Wathan's evolution. |
| Composition over subcomponents | Using multiple small, independent classes together (`.card .shadow .rounded`) rather than creating modifier variants (`.card--shadowed--rounded`). |
| Token scale | A predefined, finite set of values for a design property (spacing, color, type size, shadow, radius). The "vocabulary" of the design system. |
| Progressive scale | A non-linear scale where gaps between values widen as values increase (e.g., spacing: 4, 8, 12, 16, 24, 32, 48, 64). Contrast with linear scales. |
| The 25% rule | No two adjacent values in a scale should be closer than ~25% apart. Ensures each step is perceptibly different. |
| @apply | Tailwind directive to bundle utilities into a CSS class. Wathan discourages heavy use -- "you are basically just writing CSS again." |
| Template components | The preferred abstraction: React/Vue/Svelte components that compose utilities in their template. Own both markup structure and style composition. |
| HSL color model | Hue-Saturation-Lightness. Wathan and Schoger advocate defining palettes in HSL (or OKLCH in v4) because it maps to intuitive design decisions. |
| Spacing multiplier | Tailwind v4 concept: define a single `--spacing` unit (e.g., 0.25rem) and derive all spacing utilities as multiples (`px-4` = `calc(var(--spacing) * 4)`). Replaces explicit spacing scales. |

### Specific Techniques (step-by-step, concrete)

**Building a spacing scale:**
1. Choose a base unit (4px / 0.25rem is Tailwind's default).
2. Build up from the base: 0, 1px, 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 3rem, 4rem, 5rem, 6rem, 8rem, 10rem, 12rem, 16rem.
3. Verify no two adjacent values are closer than 25% apart. At the low end, steps can be 4px; at the high end, steps should be 32px or more.
4. Use this single scale for margin, padding, gap, width, and height. Do not maintain separate scales.
5. In Tailwind v4: define `--spacing: 0.25rem` and let the multiplier system generate values.

**Building a color palette:**
1. Pick a base color per hue that works as a button background (mid-range, ~500 level).
2. Define the darkest shade (usable for text on white background).
3. Define the lightest shade (usable as a tinted background).
4. Fill in the gaps: 8-10 total shades per hue (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).
5. As lightness increases, increase saturation slightly to prevent washed-out colors.
6. Optionally rotate hue by up to 20-30 degrees for lighter shades to add warmth/vibrancy.
7. For greys: choose a temperature (cool = saturate with blue, warm = saturate with yellow/orange, neutral = 0 saturation). You need 8-10 grey shades.
8. For accessibility: ensure text-on-background combinations meet 4.5:1 contrast ratio (small text) or 3:1 (large text).

**Building a type scale:**
1. Hand-pick sizes rather than using a mathematical ratio. Avoid fractional pixel values.
2. Example scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px, 60px, 72px.
3. Use px or rem. Never em (relative sizing does not scale predictably).
4. Define line-height proportionally: larger text gets tighter line-height (e.g., body at 1.5, headings at 1.2).
5. Use three hierarchy dimensions: size (biggest distinctions), weight (400-500 for body, 600-700 for emphasis), and color (dark for primary, grey for secondary, lighter grey for tertiary).
6. Keep line length at 45-75 characters (20-35em).

**Extracting a component from utilities:**
1. Build the UI entirely from utility classes first.
2. Use it in production. Wait until the same combination appears in 2+ places.
3. When duplication is painful, create a template component (React/Vue/Svelte) that encapsulates both the markup structure and the utility classes.
4. Only if a template component is too heavy (tiny leaf element like a button), use `@apply` to create a CSS class, and wrap it in `@layer components`.
5. Never use `@apply` just to make HTML "look cleaner."

**Translating a design spec into tokens:**
1. Inventory every visual value in the design: every unique color, spacing value, font size, shadow, radius, opacity.
2. Cluster similar values and snap them to a scale. If the design uses 14px and 15px spacing, pick one.
3. Define the resulting scales in your theme configuration (Tailwind `@theme` or CSS custom properties).
4. Map semantic meanings to base tokens where needed (e.g., `--color-primary` points to `--color-blue-500`).
5. Build components using only the defined token vocabulary. Flag any value that breaks out of the system.

### Quotes That Reveal His Thinking (2-3 direct quotes with sources)

**On the blank canvas problem:**
"You could try and enforce consistency through variables or mixins, but every line of new CSS is still an opportunity for new complexity; adding more CSS will never make your CSS simpler."
-- "CSS Utility Classes and Separation of Concerns" (2017), adamwathan.me

**On dependency direction vs. separation of concerns:**
"There are two ways you can write HTML and CSS: CSS that depends on HTML [semantic naming -- restyleable but not reusable], or HTML that depends on CSS [utility naming -- reusable but not restyleable]. Neither is inherently wrong; it's just a decision made based on what's more important to you in a specific context."
-- "CSS Utility Classes and Separation of Concerns" (2017), adamwathan.me

**On premature abstraction:**
"The reason I call the approach I take to CSS utility-first is because I try to build everything I can out of utilities, and only extract repeating patterns as they emerge. [...] Taking a component-first approach to CSS means you create components for things even if they will never get reused. This premature abstraction is the source of a lot of bloat and complexity in stylesheets."
-- "CSS Utility Classes and Separation of Concerns" (2017), adamwathan.me

**On constraints as design enforcement:**
"With inline styles, there are no constraints on what values you choose. One tag could be font-size: 14px, another could be font-size: 13px, another could be font-size: .9em, and another could be font-size: .85rem. It's the same blank canvas problem you face when writing new CSS for every new component. Utilities force you to choose: Is this text-sm or text-xs? Should I use py-3 or py-4?"
-- "CSS Utility Classes and Separation of Concerns" (2017), adamwathan.me
