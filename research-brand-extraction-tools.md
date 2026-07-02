# Brand Asset Extraction Tools Research

**Purpose:** Evaluate APIs and tools for automatically extracting brand assets from home services company websites (plumbers, HVAC, roofers) to generate personalized direct mail postcards.

**Target site profile:** Small WordPress/Wix/Squarespace sites with a logo in the header, a few project photos, basic contact info. NOT enterprise sites.

---

## 1. LOGO EXTRACTION APIs

### Brandfetch

- **What it does:** Full brand kit API -- logos (multiple formats including SVG), brand colors (hex), fonts, and metadata. 44M+ brands indexed. Drop-in Clearbit replacement.
- **Logo quality:** Returns multiple logo variants (icon, symbol, main logo), dark/light theme variants. SVG and PNG available. Logos are curated/verified, not raw scraped.
- **Pricing:**
  - Free Logo API: 500K requests/mo (just logos via CDN URL, like Clearbit)
  - Free Brand API: 1,000 requests/mo (full brand kit with colors, fonts)
  - Business Brand API: $99/mo for 10,000 requests (full brand kit)
  - Enterprise: Custom pricing
- **Print-ready?** SVGs are resolution-independent (perfect for print). PNGs are web-resolution -- you would need to upscale for 300 DPI print.
- **Small business coverage:** This is the CRITICAL weakness. Brandfetch indexes 44M+ brands but skews toward known companies. A local plumber in Tulsa ("Acme Plumbing LLC") is very unlikely to be in their database. Brandfetch is best for recognizable brands, not mom-and-pop shops.
- **Verdict for your use case: POOR for primary extraction.** Most of your customers won't be in their database. Could be a fallback or supplement, not the primary tool.

### Brand.dev (formerly Context.dev)

- **What it does:** Real-time brand identity extraction from any domain -- logos, colors, fonts, metadata, industry classification. Extracts on-demand rather than from a pre-built database.
- **Key advantage:** Because it extracts in real-time from the actual website, it works for ANY business with a website, including small local plumbers.
- **Pricing:**
  - Starter: $29/mo for 1,000 API calls
  - Growth: $99/mo for 15,000 API calls
  - Scale: $949/mo for 250,000 API calls
  - No free tier
- **Response time:** ~250ms (slower than database lookups because it's crawling live)
- **Print-ready?** Returns logo URLs in whatever format the website has. If the site has an SVG logo, you get SVG. If it's a 200px PNG, that's what you get.
- **Verdict for your use case: GOOD candidate.** Real-time extraction means it works for any website. The $29-99/mo price is reasonable for a SaaS.

### BrandsAPI

- **What it does:** Brand data API with logos, colors, fonts, metadata. Claims 99.97% accuracy via multi-source verification (official brand guidelines, press kits, social accounts, websites).
- **Pricing:**
  - Free: 100 calls/mo
  - Pro: $50/mo for 10,000 calls (all features including webhooks)
- **Response time:** 94ms average
- **Small business coverage:** 44M+ brands indexed. Same limitation as Brandfetch -- database-driven, so local plumbers likely missing.
- **Verdict for your use case: POOR for primary.** Same database coverage problem as Brandfetch.

### Logo.dev (Clearbit successor)

- **What it does:** Pure logo retrieval. "Hundreds of millions" of logos. Domain-based lookup via CDN URL. No colors, no fonts, no metadata -- just logos.
- **Pricing:**
  - Free: 150K requests/mo
  - Pro: $40/mo for 150K requests
  - Business: $120/mo for 750K requests
- **Response time:** ~20ms via global CDN
- **Print-ready?** Web-optimized images only.
- **Small business coverage:** Broadest raw coverage, but still domain-database driven.
- **Verdict for your use case: POOR alone.** Logo-only, no brand colors/fonts, and coverage for tiny local businesses is still uncertain.

### Quikturn

- **What it does:** 17M+ logos, strong in finance/trading (ticker search, ISIN). Not relevant for home services.
- **Verdict for your use case: NOT RELEVANT.** Finance-focused.

---

## 2. WEBSITE BRAND EXTRACTION (Real-time, from any site)

These are the tools that will actually work for "Bob's Plumbing in Tulsa" -- they scrape the live website rather than looking up a database.

### Firecrawl Branding Format (v2) -- TOP RECOMMENDATION

- **What it does:** Add `formats: ['branding']` to any Firecrawl scrape call and get structured brand data: logo URL, color palette (hex), typography (font families), spacing scale, and UI component styles. All from a single API call.
- **Key strengths:**
  - Works on ANY website, including Wix, Framer, Squarespace, WordPress
  - V2 specifically improved logo detection for edge cases: logos in background images, unusual HTML structures, modern site builders
  - Handles the exact target profile (small business WordPress/Wix sites)
  - You already have Firecrawl in your stack
  - Also returns markdown content in the same call, so you can extract business data simultaneously
- **Pricing:** Firecrawl pricing (you're already using it):
  - Free: 500 credits
  - Hobby: $19/mo for 3,000 credits
  - Standard: $99/mo for 100,000 credits
  - Growth: $399/mo for 500,000 credits
  - Each scrape = 1 credit
- **Print-ready?** Returns the logo URL as-is from the site. If the site has a 150px PNG logo, that's what you get. No upscaling or format conversion built in.
- **Verdict for your use case: STRONG PRIMARY CHOICE.** Works on any site, extracts logo + colors + fonts in one call, handles Wix/WordPress edge cases, and you're already using Firecrawl. The branding format was literally built for this use case.

### Apify Website Brand Extractor

- **What it does:** Multiple community-built Apify actors for brand extraction:
  - `ottosoftware/website-brand-extractor` -- logos, brand colors, fonts, social links, metadata, OG/Twitter data
  - `eiv/website-brand-extractor-pay-per-event` -- same but pay-per-event pricing
  - `solutionssmart/brand-dna` -- "Brand DNA" extraction: colors, fonts, tone, positioning, marketing templates. Uses deterministic heuristics (no AI hallucinations)
  - `jotunweb/fetch-branding` -- logos, colors, metadata, social links
- **Pricing:** Apify platform pricing:
  - Free: $5/mo in credits
  - Starter: $49/mo
  - Scale: $499/mo
  - Actors charge per-run or per-event on top of platform fee
- **Print-ready?** Same limitation -- returns whatever the website has.
- **Verdict for your use case: GOOD ALTERNATIVE to Firecrawl branding.** Multiple actor options. The "Brand DNA" actor is interesting for marketing copy generation. But adds another vendor when Firecrawl already does this.

### Sivi.ai Extract Brand API

- **What it does:** Queue-based API that extracts brand assets, colors, and identity elements from a URL. Returns a requestId for polling. Designed specifically to feed into their design generation engine.
- **Pricing:** Not publicly listed (enterprise/contact sales)
- **Verdict for your use case: INTERESTING but opaque pricing.** Worth investigating if you want to combine brand extraction + postcard design generation in one vendor.

---

## 3. STRUCTURED BUSINESS DATA EXTRACTION

### Google Places API (New)

- **What it does:** Official Google API for business data. Returns:
  - Business name, address, phone number
  - Website URL
  - Google rating + review count
  - Business hours
  - Business category/type
  - Photos (user-uploaded and business-uploaded to Google)
  - AI-powered review summaries (new feature)
- **Pricing:** Pay-per-request:
  - Place Details: $17 per 1,000 requests (basic fields)
  - Place Details: $25-35 per 1,000 requests (advanced fields including reviews)
  - Place Photos: $7 per 1,000 requests
  - Text Search: $32 per 1,000 requests
- **Photo quality:** Google Places photos are typically decent resolution (up to 4800px on the longest side). These are photos customers and businesses upload to Google -- real photos, not stock.
- **Key value:** Google rating, review count, and review summaries are GOLD for postcard marketing ("4.9 stars on Google!"). This data doesn't exist on most small business websites.
- **Verdict for your use case: ESSENTIAL.** The Google rating/reviews alone justify the cost. Also provides verified address, phone, hours. Use Place Search to find the business by name + location, then Place Details for the data.

### Google Knowledge Graph API

- **What it does:** Returns structured data about known entities (companies, people, places). Free with API key (limited to 100K requests/day).
- **Limitation:** Only works for entities Google has indexed as "knowledge entities." Most local plumbers won't have a Knowledge Graph entry.
- **Verdict for your use case: SKIP.** Google Places API is far more useful for local businesses.

### Firecrawl Structured Extraction (JSON mode)

- **What it does:** Scrape any page and extract structured JSON using a schema you define. You could define a schema like:
  ```json
  {
    "phone": "string",
    "address": "string",
    "services": ["string"],
    "certifications": ["string"],
    "years_in_business": "number",
    "guarantees": ["string"],
    "current_offers": ["string"]
  }
  ```
  And Firecrawl will extract matching data from the page content using AI.
- **Pricing:** Same Firecrawl pricing as above (1 credit per scrape).
- **Key strength:** Can extract ANY information that's on the website, not limited to a predefined set of fields. Services, certifications, guarantees, promotional offers -- all extractable.
- **Verdict for your use case: ESSENTIAL complement to Google Places.** Google gives you the verified basics (address, phone, rating). Firecrawl JSON extraction gets you the marketing copy (services list, certifications, guarantees, current promotions, years in business).

### Diffbot

- **What it does:** AI-powered structured data extraction. Automatically identifies and extracts entities (articles, products, organizations) from web pages. Also has a Knowledge Graph of 20B+ entities.
- **Pricing:** Expensive:
  - Startup: $299/mo for 10,000 API calls
  - Plus: $899/mo for 50,000 API calls
  - Enterprise: Custom
- **Quality:** Excellent for structured data, but massively overkill and overpriced for your use case.
- **Verdict for your use case: SKIP.** Firecrawl JSON extraction does the same thing for 1/10th the price for your use case.

### Jina AI Reader

- **What it does:** Converts any URL to clean markdown or structured data. Prefix any URL with `r.jina.ai/` to get markdown. Good for feeding web content to LLMs.
- **Pricing:**
  - Free: 1M tokens/day
  - Standard: From $9.90/mo
- **Quality:** Good at content extraction, but less structured than Firecrawl's JSON mode. Better for "give me the page as text" than "extract these specific fields."
- **Verdict for your use case: DECENT but redundant.** Firecrawl already does this better with structured JSON extraction. Could be a free fallback.

---

## 4. HIGH-QUALITY PHOTO EXTRACTION

### From the business website

- **Challenge:** Small business sites typically have:
  - A logo (header, usually small/web-optimized)
  - 3-10 project photos (often compressed for web, 800-1200px)
  - Maybe team photos
  - Often stock photos mixed in with real photos
- **Approach:** Firecrawl scrape with `formats: ['links', 'markdown']` to get all image URLs from the page. Then filter and download the highest resolution versions.
- **Stock photo detection:** This is a real problem. Options:
  - **TinEye API** -- reverse image search, will match stock photo databases. $200/mo for 5,000 searches.
  - **Google Vision API** (Cloud Vision) -- can detect "web entities" for an image, which would show if it's on stock sites. $1.50 per 1,000 images.
  - **Heuristic approach** -- check image filenames (stock photos often have names like `shutterstock_12345.jpg`, `istock-photo-123.webp`, `AdobeStock_456.jpeg`). Check for watermark patterns. Check image metadata (EXIF) for stock agency data.
  - **AI classification** -- send images to an LLM (Claude vision) and ask "Is this a stock photo or a real business photo?" Surprisingly effective.
- **Print quality issue:** Web images are 72-150 DPI. Print needs 300 DPI. A 1200px wide web image prints at only 4 inches wide at 300 DPI. Options:
  - **AI upscaling APIs:** Topaz, Real-ESRGAN, Stability AI upscaler. Can 2-4x resolution convincingly.
  - **Accept the limitation:** Use photos at the size they can support at 300 DPI and design around it.

### From Google Places

- **Google Places Photos API:** Returns photos uploaded to the Google Business Profile. These are often higher quality than website photos (customers upload full-resolution phone photos). Max dimension 4800px.
- **Pricing:** $7 per 1,000 photo requests.
- **Quality:** Unpredictable -- some businesses have great Google photos, others have blurry phone shots. But they're always REAL photos, not stock.
- **Verdict: GOOD supplementary source.** Especially for "completed work" and team photos that customers uploaded.

### From social media

- **Facebook/Instagram Business Pages:** Often have the best project photos. But API access is restricted and scraping violates ToS.
- **Verdict: AVOID** for automated extraction. Legal/ToS risk.

---

## 5. PRINT-READY ASSET PIPELINE

None of these APIs produce truly print-ready assets (300 DPI, CMYK, bleed). You need a post-processing pipeline:

### Logo Processing Pipeline
1. **Extract logo** via Firecrawl branding format or Brand.dev
2. **If SVG:** Perfect -- SVG is resolution-independent. Convert to high-res PNG/PDF for print at any size.
3. **If PNG/JPG:**
   - Check resolution. If >= 1000px wide, usable for most postcard logo placements.
   - If < 500px: Use AI upscaling (Real-ESRGAN, Stability AI) for 2-4x enlargement.
   - For transparent background: Use background removal API (remove.bg API, $0.14/image on subscription).
4. **Color space:** Convert RGB to CMYK for print using a library like Sharp (Node.js) or Pillow (Python).

### Photo Processing Pipeline
1. **Extract photos** from website (Firecrawl) + Google Places Photos API
2. **Filter stock photos** using filename heuristics + Google Vision API web detection
3. **Rank by quality:** Resolution, sharpness, relevance (AI classification)
4. **Upscale if needed:** AI upscaling for photos below 300 DPI at target print size
5. **Color correction:** Auto-levels, CMYK conversion

### Color Extraction
- Firecrawl branding format returns hex colors from the CSS
- For print: Convert hex (RGB) to CMYK and Pantone equivalent
- Libraries: `color-convert` (Node.js), `colormath` (Python)

---

## 6. RECOMMENDED STACK

### Primary extraction (runs on every new customer signup):

| Step | Tool | What you get | Cost per customer |
|------|------|-------------|-------------------|
| 1. Brand extraction | **Firecrawl** (branding format) | Logo URL, colors (hex), fonts, spacing | 1 credit (~$0.001) |
| 2. Business data from site | **Firecrawl** (JSON extraction) | Services, certifications, guarantees, offers, years in business | 1 credit (~$0.001) |
| 3. Google business data | **Google Places API** | Rating, review count, verified address/phone, hours, Google photos | ~$0.025-0.04 |
| 4. Logo enhancement | **remove.bg** (if needed) + AI upscaling | Transparent, high-res logo | ~$0.05-0.15 |
| 5. Photo filtering | **Heuristic + Claude Vision** | Real photos separated from stock | ~$0.01-0.05 |

**Total cost per customer: ~$0.10-0.25**

### Fallback / enrichment layer:

| Tool | When to use | Cost |
|------|-------------|------|
| **Brand.dev** | If Firecrawl branding extraction fails or returns incomplete data | $0.03/call |
| **Brandfetch** | If the business is a franchise or known brand (e.g., Mr. Rooter, ServiceMaster) | Free for logos |
| **Google Vision API** | For stock photo detection when heuristics are inconclusive | $0.0015/image |

### Tools to SKIP for your use case:

| Tool | Why skip |
|------|----------|
| **Diffbot** | $299/mo minimum, overkill for extracting data from simple small business sites |
| **Quikturn** | Finance-focused logo API, irrelevant |
| **ScrapingBee / ScrapingAnt** | Generic proxy/scraping services -- you don't need anti-bot bypass for small business WordPress sites. Firecrawl handles rendering. |
| **Google Knowledge Graph** | Local plumbers won't have Knowledge Graph entries |

---

## 7. CRITICAL GAPS AND RISKS

### Gap 1: Logo quality from small sites
Many small business websites have tiny, low-resolution logos (150-300px). Some embed the logo as part of a larger header image. The logo you extract may not be print-quality without significant processing.

**Mitigation:** AI upscaling + background removal pipeline. Also check the site's favicon (sometimes higher quality than the visible logo). Check Open Graph images (sometimes contain logo at higher res).

### Gap 2: Some businesses have terrible websites
A plumber's "website" might be a single GoDaddy page with a phone number and a stock photo. Minimal brand assets to extract.

**Mitigation:** Fall back to Google Business Profile data (Google Places API). Many small businesses invest more in their Google profile than their website. Also scrape their Facebook page metadata (name, profile picture, cover photo) via the URL without API -- the og:image tags are public.

### Gap 3: Stock photo contamination
Many home services sites are 80%+ stock photos. Your photo extraction pipeline will need aggressive filtering.

**Mitigation:** Multi-signal approach: filename patterns, EXIF metadata, reverse image search (TinEye), AI classification. Default to Google Places photos (always real) when website photos are suspect.

### Gap 4: Font licensing
Extracting font NAMES is easy. Actually USING those fonts in generated postcards requires a license. Most small businesses use Google Fonts (free) or common system fonts, but some use premium fonts.

**Mitigation:** Map extracted font names to your licensed font library. Use closest licensed alternative when exact match unavailable. Google Fonts covers ~80% of cases for small business sites.

### Gap 5: CMYK color shift
RGB colors from websites look different when converted to CMYK for print. Bright blues and greens shift noticeably.

**Mitigation:** Build a CMYK preview into your postcard builder so customers can approve colors before print. Use a professional ICC profile for conversion.

---

## 8. IMPLEMENTATION PRIORITY

**Phase 1 (MVP -- do this first):**
- Firecrawl branding format for logo + colors + fonts
- Firecrawl JSON extraction for business data (services, certifications, etc.)
- Google Places API for rating, reviews, verified contact info
- Basic logo processing (download, check resolution, background removal if needed)

**Phase 2 (Enhancement):**
- Photo extraction pipeline with stock photo filtering
- AI upscaling for low-res logos
- Google Places photos as supplementary image source
- Brand.dev as fallback for failed Firecrawl extractions

**Phase 3 (Polish):**
- CMYK color conversion with preview
- Font matching to licensed font library
- Social media metadata extraction (Facebook og:image, etc.)
- Franchise detection (recognize known brands and use official assets from Brandfetch)
