# Visual Gap List v2 — 2026-04-10 (post-Session 32 state)

**What this is:** The Phase 1 "close the loop" deliverable I skipped at the end
of Session 32. Walks through the original `visual-taste-audit-2026-04-09.md`
P0/P1/P2 list and marks current state against the Desert Diamond FINAL renders
AND the reference corpus (Mail Shark oversized, PostcardMania HVAC gallery).

**Inputs compared:**
- `demo-smoke-test-2026-04-09/desert-diamond-FRONT-FINAL.png` (current front render)
- `demo-smoke-test-2026-04-09/desert-diamond-BACK-FINAL.png` (current back render)
- `demo-smoke-test-2026-04-09/desert-diamond-front-big.png` (higher-res front)
- `demo-smoke-test-2026-04-09/desert-diamond-back-big.png` (higher-res back)
- `visual-audit-2026-04-09/ref-mailshark-oversized-1.png`
- `visual-audit-2026-04-09/ref-mailshark-oversized-2.png`
- `visual-audit-2026-04-09/ref-postcardmania-hvac-gallery-row1.png`
- `visual-audit-2026-04-09/ref-postcardmania-hvac-gallery-row2.png`

---

## Original gap list status (from visual-taste-audit-2026-04-09.md)

| # | Item | Status | Evidence in render |
|---|---|---|---|
| P0 #1 | Front OfferBadge (burst / ribbon) | ✅ **FIXED** | Yellow/orange diagonal ribbon visible top-right of front (but collides with credibility — see NEW P0-A) |
| P0 #2 | Reclaim USPS column (4.25→3.0) | ⏳ **PARTIAL** | CSS landed (commit `3d86456`), but the right USPS panel still reads ~33% of card width visually. Phase 2 (§202.5.3 pivot to 2.25in) is what closes the gap. |
| P0 #3 | Front phone in colored container | ✅ **FIXED** | Phone `(623) 246-2377` is in solid orange brand-primary pill, very legible. |
| P0 #4 | Credibility line clip fix | ⏳ **PARTIAL** | CSS ellipsis+max-width landed, but you can't see credibility at all in the current render because the new ribbon is painted over top of it. CSS fix is correct; z-order/layout needs adjustment. See NEW P0-A. |
| P0 #5 | Back overflow at preview scale | ✅ **FIXED** | ResizeObserver + transform:scale wrapper working — back renders cleanly at the preview container size. |
| P1 #6 | 6-block back → 4 blocks | ⏳ **PARTIAL** | Block 6 (local proof) merged into top strip (good). Block 5 (risk reversal) still present as "LICENSED & INSURED" row. Close to target. |
| P1 #7 | Back phone 26pt → 30pt | ❌ **NOT FIXED** | Back phone is visually the same weight as the offer headline; should dominate per Mail Shark references. Deferred in audit pending column reclaim — column reclaim happened, upsize didn't follow. |
| P1 #8 | Full-width trust badge strip | ❌ **NOT FIXED** | Trust badges are still cramped in a row inside the left content column, not a full-bleed strip at the bottom. |
| P1 #9 | Review quote callout on review-forward layout | 🟡 **N/A this render** | Current render is full-bleed, not review-forward. Can't verify without re-render. |
| P2 #10 | before-after layout recommendation weight | 🟡 **N/A this render** | Template picker not exercised in this single-layout render. |
| P2 #11 | Logo text-fallback treatment | ❌ **NOT FIXED** | Desert Diamond logoUrl was empty; no text fallback visible in the render either. Front has no logo slot at all right now. Confuses "is the logo missing" vs "is the logo supposed to be there." |
| P2 #12 | Bold-graphic layout re-composition | 🟡 **N/A this render** | Not exercised. |

**Original P0 batch score: 3 FIXED + 2 PARTIAL out of 5.** The CSS changes
landed, but the partials are what Drake saw last night and rejected.

---

## NEW ranked gap list v2 (ordered by demo impact)

Every item below was either (a) visible in the FINAL renders but missing from
the original audit, or (b) a reference-corpus pattern the audit didn't call out.
Each row specifies the exact file and change.

### P0 — must fix before demo (8 items)

#### P0-A. **Front credibility hidden behind OfferBadge ribbon** ⚠️ regression
- **What I see:** Yellow ribbon in top-right of full-bleed covers the top-right
  credibility badge zone. You cannot read "Licensed & Insured · Family-Owned
  Since 2014" — it is literally painted over.
- **Root cause:** P0 #1 and P0 #4 both claimed the top-right corner on
  full-bleed / side-split / photo-top / before-after. P0 #1 shipped later
  with `z-index` higher.
- **Fix:** Move credibility badge to top-LEFT corner (where logo would go
  if present), OR move OfferBadge to top-LEFT on layouts that have the
  credibility on top-right, OR put credibility inline below the headline.
- **File:** `src/components/postcard/PostcardFront.vue` — the
  `pc-credibility` span + the `OfferBadge` wrapper.
- **Est:** 45 min.

#### P0-B. **Back USPS panel still visually dominates at ~33% width**
- **What I see:** The right column in `desert-diamond-BACK-FINAL.png` reads
  as roughly one-third of card width. Mail Shark / PostcardMania / Lob
  references all sit at <25% right-panel width. The gap is visible at a
  glance.
- **Root cause:** `--pc-usps-col-w: 3.0in` on a 9in card = 33.3%.
- **Fix:** Phase 2 in handoff — execute §202.5.3 pivot. Drop
  `--pc-usps-col-w` from 3.0in to 2.25in (25%). Drop
  `--pc-usps-barcode-h` (barcode moves into address block). Remove the
  `<div class="h-3 bg-gray-200 rounded-sm" />` barcode clear-zone
  placeholder from PostcardBack.vue bottom-right.
- **Files:** `src/styles/print-scale.css`, `src/components/postcard/PostcardBack.vue`.
- **Risk:** Requires print partner §202.5.3 support. Drake added the demo-call
  question to `postcanary-todo.md` (line 35). Fallback: revert commit if
  partner says no.
- **Est:** 1-2 hours.

#### P0-C. **Wrong website shown on back CTA** 🐛
- **What I see:** Desert Diamond HVAC back shows `martinezplumbing.com`
  below the phone number. That's a hard-coded mock default from the
  dev route's form state.
- **Root cause:** `pages/dev/PostcardPreview.vue` form state has a default
  `website` that wasn't re-set after injecting Desert Diamond form values.
  The field isn't in the Playwright injection script in handoff §6.4.
- **Fix:** Add `setText('Website', 'desertdiamondhvac.com')` to the injection
  script in handoff §6.4 AND add a `website` ref to the dev route form with
  a sensible default that matches businessName.
- **File:** `src/pages/dev/PostcardPreview.vue`.
- **Est:** 20 min.

#### P0-D. **Hero photo is a loyalty-badge graphic, not an emotional scene**
- **What I see:** Front shows "DESERT DIAMOND CLUB" with 4 diamond icons
  (Bronze/Silver/Gold/Diamond tier graphic). It's a marketing graphic from
  the website, not a photo of a worker or a family or a home. Zero
  emotional pull. The Mail Shark / PostcardMania references ALL show
  people or rooms — never abstract brand graphics.
- **Root cause:** Firecrawl's `BrandingProfile.photos` is sorted by
  "quality/prominence" not by "emotional pull for direct mail." A big
  hero marketing graphic beats a small team photo in the extraction
  scoring.
- **Fix options (pick one):**
  - **(a) Demo-seed fix:** Manually point the Desert Diamond brand kit
    hero photo to a better image from `brandKit.photoUrls` (the scrape
    returned 13 photos — there's likely a worker photo in there). 15
    min to update DB, no code change.
  - **(b) Extraction fix:** Extend the Firecrawl JSON schema prompt to
    score photos as "shows people: yes/no", "shows equipment-only: yes/no",
    "shows completed work: yes/no" and sort by people > work > equipment
    > abstract. 1-2 hours.
  - **(c) Hybrid:** Demo-seed Desert Diamond for tomorrow, file the
    extraction improvement as P1 for after the demo.
- **Recommendation:** **Option (c)** — demo-seed fix now, extraction fix
  after demo lands.
- **Est:** 15 min (a), 1-2 hours (b).

#### P0-E. **QR code not visible on back render** ⚠️ possible regression
- **What I see:** I do NOT see a QR code in the back render. The Session 31
  P0 #3 work made QR mandatory (qrCodeImageUrl persisted, CTABox
  qrCodeUrl prop required). The back render should show a QR.
- **Possible causes:**
  - (a) QR is rendered but positioned in the USPS right-column area
    that's cropped in the screenshot
  - (b) The /dev/postcard-preview route doesn't wire qrCodeImageUrl from
    the brand kit
  - (c) The Playwright injection script in handoff §6.4 doesn't set the
    QR URL field
- **Action:** Investigate before building — if it's (b) or (c) that's a
  legitimate dev-route bug. If it's (a) that's cosmetic (the QR is supposed
  to live in the content column, not the USPS zone, per the spec). Read
  `CTABox.vue` and `PostcardBack.vue` to find where `qrCodeUrl` prop is
  consumed.
- **Est:** 30 min investigation + fix.

#### P0-F. **Left column content too sparse (lose the "corporate SaaS" feel)**
- **What I see:** The back's left column has 4 blocks separated by generous
  whitespace:
  1. Offer headline box (1 line + deadline)
  2. Phone pill + website
  3. Star rating + review quote
  4. Trust badge row
  In Mail Shark references, the same vertical space holds 6-8 content
  blocks with barely any whitespace. Our left column reads "clean/airy."
  Theirs reads "packed with value."
- **Fix:** Phase 3 in handoff. Stacked value items in OfferBox
  (`✓ 23-Point Safety Check $49 value`, `✓ Condenser Coil Cleaning $79
  value`, etc.), tighten vertical padding, add a risk-reversal line under
  the phone ("Free estimate · No trip charge · Satisfaction guaranteed"),
  make the trust badge row a full-width bottom strip (P1 #8 from original
  audit).
- **Files:** `src/composables/usePostcardGenerator.ts` (extend to emit
  `offer.items[]`), `src/components/postcard/OfferBox.vue` (render the
  items), `src/components/postcard/PostcardBack.vue` (tighter block
  spacing), `src/components/postcard/TrustBadges.vue` (full-width layout).
- **Est:** 2-3 hours.

#### P0-G. **Back phone not 2x bigger than offer headline** (from P1 #7)
- **What I see:** Back phone `(623) 246-2377` reads as roughly the same
  weight as the `$277 Value` offer headline. In Mail Shark references
  the phone is the single biggest element on the back.
- **Fix:** Bump `--pc-phone-back-size` from 26pt to 32pt in
  `print-scale.css`. Verify CTABox doesn't overflow column width at the
  new size.
- **File:** `src/styles/print-scale.css`.
- **Est:** 20 min + visual verification.

#### P0-H. **No full-bleed photo on front — photo sits inside a white card border**
- **What I see:** Even on full-bleed layout, there's a visible white border
  around the hero photo at the top. Mail Shark / PostcardMania full-bleed
  cards literally bleed edge-to-edge with no white inset.
- **Root cause:** The preview card has `border: 1px solid` + internal
  padding that pushes the photo off the edge.
- **Fix:** In full-bleed layout, remove the internal padding on the
  PostcardFront content wrapper for the full-bleed variant only; keep the
  0.125" bleed safe zone (print-scale CSS var) but don't visually frame
  the photo inside a white rectangle.
- **File:** `src/components/postcard/PostcardFront.vue`.
- **Est:** 30 min.

### P1 — high impact, can slip if P0 takes more time (6 items)

#### P1-A. **Hide John Doe placeholder in /dev route**
- **What I see:** The placeholder USPS address block shows "John Doe / 123
  Main St / Anytown ST 00000". Distracting during demo prep.
- **Fix:** In `/dev/postcard-preview`, conditional the address block
  rendering to hide it when `import.meta.env.DEV` or a dev-mode prop.
- **File:** `src/pages/dev/PostcardPreview.vue` or `PostcardBack.vue`
  behind a prop.
- **Est:** 20 min.

#### P1-B. **Trust badges look washed out (outline style vs filled style)**
- **What I see:** BBB A+, Angi, HomeAdvisor, Licensed & Insured badges
  render as outlined boxes with small text. In references they're filled
  color blocks (blue BBB logo, orange Angi logo, green HomeAdvisor logo).
- **Fix:** Use the real brand logos (BBB blue, Angi orange, etc.) as SVG
  or image assets, filled not outlined. Store in `src/assets/trust-badges/`.
- **File:** `src/components/postcard/TrustBadges.vue` + new assets.
- **Est:** 1 hour (finding/creating the SVG assets is the slow part).

#### P1-C. **No value stack items (`✓` rows) inside the offer box**
- Called out in P0-F but can be split as a separate task. This is the
  AI-generation half of P0-F — `usePostcardGenerator.ts` needs to emit
  `offerItems: [{label, value}]` based on the goal type and brand kit
  services, then `OfferBox.vue` renders them.
- **Est:** 1-2 hours.

#### P1-D. **Offer deadline is body text, should be urgency callout**
- **What I see:** "Offer expires May 31, 2026" renders as plain italic
  body text. References put deadlines in bold red/orange or in a banner
  style treatment.
- **Fix:** Restyle the deadline as bold + brand-accent color + small icon
  (clock or exclamation).
- **File:** `src/components/postcard/OfferBox.vue`.
- **Est:** 20 min.

#### P1-E. **Phone pill needs a "CALL" label integrated, not a disconnected small label**
- **What I see:** "CALL NOW" sits as a small label above the back phone
  pill. References integrate the call-to-action into the phone block
  directly ("📞 CALL (623) 246-2377") or put both in a single colored
  rectangle.
- **Fix:** Merge CallNow label into the CTABox as a single rectangle with
  label + phone inline.
- **File:** `src/components/postcard/CTABox.vue`.
- **Est:** 30 min.

#### P1-F. **Logo slot empty on front — either hide or text-fallback cleanly**
- **What I see:** Desert Diamond logoUrl came back empty from Firecrawl.
  The top-left of the front shows... nothing. Not a text fallback, not a
  clean hidden state — just a blank area that makes the layout feel
  off-balance.
- **Fix:** When `logoUrl` is empty, either (a) hide the slot entirely and
  let the headline shift left, or (b) render a simple text wordmark of
  `businessName` in brand-primary color inside a pill. Option (b) is
  closer to Mail Shark when they don't have a logo.
- **File:** `src/components/postcard/PostcardFront.vue` — the logo slot
  conditional.
- **Est:** 45 min.

### P2 — polish (skip if out of time)

#### P2-A. Bold-graphic "burst overlaps AC headline" bug from handoff Phase 4 #4
- Not reproduced in full-bleed render. Verify on a bold-graphic layout
  re-render after P0 items land. 30 min to verify and fix if still present.

#### P2-B. Review-forward "stars + ribbon collision" bug from handoff Phase 4 #3
- Same — not reproduced in full-bleed render, needs a review-forward
  render to verify. 30 min.

#### P2-C. Top-right area above address block on back is unused reclaimable space
- Per DMM research (`research-usps-dmm-201-clear-zones-2026-04-09.md` §3),
  there's ~1.5" × 1.5" of usable space top-right between the indicia and
  the address block. The current render leaves it blank. Not a visual
  quality blocker, but if the left column stays dense after Phase 3, we
  could push something there (logo echo? secondary phone? big
  certification badge?).
- Defer until after P0 items land.

---

## Reference-corpus patterns our render is missing (summary)

What Mail Shark / PostcardMania DO that we still DON'T:

1. **Photo dominates the front.** 50-70% of card area. Ours: the hero
   photo is smaller and framed inside a white-bordered card.
2. **Offer appears as a bold colored burst/badge ON the front.** Ours:
   P0 #1 added a ribbon, but it's small and collides with credibility.
3. **Phone on the back is the biggest single element.** Ours: same weight
   as offer headline (P0-G).
4. **Left column packed with content.** Ours: airy/clean, 4 blocks with
   generous whitespace (P0-F).
5. **Trust badges as bold filled color blocks, not outlined boxes.**
   Ours: outlined (P1-B).
6. **Value stacks with ✓ items and dollar values.** Ours: single offer
   line (P0-F / P1-C).
7. **Full-width trust badge strip at the bottom of the back.** Ours:
   cramped row inside the left column (original P1 #8, still open).
8. **Urgent deadline treatment (bold red/orange + icon).** Ours: italic
   body text (P1-D).
9. **Emotional photo of a person (family or worker).** Ours: brand
   loyalty graphic with diamond icons (P0-D).

---

## Recommended execution order (next work session)

If 5-7 hours of work time before Drake needs to sign off:

1. **P0-C** (20 min) — fix the wrong website before anything else. Cheap. Done.
2. **P0-D option (a)** (15 min) — demo-seed Desert Diamond with a better hero photo from the existing 13 scraped photos. Cheap, high visual impact.
3. **P0-A** (45 min) — unblock the credibility badge behind the ribbon.
4. **P0-E** (30 min) — investigate and fix QR code visibility.
5. **P0-B** (1-2 hours) — §202.5.3 pivot, reclaim USPS column to 2.25in.
6. **P0-G** (20 min) — upsize back phone 26→32pt.
7. **P0-H** (30 min) — remove white frame on full-bleed photo.
8. **P0-F** (2-3 hours) — content density pass: stacked value items, tighter spacing, full-width trust badge strip.
9. **Re-render, explorer the folder, show Drake the updated card.**
10. **Get Drake's explicit signoff before Phase 5 (mail-campaigns endpoint, PDF export, rehearsal).**

**P0 batch total: ~5-7 hours. Fits inside one session if Drake doesn't pivot.**

P1 items (B-F) slot in after P0 signoff if time permits; otherwise they're
post-demo polish.

---

## What this document is NOT

- Not a re-run of the original audit. The original audit is still the
  philosophical reference for how pro direct mail looks. This doc is just
  the CURRENT-STATE-vs-TARGET-STATE delta.
- Not a code plan. Each P0 item names the file + change; actual diffs
  happen during execution.
- Not final. After Drake reads it, Drake decides what gets cut or
  reordered. The ordering above is my best demo-leverage read, not his.

---

## Questions for Drake before building

1. **P0-D hero photo:** OK to demo-seed manually from the existing 13
   scraped photos instead of fixing Firecrawl extraction scoring? (my
   rec: yes, demo-first, fix after)
2. **P0-B §202.5.3 pivot:** still want to proceed before partner call
   confirms support, accepting fallback-revert risk? (Drake already
   approved in drake-memory ID 116 — confirming again)
3. **Anything on this list you want CUT?** 14 items is ambitious; if
   demo time is tighter than I think, I'll cut P1-F / P1-B / P1-E first.
