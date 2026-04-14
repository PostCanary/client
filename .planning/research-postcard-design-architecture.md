# Research: Postcard Design Architecture for Variable Data at Production Scale

**Date:** 2026-04-09  
**Purpose:** Architecture decision for how PostCanary produces professional postcard designs with variable customer data  
**Output:** 6x9 postcards, 300 DPI, CMYK print-ready PDF

---

## 1. How Do Lob, Postalytics, PostcardMania, and PostGrid Handle Template Design + Variable Data?

### Lob (Market Leader, VC-backed)

**Template Technology:** HTML + CSS with merge variables (Mustache/Handlebars syntax)

- Templates are plain HTML/CSS with `{{variable_name}}` placeholders
- Supports inline CSS and internal stylesheets (no external stylesheets)
- Merge variables accept strings, numbers, booleans, arrays, objects, null (max 25,000 chars JSON)
- Advanced templating uses Handlebars engine for conditionals, loops, helpers

**Rendering Engine:** WebKit-based (they recommend viewing templates in Safari for the closest visual match to their renderer). This is NOT Chromium/Puppeteer -- it is a WebKit renderer, likely a custom headless WebKit pipeline.

**Key Technical Details:**
- Dimensions for 6x9 postcard: body width 9.25in, height 6.25in (includes 0.125" bleed on all sides, trimmed to 6x9)
- Images must be 300 DPI, hosted at publicly accessible URLs
- RGB only in HTML templates -- Lob's rendering engine does NOT support CMYK in HTML. Colors undergo RGB-to-CMYK conversion during print prep, which can shift hues/saturation
- CMYK is supported only for static PDF uploads
- Absolute positioning recommended (since it is a fixed-size canvas, not responsive)
- JavaScript is supported but comes with caveats
- Font support: Google Fonts, custom fonts via URL, standard PDF fonts

**Design Workflow Options:**
1. Hand-code HTML/CSS (most common for developers)
2. Use Lob's Template Gallery (pre-designed HTML templates with merge variables)
3. Use the **Figma-to-Lob plugin** -- design in Figma, plugin converts to HTML, exports directly to Lob as template. Supports `{{merge_variables}}` in text layers. Auto-hosts static imagery.
4. Use **Templify PDF-to-HTML** integration -- converts existing PDFs into Lob-ready HTML templates
5. Upload static PDFs (no personalization possible)

**API Flow:**
```
POST /v1/postcards
{
  description: "My Postcard",
  to: { address },
  from: { address },
  front: "tmpl_xxx" or "<html>...</html>" or "https://example.com/front.pdf",
  back: "tmpl_xxx" or "<html>...</html>",
  merge_variables: { name: "John", offer: "20% off" },
  size: "6x9"
}
```
Response includes `status: "rendered"` when PDF is ready, with hosted PDF URL for preview.

**Pricing:** Pay per piece mailed (varies by format/volume). No separate template or rendering fees.

### Postalytics

**Template Technology:** Proprietary drag-and-drop editor (web-based WYSIWYG)

- NOT HTML-based for the end user -- visual editor with drag-and-drop text blocks, images, shapes
- Variable data: drag text block, click "Variable Data" in Personalize panel, select field from list
- Variable images: swap images per recipient based on data
- Variable logic: conditional content based on data (e.g., different offers for different segments)
- Supports personalized URLs (pURLs) and QR codes as trackable merge elements
- Pre-built templates in multiple color schemes (White, Red, Green, Blue)

**Rendering:** Generates high-resolution PDF proofs that show exactly what will be printed, including all merged variable data. The editor produces print-ready output internally.

**Design Workflow:**
1. Choose template from library OR create from scratch in editor
2. Customize with drag-and-drop
3. Add variable data fields, QR codes, pURLs
4. Proof template with sample or real data (generates PDF proof)
5. Review multiple proofs to check variable field lengths
6. Accept proof and launch campaign

**API:** REST API for campaigns, contacts, templates. Also has Express Windows for embedded template creation.

**Pricing:** Free tier available. Pay per piece. 3,000+ integrations via Zapier.

### PostcardMania / PCM Integrations

**Template Technology:** Traditional print production (Adobe InDesign) + API with variable data

- PCM Integrations is PostcardMania's API division (same company, same 69,800 sq ft print facility)
- **100% in-house printing** -- no outsourcing to third-party printers
- Templates are designed using professional graphic design tools (InDesign, etc.)
- Variable data: "If you can put it in a spreadsheet, we can personalize your card with it"
- Supports variable: first names, images, dates, colors, QR codes, custom fields
- UNLIMITED variable data options via their API

**Technical Approach:**
- Upload or choose a design in their portal
- Place the API call in your workflow
- Trigger fires (new lead, job completed, etc.)
- PCM prints and mails automatically
- 1 business day turnaround for postcards
- Includes CASS, NCOA, DPV, presort at no additional cost

**Key Differentiator:** This is the PostcardMania that produces the "professional direct mail look" PostCanary is trying to match. They use professional graphic designers + InDesign + industrial printing. The API wraps traditional print production, not HTML rendering.

**API:** REST API with design management, proofing (JPG or PDF), order creation, webhooks for tracking.

**Pricing:** No tech fees, no setup fees, no monthly minimums. Pay per piece mailed. Wholesale pricing available for white-label partners.

### PostGrid

**Template Technology:** HTML templates OR PDF upload

- Create postcards with: HTML content (front/back), template IDs (front/back), or 2-page PDF
- HTML templates with merge variables similar to Lob
- Supports variable data for personalization
- Addresses validated automatically

**API:**
```
POST /print-mail/v1/postcards
{
  to: { address },
  frontTemplate: "template_xxx",
  backTemplate: "template_xxx",
  mergeVariables: { verification_code: "4242" },
  size: "6x4"
}
```

**Pricing:** Pay per piece. API-first platform.

### Summary Table: Platform Comparison

| Feature | Lob | Postalytics | PostcardMania/PCM | PostGrid |
|---------|-----|-------------|-------------------|----------|
| Template format | HTML/CSS | Drag-and-drop editor | InDesign/PDF + API | HTML/CSS or PDF |
| Variable data | Mustache/Handlebars | Visual editor fields | Spreadsheet-based | Merge variables |
| Rendering | WebKit-based | Proprietary | Traditional print | Unknown |
| CMYK support | PDF only (not HTML) | Built-in | Native (print shop) | Unknown |
| Design tools | Figma plugin, gallery | Built-in editor | Professional designers | Template editor |
| Print facility | Network of printers | Third-party network | 100% in-house | Third-party network |
| Turnaround | 3-5 days | 3-7 days | 1-2 days | 2 days |

---

## 2. Production-Grade Approaches for "Beautiful Design + Variable Data"

### Approach A: HTML/CSS Templates Rendered by Headless Browser (Puppeteer/Playwright)

**How it works:**
- Design postcards as HTML/CSS documents with fixed dimensions (e.g., 9.25in x 6.25in with bleed)
- Use absolute positioning for all elements (it is a fixed canvas, not responsive)
- Inject variable data via template engine (Handlebars, EJS, Nunjucks, etc.)
- Render to PDF using headless Chromium (Playwright preferred in 2026)

**2026 Benchmark Data (pdf4.dev):**

| Tool | Simple (Cold) | Complex (Cold) | Simple (Warm) | Complex (Warm) |
|------|--------------|----------------|---------------|----------------|
| Playwright | 42ms | 119ms | 3ms | 13ms |
| Puppeteer | 147ms | 187ms | 48ms | 58ms |
| WeasyPrint | 227ms | 629ms | N/A (no warm) | N/A |

**Making HTML look like professional print (not web pages):**
- Use print-specific CSS: `@page` rules, fixed dimensions in inches, no responsive breakpoints
- Use absolute positioning for every element (like a design canvas)
- Embed custom fonts (Google Fonts or self-hosted .ttf/.woff2)
- Use high-res background images (300 DPI)
- Think in layers: background image layer, overlay/gradient layer, text layer, logo layer
- Use CSS `background-size: cover`, `object-fit: cover` for photos
- Add text shadows, gradients, overlays for the "direct mail" look
- Avoid typical web patterns (borders, box shadows, card layouts)

**Critical Limitation: NO CMYK from Chromium.** Headless Chrome/Playwright outputs RGB PDFs only. You MUST post-process with Ghostscript to convert RGB to CMYK:
```bash
gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
   -sColorConversionStrategy=CMYK \
   -sOutputICCProfile=USWebCoatedSWOP.icc \
   -dOutputFile=output-cmyk.pdf input-rgb.pdf
```

**Production Challenges:**
- Docker image: 300-500MB with Chromium
- Memory: ~150MB per browser + ~30MB per page
- Browser crashes under memory pressure need restart logic
- Concurrency: ~5-10 parallel pages per browser instance before degradation
- Serverless: AWS Lambda 250MB layer limit is tight

### Approach B: PrinceXML / DocRaptor

**How it works:**
- PrinceXML is a commercial HTML-to-PDF engine with superior print features
- DocRaptor is the cloud API wrapping PrinceXML

**Print-specific advantages over Chromium:**
- **Native CMYK support:** `color: cmyk(0, 1, 1, 0)` directly in CSS
- **Bleed and crop marks:** `@page { marks: crop cross; prince-bleed: 0.125in; prince-trim: 0.125in; }`
- **Spot colors:** Named spot colors with `@prince-color` rules
- **Rich black control:** `prince-pdf-color-options: use-true-black` prevents muddy grays
- **PDF/X output:** Supports PDF/X-1a (CMYK only, print production standard) and PDF/X-4
- **ICC color profiles:** Output intent profiles for consistent color
- **Advanced typography:** Hyphenation, widows/orphans, multi-column, footnotes
- **Font embedding:** Full support
- **PDF compression:** Built-in

**Example for a postcard with bleed:**
```css
@page {
  size: 6.25in 9.25in;  /* trim size + bleed */
  margin: 0;
  marks: crop cross;
  prince-bleed: 0.125in;
  prince-trim: 0.125in;
}
body {
  color: cmyk(0, 0, 0, 1);  /* true black */
}
```

**Cost:** PrinceXML license starts ~$3,800 for server. DocRaptor API is pay-per-document.

**Verdict:** This is the "correct" tool for print-ready PDF from HTML. But expensive and still requires HTML/CSS design skill.

### Approach C: WeasyPrint (Python)

- Pure Python renderer, no browser engine
- Smallest output files (8KB vs 16KB for simple docs)
- No JavaScript support, no warm mode
- 75x slower than warm Playwright
- Limited modern CSS support (Grid/Flexbox edge cases)
- NO native CMYK -- same Ghostscript post-processing needed
- Good for: Python shops with simple templates, low volume

### Approach D: Template-Based Image/PDF Generation APIs

**These are purpose-built for the "design template + variable data" problem:**

#### Abyssale (Best for Print)
- **Visual editor** for creating templates with dynamic layers
- **Native CMYK support** with ICC profiles (ISO Coated v2, US Web Coated SWOP, etc.)
- **Print-specific design type:** `printer` and `printer_multipage` templates
- Outputs: CMYK PDF at 300 DPI with bleed zones and crop marks
- Vector QR codes (SVG in PDF, perfectly sharp)
- True CMYK black handling
- Multi-page PDF stitching (front+back in one file)
- Async API with webhooks for generation status

**API Example:**
```json
POST /async/banner-builder/{designId}/generate
{
  "template_format_names": ["postcard"],
  "elements": {
    "text_0": { "payload": "20% OFF", "color": "cmyka(0,0,0,100,100)" },
    "image_0": { "image_url": "https://..." }
  },
  "print": {
    "display_crop_marks": true,
    "color_profile": "0e0355e6-2931-4c83-92f2-64db9f5ddffc"
  },
  "callback_url": "https://api.myapp.com/webhooks/pdf-ready"
}
```

**Pricing (March 2026):**
- Start: $12-15/seat/month for 150 generations
- Per-image cost: ~$0.08 at base tier
- Add-on credits: $0.01 each (non-expiring)
- Suite plan required for print PDF generation

#### Bannerbear
- Established since 2019, robust API
- Template editor with dynamic text/image layers
- Outputs: PNG, JPEG, PDF, MP4, GIF
- **No native CMYK or print-specific features**
- Good for social media / web images, not ideal for print
- $49/month for 1,000 renders ($0.049/image)
- $149/month for 10,000 renders ($0.015/image)

#### Placid
- Marketing-focused template automation
- Drag-and-drop editor
- Strong no-code integrations (Webflow, WordPress, Airtable)
- Outputs: Image, Video, PDF
- **Limited print-specific features** (no CMYK, no bleed management)
- $19/month for 500 credits ($0.038/image)
- $39/month for 2,500 credits ($0.016/image)
- Unused credits carry over

#### Templated.io
- Clean drag-and-drop editor
- Can import Canva designs
- Image, PDF, Video output
- $29/month for 1,000 renders ($0.029/image)
- No native CMYK

#### APITemplate.io
- Basic utilitarian editor
- Image and PDF generation
- $29/month for 1,500 renders ($0.019/image)
- 50 free renders/month permanently

#### DynaPictures
- Postcard-specific generator available
- Spreadsheet-based batch generation
- Embeddable widget for websites
- Dynamic content from Google Sheets, CSV, API, forms
- ~$51/month for 1,000 credits

### Approach E: Image Composition (Canvas/Sharp/Pillow)

**How it works:**
- Start with a professionally designed background image (from a designer or AI)
- Programmatically overlay text, logos, photos using image manipulation libraries
- Node.js: Sharp or node-canvas
- Python: Pillow/PIL

**Advantages:** Full control, no browser overhead, fast
**Disadvantages:** Text rendering is primitive compared to HTML. No rich typography, no text wrapping intelligence, no CSS-like layout. Positioning every element manually is fragile.

**Verdict:** Viable for simple overlays but breaks down with complex layouts. Not recommended as primary approach for postcards with multiple text zones.

---

## 3. Canva, Bannerbear, Placid, and Abyssale for Postcard/Direct Mail

### Canva Connect API

**How it works:**
- Users design in Canva's editor (which is powerful and familiar)
- Brand Templates with Data Autofill feature enables variable data
- API can programmatically fill template fields (text, images, charts)
- Export as image or PDF

**Critical Limitations for PostCanary:**
- **Requires Canva Enterprise subscription** for Brand Templates + Autofill APIs
- Each user needs a Canva account -- adds friction
- Canva branding remains in the flow (not white-label)
- Designs live in Canva's workspace, not your database
- Rate limited to 60 autofill requests/minute per user
- Async jobs require polling
- **NOT designed for fully automated, headless, variable-data workflows** -- it is built for human-in-the-loop editing
- No native CMYK output for print
- Max design size: 8000x8000 pixels

**Would work for:** Letting customers manually design their own postcards in a familiar tool
**Would NOT work for:** Automated postcard generation from scraped website data

**Pricing:** Canva Enterprise subscription required ($$$). API usage may have additional costs.

### Bannerbear for Postcards

**Workflow:**
1. Create template in Bannerbear's visual editor
2. Define dynamic layers (text, image, shape)
3. Call API with variable data to generate variations
4. Receive PNG/JPEG/PDF output

**For PostCanary:** Could work for preview images, but PDF output is RGB, no CMYK, no bleed handling. Would need post-processing for print.

### Placid for Postcards

**Workflow:**
1. Design template in Placid's editor
2. Set up dynamic layers
3. Generate via API, Zapier, Make, or direct URL parameters
4. Outputs images and PDFs

**For PostCanary:** Similar limitations as Bannerbear -- no print-specific features. Better for digital assets than physical print.

### Abyssale for Postcards (BEST FIT)

**Workflow:**
1. Create template in Abyssale editor, selecting "Print" design type
2. Configure CMYK color profile, bleed zones, crop marks
3. Define dynamic elements (text, images, shapes, QR codes)
4. Call async API with variable data
5. Receive print-ready CMYK PDF at 300 DPI via webhook
6. Send directly to print partner (Lob, PostGrid, etc.)

**For PostCanary:** This is the only template API that natively handles the print production requirements (CMYK, bleed, crop marks, 300 DPI) without post-processing.

**Pricing for PostCanary's use case:**
- ~150 template renders to start (during design phase)
- At scale: ~$0.01-0.08 per postcard render depending on volume tier
- Multiple CMYK ICC profiles available
- Figma-to-Abyssale plugin for importing designs

---

## 4. Can AI Image Generation Be Used for Template Design?

### Current State (April 2026)

**GPT Image (gpt-image-1 / 1.5):**
- Best text rendering of any AI model -- can handle headlines, phone numbers
- $0.02-0.19 per image depending on size/model
- Can generate photorealistic backgrounds, marketing-style layouts
- Output: RGB PNG/JPEG, NOT CMYK, NOT vector

**DALL-E 3:**
- $0.04/image (1024x1024)
- Good quality but text rendering still imperfect
- Aspect ratio support but not print-specific dimensions

**Flux / Stable Diffusion:**
- Open source, self-hostable
- Cheaper at scale
- Text rendering worse than GPT Image

**Midjourney:**
- Highest aesthetic quality
- No API (Discord-based)
- Poor text rendering

### How You COULD Use AI in a Variable-Data Pipeline

**Option 1: AI generates the background/layout, data overlaid programmatically**
```
1. Generate base postcard design with AI (no text, just visual layout)
   - Prompt: "Professional HVAC service postcard background, modern clean design, 
     blue and white color scheme, space for headline at top, space for offer in center,
     photo placeholder on right, no text"
2. Use image composition to overlay:
   - Customer's logo
   - Headline text
   - Offer text  
   - Phone number
   - Reviews
   - Trust badges
3. Convert to CMYK PDF with Ghostscript
```

**Option 2: AI generates complete postcard including text**
- Prompt includes all variable data
- Each generation is unique (no template reuse)
- EXPENSIVE at scale ($0.04-0.19 per generation vs $0.01-0.05 for template APIs)
- Text may have errors (misspelled phone numbers = disaster for print)
- No deterministic output (same data = different design each time)

**Option 3: AI generates template designs ONCE, humans review, then use as static templates**
- Generate 6-9 postcard designs for different industries using AI
- Human designer reviews and polishes in Figma/Illustrator
- Convert polished designs into Abyssale/Bannerbear templates
- Variable data injected via template API at runtime

### Production Examples

**CreativeCampaign-Agent (open source, genmind.ch):**
- Uses DALL-E 3 for product images + GPT-4o-mini for copy + Pillow for text overlay
- Event-driven microservices (NATS JetStream)
- 32 variants in 5-8 minutes, ~$1.50 total cost
- BUT: for digital ads, not print. No CMYK handling.

**PostGrid + OpenAI integration:**
- PostGrid offers a "native integration" with OpenAI
- GPT generates copy, PostGrid handles template + print
- AI is for text generation, not visual design

**Pixazo.ai:**
- Claims "AI direct mail postcard maker"
- Launched March 2026
- Details unclear on actual AI involvement

### Limitations of AI for Print Production

1. **No CMYK output** -- all AI models output RGB. Requires conversion.
2. **No bleed/crop marks** -- AI doesn't understand print production specs.
3. **Non-deterministic** -- same prompt = different output. Breaks QA.
4. **Text accuracy** -- AI can misspell words, misrender phone numbers. CRITICAL failure mode for print.
5. **Resolution** -- Most models output 1024x1024 or similar. A 6x9 at 300 DPI needs 1800x2700px. Upscaling introduces artifacts.
6. **Cost at scale** -- $0.04-0.19/image vs $0.01-0.05 for template APIs.
7. **No variable data isolation** -- Can't guarantee logo/phone/offer are in the right spot every time.

### Verdict on AI for PostCanary

**Use AI for:** Generating initial template designs (Option 3). Have AI create 6-9 industry-specific designs, then clean up in Figma and convert to templates.

**Do NOT use AI for:** Runtime postcard generation in the production pipeline. Too expensive, too unpredictable, text accuracy is a dealbreaker for print.

---

## 5. Best Visual Quality for Least Engineering Effort

### The Ranking (Best to Worst for PostCanary)

#### Tier 1: Abyssale (RECOMMENDED)

**Engineering effort:** Low-Medium  
**Visual quality:** Professional (limited by template design skill)  
**Print compliance:** Native CMYK, 300 DPI, bleed, crop marks  

**How it works for PostCanary:**
1. Hire a designer (Fiverr/99designs/contractor) to create 6-9 postcard templates in Abyssale's editor, using the "Print" design type
2. Each template has dynamic layers: `logo_image`, `hero_photo`, `headline_text`, `offer_text`, `phone_text`, `review_text`, `badge_area`, `background_color`
3. PostCanary API sends scraped data to Abyssale API
4. Abyssale renders CMYK PDF via webhook
5. Customer previews, edits text fields, re-renders
6. Final PDF sent to print partner (Lob or PCM Integrations)

**Cost per postcard render:** ~$0.01-0.08  
**Time to implement:** 2-3 weeks (API integration) + 1-2 weeks (template design)  
**Ongoing maintenance:** Minimal -- add new templates in editor, no code changes

#### Tier 2: Lob HTML Templates + Figma Plugin

**Engineering effort:** Medium  
**Visual quality:** Good (depends on HTML/CSS skill or Figma design)  
**Print compliance:** RGB only in HTML (Lob handles conversion internally)  

**How it works:**
1. Design postcards in Figma with merge variable placeholders
2. Export to Lob via Figma plugin (auto-converts to HTML)
3. PostCanary sends variable data + template ID to Lob API
4. Lob renders, prints, and mails

**Advantage:** Single vendor for template rendering AND print/mail fulfillment  
**Disadvantage:** RGB-to-CMYK conversion may shift colors. Less control over final print output.

#### Tier 3: Playwright/Chromium + Ghostscript Pipeline

**Engineering effort:** High  
**Visual quality:** Depends entirely on your HTML/CSS skill  
**Print compliance:** Requires Ghostscript post-processing for CMYK  

**How it works:**
1. Build HTML/CSS templates with Handlebars variables
2. Inject scraped data into templates
3. Render to PDF with Playwright (warm browser pool)
4. Post-process with Ghostscript for CMYK conversion
5. Upload to print partner

**Advantage:** Full control, no per-render costs, no vendor dependency  
**Disadvantage:** This is where the "SaaS component" look comes from. Making HTML look like professional direct mail requires significant design skill and iteration. Docker complexity, browser pool management, CMYK post-processing adds moving parts.

#### Tier 4: PrinceXML / DocRaptor

**Engineering effort:** Medium  
**Visual quality:** Best HTML-to-PDF rendering available  
**Print compliance:** Native CMYK, bleed, crop marks in CSS  

**How it works:** Same as Playwright but using PrinceXML engine instead of Chromium  
**Advantage:** Native CMYK, best print CSS support  
**Disadvantage:** $3,800+ license. Still requires HTML/CSS design skill.

#### Tier 5: Canva API

**Engineering effort:** High (Enterprise subscription, OAuth flow, async polling)  
**Visual quality:** Highest (Canva's editor is world-class)  
**Print compliance:** Not great -- no CMYK export  

**Verdict:** Wrong tool for automated pipeline. Right tool if you want customers designing their own postcards.

#### Tier 6: Pure Image Composition (Sharp/Canvas)

**Engineering effort:** Very High  
**Visual quality:** Low without significant effort  
**Print compliance:** Manual everything  

**Verdict:** Don't go this route for postcards with complex layouts.

---

## 6. Recommended Production Architecture for PostCanary

### End-to-End Flow

```
CUSTOMER ENTERS URL
       |
       v
[1. Website Scraper] ---- Playwright/Firecrawl
       |                   - Screenshot homepage
       |                   - Extract logo (favicon, header logo)
       |                   - Extract brand colors (CSS analysis)
       |                   - Extract hero photos
       |                   - Extract business info (name, phone, address)
       |
       v
[2. Google Reviews Scraper] ---- Google Places API
       |                         - Fetch top reviews
       |                         - Get star rating
       |                         - Get review count
       |
       v
[3. AI Enhancement Layer] ---- GPT-4o / Claude
       |                        - Generate headline options
       |                        - Generate offer copy
       |                        - Select best photos
       |                        - Match template to industry
       |                        - Clean/improve extracted text
       |
       v
[4. Template Selection] ---- PostCanary Logic
       |                     - Industry detection (HVAC, plumbing, etc.)
       |                     - Color scheme matching
       |                     - Layout selection based on available data
       |                     - 6-9 templates covering common industries
       |
       v
[5. Postcard Generation] ---- Abyssale API (RECOMMENDED)
       |                       OR Lob HTML Templates
       |                       - Inject: logo, colors, photo, headline,
       |                         offer, phone, reviews, badges
       |                       - Render preview image (fast, RGB)
       |                       - On approval: render print PDF (CMYK)
       |
       v
[6. Customer Preview + Edit] ---- PostCanary UI
       |                           - Show rendered preview
       |                           - Editable fields: headline, offer,
       |                             phone, CTA text
       |                           - Template switching
       |                           - Re-render on each edit
       |
       v
[7. Final PDF Render] ---- Abyssale API (print mode)
       |                    - CMYK, 300 DPI, bleed, crop marks
       |                    - Front + back as multi-page PDF
       |
       v
[8. Print + Mail] ---- Lob API or PCM Integrations API
                        - Upload final PDF
                        - Mailing list with addresses
                        - CASS/NCOA address validation
                        - Print and mail
                        - Tracking webhooks
```

### Detailed Tool Assignments

| Step | Tool | Why |
|------|------|-----|
| Website scraping | Playwright + custom extraction | Need screenshot + DOM analysis |
| Logo extraction | Custom (favicon + header analysis) | No good API for this |
| Color extraction | node-vibrant or custom CSS parser | Extract palette from screenshot/CSS |
| Photo extraction | Custom (largest images on page) | Filter for hero/service photos |
| Reviews | Google Places API | Authoritative source |
| AI copy generation | GPT-4o or Claude | Generate headlines, offers |
| Template design | Abyssale editor (by hired designer) | Visual editor + print support |
| Preview rendering | Abyssale API (static mode, fast) | RGB preview for customer |
| Print PDF rendering | Abyssale API (printer mode) | CMYK, bleed, crop marks |
| Customer editing | PostCanary React UI | Text field editing, re-render |
| Address validation | Lob Address Verification API | CASS certified |
| Print + mail | Lob Print API or PCM Integrations | Proven fulfillment networks |

### Alternative Architecture: All-Lob Pipeline

If you want fewer vendors:

```
Templates: Design in Figma → Export via Figma-to-Lob plugin → Lob HTML Templates
Preview: Lob Template Proof API (generates preview)
Editing: PostCanary UI edits merge variables → re-proof via Lob API
Print: Lob handles everything (rendering + printing + mailing + tracking)
```

**Pros:** Single vendor, proven at scale, simpler integration  
**Cons:** RGB-only HTML rendering (color accuracy depends on Lob's internal RGB→CMYK conversion), less control over final output quality, template design limited by HTML/CSS skill

### Alternative Architecture: Hybrid Playwright + Print Partner

If you want full control and zero per-render costs:

```
Templates: HTML/CSS with Handlebars, designed to look like direct mail
Preview: Playwright warm browser → RGB PDF → display to customer
Print PDF: Playwright → Ghostscript (CMYK conversion) → PDF/X
Print: Upload to Lob or PCM Integrations
```

**Pros:** No per-render vendor costs, full control  
**Cons:** Highest engineering effort, Docker/browser management, CMYK post-processing, and the fundamental challenge: making HTML look like professional print design

---

## Key Decision Points

### Decision 1: Template Design Approach
| Option | Cost | Quality | Engineering |
|--------|------|---------|-------------|
| Hire designer → Abyssale templates | $500-2000 design + $0.01-0.08/render | High | Low |
| Hire designer → Figma → Lob HTML | $500-2000 design + included in Lob pricing | Medium-High | Medium |
| AI-generate designs → clean up → templates | $50-100 AI + $200-500 cleanup | Medium | Medium |
| Hand-code HTML/CSS templates | $0 + engineering time | Low-Medium | High |

### Decision 2: Rendering Pipeline
| Option | CMYK? | Speed | Cost/render | Complexity |
|--------|-------|-------|-------------|------------|
| Abyssale API | Native | 2-5s async | $0.01-0.08 | Low |
| Lob (renders internally) | Converted | Included in mail | $0 extra | Low |
| Playwright + Ghostscript | Post-process | 13ms render + 1-2s GS | $0 (self-hosted) | High |
| PrinceXML | Native | Fast | $3800 license | Medium |

### Decision 3: Print Fulfillment
| Option | Turnaround | Quality | Integration |
|--------|------------|---------|-------------|
| Lob | 3-5 days | Good | API, webhooks |
| PCM Integrations | 1-2 days | Excellent (in-house) | API, webhooks |
| PostGrid | 2 days | Good | API |
| Postalytics | 3-7 days | Good | API + editor |

---

## Final Recommendation for PostCanary

**Phase 1 (MVP -- get to market fast):**
1. Use **Abyssale** for template creation + rendering
   - Hire a designer to create 6 templates in Abyssale (HVAC, plumbing, electrical, roofing, landscaping, general)
   - Each template has dynamic layers for all PostCanary variable data
   - Use Abyssale's print mode for CMYK PDF generation
2. Use **Lob** for print fulfillment + address verification
3. Use **PostCanary's React UI** for customer preview and text editing
4. Use **GPT-4o** for headline/offer generation from scraped data

**Phase 2 (Scale):**
- If Abyssale costs become significant at volume, migrate to **Playwright + Ghostscript** self-hosted pipeline
- Port Abyssale templates to HTML/CSS (you already know the layouts work)
- Or negotiate volume pricing with Abyssale

**Phase 3 (Differentiation):**
- Add PostcardMania-quality by partnering directly with **PCM Integrations** for printing (they offer wholesale white-label pricing)
- Build template marketplace where designers contribute templates
- AI-powered template recommendation based on industry + competition analysis

---

## Sources

### Platform Documentation
- Lob Help Center: Dynamic personalization, Creative formatting, Figma plugin, Advanced templating (Handlebars)
- Lob Blog: "Creating Functional Print Mail From Digital Assets" (2021), "Print and Mail a Customizable Postcard using HTML" (2015), "Mailing a Postcard with JavaScript" 3-part series (2021)
- Lob API Documentation: /v1/postcards, /v1/templates endpoints
- Postalytics Support: "Understanding the Postalytics Direct Mail Editor", "Create Direct Mail Postcard Templates In Postalytics"
- PostGrid API Reference: postcards_create endpoint
- PCM Integrations: pcmintegrations.com/direct-mail-api/
- PostcardMania: "Two Types of Postcards: Static and Variable", Variable Data Guide PDF

### Template API Documentation
- Abyssale Developer Hub: REST API generation, print PDF generation, design types
- Abyssale Blog: "Automating High-Fidelity PDF Generation" (2025), "Image Generation API for Automated Creative Production" (2026)
- Abyssale Features: PDF export page, API page
- Bannerbear vs Placid vs Abyssale comparisons: saashub.com, stackreaction.com, templated.io/blog
- Imejis.io: "Image Generation API Pricing Compared (2026)", "AI Image Generation vs Template APIs (2026)"
- Templated.io: "5 Best Bannerbear Alternatives" (2025), "Top 6 Placid Alternatives" (2025)

### HTML-to-PDF Tools
- pdf4.dev: "HTML to PDF benchmark 2026" -- Playwright vs Puppeteer vs WeasyPrint
- PDFBolt: "How to Generate PDFs in 2025: Methods and Tools Compared"
- PrinceXML Documentation: Graphics (CMYK/spot colors), Paged Media (bleed/crop marks), Tips and Tricks
- Peasy Math: "PDF Print Production: Settings for Professional Output"

### Canva API
- Canva Developer Docs: Autofill guide, Create design autofill job API, Brand templates API
- Canva Developer Blog: "Apply Canva Brand templates with the Autofill API"
- Canva Connect API Starter Kit (GitHub)
- Templated.io: "Canva Connect API vs Templated"
- IMG.LY Blog: "Canva Connect API Alternative for White-Label Editing"

### AI + Direct Mail
- genmind.ch: "Building an AI-Powered Creative Campaign Pipeline" (2025) -- DALL-E 3 + GPT-4o-mini pipeline
- MindStudio Blog: "AI Image Generation + Airtable: Automate Visual Content Pipelines" (2026)
- shopclawmart.com: "AI Agent for Lob: Automate Direct Mail Campaigns" (2026)
- PostGrid: OpenAI integration page
- DirectMailer.io: "Build a Direct Mailer with Merge Variable Data" (2022)
