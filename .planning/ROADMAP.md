# Roadmap: PostCanary Design Studio Round 2

**Created:** 2026-04-06
**Milestone:** v1-design-studio-r2
**Core Value:** Auto-generated postcards so good the customer doesn't want to change them

## Phases

### Phase 1: AI Generation + Website Scraping
**Goal:** Replace mock data with real AI-generated content powered by scraped website data and manually-pasted reviews. Google Reviews OAuth deferred to Phase 2 per cross-AI review feedback.
**Depends on:** Round 1 Design Studio (complete), server-side Claude integration (exists)
**Requirements:** AIGEN-01, AIGEN-02, AIGEN-03, AIGEN-04, AIGEN-05, AIGEN-06, AIGEN-07, SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04, SCRAPE-05, SCRAPE-06, GREV-03, GREV-04, GREV-05
**Plans:** 2 plans
**Success:** Customer enters wizard -> system scrapes their website (with progress UI and Skip button) -> customer pastes a Google review manually -> AI generates personalized postcard with real headlines, offers, photos, and reviews -> each card has a different layout -> postcard renders with actual business content, not placeholders.
**Review changes applied:**
- Google Reviews OAuth (GREV-01, GREV-02, GREV-06) deferred to Phase 2
- Manual "paste review" text field replaces OAuth for review entry
- AI generation simplified: one Claude call per card, synchronous, no pre-generation
- Scraping hardened: stale reaper, circuit breaker, Playwright sync API, DNS rebinding defense, decompression bomb protection
- Card-position-aware template recommendation (different layout per card)
- Offer text word limit (50 words max)
- Plain-English reason fields (no marketing jargon)
- Progress UI spec for scraping (animated steps, time estimate, Skip button)

Plans:
- [ ] 01-01-PLAN.md -- Hardened website scraping pipeline (Playwright sync + Claude extraction + EXIF strip + security defenses + progress UI)
- [ ] 01-02-PLAN.md -- Simplified AI content generation (one call per card, synchronous) + manual review entry

### Phase 2: Template Upgrades + UX Polish + Google Reviews OAuth
**Goal:** Implement all 6 base layouts with enforced design rules, brand consistency, educational UX, and Google Business Profile OAuth integration for automated review pulling.
**Depends on:** Phase 1 (AI generation feeds template content)
**Requirements:** TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, UXP-01, UXP-02, UXP-03, UXP-04, GREV-01, GREV-02, GREV-06
**Success:** All 6 layouts render correctly with enforced Z/F-patterns, brand kit consistency across sequence cards, "Why This Design Works" panel educates customer, print-ready output at 300 DPI CMYK. Google Reviews OAuth connected, reviews auto-fetched and refreshed.

### Phase 3: Designs Library + Custom Upload
**Goal:** Add designs management page and agency escape hatch for custom uploads.
**Depends on:** Phase 2 (templates must work before saving/reusing)
**Requirements:** DLIB-01, DLIB-02, DLIB-03, UPLD-01, UPLD-02, UPLD-03, UPLD-04
**Success:** Designs page shows saved designs grid, "Create New" launches wizard, agencies can upload custom PDF with locked zone overlay, downloadable template files available.

## Phase Status

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | AI Generation + Scraping | Planning (revised per reviews) | 2 |
| 2 | Template Upgrades (SVG → Figma) | Planned | 3 |
| 3 | Designs Library + Custom Upload | Pending | 0 |

---
*Roadmap created: 2026-04-06*
*Last updated: 2026-04-10 (Phase 2 replanned: SVG → Figma pivot, 3 new plans replace 4 stale CSS plans)*
