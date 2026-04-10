## Sarah Drasner -- Initial Scan

### Who They Are

Sarah Drasner is Senior Director of Engineering at Google, leading Core Infrastructure teams powering Google apps (Search, YouTube, Workspace, Cloud) on Web, Android, iOS, and multiplatform. Previously VP of Developer Experience at Netlify and Principal at Microsoft Azure. She was a Vue.js core team member (contributed to Vue 3 docs, reactivity explainers, and the Vue 3 migration guide). She is a Frontend Masters instructor with courses on Vue.js, SVG Animation, and Design for Developers. Author of "SVG Animations" (O'Reilly). Prolific CSS-Tricks contributor. Co-organized Concatenate, a free conference for Nigerian and Kenyan developers.

### Key Works

**Directly relevant:**
- "Intro to Vue.js" 5-part CSS-Tricks series (2017) -- Components, Props, Slots, Vue-CLI, Vuex, Animations
- "Methods, Computed, and Watchers in Vue.js" (CSS-Tricks, 2018)
- "Replacing jQuery With Vue.js: No Build Step Necessary" (Smashing Magazine, 2018)
- "Using Mixins in Vue.js" (CSS-Tricks, 2017)
- Frontend Masters: "Introduction to Vue 3" (2020, ~5 hours)
- Frontend Masters: "Design for Developers" (2019) -- layout, grids, composition, CSS Grid, Flexbox, color, typography
- Vue 3 Reactivity Internals talk (Vue.js Amsterdam 2020)
- CSS Grid Generator tool (open source, built in Vue)
- GitHub repos: intro-to-vue (2784 stars), building-web-apps-with-vue, vue-directory-tree, animated-guide-vue3

**Adjacent:**
- "SVG Animations" book (O'Reilly)
- Extensive CodePen portfolio of Vue + SVG + GreenSock demos
- Vue 3 docs contributor (rewrote accessibility section, reactivity section with animations)
- Management/engineering leadership articles on CSS-Tricks (career ladders, team dynamics)
- Modern Web Podcast with Evan You discussing Vue philosophy (2017)

### Core Idea (one paragraph)

Drasner's work consistently emphasizes that Vue's value lies in its legibility and declarative clarity -- components should be small, composable abstractions that make application structure immediately obvious to a maintainer seeing the code for the first time. She teaches a "props down, events up" data flow, uses slots over excessive prop configuration to keep components flexible without prop explosion, and advocates for prop validation as self-documenting contracts. Her Design for Developers course treats layout as the single most important design concept, teaching grid-based composition as "the architecture of space" where you commit to a layout system (CSS Grid for 2D layouts, Flexbox for 1D alignment) and respect it until you have a deliberate reason to break it. She repeatedly emphasizes comprehension: "We spend 70% of our time reading code and 30% writing it," so component structure should optimize for the reader who will maintain it, not the writer who builds it.

### Initial Red Flags

1. **Vue 2 era bias.** Her most detailed component architecture writing (the CSS-Tricks series, mixins article) is from 2017-2018 and uses the Options API. Her Vue 3 course (2020) covers Composition API but the deep component-splitting philosophy content predates it. Mixins, which she taught extensively, are now considered an anti-pattern in Vue 3 (replaced by composables).

2. **Introductory-level focus.** Most of her published component writing is tutorial-level ("here's what props are, here's what slots are") rather than opinionated architectural guidance about when to split components, how to decide layout modes, or how to translate a Figma spec into a component tree. She teaches the primitives well but doesn't appear to have published a prescriptive "component architecture rulebook."

3. **No specific writing found on visual-fidelity component architecture.** The exact question we care about -- "how do you translate a visual design spec into Vue component boundaries, decide absolute vs flex, scope styles to visual concerns" -- does not appear to be directly addressed in any discoverable written work. Her Design for Developers course covers layout and CSS Grid/Flexbox from a design perspective, but the bridge between "design layout" and "Vue component structure for that layout" is not explicitly published.

4. **Role shift away from hands-on Vue.** Since joining Google (~2022), her public output has shifted to engineering management and infrastructure leadership. She is no longer actively publishing Vue component architecture content.

5. **No criticism found of her Vue approach specifically.** General Vue criticism (Vue 3 complexity, SFC anti-pattern arguments, TypeScript template limitations) exists but none targets Drasner's architectural opinions directly. This means there's less adversarial testing of her ideas compared to someone like, say, Kent C. Dodds whose patterns get actively debated.

### Primary Sources Found

| Source | Type | Relevance |
|--------|------|-----------|
| CSS-Tricks: Intro to Vue Part 2 (Components, Props, Slots) | Article | HIGH -- clearest statement of her component philosophy |
| CSS-Tricks: Methods, Computed, Watchers | Article | MEDIUM -- data flow philosophy, maintainability emphasis |
| CSS-Tricks: Using Mixins in Vue.js | Article | LOW -- outdated pattern, but shows her thinking on code reuse |
| Smashing: Replacing jQuery With Vue.js | Article | MEDIUM -- declarative vs imperative, DOM decoupling philosophy |
| Frontend Masters: Design for Developers | Course (paid) | HIGH -- layout, grids, CSS Grid vs Flexbox, composition |
| Frontend Masters: Introduction to Vue 3 | Course (paid) | HIGH -- Vue 3 component patterns, Composition API |
| Modern Web Podcast with Evan You (2017) | Transcript | MEDIUM -- Vue philosophy discussion, reactivity, simplicity |
| sarah.dev/projects | Portfolio | LOW -- project index, no architectural writing |
| GitHub: sdras/design-for-developers | Repo | MEDIUM -- workshop slides in PDF form (not crawled) |

### Best Secondary Sources

| Source | Why Useful |
|--------|------------|
| Michael Thiessen: "12 Design Patterns in Vue" | Covers Humble Components, Controller Components, Hidden Components -- patterns Drasner doesn't explicitly name but implicitly uses |
| Vue.js Official Style Guide (Priority B & C rules) | The canonical Vue component naming/structure rules that Drasner helped shape as core team member |
| Vue School: "5 Component Design Patterns" | Builds on Smart/Dumb component split that aligns with Drasner's teaching |
| Evan You: "What Vue's Creator Learned the Hard Way with Vue 3" (The New Stack, 2023) | Context on Vue 3's evolution, Composition API rationale |

### Relevance Assessment

**Overall: MEDIUM relevance. Strong on fundamentals, weak on the specific architectural question.**

Drasner is an excellent teacher of Vue component primitives (props, slots, events, computed, watchers) and design fundamentals (layout, grids, composition). She consistently prioritizes legibility and maintainability. However, the specific expertise we need -- translating visual design specs into Vue component structures, deciding layout modes per component, scoping styles to visual concerns, "one component = one visual concern" -- does not appear in her published work in a prescriptive, rules-based form.

Her Design for Developers course is the closest match for the layout/composition philosophy, but it's a general design course, not a Vue component architecture course. Her Vue courses teach the building blocks but stop short of the assembly rules we need.

**Recommendation:** Drasner is a useful background source for understanding Vue component fundamentals and design-to-code thinking, but she is unlikely to be the primary expert for our specific need (prescriptive rules for component architecture that ensures visual fidelity). Look for someone who has published specifically on component decomposition strategies for design systems -- e.g., Brad Frost (Atomic Design), Mark Dalgleish (treat.js, CSS-in-JS architecture), or someone in the Tailwind/utility-CSS component architecture space.
