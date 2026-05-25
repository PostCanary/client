# Execution Plan: Terminal 2 — Design Studio (Wizard Step 3)

## Context

This builds the postcard design experience — Step 3: "Your Postcard." The customer sees an auto-generated postcard using their brand kit data and the campaign context from Steps 1-2. They can edit text, swap photos, change templates, or just click approve. The goal: the auto-generated postcard is so good they don't want to change it.

**Branch:** `feat/campaign-design-studio` from `main` (after prerequisites merged)
**Brief:** `C:\Users\drake\postcanary\coding-briefs\02-terminal-design-studio.md` (definitive reference)
**Depends on:** Prerequisites build complete and merged (shared types, draft store, wizard shell, brand kit store, PostcardPreview stubs)

## Pre-Flight Checklist

1. Verify prerequisites branch is merged to main
2. Verify wizard works with stubs: navigate to `/app/send`, click through all 4 stubs
3. Verify brand kit store loads data: check `useBrandKitStore.brandKit` has mock data
4. Create branch in BOTH repos:
   - `cd "C:/Users/drake/postcanary/client" && git checkout -b feat/campaign-design-studio`
   - `cd "C:/Users/drake/postcanary/server" && git checkout -b feat/campaign-design-studio`
5. Verify `npm run build` passes before making changes

## Build Order (13 tasks, 5 phases)

### Phase 1: Template System + Data (Tasks 1-3)

**Task 1: Create template definitions**
- File: `src/data/templates.ts`
- Define ALL 18 templates: 6 layouts × 3 card positions (offer / proof / last_chance)
- Layouts: full-bleed, side-split, photo-top, bold-graphic, before-after, review-forward
- Each template: id, layoutType, name, description, cardPosition, bestFor (goal types), contentSlots (with maxChars + placeholder text), previewImageUrl
- `GOAL_TEMPLATE_MAP`: maps each CampaignGoalType to its recommended layout
- `getRecommendedTemplateSet(goal)`: returns 3 templates (one per card position) for a goal
- Preview images: use inline SVG placeholders (colored rectangle + layout name text). Do NOT block on creating real images.
- **Verify:** Import templates, call `getRecommendedTemplateSet('neighbor_marketing')` → returns 3 templates in order (offer, proof, last_chance)

**Task 2: Create stock photo library**
- File: `src/data/stockPhotos.ts`
- 3-5 photos per industry (HVAC, plumbing, roofing, cleaning, electrical, pest control, landscaping)
- Use Unsplash URLs with `?w=800` resize parameter for Round 1
- Each photo: id, url, thumbnailUrl, industry, emotion (trust/comfort/urgency/proof), description
- `getPhotosForIndustry(industry)` helper function
- Fallback: if no photos for an industry, return generic professional photos
- **Verify:** `getPhotosForIndustry('plumbing')` returns 3-5 photos with valid URLs

**Task 3: Create postcard generator composable**
- File: `src/composables/usePostcardGenerator.ts`
- Also create: `app/services/ai_generation.py` on server (model-agnostic interface, mock for Round 1)
- `generateCards(brandKit, goalType, sequenceLength, recipientBreakdown)` → returns `CardDesign[]`
- `resolveContent()`: merges brand kit + goal + template → fills all content fields
- `resolveBackContent()`: fills back-of-card content from brand kit
- Mock headline generator: 3 options per goal × card purpose × industry. Uses brand kit business name, location, years in business.
- Mock offer generator: uses brand kit's `currentOffers` or industry defaults
- Mock urgency generator: varies by card purpose (offer → "limited spots", proof → "X spots left", last_chance → "expires in 7 days")
- Photo selector: brand kit photos first (sorted by quality), then stock photos for industry
- Recipient breakdown determines messaging tone: 90%+ new prospects → cold messaging, 50%+ past customers → warm messaging
- **Verify:** Call `generateCards()` with mock brand kit → returns 3 CardDesign objects with all fields populated, no nulls in resolvedContent

### Phase 2: Postcard Preview (Tasks 4-7)

**Task 4: Create `PostcardFront.vue`**
- File: `src/components/postcard/PostcardFront.vue` (REPLACES PostcardFrontStub from prerequisites)
- Renders front of postcard at 6x9 proportions (aspect-ratio: 9/6)
- 6 different layout rendering modes based on `layoutType` prop (use v-if per layout)
- All layouts follow Z-pattern: top-left (logo) → top-right (credibility) → bottom-left (headline/offer) → bottom-right (phone/CTA)
- Common elements across all layouts: logo (top-left, small), "Licensed & Insured" (top-right), company name (bottom-left), phone (bottom-right)
- Brand colors applied via CSS custom properties from props
- **Verify:** Render each of the 6 layout types with mock data → all look distinct, all show correct elements

**Task 5: Create `PostcardBack.vue`**
- File: `src/components/postcard/PostcardBack.vue` (REPLACES PostcardBackStub from prerequisites)
- Left half: editable content — offer headline, review + stars, phone + CTA, QR placeholder, risk reversal, company address, website URL, urgency
- Right half: locked USPS zone — address block (sample address), IMb barcode placeholder
- Top left: return address (customer's business address, NOT PostCanary)
- Top right: permit indicia placeholder
- F-pattern reading flow on left half
- **Verify:** Back renders with all content areas populated. Locked zone visually distinct (gray overlay + lock icon).

**Task 6: Create `LockedZoneOverlay.vue`**
- File: `src/components/design/LockedZoneOverlay.vue`
- Gray semi-transparent overlay (#f0f2f5, 80% opacity) with lock icon
- "Required by USPS" label
- Non-interactive (pointer-events: none on the overlay)
- Clear visual boundary between editable and locked zones
- **Verify:** Overlay renders over right half of postcard back, non-clickable

**Task 7: Update `PostcardPreview.vue`**
- File: `src/components/postcard/PostcardPreview.vue` (MODIFY, created by prerequisites)
- Change imports: `PostcardFrontStub` → `PostcardFront`, `PostcardBackStub` → `PostcardBack`
- Pass all required props: card data, brand kit, layout type, brand colors
- Both size modes still work: thumbnail and large
- Front/back flip button still works
- **Verify:** Preview renders real postcard (not colored rectangle stub). Flip works. Both sizes render.

### Phase 3: Editing Components (Tasks 8-9)

**Task 8: Create `EditPanel.vue` + `CharacterCounter.vue`**
- File: `src/components/design/EditPanel.vue`
- Right-side panel (w-80, border-left, scrollable)
- Labeled buttons: Change Photo, Edit Headline, Edit Offer, Change Review, Change Colors
- "Try Different Template" button (teal, opens template browser)
- "Reset to Original" link
- Active editor expands inline when button clicked (only one open at a time)
- CharacterCounter: shows remaining characters, turns red when over limit
- **Verify:** Panel renders, buttons toggle inline editors, only one editor open at a time

**Task 9: Create individual editors**
- Files: `src/components/design/EditHeadline.vue`, `EditOffer.vue`, `EditReview.vue`, `EditPhoto.vue`, `EditColors.vue`
- **EditHeadline:** 3 mock headline options (radio buttons) + custom text input with 50-char limit. Live preview updates.
- **EditOffer:** Textarea with 200-char limit. Pre-filled from brand kit offers or industry default. Suggestion tip text.
- **EditReview:** Dropdown of brand kit reviews (quote + reviewer + stars). "Paste a review" fallback input.
- **EditPhoto:** Grid of available photos (brand kit first, then stock for industry). Click to select. Upload button (file input, max 10MB, jpg/png).
- **EditColors:** Brand palette (2-3 colors) + 3-4 recommended accents. Click to apply. "Apply to all cards?" prompt when changing.
- All editors: changes stored as `overrides` on the CardDesign (template defaults preserved separately in `resolvedContent`)
- **Verify:** Each editor opens inline, makes changes, preview updates in real-time, character counters work

### Phase 4: Sequence View + Template Browser (Tasks 10-11)

**Task 10: Create `SequenceView.vue`**
- File: `src/components/design/SequenceView.vue`
- Horizontal row of card thumbnails: Card 1 "The Offer" / Card 2 "Social Proof" / Card 3 "Last Chance"
- Active card: teal border + shadow. Inactive: light border.
- Click thumbnail → switches main preview + edit panel to that card
- Shows sequence explanation text for first-time users: "Your 3-card sequence — same branding, different messaging"
- For single-card campaigns: don't show this component
- **Verify:** 3 thumbnails render, clicking switches active card, main preview updates

**Task 11: Create `TemplateBrowser.vue` + `TemplateCard.vue`**
- Files: `src/components/design/TemplateBrowser.vue`, `TemplateCard.vue`
- Slide-in panel from right (480px, overlay with dark backdrop)
- Filtered by campaign goal + industry: shows 3-6 relevant template SETS (not individual cards)
- "Best Match" star on recommended template
- Each TemplateCard: shows 3 small postcard thumbnails (the sequence), template name, description
- Click → auto-populates ALL cards with brand kit data using the new template + regenerates content
- "More styles" expandable for additional templates
- Close button (X) top-right
- **Verify:** Browser opens from edit panel, shows filtered templates, clicking one regenerates all cards with new layout

### Phase 5: Main Component (Tasks 12-13)

**Task 12: Create `StepDesign.vue` (main orchestrator)**
- File: `src/components/wizard/StepDesign.vue`
- On mount: if draft has existing design → load it. Otherwise → call `generator.generateCards()` with brand kit + goal + targeting recipient breakdown
- Layout: SequenceView (top) + PostcardPreview (left, centered) + EditPanel (right)
- Front/back flip button below preview
- Active card number state drives preview + edit panel
- `updateCardField(field, value)`: sets override on active card, updates resolvedContent, commits to draft store
- `selectTemplate()`: regenerates all cards with new template, re-applies existing overrides
- `commitDesign()`: builds `DesignSelection` object, calls `draftStore.setDesign()`
- Handle: no brand kit (show placeholder content with "Complete your brand setup" banner)
- **Verify:** Step 3 opens with auto-generated postcard. Edit a headline → preview updates. Change template → all cards regenerate. Data persists in draft store.

**Task 13: Update WizardShell**
- File: `src/components/wizard/WizardShell.vue` (MODIFY)
- Change import: `StepDesignStub` → `StepDesign`
- **Blast radius:** Read WizardShell.vue fully first. Only change the one import line + component registration.
- **Verify:** Full wizard flow: Step 1 (stub) → Step 2 (stub or real if Terminal 1 merged) → Step 3 (real design) → Step 4 (stub). All data flows correctly.

## Codebase Guardian Rules

- Before modifying PostcardPreview.vue or WizardShell.vue: read fully, grep for all consumers
- `PostcardFront.vue` and `PostcardBack.vue` REPLACE stubs — use exact same file paths as stubs
- After every task: `npm run build` must pass
- After Task 13: run existing e2e Playwright tests

## Verification (after all 13 tasks)

1. `npm run build` passes with zero errors
2. Navigate to `/app/send` → complete Step 1 → complete Step 2 → arrive at Step 3
3. Auto-generated postcard appears immediately (not blank, not a picker)
4. Postcard shows brand kit data: business name, phone, logo placeholder, brand colors
5. Front layout matches recommended template for the campaign goal
6. Back shows: offer, review, phone, QR placeholder, risk reversal, locked USPS zone
7. Locked zone has gray overlay + lock icon + "Required by USPS" — non-interactive
8. 3-card sequence view shows all cards (for multi-card campaigns)
9. Click Card 2 thumbnail → preview and edit panel switch to Card 2
10. Edit headline → 3 options + custom input → preview updates in real-time
11. Edit offer → textarea with character counter → preview updates
12. Change photo → grid of options → preview updates
13. Change template → browser shows 3-6 options → selecting one regenerates all cards
14. "Reset to Original" restores auto-generated content
15. Color change → "Apply to all cards?" prompt works
16. Data writes to draft store correctly: `draftStore.draft.design` has all CardDesign fields
17. Click Next → Step 4 (stub) shows postcard preview from shared PostcardPreview component
18. Click Back → return to Step 2 → design data preserved
19. Run existing e2e tests → all pass
20. Drake checkpoint: "Here's a postcard for a plumbing company. Would Bob approve this or want to change everything?"
