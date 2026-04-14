# Phase 04: Design Studio Render Pipeline

> **Goal:** Headless print-render pipeline that converts a customer-approved postcard design (persisted `CampaignDraft.design.sequenceCards` + `BrandKit` data) into PDF proofs. Demo scope: on-screen RGB PDF preview. Post-demo: CMYK PDF/X-1a, veraPDF preflight, 1 Vision integration, back-of-card.
>
> **Branch:** continue on `feat/design-studio-r2`
>
> **Demo deadline:** 2026-04-20 (on-screen flow only)
>
> **Tier:** 4 — Major. Multi-session, architectural, customer-facing, revenue-critical.
>
> **Predecessor phase:** Phase 03 (Figma postcard plugin). Figma template at `Dn4IQuj2hPdRe4NTSn3cxh` resized Session 47 from 799×564 to 1200×800 (6×9 landscape aspect 1.5).
>
> **Expert panels:** `experts-template-pipeline.md` (Figma + VDP + Pre-press), foundation: Reilly, Cantrill, Beck, Hunt
>
> **Research agents (Session 47):** Figma API limitations, Figma→CMYK pipeline
>
> **Codex review v1 (Session 47):** FAIL (92% conf), 14 findings — 2 CRITICAL + 5 HIGH + 5 MEDIUM + 1 LOW. This plan (v2) incorporates all fixes.

---

## Key decisions (v3 — locked after Codex v1+v2 + expert convergence)

1. **Renderer consumes persisted draft content**, NOT fresh AI calls. Customer edits are authoritative.
2. **DB-backed job table + ThreadPoolExecutor**, NOT Celery+Redis. Matches existing `_scrape_job` pattern. No new infrastructure.
3. **Resource namespace: `/api/campaign-drafts`** (wizard operates on drafts pre-approval).
4. **Demo-only preview artifact** — `kind: "preview"` in job row. A separate future-phase approval artifact will cover front+back + signed/immutable output.
5. **Signed download URLs with short TTL**, NOT raw media paths.
6. **Golden-master = normalized raster snapshots** (pytest-image-regression), NOT PDF byte SHA-256.
7. **HMAC canonical string** = `method | path | body_sha256 | timestamp | nonce` + ±5min window.
8. **Figma 6×9 iteration freeze: 2026-04-16.** After that, current state is final for demo regardless.
9. **Orchestrator builds `RenderContext` DTO** from persisted data (CampaignDraft + BrandKit); render-worker consumes that DTO. Template-specific transforms (e.g., HAC-1000 splits one `headline` into 5 visual slots) live in the template's renderer Python, not in the data model.
10. **Render-worker deploys with `maxReplicas: 1` for demo.** Nonce LRU is per-instance; single instance keeps replay protection sound without needing shared nonce storage until we add Redis.
11. **Server data path is `draft.data.design.sequenceCards`** (CampaignDraft uses single JSONB `data` column per `models.py`); client DTO flattens to `draft.data.design.sequenceCards (server) / draft.design.sequenceCards (client DTO)`.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT (Vue 3 — existing Step 3 StepDesign.vue)             │
│  → Customer edits sequenceCards, approves preview            │
└────────────────────┬─────────────────────────────────────────┘
                     │ POST /api/campaign-drafts/{id}/generate-preview
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  API SERVICE (existing Flask blueprint)                      │
│  • Load draft, validate draft.data.design.sequenceCards (server) / draft.design.sequenceCards (client DTO) present   │
│  • Create render_job row (org_id, draft_id, kind="preview",  │
│    status="queued", cards_snapshot=JSONB)                    │
│  • Submit job to ThreadPoolExecutor                          │
│  • Return 202 { job_id, status_url, eta_seconds }            │
└────────────────────┬─────────────────────────────────────────┘
                     │ _BG_EXECUTOR.submit(_render_job, job_id)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  RENDER ORCHESTRATOR (same api process, background thread)   │
│  • Mark status=rendering, started_at=now                     │
│  • For each card in cards_snapshot:                          │
│    - Localize logo if still remote                           │
│    - Build HMAC canonical → HTTP → render-worker             │
│    - Save returned PDF bytes to /media/renders/{org_id}/...  │
│  • Update heartbeat_at every 5s during render                │
│  • Mark status=done OR status=failed with structured error   │
│  • Stale reaper: jobs with heartbeat_at < now-60s → failed   │
└────────────────────┬─────────────────────────────────────────┘
                     │ POST https://render-worker.internal/render/postcard
                     │ Headers: X-Render-Auth, X-Render-Timestamp,
                     │          X-Render-Nonce, X-Render-Corr-Id
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  RENDER-WORKER SERVICE (new Railway svc, same repo)          │
│  • Verify HMAC canonical + ±5min window + nonce (LRU)        │
│  • Validate render_context against Pydantic schema         │
│  • Load Jinja template (postcard/hac-1000-front.html)        │
│  • Apply text-overflow cascade server-side (Pillow-measured) │
│  • WeasyPrint render → RGB PDF bytes                         │
│  • [POST-DEMO] Ghostscript CMYK + veraPDF preflight          │
│  • Return PDF bytes + metadata + warnings[]                  │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  CLIENT polls GET /api/render-jobs/{id}                      │
│  → when status=done: signed download URL per card            │
│  → shows PDFs inline in StepDesign preview + StepReview      │
└──────────────────────────────────────────────────────────────┘
```

---

## RenderContext DTO + Variable Schema (v3, verified against persisted types)

**Key insight from Codex v2:** `CardDesign.resolvedContent` (the persisted shape per `client/src/types/campaign.ts:237`) does NOT contain `headlines[]`, `bridgeText`, or `ctaText` — those are pre-persist fields on `GeneratedCardContent`. The composable `usePostcardGenerator.ts` flattens AI output into the persisted shape at generation time.

**Solution:** define a `RenderContext` DTO at the render-worker boundary. Server-side orchestrator constructs it from `draft.data.design.sequenceCards[i]` + `brand_kit`. Render-worker consumes only this DTO. Template-specific transforms (like HAC-1000 splitting one `headline` string into 5 visual slots) live in the HAC-1000 renderer's Python, not in the data model.

### RenderContext (Pydantic on render-worker, matching TypedDict on server)

```python
class RenderContext:
    card: CardContent               # from CardDesign.resolvedContent
    back: CardBackContent | None    # from CardDesign.backContent — NULL in Phase 4 (front-only demo); populated by future back-side phase
    brand: BrandSubset              # from BrandKit

class CardContent:           # 1:1 mirror of CardDesign.resolvedContent (campaign.ts:237)
    headline: str             # single semantic string; template renderer handles splitting
    offer_text: str
    offer_teaser: str         # short front-of-card teaser, e.g. "$79 TUNE-UP"
    offer_items: list[OfferStackItem]   # stacked value items, usually 3-5
    photo_url: str            # /media/brand-photos/{org_id}/... or stock
    review_quote: str
    reviewer_name: str
    phone_number: str
    urgency_text: str
    risk_reversal: str
    trust_signals: list[str]

class CardBackContent:       # 1:1 mirror of CardDesign.backContent (campaign.ts:250)
    guarantee: str
    certifications: list[str]
    license_number: str
    company_address: str
    website_url: str
    qr_code_url: str

class BrandSubset:           # pulled from BrandKit at orchestration time
    business_name: str       # required
    phone: str               # required
    website_url: str | None
    logo_url: str | None     # null → template uses text-logo fallback
    qr_code_url: str         # required (generated by qr_codes service)
    primary_color: str | None
    secondary_color: str | None
    accent_color: str | None
    industry: str | None     # may be null; renderer applies fallback chain
    service_types: list[str]
```

### Jinja variable mapping (per HAC-1000 front template)

The HAC-1000 front renderer in `postcard_renderer.py` takes a `RenderContext` and produces these Jinja vars by applying template-specific transforms:

| Jinja var | Derivation from RenderContext | Fallback |
|---|---|---|
| `photo_url` | `ctx.card.photo_url` OR stock-by-industry | industry chain (see below) |
| `headline_red_1`, `headline_red_2` | Split `ctx.card.headline` at position based on word-count heuristic | "[City] Homeowners" / "Save Today" |
| `bridge_text` | Template-specific pattern in `ctx.card.headline` OR template default | "—stay comfortable with a" |
| `headline_blue_1`, `headline_blue_2` | Remainder of `ctx.card.headline` split | "NEW A/C" / "SYSTEM!" |
| `offer_prefix`, `offer_amount`, `offer_suffix` | Regex-parse `ctx.card.offer_text` | "Get" / "$50 OFF" / "your next service" |
| `offer_disclaimer` | Template constant | "With this card. Offer expires 30 days from mail date." |
| `logo_url` | `ctx.brand.logo_url` | null → text-logo (`business_name` in Bebas Neue) |
| `business_name` | `ctx.brand.business_name` | required (422 if missing upstream) |
| `tagline_line1`, `tagline_line2` | Split `ctx.brand.industry` via industry→tagline map | "HEATING &" / "AIR" |
| `cta_text` | Template constant (CTA is a template property per the Figma design) | "Call today to schedule your service!" |
| `phone` | `ctx.brand.phone` | required |
| `website_url` | `ctx.brand.website_url` protocol-stripped | null → hide row |
| `qr_code_url` | `ctx.brand.qr_code_url` | required |

### Headline splitting (HAC-1000-specific, renderer-side)

Input: one `ctx.card.headline` string (free-form, customer-editable).

Output: 5 visual slots matching the Figma template: `headline_red_1`, `headline_red_2`, `bridge_text`, `headline_blue_1`, `headline_blue_2`.

Algorithm (HAC-1000 renderer — handles all input shapes as first-class cases):

**Case A — single em-dash present** (AI-generated default shape, e.g., `"Phoenix Homeowners — Stay Cool This Summer With A New A/C System!"`):
- Split on the em-dash. Left portion → red lines (word-balanced into 2 lines). Right portion → first 3-4 words form `bridge_text`, remaining words → blue lines (word-balanced into 2 lines, last word shouted).

**Case B — no em-dash** (customer removed or never typed one, e.g., `"Phoenix Homeowners Save On A New A/C System"`):
- Heuristic split: take first ~30% of words → red lines. Middle ~20% → bridge_text. Last ~50% → blue lines.
- If total word count < 5: promote entire headline to red lines; use template default for bridge + blue; emit `HEADLINE_SHORT` warning.

**Case C — multiple em-dashes** (customer used dash as punctuation, e.g., `"Phoenix — Quick — Reliable — HVAC"`):
- Deterministic normalization: replace all em-dashes after the FIRST with a single space. This produces a Case A input (exactly one em-dash) which then runs through the Case A splitter unchanged.
- For `"Phoenix — Quick — Reliable — HVAC"` → normalized to `"Phoenix — Quick Reliable HVAC"` → Case A produces red=["Phoenix"], bridge="Quick", blue=["Reliable", "HVAC"] (or the Case A word-balancer's actual output, which is authoritative).
- Emit `HEADLINE_MULTI_DASH` warning so the customer knows punctuation dashes were collapsed.

**Case D — single word or empty after strip** (degenerate):
- Use template default for all 5 slots. Emit `HEADLINE_DEGENERATE` warning. Render job succeeds with warning.

**Never fall back silently.** Every non-Case-A path emits a named warning in response.warnings[]. Golden-master fixtures cover one example of each case (5 fixtures total: typical em-dash, dashless sentence, dashless short, multi-dash, single-word).

**Why this works:** the headline is a SEMANTIC unit persisted as one string. The template imposes a VISUAL structure (5 slots, 2 colors). The split is template-specific styling, not data shape. All edit-paths produce a valid render.

### Industry fallback chain

1. `ctx.brand.industry` if set
2. `ctx.brand.service_types[0]` mapped via industry taxonomy
3. Generic "home-services" stock + tagline "LOCAL SERVICES" + warning in response

---

## API Contracts

### `POST /api/campaign-drafts/{id}/generate-preview` (client → api)

**Blueprint:** add to existing `campaign_drafts_bp` in `server/app/blueprints/campaign_drafts.py`.
**Auth:** session cookie. **Org scope:** `_oid()` helper in that blueprint.
**Rate limit:** 10/hr/org.

```json
// Request
{ "side": "front" }

// 202 Accepted
{
  "job_id": "rjob_abc123",
  "status": "queued",
  "status_url": "/api/render-jobs/rjob_abc123",
  "eta_seconds": 15
}

// 400 — draft has no design.sequenceCards
// 404 — draft not found or not in caller's org
// 409 — pending render job already exists for this draft+side
// 422 — required brand_kit field missing
// 429 — rate limit
```

### `GET /api/render-jobs/{id}` (client poll)

**Blueprint:** new `server/app/blueprints/render_jobs.py`.
**Auth:** session + org_id match against `job.org_id`.

```json
// Rendering
{ "job_id": "...", "kind": "preview", "status": "rendering",
  "progress": { "completed": 1, "total": 3 } }

// Done
{ "job_id": "...", "kind": "preview", "status": "done",
  "cards": [ { "card_number": 1, "download_url": "/api/render-jobs/.../cards/1?sig=...&exp=..." }, ... ] }

// Failed
{ "job_id": "...", "kind": "preview", "status": "failed",
  "error": { "code": "RENDER_TIMEOUT", "message": "Render exceeded 30s; retry available" } }
```

### `GET /api/render-jobs/{id}/cards/{n}` (client download, signed)

HMAC URL: `?sig=HMAC({job_id}|{card_n}|{org_id}|{exp})&exp={unix}`. TTL 10min. Secret rotates per deploy. Session cookie validates current_user.org_id matches embedded org_id. Returns `application/pdf` bytes.

### `POST /render/postcard` (api → render-worker, INTERNAL)

HMAC canonical + replay protection:

```
Canonical = METHOD "\n" PATH "\n" SHA256(body) "\n" TIMESTAMP "\n" NONCE
X-Render-Auth = HMAC-SHA256(canonical, secret)
X-Render-Timestamp = "2026-04-14T02:30:15Z"   # reject if outside ±5min
X-Render-Nonce = UUIDv4                        # reject if seen in last 10min (in-memory LRU)
X-Render-Corr-Id = UUIDv4
```

Request body:

```json
{
  "correlation_id": "req_xyz",
  "org_id": "org_123",
  "draft_id": "draft_456",
  "template_id": "hac-1000-front-v1",
  "side": "front",
  "card_number": 1,
  "render_context": {
    "card": { "headline": "...", "offer_text": "...", "offer_teaser": "...",
              "offer_items": [ { "label": "...", "value": "79" } ],
              "photo_url": "...", "review_quote": "...", "reviewer_name": "...",
              "phone_number": "...", "urgency_text": "...", "risk_reversal": "...",
              "trust_signals": ["..."] },
    "back": null,                        // Phase 4 front-only
    "brand": { "business_name": "...", "phone": "...", "website_url": "...",
               "logo_url": "...", "qr_code_url": "...",
               "primary_color": "#...", "secondary_color": "#...", "accent_color": "#...",
               "industry": "...", "service_types": ["..."] }
  }
}
```

Response 200: `{ correlation_id, pdf_bytes_base64, size_bytes, render_ms, warnings[] }`. Errors: 400 invalid / 401 HMAC or replay / 422 content / 500 render / 504 timeout.

---

## File List + Build Order (matches repo conventions)

Server uses `app/models.py` (single file), `app/blueprints/`, `app/services/`, `app/dao/`.

### Phase 4A: api-side foundation (Days 1-2)

1. `server/app/models.py` — ADD `class RenderJob(Model)` after `CampaignDraft`. Fields: `id, org_id, draft_id, kind, status, side, cards_snapshot JSONB, cards_output JSONB, error JSONB, created_at, started_at, heartbeat_at, completed_at, attempt_count`
2. Alembic migration — indexes on `(org_id, draft_id, status)` and `(status, heartbeat_at)` for reaper
3. `server/app/dao/render_jobs_dao.py` — CRUD matching `brand_kit_dao.py` shape
4. `server/app/services/render_jobs.py` — `create_job`, `mark_rendering`, `mark_done`, `mark_failed`, `reap_stale_render_jobs()` mirroring `brand_kit.reap_stale_scrapes()`
5. `server/app/services/render_worker_client.py` — HMAC canonical builder + HTTP client
6. `server/app/blueprints/render_jobs.py` — `GET /api/render-jobs/{id}`, `GET /api/render-jobs/{id}/cards/{n}` (signed URL validator + PDF stream)
7. `server/app/blueprints/campaign_drafts.py` — ADD `POST /{id}/generate-preview`
8. `server/app/__init__.py` — REGISTER `render_jobs_bp`
9. `server/app/tasks/render_orchestrator.py` — ThreadPoolExecutor-submitted `_render_job(job_id)` following `_scrape_job`

### Phase 4B: render-worker service (Days 2-4)

10. `render_worker/` — NEW top-level dir alongside `server/` and `client/`
11. `render_worker/Dockerfile` — python:3.11-slim + apt pango cairo gdk-pixbuf + weasyprint + Pillow (demo); Ghostscript + veraPDF + JRE (post-demo)
12. `render_worker/app.py` — Flask app + routes + HMAC middleware
13. `render_worker/templates/postcard/hac-1000-front.html` — Jinja, adapted from post-iteration `get_design_context`
14. `render_worker/templates/postcard/_base.html` — `@page`, `@font-face`, print CSS reset
15. `render_worker/fonts/Oswald-Bold.ttf, BebasNeue-Regular.ttf, InstrumentSans-*.ttf` — SIL OFL local files
16. `render_worker/services/text_overflow.py` — Pillow `ImageFont.getbbox()` cascade
17. `render_worker/services/postcard_renderer.py` — `render_card(validated_request) -> RenderResult`
18. `render_worker/services/hmac_auth.py` — canonical + timestamp + nonce LRU
19. Railway service config — separate service, internal networking only, **`maxReplicas: 1`** for demo (single instance keeps HMAC nonce LRU sound; migrate to shared nonce state post-demo)

### Phase 4C: Integration + tests (Days 4-5)

20. `server/tests/blueprints/test_render_jobs_route.py` — unit tests, mocked executor
21. `render_worker/tests/test_postcard_renderer.py` — normalized raster snapshot tests (pytest-image-regression, 0.5% threshold)
22. `render_worker/tests/fixtures/` — Desert Diamond HVAC + `AB` + 46-char name + null photo + null logo
23. `render_worker/tests/test_text_overflow.py` — cascade unit tests
24. `render_worker/tests/test_hmac_auth.py` — replay + window tests
25. `render_worker/Dockerfile.test` — containerized test runner (pinned WeasyPrint/pango/cairo)

### Phase 4D: Client integration (Day 5)

26. `client/src/api/renderJobs.ts` — `generatePreview`, `getJob`
27. `client/src/composables/useRenderJob.ts` — polling with exp backoff
28. `client/src/components/wizard/StepDesign.vue` — ADD "Generate Proof" button + preview display
29. `client/src/components/wizard/StepReview.vue` — display PDF proofs (demo; true approval artifact deferred)

---

## Test Criteria (Beck TDD — tests BEFORE render code)

**Unit:** overflow cascade (AB / 46ch / 5ch), logo bucketing, HMAC (valid / body-modified / timestamp-out-window / nonce-replay / missing-header), image localizer, stale reaper (60s heartbeat cutoff), variable resolver, industry fallback chain.

**Golden-master (containerized):** 5 fixtures → per-card 150 DPI PNG → `pytest-image-regression` 0.5% threshold. Snapshots in `render_worker/tests/fixtures/snapshots/`. Re-snapshot requires `--snapshot-update` + review. Test Dockerfile matches production.

**Integration:** Desert Diamond HVAC → POST generate-preview → poll → 3 signed URLs → PDFs download → per-card PNG within raster threshold.

---

## Error Handling

| Condition | HTTP | Job | Client |
|---|---|---|---|
| `brand_kit` missing | n/a | 422 | redirect to onboarding |
| `draft.data.design.sequenceCards (server) / draft.design.sequenceCards (client DTO)` empty | 400 | n/a | "Complete Step 3" message |
| `businessName` null | 422 | n/a | onboarding prompt |
| `phone` null | 422 | n/a | onboarding prompt |
| `qrCodeImageUrl` null | 422 | n/a | regenerate qr step |
| `photos = []` | — | proceeds | stock + warning |
| `logoUrl = null` | — | proceeds | text-logo fallback |
| `industry = null` | — | proceeds | 3-step fallback + warning |
| Remote URL 404 in localizer | — | proceeds | stock + warning |
| HMAC mismatch | — | retry 2x then fail | retry button |
| Render >30s | 504 int | retry 2x then fail | retry button |
| Worker unreachable | — | retry 2x then fail | retry button |
| Worker dies mid-render | — | stale reaper flips at 60s | sees failed |

---

## Security

1. **Authenticated PDF delivery.** `GET /api/render-jobs/{id}/cards/{n}` validates signed URL + session + org match. Not static.
2. **Signed URL scheme** — HMAC over `(job_id|card_n|org_id|exp)`, TTL 10min, secret rotates per deploy.
3. **render-worker internal-only.** Not in public Railway routing.
4. **HMAC canonical** — method|path|body_sha256|timestamp|nonce, ±5min window, nonce LRU.
5. **Jinja `autoescape=True`** — all 18 vars escape-safe. Prevents XSS from AI-generated content.
6. **Rate limit** 10/hr/org on generate-preview.
7. **Pydantic schema** validates `render_context` server-side on render-worker.
8. **Audit log** on every HMAC failure (correlation_id, source IP, reason).

---

## Risk Assessment

| Risk | P | I | Mitigation |
|---|---|---|---|
| WeasyPrint differs from Figma | MED | MED | Raster snapshot in container; Drake visual review; accept ~98% |
| Figma 6×9 iteration slips | MED | MED | Hard freeze 2026-04-16; after that, current state ships |
| Remote logo URL 404 | MED | HIGH | Localizer on every job; stock fallback |
| Text overflow misfires | MED | MED | Pillow measurement + snapshots + warnings[] |
| ThreadPoolExecutor scale limit | LOW demo / MED scale | MED | Monitor; migrate to Celery+Redis only if real traffic requires |
| Stale row accumulation | MED | LOW | Opportunistic reaper on every job creation |
| CMYK breaks rich-black (post-demo) | HIGH | HIGH | `-dBlackPtComp=1` + veraPDF + sample prints |
| 1 Vision rejects format (post-demo) | MED | HIGH | Peter's 3 questions; baseline PDF/X-1a + GRACoL 2013 CRPC6 |
| Render-worker not deployed by demo | LOW | HIGH | Phase 4A day 1 provisioning; Drake has Railway admin |
| Codex v2 finds more issues | MED | MED | 1 more revision round budgeted max |

---

## Spikes Required Before Phase 4B (~7h total)

1. WeasyPrint hello-world on python:3.11-slim + apt deps — 1h
2. `@font-face` Oswald/Bebas/Instrument from local TTF — 30m
3. `clip-path: polygon()` diagonal cut — 1h
4. `figma:figma-implement-design` on 6×9 iterated template — 30m (after Drake freeze)
5. Text overflow cascade via Pillow — 2h
6. E2E Desert Diamond HVAC → rendered PDF — 2h

---

## Deferred Work (tracked in TaskList this session)

- Ghostscript CMYK (post-demo, task #5)
- veraPDF preflight (post-demo, task #6)
- 1 Vision integration (post-demo, blocked on Peter, task #7)
- Back of postcard (post-demo, task #8)
- Peter 3-question email (send ASAP, task #9)
- Dustin coord on Railway svc (pre-4B, task #10)
- Celery+Redis migration (future, if volume requires)
- Approval artifact flow (signed/immutable, front+back, legal hold) (future phase)

---

## Success Criteria

**Phase 4 complete:**
- [ ] All 6 spikes pass
- [ ] Desert Diamond HVAC → 3 PDFs via full pipeline
- [ ] Drake visual confirms ≥95% match
- [ ] Raster snapshots pass in container
- [ ] Client StepDesign triggers + polls + displays PDFs
- [ ] Codex v2 passes (no CRITICAL, no HIGH)
- [ ] Hunt IDOR check passes
- [ ] Deferred items tracked

**Demo (2026-04-20):**
- [ ] On-screen: URL → extraction → AI → customer edits → approves → preview PDFs in Step 4
- [ ] 3-card Kennedy sequence
- [ ] CMYK / veraPDF / 1 Vision / physical mail out of demo scope

---

## Expert Sources Cited

| Finding | Source | Applied |
|---|---|---|
| Concrete API contracts | reilly-deep.md Technique 2 | Every endpoint has full schema + errors |
| 5+ unvalidated → spike | reilly-deep.md Stopping Rules | 6 pre-execution spikes |
| Trust code > plan | reilly-deep.md Plan vs Reality | Schema rewritten from actual types |
| Server-side overflow | cantrill-deep.md abstraction-leak | Pillow measurement |
| Golden-master in container | cantrill-deep.md prod-vs-dev | Test Dockerfile mirrors prod |
| Raster > PDF byte hash | Codex #9 + Cantrill | pytest-image-regression 0.5% |
| AI genie tricks | beck-deep.md Rules 5-6 | Snapshots immutable without `--snapshot-update` |
| Commodity vs crafted | beck-deep.md Rule 3 | Customer-facing = carefully crafted |
| IDOR on delivery | hunt-deep.md | Signed URL + session + org match |
| HMAC canonical replay | hunt-deep.md + Codex #11 | method|path|body|timestamp|nonce |
| Input validation server-side | hunt-deep.md | Pydantic on render-worker |
| Ghostscript CMYK | CMYK research agent | `-dBlackPtComp=1` (deferred) |
| Plugins need active session | Figma research agent | No Figma for prod render |
| Font licensing | template-pipeline.md | Oswald/Bebas/Instrument SIL OFL |
| Re-run AI = bug | Codex #2 | Renderer consumes persisted sequenceCards |
| Drafts ≠ campaigns | Codex #1 | Rescoped to `/api/campaign-drafts` |
| Celery not installed | Codex #3 + grep | DB-backed + ThreadPoolExecutor |
| File path conventions | Codex #10 + repo inspection | Match `app/blueprints/`, single `app/models.py` |
| Stale reaper | Codex #6 | `reap_stale_render_jobs` mirrors `reap_stale_scrapes` |
| Delivery contract match | Codex #5 | Signed URLs, not raw paths |
| Demo-only preview kind | Codex #7 | `kind: "preview"` explicit; approval = future phase |
| Industry fallback | Codex #12 | 3-step chain + warning |
| Figma freeze | Codex #13 | 2026-04-16 |
| Image localizer scope | Codex #14 | Logos only; photos already localized |

---

## Status

**Current:** PLAN.md v2 drafted (Session 47). Awaiting:
1. **Drake signoff on v2** (or pushback)
2. **Codex v2 re-review** — verify fixes landed
3. After both: create `APPROVED.md` to unlock execution
4. **Drake's Figma 6×9 iteration** — async track, freeze 2026-04-16

**After signoff:**
- Phase 4 pre-execution: 6 spikes (1 day)
- Phase 4A: foundation (2 days)
- Phase 4B: render-worker (2 days)
- Phase 4C: tests (1 day)
- Phase 4D: client (1 day)
- **Target demo: 2026-04-20** ✓ within deadline
