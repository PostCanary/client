# Phase 2: Template Upgrades + UX Polish + Google Reviews OAuth - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Demo deadline:** 2026-04-20 (11 calendar days)

<domain>
## Phase Boundary

Visual rebuild of the postcard templates so they look like pro direct mail (PostcardMania / Mail Shark quality bar) instead of SaaS components, plus the logo wordmark fallback for empty-logo cases. Demo on 2026-04-20 with Desert Diamond HVAC as the demo card.

**SCOPE NARROWED FROM ORIGINAL ROADMAP** per discuss-phase decision:
- IN: Template visual rebuild (TMPL-01 through TMPL-07 — visual concerns only)
- IN: Logo wordmark fallback (universal + Desert Diamond manual seed)
- IN: Filled trust badge artwork (real BBB / Angi / HomeAdvisor)
- DEFERRED to Phase 2.5 post-demo: UXP-01 ("Why This Design Works" panel), UXP-02/03 (photo + review confirmation checkboxes), UXP-04 (print-dimension preview), GREV-01/02/06 (Google Business Profile OAuth + auto-pull reviews)

The deferred items are not dropped — they become Phase 2.5 after the print partner demo lands.

</domain>

<decisions>
## Implementation Decisions

### Layout Scope
- **D-01:** Build only **1 layout** (Full-Bleed Photo) to demo quality. The V1 spec's #1 default for HVAC. The other 5 layouts (Side Split, Photo Top, Bold Graphic, Before/After, Review Forward) stay in the codebase as-is.
- **D-02:** **Hide** the 5 unbuilt layouts from the customer-facing template browser. Code stays in place but they're filtered out of the picker so demo viewers can't accidentally select an unfinished layout. Easy to re-enable post-demo.
- **D-03:** Demo render = **single perfect Desert Diamond HVAC card** rendered through Full-Bleed Photo layout. No multi-business range, no multi-layout range. One excellent artifact.

### Aesthetic Non-Negotiables (Draplin Gate)
These are HARD rules. If a template fails any of these, it doesn't ship.
- **D-04:** `border-radius: 0px` on every visual element. No rounded corners > 2px anywhere on the card. (Draplin: "thick confident borders, not thin delicate lines")
- **D-05:** No soft grey drop shadows on any card element. Shadows allowed only as brand-color drop shadows for depth. SaaS-style soft shadows are banned.
- **D-06:** Color blocks > whitespace. Large brand-color rectangles span >40% of card area. Whitespace > 8px between elements is forbidden unless structurally required for legibility.
- **D-07:** All templates must score **5 of 6 minimum** on the SUCCESs check (Simple, Unexpected, Concrete, Credible, Emotional, Stories). The current Desert Diamond render scores 2/6 (Simple ✓, Credible ✓, others ✗) — that's the gap to close.
- **D-08:** Z-pattern enforced on every front layout: logo top-left → credibility top-right → diagonal → headline bottom-left → phone bottom-right. F-pattern on the back. (Whitman / CA$HVERTISING)

### Logo Treatment
- **D-09:** Universal fallback when scrape returns empty logo: render the business name as a text wordmark inside a **solid brand-color filled pill** (not outlined). Bold sans-serif, dark contrasting text on brand-primary background. Sized to be top-left logo dominance (1.0–1.5" wide minimum).
- **D-10:** For Desert Diamond demo specifically: **manually grab the actual logo from desertdiamondhvac.com** and seed it into the dev DB so the demo render shows the real logo, not the fallback. The wordmark fallback is the production safety net for any business where Firecrawl misses the logo.

### Photo Selection
- **D-11:** For Desert Diamond demo: select a **worker / technician / homeowner photo** from the 13 already-scraped photos. The current "Desert Diamond Club" loyalty graphic is unacceptable — it's a brand graphic, not an emotional photo.
- **D-12:** Universal photo priority order (already in V1 spec, enforced here): people > completed work > equipment > abstract brand graphics. Workers/team photos always rank highest.

### Trust Badges
- **D-13:** Use **real BBB / Angi / HomeAdvisor brand artwork** — filled, real brand colors (BBB navy, Angi orange #F26B2C, HomeAdvisor green). NOT outlined boxes. NOT text-in-brand-color facsimiles.
- **D-14:** Trust badges acquired as nominative fair use — they identify the business's actual third-party certifications, which is the textbook nominative use case. Document this in a brief legal-rationale note in TrustBadges.vue source comments so it's auditable.

### Reference Study Discipline (Legal Protection — Pattern Extraction Not Layout Cloning)
This is the IP firewall between the reference corpus and our original templates. Mandatory.
- **D-15:** **Phase A — STUDY** (1-2 hours, time-boxed per Hiten): Open 10-15 reference postcards from `~/postcanary/client/visual-audit-2026-04-09/`. Study them. Output: a `PATTERNS.md` file with 30-50 specific measurable visual rules — `border-radius`, logo dimensions in inches, phone size in pt, color block percentages, shadow rules, headline bar dimensions, etc.
- **D-16:** **Phase B — BUILD** (the discipline that prevents anchoring): ALL reference image windows CLOSED during build. Build only against `PATTERNS.md`. Each commit tested against `PATTERNS.md` ("does this template hit P-12, P-15, P-23?"), NOT against any specific reference image. If a build commit looks too much like a specific reference, that means I anchored — refactor.
- **D-17:** **Phase C — VALIDATE**: Re-open references but only as a **visual category check** ("does ours belong to the same visual category as pro direct mail?") — never as a "does ours match this specific reference" check. Distinct execution required: our colors, our typography, our composition.
- **D-18:** `PATTERNS.md` is the **legal abstraction layer** between source references and PostCanary-original output. Pattern extraction (legal) vs. layout cloning (illegal) per V1 spec lines 968-973: "Templates are PostCanary ORIGINALS based on universal design principles. NOT copied from PostcardMania, Modern Postcard, or any competitor."
- **D-19:** Lawyer test before any commit: "Could a Mail Shark / PostcardMania lawyer credibly say 'that's our card with different colors'?" If yes → infringement → don't commit. If "that's a postcard that uses universal direct-mail patterns but is clearly its own design" → safe.

### Architecture (UPDATED Session 37 — SVG → Figma Pivot)
- **D-20:** ~~Vue 3 + Pinia + Tailwind~~ **SUPERSEDED Session 37.** CSS-coded Vue postcard templates FAILED (Sessions 31-36 = 5 sessions of thrown-away work). New approach: **SVG templates** built at print dimensions (648×432pt = 9×6"), imported into **Figma** for visual review and iteration. Variable data layers marked with element IDs (`{{headline}}`, `{{phone}}`, etc.). Production rendering pipeline TBD based on demo call with 1 Vision print partner (April 20).
- **D-21:** Brand kit consistency enforced — customer cannot break consistency across sequence cards. Locked elements remain locked (USPS zones, logo placement, brand color application).
- **D-22:** Branch: `feat/design-studio-r2`. Phase 2 work continues on the same branch.

### SVG Template Design Process (NEW — Session 37)
- **D-32:** **Stock photo prerequisite** — find HVAC photo on Pexels/Unsplash with composition matching HAC-1000: subject RIGHT (AC unit or technician), open sky LEFT for text overlay zone. Must be minimum 2700×1800px (300 DPI at 9×6"). This is a prerequisite before Zone 1 design.
- **D-33:** **Dan Mall zone-by-zone methodology** — deconstruct HAC-1000 into visual DECISIONS (not measurements), build SVG zone by zone, show Drake each zone for approval before proceeding to the next. Zone 1 (photo+headline) → Zone 2 (offer strip) → Zone 3 (info bar) → full front → back card.
- **D-34:** **3-zone structure from POSTCARD-DEEP-SPEC.md** — Zone 1: Photo + Headline (~63%), Zone 2: Green Offer Strip (~14%), Zone 3: Navy Info Bar (~23%). Zero gaps between zones. Full-bleed photo background.
- **D-35:** **HAC-1000 color hierarchy** — headline lines 1-2 in RED (#E53935), bridge text in BLACK, sub-headline lines 4-5 in NAVY (#0D2B4B matching info bar), offer strip GREEN (#43A047), info bar NAVY. Three distinct zone colors, never crossing zones.
- **D-36:** **Figma token** stored at `~/.claude/.env.personal` (FIGMA_PERSONAL_ACCESS_TOKEN). Figma REST API is read-only for design content. SVG files are imported into Figma manually by Drake for review. Iteration happens via SVG edits → re-import.
- **D-37:** **Expert review before Drake** — every SVG version gets expert panel review (Gendusa elements, Draplin aesthetics, Whitman eye flow, Heath stickiness) BEFORE showing to Drake. Fix issues found by experts before asking for Drake's feedback.

### Active Expert Roster (Validates Each Build Decision)
- **D-23:** Lead designer: Joy Gendusa (PostcardMania) — postcard strategy authority, validates output against the quality bar her own company sets
- **D-24:** Aesthetic gate: Aaron Draplin — every visual decision filtered through "bold, confident, American, not minimalist" with the specific D-04 / D-05 / D-06 rules as enforcement
- **D-25:** Eye flow: Drew Eric Whitman — Z-pattern enforcement on every layout (D-08)
- **D-26:** Copy: Gary Halbert — A-pile vs B-pile, "make it look personal not promotional," anchored value stacks with all 4 components (original price + items + customer price + savings)
- **D-27:** Headlines: John Caples — every headline matches one of the 35 proven formulas
- **D-28:** Stickiness gate: Chip + Dan Heath — SUCCESs check at D-07 minimum 5/6 score
- **D-29:** Time-to-value: Hiten Shah — Phase A pattern study time-boxed to 1-2 hours, no scope sprawl
- **D-30:** Scope discipline: DHH — accepted "1 layout" recommendation, locked at D-01
- **D-31:** IP / copyright: Troy Hunt + V1 spec — pattern extraction discipline at D-15-D-19, PATTERNS.md as legal audit trail

### Claude's Discretion
- SVG element naming and structure within the zone rules
- Exact font choices (Oswald/Bebas Neue/Impact for condensed headlines, Open Sans/Instrument Sans for body)
- Specific anchor points within Z-pattern enforcement (so long as the order holds)
- Exact `PATTERNS.md` schema and format
- Test approach for the SUCCESs gate (manual checklist is fine for demo)
- SVG optimization for Figma import compatibility

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner) MUST read these before planning or implementing.**

### Design Spec (V1 contract — load-bearing for every decision)
- `~/.claude/projects/C--Users-drake/memory/postcanary-v1-build-decisions.md` §574-1147 — Full Design Studio spec including 6 layouts, element fallback chain table (line 1112-1120), Z/F-pattern enforcement, Draplin aesthetic philosophy, color-by-industry table, Half-Second Grab SUCCESs check, headlines via Caples + Halbert + Gendusa, photo strategy, **Templates Are NOT Copied legal note (lines 968-973)**
- `~/.claude/projects/C--Users-drake/memory/postcanary.md` — Expert roster (full names + philosophies), brand colors (--app-* and --pc-* tokens), stakeholder personas (Bob, Sarah, Jake, Alex, Dave)
- `~/.claude/projects/C--Users-drake/memory/postcanary-vision.md` Pillar 3 — Design Studio vision (lines 39-50)

### Visual Audit (THE quality bar reference)
- `~/postcanary/client/visual-taste-audit-2026-04-09.md` — 436-line audit, 12-item ranked gap list, typography verdict (22-26pt wins over 14-18pt), offer-on-front decision, reference corpus survey
- `~/postcanary/client/visual-gap-list-2026-04-10.md` — Post-Session 32 v2 gap list, NEW ranked items P0-A through P0-H + P1 + P2
- `~/postcanary/client/visual-audit-2026-04-09/` — 22 reference PNGs (Mail Shark / PostcardMania / Wise Pelican + our existing templates pre-Session 33)

### USPS Compliance (back layout constraints)
- `~/postcanary/client/research-usps-dmm-201-clear-zones-2026-04-09.md` — Full DMM 201/202 citations, recommended column split (5.5" content + 3.0" USPS), §202.5.3 in-block IMb alternative, 10 print partner risk caveats

### Original Design Studio R2 Brief (reference for original scope)
- `~/postcanary/coding-briefs/06-design-studio-r2-extraction-templates.md` — 410-line brief defining Phase 2 task list, file lists, data contracts, validation checklist
- `~/postcanary/planning/06-design-studio-r2-expert-review.md` — 359-line expert review of brief #6 from 8 experts (Hiten, DHH, Gendusa, Halbert, Draplin, Hunt, Majors, Willison) — verdicts and conditional changes

### Drake-Memory Context (Session 33 corrections — load before any visual work)
- drake-memory ID 130 — Logo missing was P0 not P1; demo-readiness failure
- drake-memory ID 131 — Expert activation protocol mandatory at session start
- drake-memory ID 132 — Rebuild not patch when visual gap is fundamental (3rd strike on visual quality)
- drake-memory ID 133 — IP/copyright dividing line (pattern extraction legal, layout cloning not)
- drake-memory ID 134 — Always check existing GSD planning state before creating new structures
- drake-memory ID 135 — Banned acknowledgment openers (response template fix)

### Session 32 → 33 Handoff (full strategic context)
- `~/postcanary/sessions/handoff-2026-04-09-to-2026-04-10-evening.md` — Full handoff doc, ~650 lines, all environment + state + Drake's communication preferences

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (will be rewritten or extended in this phase)
- `src/components/postcard/PostcardFront.vue` — Current branched 6-layout component. Will rewrite for Full-Bleed Photo only; other 5 layouts get filtered out via template browser, not deleted from this file.
- `src/components/postcard/PostcardBack.vue` — Current 4-block back layout. May need rebuild to match new Draplin aesthetic (color blocks > whitespace).
- `src/components/postcard/PostcardPreview.vue` — Shared preview wrapper with ResizeObserver + transform-scale. Architecture stays.
- `src/components/design/OfferBox.vue` — Current value-stack box. Will rewrite for Draplin aesthetic.
- `src/components/design/CTABox.vue` — Current phone + QR box. Will rewrite.
- `src/components/design/RatingBadge.vue` — Current stars + rating. Likely needs rebuild for Draplin aesthetic.
- `src/components/design/TrustBadges.vue` — Current outlined boxes. Full rebuild with real BBB / Angi / HomeAdvisor artwork (D-13).
- `src/components/design/OfferBadge.vue` — Front offer ribbon/burst. Built in Session 32. Probably stays (it's Gendusa-correct) but visual style needs Draplin pass.
- `src/styles/print-scale.css` — Current pt-based typography tokens. EXTEND with Draplin aesthetic tokens (`--pc-radius: 0`, `--pc-shadow-soft: none`, color block tokens).
- `src/data/templates.ts` — Template metadata. Update to filter unbuilt layouts from the customer-facing browser (D-02).
- `src/composables/usePostcardGenerator.ts` — AI generation composable. Add wordmark-fallback emit when logoUrl is empty (D-09).
- `src/components/design/TemplateBrowser.vue` — Customer-facing layout picker. Update to filter (D-02).

### Established Patterns
- Print typography in `pt` units (not rem/px) — V1 spec mandates this for print accuracy
- Vue 3 Composition API with `<script setup>` — Dustin's architecture
- Pinia stores for state, useBrandKitStore for brand data
- Brand colors come from `brandKit.brandColors[]` array (extracted via Firecrawl) — fall back to `--app-navy` / `--app-teal` only if extraction fails

### Integration Points
- `/dev/postcard-preview` route — dev-only Playwright-driven render route used for visual testing
- `/wizard/step-design` (StepDesign.vue) — wizard step 3, calls `usePostcardGenerator` then renders via PostcardPreview
- StepReview.vue — final review screen, also renders preview

### Test Infrastructure (LIMITED — known gap)
- Server: 274/274 unit tests green (Phase 1 work)
- Client: NO test runner. Only `npx vue-tsc --noEmit` for type checking.
- Visual regression testing: NONE. Done manually via `/dev/postcard-preview` + Playwright screenshot comparison
- This phase will NOT wire Vitest unless time permits (DHH "build less" gate)

</code_context>

<specifics>
## Specific Ideas

- **Demo target business:** Desert Diamond HVAC. Org ID `549e9d08-c287-420f-b191-e879ee08e23b` in dev DB. Brand kit already populated (4 colors, 5 services, BBB+NATE, 13 photos, 4.9★ rating, 2423 reviews, real phone). Logo URL is empty (Firecrawl gap — CSS background image not detected).
- **Drake's verbal evaluation criterion:** "looks like a real pro postcard, not a SaaS component" — this is the only signoff that matters
- **Drake said tonight (verbatim):** "gross, our templates look nothing like the good ones on mail companies websites. looks like youve never seen a postcard before"
- **Reference postcards Drake wants matched (visual category, not specific layout):** Mail Shark oversized 1-3, PostcardMania HVAC gallery rows 1-3, Wise Pelican roofing
- **HVAC color guidance from V1 spec:** blue (trust) + red/orange accent (urgency/warmth). Desert Diamond's actual brand colors (#0488F5 blue, #F97B22 orange, #5FC756 green) align well with this. Lean into them boldly.
- **Demo render artifact location:** create new folder `~/postcanary/client/demo-smoke-test-2026-04-DD/` for the rebuilt render. Name with whatever date the rebuild lands.

</specifics>

<deferred>
## Deferred Ideas (Phase 2.5 post-demo, OR future phases)

### Deferred to Phase 2.5 (will become its own discuss-phase post-demo)
- **UXP-01:** "Why This Design Works" expandable panel below postcard preview
- **UXP-02:** Confirmation checkbox for scraped photos ("Confirm you have rights to use this image in print")
- **UXP-03:** Confirmation checkbox for Google reviews ("Confirm this is a real customer review")
- **UXP-04:** Print-dimension preview accuracy
- **GREV-01:** Google Business Profile OAuth integration
- **GREV-02:** Auto-pull and AI-select reviews from Google
- **GREV-06:** Periodic review refresh (don't cache forever)
- **5 of 6 layouts (Side Split, Photo Top, Bold Graphic, Before/After, Review Forward):** rebuild post-demo to the same Draplin standard as Full-Bleed Photo

### Deferred to later phases / post-Phase 3
- **USPS column reclaim to 2.25in absolute layout** — Codex Pass 1 in Session 33 caught that a hard 2.25in column breaks long city+zip OCR. Requires absolute-layout refactor of PostcardBack, deferred post-demo. Current 3.0in column stays.
- **Filled trust badge real artwork acquisition** — D-13 says use real BBB/Angi/HomeAdvisor logos. The actual SVG/PNG assets need to be sourced before Phase 2 can use them. Either (a) download from each org's brand assets page during build, or (b) track as a sub-task in Phase 2 plan.
- **§202.5.3 in-block IMb pivot** — drake-memory ID 116, contingent on print partner support. Ask on demo call. Fallback: revert to current §202.5.1 layout.
- **Vitest + @vue/test-utils + jsdom** — wire client test runner. Not done in any client-side commit through Session 33.
- **Logo extraction improvement** — Firecrawl misses CSS background-image logos. Either add `<img>` src/alt scanning, OR add a logo-upload step in wizard onboarding.

### Reviewed Todos (none folded — todo match returned 0)
None.

</deferred>

---

*Phase: 02-template-upgrades-ux-polish-google-reviews-oauth*
*Context gathered: 2026-04-09 (Session 33 — post-Drake-frustration-correction)*
*Discuss-phase mode: standard interactive (1 of 4 gray areas selected for deep discussion, 3 locked via recommendations)*
