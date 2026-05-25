# PostCanary — Design Studio Round 2

## What This Is

PostCanary is a direct mail platform for home services companies. Customers draw a targeting area on a map, the system auto-generates expert-designed postcards using their brand, and handles printing + mailing. Round 2 upgrades the Design Studio from mock data to real AI-generated, website-scraped, personalized postcards.

## Core Value

The postcard should be so good the customer doesn't want to change it. Auto-generated from their website + brand kit + campaign goal — "damn near perfect" on first render.

## Requirements

### Validated

- [x] Template-first wizard flow (Step 3) with 18 template variants
- [x] PostcardFront + PostcardBack components with edit panel
- [x] SequenceView (3-card horizontal selector)
- [x] TemplateBrowser with goal-aware filtering
- [x] Brand kit store + mock AI generation composable
- [x] Editable text fields (headline, offer, review, phone, colors)
- [x] Locked zones for USPS compliance (address block, barcode, return address)
- [x] Character counters on text inputs

### Active

- [ ] Real AI headline generation (Claude, Caples/Halbert/Gendusa frameworks)
- [ ] Real AI offer text generation (value stacks, goal-aware)
- [ ] Real AI review selection from Google reviews (Kennedy/Halbert criteria)
- [ ] Website scraping (Playwright + Claude extraction: photos, phone, logo, offers, certifications)
- [ ] Photo fallback chain (website > upload > stock > AI-generated V2)
- [ ] Template upgrades: 9 base layouts (3 visual styles x 3 card positions) with goal-aware copy
- [ ] "Why This Design Works" reasoning panel (collapsed by default)
- [ ] Designs library page (saved designs grid + "Create New")
- [ ] Upload custom design (agency escape hatch — PDF/image + locked zone overlay)
- [ ] Google Business Profile integration for reviews

### Out of Scope

- Fabric.js canvas editor — V2 only if customers request it (DHH override)
- AI-generated images — V2 (DALL-E/Flux), stock photos for now
- Real-time collaboration on designs
- A/B testing of postcard variants — future, needs send data first
- Print preview with exact CMYK rendering

## Context

- **Codebase:** Vue 3 + TypeScript + Pinia + Tailwind + Naive UI (client), Flask + SQLAlchemy + PostgreSQL (server)
- **Branch:** `feat/campaign-design-studio` has Round 1 build. Round 2 work branches from latest main.
- **Existing spec:** `postcanary-v1-build-decisions.md` (1,768 lines) — THE source of truth
- **Expert roster:** 35 named experts validate every decision (see `postcanary.md`)
- **Round 1 built:** 18 components, mock AI content, template browser, edit panel, sequence view
- **Round 2 goal:** Replace mocks with real data — AI generation, website scraping, upgraded templates
- **Dustin (co-founder):** Manages infrastructure, does final merge to main. We stay on feature branches.
- **Drake (founder):** Non-technical. Cares about what the customer sees, not how it's built.

## Constraints

- **Stack:** Must follow existing Vue 3 + Composition API + Pinia patterns (Dustin's architecture)
- **No main merges:** Feature branches only. Dustin reviews and merges.
- **Server API:** Flask blueprints + services + DAOs pattern. New endpoints need server-side work.
- **AI provider:** Anthropic Claude for all AI generation (already integrated for insights + chatbot)
- **Template system:** JSON schemas defining layout positions, not rendered HTML templates
- **Print spec:** USPS 6x9, 0.125" bleed, 0.25" safe zone, 300 DPI, CMYK
- **PostCanary invisible:** Customer's brand only on postcards. PostCanary branding never appears.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Template-first, not canvas | DHH: ship fast, reduce complexity | ✓ Good |
| Caples + Halbert + Gendusa for headlines | Research-validated frameworks, not generic AI | — Pending |
| Playwright for website scraping | Handles JS-rendered sites, Claude extracts structured data | — Pending |
| 6 base layouts x 3 card positions | Covers all campaign goals without overwhelming choice | — Pending |
| Pay-per-send $0.69, no subscription required | First campaign without commitment | ✓ Good |
| Melissa LeadGen for targeting counts | API access blocked (status 116), email sent to sales | ⚠️ Revisit |

---
*Last updated: 2026-04-06 after GSD initialization*
