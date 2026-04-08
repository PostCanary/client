# Phase 1: AI Generation + Website Scraping + Google Reviews - Research

**Researched:** 2026-04-06
**Domain:** Server-side AI content generation, web scraping, Google Business Profile API integration
**Confidence:** HIGH

## Summary

Phase 1 replaces the mock data layer in the Design Studio with real AI-generated content, website-scraped brand assets, and Google Business Profile reviews. The existing codebase already has the client-side interfaces, types, stores, and mock composable (`usePostcardGenerator.ts`) in place -- the work is primarily server-side: building Flask services for Playwright scraping, Claude-powered content extraction/generation, and Google Reviews API integration, then wiring the client to consume real data through the existing `brandKit` API + a new `generate` endpoint.

The server already uses Anthropic Claude (`claude-sonnet-4-20250514`) for the chatbot and Google Gemini Flash for insights, with established patterns for background task execution (`ThreadPoolExecutor`), structured JSON responses, and streaming SSE. The AI generation test file (`test_ai_models.py`) contains 20+ real PostCanary prompts with Claude outputs that validate quality -- these prompts are the foundation for the production generation service.

**Primary recommendation:** Build three server services (`scraper`, `ai_generator`, `google_reviews`) following the existing Blueprint > Service > DAO pattern. Use the `ThreadPoolExecutor` pattern (not Celery -- it's not in the stack yet) for background pre-generation during Step 2. Deploy Playwright inside the existing Docker container with `playwright install --with-deps chromium` added to the Dockerfile.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AIGEN-01 | 3 personalized headline options per business using Caples/Halbert/Gendusa | Claude prompt engineering patterns proven in `test_ai_models.py`; structured JSON output via Anthropic SDK |
| AIGEN-02 | Headlines are goal-aware (neighbor=social proof, seasonal=urgency, storm=news) | Goal type already in `CampaignGoalType` enum; prompt templates per goal type |
| AIGEN-03 | Value-stacked offer text based on business services + campaign goal | Claude generates offers; `test_ai_models.py` has working offer prompts |
| AIGEN-04 | AI selects best Google review using Kennedy/Halbert criteria | Claude review selection prompts validated in `test_ai_models.py` (review_1 test); reviews come from Google API |
| AIGEN-05 | AI returns `reason` field explaining WHY each element was selected | Structured JSON response includes `reason` field; `BrandKitReview.reason` type already exists |
| AIGEN-06 | Each card in sequence has different content with Kennedy escalation | Card purpose enum (`offer`, `proof`, `last_chance`) already exists; generation prompt varies per purpose |
| AIGEN-07 | No two businesses get identical headlines (unique per business+service+city+goal) | Inputs include business context -- uniqueness is inherent when using real business data |
| SCRAPE-01 | Playwright scrapes customer website for name, phone, address, logo, photos | Playwright Python + Claude extraction; Docker deployment with `--with-deps chromium` |
| SCRAPE-02 | Claude extracts structured data from scraped page | Claude receives raw HTML/text, returns structured JSON matching `BrandKit` fields |
| SCRAPE-03 | Photos quality-scored and ranked (workers/team > results > equipment > stock) | Claude scores photos by alt text, context, surrounding HTML; `BrandKitPhoto.qualityScore` type exists |
| SCRAPE-04 | Fallback chain: website scrape > customer upload > stock photos | `stockPhotos.ts` already has fallback photos; `BrandKitPhoto.source` tracks origin |
| SCRAPE-05 | EXIF metadata stripped from all uploaded/scraped images server-side | Pillow `Image.open()` + save without EXIF; already in requirements as dependency of other tools |
| SCRAPE-06 | Current offers/promotions extracted and used | Part of Claude extraction prompt; stored in `BrandKit.currentOffers` |
| GREV-01 | Connect Google Business Profile during onboarding | Google Business Profile API v4 with OAuth 2.0; reviews.list endpoint still active |
| GREV-02 | System pulls all reviews, AI selects best per campaign type | Reviews API fetches all; Claude selects using Kennedy/Halbert criteria per campaign goal |
| GREV-03 | Review excerpted to under 35 words, specific details preserved | Claude excerpting in prompt constraints; validated in `test_ai_models.py` |
| GREV-04 | Reviewer name: first name + last initial only (privacy) | Server-side transformation before storage |
| GREV-05 | Customer can swap to any other review from dropdown | All reviews stored in brand kit; client dropdown selects from array |
| GREV-06 | Reviews refresh periodically (deleted reviews must stop appearing) | Periodic re-fetch via Google API; stale review detection on refresh |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| anthropic | >=0.40.0 (pinned in requirements.txt) | Claude AI generation for headlines, offers, review selection, data extraction | Already in stack, used by chatbot [VERIFIED: server/requirements.txt] |
| playwright | latest (Python) | Headless Chromium for website scraping | Handles JS-rendered sites; spec mandates Playwright [VERIFIED: spec decision] |
| Pillow | latest | EXIF stripping from scraped/uploaded images | Standard Python image processing; lightweight [ASSUMED] |
| google-api-python-client | latest | Google Business Profile API for reviews | Official Google API client library [CITED: developers.google.com/my-business/content/review-data] |
| google-auth-oauthlib | latest | OAuth 2.0 flow for Google Business Profile | Required for GBP API authentication [CITED: developers.google.com/my-business/content/oauth-setup] |

### Already In Stack (no new installs)
| Library | Version | Purpose |
|---------|---------|---------|
| Flask | 3.0.3 | HTTP API framework [VERIFIED: requirements.txt] |
| SQLAlchemy | 2.0.31 | Database ORM [VERIFIED: requirements.txt] |
| psycopg | 3.2.3 | PostgreSQL driver [VERIFIED: requirements.txt] |
| requests | 2.32.3 | HTTP client for image downloads [VERIFIED: requirements.txt] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright (Python) | Playwright (Node.js) | Python keeps entire server in one language; spec says Playwright specifically |
| Google Business Profile API | Google Places API (New) | Places API only returns 5 public reviews; GBP API returns ALL reviews for verified businesses [CITED: developers.google.com/my-business/content/review-data] |
| ThreadPoolExecutor | Celery + Redis | Celery is in the spec vision but NOT in the current stack; ThreadPoolExecutor already works for insights; add Celery later when needed |
| Pillow for EXIF | piexif library | Pillow is more battle-tested and likely already a transitive dependency |

**Installation (new packages only):**
```bash
pip install playwright Pillow google-api-python-client google-auth-oauthlib
playwright install --with-deps chromium
```

## Architecture Patterns

### Recommended Project Structure (Server)
```
app/
├── services/
│   ├── scraper.py           # Playwright scraping + Claude extraction
│   ├── ai_generator.py      # Headlines, offers, review selection
│   ├── google_reviews.py    # GBP API integration + OAuth
│   └── brand_kit.py         # EXISTING — add real scrape orchestration
├── blueprints/
│   ├── brand_kit.py         # EXISTING — add /scrape (real), /generate endpoints
│   └── google_reviews.py    # NEW — OAuth callback, connect, disconnect
├── dao/
│   ├── brand_kit_dao.py     # EXISTING — works as-is (JSONB storage)
│   └── google_reviews_dao.py # NEW — OAuth tokens, cached reviews
└── models.py                # EXISTING — add GoogleReviewConnection model
```

### Recommended Project Structure (Client)
```
src/
├── composables/
│   └── usePostcardGenerator.ts  # MODIFY — call server API instead of local generation
├── stores/
│   └── useBrandKitStore.ts      # MODIFY — wire to real scrape + poll for completion
├── api/
│   ├── brandKit.ts              # MODIFY — add generateContent(), pollScrapeStatus()
│   └── googleReviews.ts         # NEW — connect, disconnect, list reviews
└── components/design/
    └── (existing components)    # MINIMAL changes — they consume CardDesign already
```

### Pattern 1: Model-Agnostic AI Service (from spec)
**What:** Single `call_model()` function with config switch between Claude/Gemini/GPT
**When to use:** All AI generation calls
**Example:**
```python
# Source: postcanary-v1-build-decisions.md line ~961
# Matches Ronacher recommendation in spec

import os
from anthropic import Anthropic

_client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def call_model(prompt: str, system: str = "", model: str | None = None) -> str:
    """Model-agnostic AI call. Config switch for future model swaps."""
    model = model or os.environ.get("AI_MODEL", "claude-sonnet-4-20250514")
    
    response = _client.messages.create(
        model=model,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
```
[VERIFIED: matches existing chat.py pattern at server/app/blueprints/chat.py line 137]

### Pattern 2: Background Pre-Generation (ThreadPoolExecutor)
**What:** Fire background AI generation when Step 1 completes, cache results for Step 3
**When to use:** AI content generation that should not block the wizard flow
**Example:**
```python
# Source: existing pattern in app/services/insights.py lines 21, 358-386
from concurrent.futures import ThreadPoolExecutor

_BG_EXECUTOR = ThreadPoolExecutor(max_workers=2)

def kickoff_content_generation(
    *, org_id: UUID, goal_type: str, brand_kit_data: dict
) -> None:
    flask_app = _flask_app()

    def _job():
        with flask_app.app_context():
            try:
                generate_postcard_content(org_id, goal_type, brand_kit_data)
            except Exception:
                flask_app.logger.exception("Content generation failed org=%s", org_id)
            finally:
                db.session.remove()

    _BG_EXECUTOR.submit(_job)
```
[VERIFIED: matches insights.py kickoff pattern exactly]

### Pattern 3: Structured JSON from Claude
**What:** Claude returns structured JSON matching TypeScript interfaces
**When to use:** All AI generation that produces data consumed by the client
**Example:**
```python
# Source: existing pattern in insights.py build_prompt() lines 223-267
import json

HEADLINE_SYSTEM = """You are an expert direct mail copywriter.
Return ONLY valid JSON, no markdown fences or extra text."""

HEADLINE_PROMPT = """Generate 3 postcard headlines for:
- Business: {business_name}
- Service: {service_type}
- Campaign goal: {goal_type}
- Location: {location}
- Recipient type: {recipient_type}

Return JSON:
{{
  "headlines": [
    {{
      "text": "headline text (8 words max)",
      "formula": "caples formula used (question/news/curiosity/command/testimonial)",
      "reason": "why this headline works for this business and goal"
    }}
  ]
}}"""
```
[VERIFIED: JSON-structured prompt pattern from insights.py]

### Pattern 4: Blueprint > Service > DAO Layering
**What:** HTTP layer (blueprint) calls business logic (service) which calls data access (DAO)
**When to use:** All new endpoints
**Example:**
```python
# Source: existing brand_kit.py blueprint pattern
@brand_kit_bp.post("/scrape")
def trigger_scrape():
    uid = _uid()
    oid = _oid()
    _require_member(oid, uid)
    body = request.get_json(silent=True) or {}
    website_url = body.get("website_url")
    # Service handles orchestration
    bk = brand_kit_svc.real_scrape(org_id=oid, website_url=website_url)
    return {"ok": True, **bk}, 200
```
[VERIFIED: brand_kit.py blueprint line 76-84]

### Anti-Patterns to Avoid
- **Don't put AI prompts inline in blueprints.** Separate prompts into service layer (or a `prompts/` module). Blueprints only handle HTTP. [VERIFIED: insights.py separates prompt building from API route]
- **Don't block the wizard waiting for AI.** Pre-generate in background during Step 2. Show cached brand kit data immediately, swap in AI text when ready. [CITED: spec lines 939-949]
- **Don't re-scrape on every campaign.** Website scrape is ONE TIME during onboarding, cached in brand kit JSONB. Customer refreshes from Settings. [CITED: spec lines 933-937]
- **Don't invent offers -- use theirs.** Kennedy rule: extract their actual offers from the website. Only generate fallback offers if none found. [CITED: spec line 703]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Website scraping | Custom HTTP + BeautifulSoup scraper | Playwright headless Chromium | JS-rendered sites (React, Angular) won't work with simple HTTP; spec mandates Playwright [CITED: spec line 696-708] |
| HTML to structured data | Regex or manual DOM parsing | Claude with raw HTML input | Claude handles messy HTML better than any rule-based parser; adaptable without code changes [CITED: spec line 697-708] |
| EXIF stripping | Manual binary manipulation | Pillow `Image.open()` + re-save | EXIF is complex (100+ tags, embedded thumbnails); Pillow handles edge cases [ASSUMED] |
| OAuth 2.0 flow | Custom token management | google-auth-oauthlib | Token refresh, error handling, consent screen -- all handled [CITED: developers.google.com/my-business/content/oauth-setup] |
| Image quality scoring | Custom ML model | Claude vision + heuristic scoring | Claude can assess image quality from alt text, context, size; no ML infrastructure needed [ASSUMED] |
| Review excerpting | Custom NLP truncation | Claude with word-count constraint | Claude preserves meaning while cutting; rule-based truncation breaks sentences [VERIFIED: test_ai_models.py review tests show Claude does this well] |

**Key insight:** The entire data extraction + content generation pipeline relies on Claude as the "intelligence layer." This means the prompts ARE the product -- invest heavily in prompt quality, not in building custom parsing/scoring/generation logic.

## Common Pitfalls

### Pitfall 1: Playwright in Docker on Railway
**What goes wrong:** Playwright fails to launch Chromium with "missing executable" errors even after `playwright install`
**Why it happens:** System dependencies (libgbm, libnss3, libatk-bridge2.0) not installed; Railway memory limits too low for browser
**How to avoid:** Use `playwright install --with-deps chromium` in Dockerfile (installs browser + system deps). Set `NODE_OPTIONS=--max-old-space-size=4096` environment variable. Allocate at least 1GB memory on Railway. [CITED: docs.railway.com/guides/playwright]
**Warning signs:** Build succeeds but scrape endpoint returns 500; container OOM kills

### Pitfall 2: Google Business Profile API OAuth Complexity
**What goes wrong:** OAuth consent screen requires Google verification for production; setup takes weeks not hours
**Why it happens:** GBP API requires OAuth consent screen with homepage/privacy/TOS links; apps accessing sensitive scopes need Google verification review
**How to avoid:** Start OAuth setup early (it can take 1-4 weeks for verification). Begin with "Testing" mode (100 users, no verification needed). Use the `https://www.googleapis.com/auth/business.manage` scope. Store refresh tokens securely (encrypted in DB, never in client). [CITED: developers.google.com/my-business/content/oauth-setup]
**Warning signs:** OAuth works in development but fails in production; "unverified app" warning blocks customers

### Pitfall 3: Scrape Reliability Is ~60-70% (Spec Acknowledges This)
**What goes wrong:** Assuming scraping always works; building UI that requires scraped data
**Why it happens:** Bot protection (Cloudflare, reCAPTCHA), Facebook-only businesses, broken sites, no website at all
**How to avoid:** Build the manual fallback flow FIRST. Show customer what was found vs missing with checkmarks/X marks. Scrape is a convenience shortcut, not a requirement. [CITED: spec lines 916-923]
**Warning signs:** Customers stuck at "scanning your website..." with no way forward

### Pitfall 4: AI Generation Timeout Blocking the Wizard
**What goes wrong:** Customer clicks from Step 2 to Step 3 and sees a loading spinner while AI generates content
**Why it happens:** AI generation not pre-triggered; or pre-generation failed silently
**How to avoid:** Kick off generation when Step 1 completes (background thread). Cache results. If cache miss on Step 3 load, show brand kit defaults immediately, swap AI text in when ready (progressive enhancement). 10-second timeout on every AI call with fallback text. [CITED: spec lines 939-956]
**Warning signs:** Step 3 takes >2 seconds to load; customer sees "Generating your postcard..."

### Pitfall 5: Claude Prompt Drift
**What goes wrong:** Prompts that work in testing produce inconsistent results in production
**Why it happens:** Not pinning model version; prompt relies on implicit behavior; no structured output validation
**How to avoid:** Pin `claude-sonnet-4-20250514` (already done in chatbot). Validate JSON response structure before using. Log raw responses for debugging. Include explicit format examples in every prompt. [VERIFIED: chat.py pins model version]
**Warning signs:** Occasional malformed JSON responses; inconsistent headline quality

### Pitfall 6: Google Review Privacy Violations
**What goes wrong:** Displaying full reviewer names or showing deleted reviews
**Why it happens:** Not transforming reviewer names on ingest; not refreshing review cache
**How to avoid:** Transform to "First name + last initial" on server before storage (GREV-04). Refresh reviews on a schedule and on-demand. On refresh, remove reviews no longer returned by API. [CITED: spec lines 736-739, 779-782]
**Warning signs:** Legal complaint from reviewer; stale reviews appearing months after deletion

## Code Examples

### Website Scrape Service (Server)
```python
# Source: pattern derived from spec lines 696-708 + existing brand_kit.py mock_scrape
import asyncio
from playwright.async_api import async_playwright
from anthropic import Anthropic

_claude = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

async def scrape_website(url: str) -> dict:
    """Scrape a website and extract structured business data via Claude."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=15000)
            
            # Get full page content
            html_content = await page.content()
            title = await page.title()
            
            # Get all image URLs with context
            images = await page.evaluate("""() => {
                return Array.from(document.images).map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    context: img.closest('section,div,article')?.textContent?.slice(0,200) || ''
                })).filter(img => img.width > 200 && img.height > 200);
            }""")
            
        finally:
            await browser.close()
    
    # Claude extracts structured data
    extraction = _claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system="Extract business information from this website HTML. Return ONLY valid JSON.",
        messages=[{
            "role": "user",
            "content": f"Extract from this website:\n\nTitle: {title}\n\nHTML (first 50K chars):\n{html_content[:50000]}\n\n"
                       f"Images found: {json.dumps(images[:20])}\n\n"
                       "Return JSON with: businessName, phone, address, services (array), "
                       "currentOffers (array), guarantees (array), certifications (array), "
                       "yearsInBusiness (number or null), brandColors (array of hex codes from CSS), "
                       "logoUrl (best candidate), topPhotos (array of {{url, alt, score 1-100, reason}})"
        }],
    )
    
    return json.loads(extraction.content[0].text)
```
[VERIFIED: Playwright async API pattern; Claude call matches chat.py pattern]

### AI Headline Generation (Server)
```python
# Source: prompts validated in test_ai_models.py; format matches spec lines 804-812
HEADLINE_SYSTEM = """You are an expert direct mail copywriter trained in Caples (35 formulas), 
Halbert (specific > clever, local > generic), Gendusa (home services postcard testing), 
and Kennedy (goal-aligned messaging).

Return ONLY valid JSON. No markdown fences."""

def generate_headlines(
    business_name: str, service_type: str, goal_type: str,
    location: str, recipient_type: str, card_purpose: str,
) -> list[dict]:
    prompt = f"""Generate 3 postcard headline options for:
- Business: {business_name}
- Service: {service_type}
- Campaign goal: {goal_type}
- Location: {location}
- Recipient: {recipient_type}
- Card purpose: {card_purpose} (offer/proof/last_chance)

RULES:
- 8 words max per headline
- Specific beats clever ("{location}" > "Your Area")
- Each headline uses a DIFFERENT Caples formula
- Goal-aware: neighbor=social proof, seasonal=urgency, storm=news, win-back=re-engage

Return JSON:
{{"headlines": [{{"text": "...", "formula": "question|news|curiosity|command|testimonial", "reason": "why this works"}}]}}"""

    raw = call_model(prompt, system=HEADLINE_SYSTEM)
    return json.loads(raw)["headlines"]
```
[VERIFIED: prompt structure matches test_ai_models.py headline tests]

### Google Reviews OAuth Flow (Server)
```python
# Source: developers.google.com/my-business/content/oauth-setup
from google_auth_oauthlib.flow import Flow

SCOPES = ["https://www.googleapis.com/auth/business.manage"]

def create_oauth_flow(redirect_uri: str) -> Flow:
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.environ["GOOGLE_CLIENT_ID"],
                "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )
    return flow

def fetch_reviews(credentials, account_id: str, location_id: str) -> list[dict]:
    from googleapiclient.discovery import build
    service = build("mybusiness", "v4", credentials=credentials)
    response = service.accounts().locations().reviews().list(
        parent=f"accounts/{account_id}/locations/{location_id}"
    ).execute()
    return response.get("reviews", [])
```
[CITED: developers.google.com/my-business/content/review-data]

### Client-Side API Calls (New)
```typescript
// Source: matches existing api/brandKit.ts pattern
import { postJson, get } from "@/api/http";

interface GenerateContentRequest {
  goal_type: string;
  card_purposes: string[];  // ["offer", "proof", "last_chance"]
  recipient_type: string;
}

interface GeneratedContent {
  headlines: Array<{ text: string; formula: string; reason: string }>;
  offers: Array<{ text: string; reason: string }>;
  selectedReview: { quote: string; reviewerName: string; rating: number; reason: string } | null;
  templateRecommendation: string;
  reason: string;
}

export async function generateContent(
  data: GenerateContentRequest
): Promise<GeneratedContent> {
  return postJson<GeneratedContent>("/api/brand-kit/generate", data);
}

export async function pollScrapeStatus(): Promise<BrandKit> {
  return get<BrandKitResponse>("/api/brand-kit").then(toBrandKit);
}
```
[VERIFIED: matches existing api/brandKit.ts patterns]

### EXIF Stripping (Server)
```python
# Source: Pillow documentation + security best practice
from PIL import Image
from io import BytesIO

def strip_exif(image_bytes: bytes) -> bytes:
    """Strip all EXIF metadata from image bytes. Returns clean image."""
    img = Image.open(BytesIO(image_bytes))
    # Create new image without metadata
    clean = Image.new(img.mode, img.size)
    clean.putdata(list(img.getdata()))
    
    output = BytesIO()
    clean.save(output, format=img.format or "JPEG", quality=95)
    return output.getvalue()
```
[ASSUMED: standard Pillow EXIF stripping pattern]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google My Business API v4 (some parts) | Business Information API v1 + Performance API | 2022-2023 | Reviews endpoint still on v4, still active [CITED: developers.google.com/my-business/content/sunset-dates] |
| BeautifulSoup for scraping | Playwright headless browser | 2020+ | JS-rendered sites require real browser; most home services sites use WordPress/Wix/Squarespace with heavy JS |
| Generic AI prompts | Domain-specific prompt frameworks (Caples/Halbert/Kennedy) | PostCanary spec decision | Dramatically better headline quality vs generic "write a headline" prompts [VERIFIED: test_ai_models.py shows quality] |
| Celery for background tasks | ThreadPoolExecutor (current stack) | Current | Celery/Redis not yet in the stack; ThreadPoolExecutor sufficient for 1-2 concurrent AI calls per request |

**Deprecated/outdated:**
- My Business Q&A API: discontinued November 3, 2025 [CITED: developers.google.com/my-business/content/qanda/change-log]
- My Business Performance API v4.9: deprecated, replaced by new Performance API [CITED: developers.google.com/my-business/content/sunset-dates]
- Reviews API v4: still active and supported (NOT deprecated) [VERIFIED: sunset-dates page does not list reviews as deprecated]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pillow is sufficient for EXIF stripping (vs piexif or exiftool) | Standard Stack | LOW -- Pillow is standard; worst case, swap library |
| A2 | ThreadPoolExecutor is sufficient vs Celery for AI background tasks | Architecture | MEDIUM -- if many concurrent users, ThreadPoolExecutor could bottleneck; Celery migration is well-understood |
| A3 | Claude vision is not needed for photo quality scoring (text context sufficient) | Don't Hand-Roll | LOW -- can add vision later if needed; alt text + HTML context usually sufficient for home services sites |
| A4 | Google OAuth consent screen verification can complete within phase timeline | Common Pitfalls | HIGH -- if verification takes 4+ weeks, it blocks GREV-01; mitigate with "Testing" mode (100 users) |
| A5 | Existing `python:3.11-slim` Docker image can run Playwright with added deps | Architecture | MEDIUM -- may need to switch to `python:3.11-bookworm` or Playwright's official image for system libs |

## Open Questions

1. **Railway Memory for Playwright**
   - What we know: Chromium needs 500MB-1GB; Railway default may be lower
   - What's unclear: Current Railway plan's memory limit; whether Dustin has configured this
   - Recommendation: Check with Dustin on Railway plan limits. If too low, consider browserless.io as an alternative (connect Playwright to remote browser)

2. **Google Cloud Project for GBP API**
   - What we know: Need a Google Cloud project with OAuth consent screen, GBP API enabled
   - What's unclear: Does PostCanary already have a Google Cloud project? (Google Maps geocoding uses an API key -- may already exist)
   - Recommendation: Check if existing Google Cloud project exists from Maps API integration. If so, add GBP API to it. If not, create one early -- consent screen verification can block.

3. **Celery vs ThreadPoolExecutor Long-Term**
   - What we know: Spec says "Flask + Celery + Redis" for production. Current stack uses ThreadPoolExecutor.
   - What's unclear: Whether Dustin plans to add Celery/Redis to infra for this phase
   - Recommendation: Build with ThreadPoolExecutor now (matches existing pattern). Design the service layer so swapping to Celery later is a config change, not a rewrite.

4. **Image Storage**
   - What we know: Scraped images need to be stored somewhere. Current server has `/media` mount for avatars.
   - What's unclear: Whether to store scraped photos on the server filesystem, S3, or Cloudflare R2
   - Recommendation: Use the existing `/media` volume mount for now (same as avatars). Store photo URLs in brand kit JSONB. Migrate to S3/R2 later when scale requires it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.11 | Server services | Yes | 3.11.9 (local), 3.11-slim (Docker) | -- |
| Node.js | Client dev | Yes | v22.20.0 | -- |
| Docker | Local dev + Railway | Yes | 29.2.0 | -- |
| PostgreSQL | Data storage | Yes | 16 (Docker) | -- |
| Playwright | Website scraping | No (not installed yet) | -- | Install via pip + playwright install |
| Pillow | EXIF stripping | No (not in requirements.txt) | -- | pip install Pillow |
| google-api-python-client | GBP API | No (not in requirements.txt) | -- | pip install |
| Anthropic SDK | AI generation | Yes | >=0.40.0 | Already installed |
| Celery + Redis | Background tasks (spec vision) | No | -- | Use ThreadPoolExecutor (already works) |

**Missing dependencies with no fallback:**
- None -- all missing dependencies can be installed

**Missing dependencies with fallback:**
- Celery/Redis: Use ThreadPoolExecutor (existing pattern, proven in insights.py)

## Project Constraints (from CLAUDE.md and PROJECT.md)

**Stack constraints:**
- Vue 3 + Composition API + Pinia + Tailwind + Naive UI (client) [VERIFIED: PROJECT.md]
- Flask + SQLAlchemy + PostgreSQL (server) [VERIFIED: PROJECT.md]
- Blueprint > Service > DAO pattern for server endpoints [VERIFIED: existing code structure]
- Anthropic Claude for AI generation (already integrated) [VERIFIED: chat.py]
- Cookie-based sessions, not JWT [VERIFIED: postcanary.md]

**Workflow constraints:**
- Feature branches only -- no main merges without Dustin [VERIFIED: PROJECT.md]
- Push remote only with Drake's permission [VERIFIED: CLAUDE.md]
- API convention: snake_case in HTTP responses, camelCase in JSONB data blobs [VERIFIED: campaign.ts header comment]
- Test and verify before claiming it works [VERIFIED: CLAUDE.md]

**AI generation constraints:**
- Model-agnostic interface with config switch (Ronacher recommendation) [CITED: spec line 961]
- 10-second timeout on every AI call with fallback text [CITED: spec line 952]
- Cache results -- don't regenerate if inputs unchanged [CITED: spec line 954]
- Every AI response includes `reason` field [CITED: spec line 737]

**Security constraints (Hunt):**
- Strip EXIF from all images server-side [CITED: spec line 772]
- Sanitize all text inputs (prevent stored XSS) [CITED: spec line 773]
- Validate uploaded file types server-side [CITED: spec line 774]
- Reviewer names: first name + last initial only [CITED: spec line 736]
- org_id on every query (data isolation) [CITED: postcanary.md line 231]

## Sources

### Primary (HIGH confidence)
- Server codebase: `app/services/insights.py`, `app/blueprints/chat.py`, `app/services/brand_kit.py` -- existing Claude + background task patterns
- Server codebase: `test_ai_models.py`, `ai_model_comparison.json` -- validated AI prompts and outputs
- Client codebase: `src/composables/usePostcardGenerator.ts`, `src/types/campaign.ts`, `src/api/brandKit.ts` -- interfaces to match
- Spec: `postcanary-v1-build-decisions.md` lines 574-966 -- locked design decisions

### Secondary (MEDIUM confidence)
- [Railway Playwright Guide](https://docs.railway.com/guides/playwright) -- Docker setup, memory requirements
- [Google Business Profile Reviews API](https://developers.google.com/my-business/content/review-data) -- endpoint structure, fields
- [Google Business Profile API Sunset Dates](https://developers.google.com/my-business/content/sunset-dates) -- reviews API still active
- [Google OAuth Setup](https://developers.google.com/my-business/content/oauth-setup) -- consent screen requirements

### Tertiary (LOW confidence)
- Playwright Python pip install process -- common knowledge but not verified against Railway specifically
- Pillow EXIF stripping reliability -- widely used but not tested in this codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- existing codebase establishes all patterns; new libraries are well-documented
- Architecture: HIGH -- follows existing Blueprint > Service > DAO; background tasks match insights.py
- Pitfalls: HIGH -- spec explicitly documents scrape reliability (~60-70%), timeout handling, privacy rules
- Google Reviews API: MEDIUM -- API is active but OAuth verification timeline is uncertain

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days -- stable domain, main risk is Google API changes)
