# Requirements: PostCanary Design Studio Round 2

**Defined:** 2026-04-06
**Core Value:** Auto-generated postcards so good the customer doesn't want to change them

## v1 Requirements

### AI Generation

- [ ] **AIGEN-01**: System generates 3 personalized headline options per business using Caples/Halbert/Gendusa frameworks
- [ ] **AIGEN-02**: Headlines are goal-aware (neighbor = social proof, seasonal = urgency, storm = news)
- [ ] **AIGEN-03**: System generates value-stacked offer text based on business services and campaign goal
- [ ] **AIGEN-04**: AI selects best Google review using Kennedy/Halbert criteria (objection-matching, specificity)
- [ ] **AIGEN-05**: AI returns `reason` field explaining WHY each element was selected
- [ ] **AIGEN-06**: Each card in sequence has different content with Kennedy escalation (offer -> proof -> closer)
- [ ] **AIGEN-07**: No two businesses get identical headlines (business name + service + city + goal = unique)

### Website Scraping

- [ ] **SCRAPE-01**: Playwright scrapes customer website for business name, phone, address, logo, photos
- [ ] **SCRAPE-02**: Claude extracts structured data from scraped page (offers, certifications, guarantees, reviews)
- [ ] **SCRAPE-03**: Photos quality-scored and ranked (workers/team > results > equipment > stock)
- [ ] **SCRAPE-04**: Fallback chain: website scrape -> customer upload -> stock photos
- [ ] **SCRAPE-05**: EXIF metadata stripped from all uploaded/scraped images server-side
- [ ] **SCRAPE-06**: Current offers/promotions extracted and used (Kennedy: use THEIR offer, don't invent)

### Template System

- [ ] **TMPL-01**: 6 base layouts implemented (Full-Bleed, Side Split, Photo Top, Bold Graphic, Before/After, Review Forward)
- [ ] **TMPL-02**: Each layout has 3 card position variants (offer, proof, closer)
- [ ] **TMPL-03**: AI recommends best layout based on campaign goal + available photos
- [ ] **TMPL-04**: Templates enforce brand kit (colors, fonts, logo placement) -- customer can't break consistency
- [ ] **TMPL-05**: Z-pattern (front) and F-pattern (back) enforced on all layouts
- [ ] **TMPL-06**: Typography rules baked in (headline 24-36pt, phone 14pt min, max ~120 words on back)
- [ ] **TMPL-07**: Color matching: HEX from website -> CMYK for print, with industry accent recommendations

### Design Library

- [ ] **DLIB-01**: Designs page shows grid of saved postcard designs with thumbnails
- [ ] **DLIB-02**: "Create New" button launches wizard
- [ ] **DLIB-03**: Saved designs can be reused in new campaigns

### Custom Upload

- [ ] **UPLD-01**: Upload PDF or image for front and back (agency escape hatch)
- [ ] **UPLD-02**: PostCanary overlays QR code + address block in locked zones on uploaded designs
- [ ] **UPLD-03**: Downloadable template files available (.ai, .psd, PDF with dimensions/bleed/safe zones)
- [ ] **UPLD-04**: Upload validation: max 10MB, file type check, dimension check, corrupted file detection

### Google Reviews Integration

- [ ] **GREV-01**: Connect Google Business Profile during onboarding or first Design Studio visit
- [ ] **GREV-02**: System pulls all reviews, AI selects best per campaign type
- [ ] **GREV-03**: Review excerpted to under 35 words, specific details preserved
- [ ] **GREV-04**: Reviewer name: first name + last initial only (privacy)
- [ ] **GREV-05**: Customer can swap to any other review from dropdown
- [ ] **GREV-06**: Reviews refresh periodically (don't cache forever -- deleted reviews must stop appearing)

### UX Polish

- [ ] **UXP-01**: "Why This Design Works" expandable panel below postcard preview
- [ ] **UXP-02**: Confirmation checkbox for scraped photos ("Confirm you have rights to use this image in print")
- [ ] **UXP-03**: Confirmation for Google reviews ("Confirm this is a real customer review")
- [ ] **UXP-04**: Print-dimension preview (actual 6x9 proportions, not screen-responsive)

## v2 Requirements

### Advanced Design

- **ADVD-01**: Fabric.js canvas editor for full drag-and-drop control
- **ADVD-02**: AI-generated images (DALL-E 3 or Flux API)
- **ADVD-03**: A/B testing of postcard variants with performance tracking
- **ADVD-04**: Campaign templates (save and share across organization)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fabric.js canvas editor | V2 -- DHH override, template-first for V1 |
| AI-generated images | V2 -- stock photos simpler, commercially safe |
| Real-time design collaboration | Not needed for target personas (Bob, Sarah) |
| Print color proofing | Disclaimer sufficient, test via campaign seeding |
| Video/animated postcards | Physical mail only |

## Traceability

| Requirement | Phase | Status | Notes |
|-------------|-------|--------|-------|
| AIGEN-01 to AIGEN-07 | Phase 1 | Pending | |
| SCRAPE-01 to SCRAPE-06 | Phase 1 | Pending | |
| TMPL-01 to TMPL-07 | Phase 2 | Pending | |
| DLIB-01 to DLIB-03 | Phase 3 | Pending | |
| UPLD-01 to UPLD-04 | Phase 3 | Pending | |
| GREV-01 | Phase 2 | Pending | Moved from Phase 1 per review: OAuth too complex for V1 onboarding |
| GREV-02 | Phase 2 | Pending | Moved from Phase 1 per review: depends on GREV-01 OAuth |
| GREV-03 | Phase 1 | Pending | Applied to manually-pasted reviews |
| GREV-04 | Phase 1 | Pending | Applied to manually-pasted reviews |
| GREV-05 | Phase 1 | Pending | Review swap dropdown works with manual reviews |
| GREV-06 | Phase 2 | Pending | Moved from Phase 1 per review: periodic refresh requires OAuth |
| UXP-01 to UXP-04 | Phase 2 | Pending | |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 (revised per cross-AI review feedback -- GREV-01/02/06 moved to Phase 2)*
