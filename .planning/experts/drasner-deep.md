## Sarah Drasner -- Deep Research

### Origin Story

Sarah Drasner came to software from fine art -- she holds a BFA in Printmaking and Photography from the School of the Art Institute of Chicago. Her background in printmaking, painting, and scientific illustration gave her a design-first mental model that she carried into frontend development. She discovered Vue.js early (around 2016) and was drawn to its legibility and declarative clarity -- qualities she explicitly contrasts with jQuery's imperative DOM-fishing approach. She joined the Vue.js core team, contributed to the Vue 3 documentation (especially the reactivity and accessibility sections), and became one of the framework's most prominent educators through her Frontend Masters courses and CSS-Tricks article series.

Her GitHub bio reads simply: "comprehension over configuration." This phrase is the single best summary of her entire philosophy -- components, APIs, layout systems, and code organization should all be optimized for the person reading the code, not the person writing it. She moved from hands-on Vue work (Microsoft, Netlify VP of Developer Experience) to engineering leadership at Google (Director of Engineering, Core Developer Web), and her public output since ~2022 has shifted toward management. Her most detailed component architecture writing dates from 2017-2020.

### Core Methodology (5-7 numbered actionable principles)

1. **Comprehension over configuration.** Structure code so a maintainer seeing it for the first time immediately understands the intent. "We spend 70% of our time reading code and 30% writing it" -- optimize for the reader. If a component requires understanding a lot of context to use, it's too complex.

2. **Props down, events up.** Data flows from parent to child via props; children communicate back via emitted events. This guarantees a single source of truth. Never mutate props in a child component -- emit an event and let the parent decide.

3. **Slots over prop explosion.** When you find yourself passing content (markup, icons, varied text) via props, switch to slots. Props are for data; slots are for content composition. "We could pass all the different content and styles down into the component with props, and switch everything out each time... but it would be really nice if we could reuse the components and populate them with the same data or functionality. This is where slots come in."

4. **Prop validation as self-documenting contracts.** Always type and validate props. Prop validation is not just error-catching -- it's documentation that lives in the code. Use custom validator functions when you need to check values against business logic.

5. **Layout is the single most important design concept.** Before thinking about fonts, colors, or content, commit to a layout system. "Layout is probably one of the most important concepts." Break the design process into sequential steps: layout first, then populate. Use grids to "bring order to chaos" and anchor elements to each other.

6. **Respect the grid until you have a reason to break it.** Grids provide "the architecture of space." You should understand grid rules even if you plan to break them -- "even if you don't wanna use them, you should understand why you're breaking those rules." Breaking a grid is a deliberate design decision, not an accident.

7. **One maintainer's mind as the benchmark.** Every structural decision -- component splitting, naming, layout nesting -- should be evaluated by asking: "What happens when someone else maintains this code? What happens when the design changes?" If nested grids make the code hard to understand, flatten them. If a mixin hides too much context, it's a liability.

### Decision Rules (MOST IMPORTANT -- if/then rules)

**Component splitting:**
- IF you have conditional rendering with multiple v-if branches -> EXTRACT each branch into its own component (implied by her teaching, explicitly stated by her follower Daniel Kelly at Vue School)
- IF a component has two variations with slight content or style differences -> USE slots, not prop-switching and not forking the component
- IF you are passing content (markup, HTML, icons) as a prop -> CONVERT to a slot. Props are for data values, slots are for template content.
- IF you need more than one slot -> NAME all of them. "Personally, if I am using more than one slot at a time, I will name all of them so that it's super clear what is going where for other maintainers."
- IF you need to switch between components but preserve each one's state -> WRAP in `<keep-alive>`

**Data flow:**
- IF a child needs to change parent state -> EMIT an event, never mutate the prop directly
- IF a piece of data is derived from existing state -> USE a computed property, not a method or a watcher
- IF you need to react to state changes with side effects (async calls, DOM manipulation, transitions) -> USE a watcher
- IF the same logic is used in multiple components -> EXTRACT into a composable (Vue 3) rather than duplicating code

**Layout:**
- IF the layout is 2-dimensional (rows AND columns) -> USE CSS Grid
- IF the layout is 1-dimensional (a single row or column of items) -> USE Flexbox
- IF you need a nested grid -> FIRST try to achieve the layout with a single grid. Only nest grids when there's a "clearly defined reason why" (e.g., a photo grid inside a larger page layout)
- IF you can't tell from looking at nested grids what each one controls -> FLATTEN the structure for maintainability
- IF the design has diagonals, curves, or non-rectilinear shapes -> USE CSS shape-outside, clip-path, or SVG rather than hacking the grid

**NO CLEAR DECISION RULES FOUND for:**
- How to translate a Figma spec into a Vue component tree (no published methodology)
- When to use absolute positioning vs. flex vs. grid within a single component
- How to scope styles to visual concerns (one component = one visual concern)
- How to decide component boundaries based on visual design elements

### Key Concepts and Vocabulary (table)

| Term | Meaning | Source |
|------|---------|--------|
| Comprehension over configuration | Code structure should prioritize readability over flexibility or power | GitHub bio, all teaching |
| Architecture of space | Grid-based composition as the structural foundation of visual design | Design for Developers course (from "Making and Breaking the Grid" book) |
| Props down, events up | Unidirectional data flow pattern: parents pass data via props, children communicate via emitted events | Intro to Vue series, Vue 3 course |
| Single source of truth | Only one component owns and mutates any given piece of state | Components & Props lesson |
| Anchoring | Visual design principle: elements align to each other and to a grid to create visual coherence | Design for Developers course |
| Slot composition | Using Vue slots to inject content into reusable components instead of passing content via props | CSS-Tricks Intro to Vue Part 2 |
| Declarative vs imperative | Vue's model (declare what you want, bind to state) vs jQuery's model (fish things out of the DOM, listen, respond) | Smashing Magazine jQuery-to-Vue article |
| Reactive programming | Programming with asynchronous data streams; Vue's reactivity system tracks dependencies automatically | Vue 3 course, Methods/Computed/Watchers article |
| Making and Breaking the Grid | Reference book by Timothy Samara that Drasner treats as the canonical resource on grid-based composition | Design for Developers course |

### Specific Techniques (step-by-step, concrete)

**Technique 1: Structuring a Vue component with props and validation**
1. Define the component with a descriptive PascalCase name
2. Declare props with types, required flags, and optionally custom validators
3. Use the prop in the template via binding (`:propName`)
4. The parent passes data down; the child never modifies it
5. If the child needs to communicate upward, use `$emit` with a named event

**Technique 2: Using slots instead of prop explosion**
1. Identify content that varies between uses of the same component
2. Replace the varying content in the child template with `<slot></slot>`
3. If the component has multiple injection points, name each slot: `<slot name="header"></slot>`
4. In the parent, inject content using the slot attribute: `<h1 slot="header">Title</h1>`
5. Provide default content inside the slot tag for fallback: `<slot>Default text</slot>`
6. If you need to preserve state across component switches, wrap with `<keep-alive>`

**Technique 3: Choosing between methods, computed, and watchers**
1. If you need to run logic in response to a user action (click, submit) -> method
2. If you need to derive/transform existing data for display (filtering, formatting) -> computed property
3. If you need to react to a data change with a side effect (API call, animation, DOM update) -> watcher
4. Computed properties cache automatically; methods re-run every render -- prefer computed for display transformations

**Technique 4: Layout-first design process (from Design for Developers)**
1. Start with layout ONLY -- ignore fonts, colors, content details
2. Create primitive shape compositions (rectangles, circles) to explore spatial relationships
3. Choose a grid system and commit to it
4. Implement the grid in CSS Grid (for 2D) or Flexbox (for 1D)
5. Populate the grid areas with content
6. Only break the grid with deliberate intent, not by accident
7. Evaluate: "as a maintainer, looking at this code, is the layout structure clear?"

### Quotes That Reveal Her Thinking (2-3 direct quotes with sources)

> "There's a stat out there that we spend 70% of our time as programmers reading code and 30% writing it. Personally, I love that, as a maintainer, I can look at a codebase I've never seen before and know immediately what the author has intended by the distinction made from methods, computed, and watchers."
> -- "Methods, Computed, and Watchers in Vue.js", CSS-Tricks (2018)

> "We could pass all the different content and styles down into the component with props, and switch everything out each time, or we could fork the components themselves and create different versions of them. But it would be really nice if we could reuse the components, and populate them with the same data or functionality. This is where slots come in really handy."
> -- "Intro to Vue.js: Components, Props, and Slots", CSS-Tricks (2017)

> "The grid is like a lion in a cage, and the designer is the lion tamer. It's fun to play with the lion, but the designer has to know when to get out before the lion eats them."
> -- Design for Developers course, Frontend Masters (2019), quoting "Making and Breaking the Grid" by Timothy Samara

---

### Honest Assessment

The scan's MEDIUM relevance rating is accurate. Drasner is a strong teacher of Vue primitives (props, slots, events, computed, watchers) and design fundamentals (grids, composition, layout-first thinking). Her "comprehension over configuration" philosophy is genuinely useful as a north star.

However, she has **no published methodology** for the specific question we care about most: how to translate a visual design spec into Vue component boundaries, how to decide layout modes per component, or how to scope styles to visual concerns. Her Design for Developers course covers layout from a designer's perspective, but does not bridge to "here is how you decompose this layout into Vue components." Her Vue courses teach the building blocks but stop before the assembly rules.

**What we can extract:** Her slots-over-props rule, her grid commitment principle, and her maintainability-first evaluation ("what does a new maintainer see?") are directly applicable. Her prop validation pattern is useful for component contracts. Her layout-first sequencing (layout -> content -> detail) is a valid design process.

**What is missing:** Prescriptive rules for component decomposition from a design spec, visual-concern scoping, absolute vs flex vs grid decisions within components, and any framework for "one component = one visual concern." These need to come from other experts (Brad Frost's Atomic Design, Mark Dalgleish's CSS architecture work, or the Vue design system community).
