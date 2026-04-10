# Google Places API Data on Printed Postcards: Legal Analysis

**Date:** 2026-04-06  
**For:** PostCanary  
**Question:** Can we legally display Google Places star ratings, review excerpts, and photos on printed postcards?

---

## BOTTOM LINE

**No. You cannot use Google Places API data (star ratings, review text, photos) on printed postcards under the current Terms of Service.** The restrictions are clear and explicit. However, practical workarounds exist that achieve the same marketing outcome.

---

## THE EVIDENCE

### 1. "Customer Application" is defined as a web page or application

The Google Maps Platform Terms of Service Section 20 defines:

> **"Customer Application"** means any web page or application (including all source code and features) that has material value independent of the Services and is owned or controlled by Customer.

A printed postcard is neither a web page nor an application. The license in Section 3.1 grants rights to use Services **"in Customer Application(s)"** only. Printed mail falls outside the scope of the license entirely.

### 2. No Scraping / No Pre-fetching / No Caching

Section 3.2.3(a) explicitly states:

> Customer will not export, extract, or otherwise scrape Google Maps Content for use **outside the Services**. For example, Customer will not: (i) **pre-fetch, index, store, reshare, or rehost Google Maps Content outside the services**; ... (iii) **copy and save business names, addresses, or user reviews**

Printing Google Places data on a postcard requires extracting that data from the API and putting it on a physical medium -- this is textbook "use outside the Services."

Section 3.2.3(b):

> Customer will not cache Google Maps Content except as expressly permitted under the Maps Service Specific Terms.

The Service Specific Terms for Places API (Section 10) only allow caching of **latitude and longitude values** for up to 30 days. Star ratings, review text, photos, and business names are NOT included in any caching exception.

### 3. No Creating Content From Google Maps Content

Section 3.2.3(c):

> Customer will not create content based on Google Maps Content.

A printed postcard showing "4.9 stars on Google" with star graphics, derived from the Places API response, constitutes creating content from Google Maps Content.

### 4. Google's Brand/Geo Guidelines Confirm: Print Has Narrow Permissions

Google's Geo Guidelines (about.google/brand-resource-center/products-and-services/geo-guidelines) address print use of **Google Maps content** specifically:

**Allowed for print:**
- Maps with directions (personal/non-commercial use)
- Inside books, textbooks (up to 5k copies)
- Periodicals
- Business documents (reports, proposals, presentations)
- **Supplemental navigational use in printed promotional materials** (business cards, pamphlets, flyers -- up to 5k copies) -- BUT only for map imagery showing location

**NOT allowed for print:**
- Consumer & retail goods or packaging
- **Primary or creative use in printed promotional or advertising materials**

Example Google gives of prohibited use: "A full-page magazine ad for a car company using a Google Maps screenshot to show how far the car can travel."

**Critical distinction:** These geo guidelines cover Google Maps/Earth visual content (map imagery). They do NOT even address Places API data (ratings, reviews, photos) for print, because that is already prohibited by the core Terms of Service restrictions on scraping/caching/creating content outside the Services.

---

## ANSWERS TO YOUR SPECIFIC QUESTIONS

### Q1: Can we show "4.9 stars" with Google's star format on a printed postcard?

**No.** Three separate prohibitions apply:
1. The rating value is Google Maps Content that cannot be stored/reshared outside the Services
2. Printing it creates content from Google Maps Content (prohibited by 3.2.3(c))
3. Using Google's star visual format/branding on print promotional material would violate Google's trademark and brand guidelines

### Q2: Can we show Google review text on printed materials?

**No.** Section 3.2.3(a)(iii) explicitly prohibits copying and saving "user reviews." The Places API policies also require that when displaying reviews, you must include the author's name in close proximity and (recommended) link to their profile -- impossible on a static printed postcard that has no clickable links.

### Q3: Can we use Google Places photos on printed materials?

**No.** Photos from Places API:
- Are Google Maps Content subject to all the same scraping/caching/export restrictions
- Require author attribution with a link to their profile (photoUri) -- not feasible on print
- Cannot be pre-fetched or stored outside the Services

### Q4: What are the attribution requirements for non-digital media?

**The question is moot** because the TOS does not permit using Places API data on non-digital media at all. Attribution requirements (Google Maps logo, third-party data provider credits) are designed for digital "Customer Applications" (web pages and apps). There is no attribution framework for print because print use of Places API data is not licensed.

---

## WORKAROUNDS THAT ACHIEVE THE SAME OUTCOME

### Option A: Use the Business's OWN Rating Statement (RECOMMENDED)

Instead of pulling from the Google API, have the business owner **self-report** their rating:

> "Rated 4.9/5 by 127 customers"

or

> "4.9 out of 5 stars from our customers"

This is a factual claim the business makes about itself. It is NOT Google Maps Content -- it's the business's own marketing statement. No Google branding, no Google stars, no Google attribution needed.

**Requirements:**
- Must be truthful (FTC Act Section 5 / consumer protection laws)
- Should be current at time of printing
- Do NOT use Google's trademarked star icons or "Google" branding
- Use generic star icons (unicode stars, custom design)
- Consider adding "Based on online reviews" or "as of [month/year]"

### Option B: QR Code to Google Reviews Page

Include a QR code on the postcard that links to the business's Google reviews page. This:
- Is explicitly allowed by Google's Geo Guidelines ("Print links to a Google Maps location, such as with short links or QR codes" -- listed under "Go for it")
- Lets the recipient see the real, live reviews
- Drives engagement
- Requires no scraping or caching of content

### Option C: Screenshot Approach (RISKY -- NOT RECOMMENDED)

Some businesses screenshot their Google reviews page and print it. While this happens in practice, it:
- Violates the TOS (pre-fetching/rehosting content outside the Services)
- Could result in Google API access being revoked
- Creates liability for outdated information
- Is not recommended for a SaaS company (PostCanary) that depends on continued API access

### Option D: Aggregate from Multiple Sources

State something like:

> "Top-rated across Google, Yelp, and Facebook"

This positions the business's overall reputation without attributing specific data to Google's API. Combined with generic star icons, this is defensible as the business's own marketing claim.

---

## WHAT POSTCARDMANIA, LOB, AND OTHERS DO

Based on research, direct mail companies that include review ratings on postcards typically:

1. **Use the business's self-reported rating** with generic star graphics (not Google-branded)
2. **Include QR codes** linking to the Google Business Profile
3. **Show testimonial quotes** that the business has collected independently (not scraped from Google)
4. **Use NFC/tap cards** to direct people to leave reviews -- these don't display Google data, they link TO Google

None of the compliant direct mail services scrape Google Places API and print the raw data on postcards.

---

## RECOMMENDED APPROACH FOR POSTCANARY

1. **On the postcard:** Show generic star rating (e.g., "4.9/5") with custom-designed star icons, attributed as the business's own claim: "Rated 4.9/5 by our customers"
2. **Add a QR code** linking to the Google Business Profile reviews page
3. **Optionally add:** "See our reviews on Google" as a text call-to-action next to the QR code
4. **Do NOT:** Use the Google logo, Google's star design, the word "Google" next to the rating number, or actual review text pulled from the API
5. **In PostCanary's system:** You can USE the Places API to fetch the rating for display in the web dashboard (that's a Customer Application, fully allowed). When generating the postcard design, convert it to a business self-reported claim format.

---

## FTC CONSIDERATIONS (BONUS)

As of December 2025, the FTC has been actively enforcing the Consumer Review Rule. Key points:

- Businesses cannot cherry-pick only positive reviews to display (review gating)
- Testimonials used in advertising must be truthful and not misleading
- If PostCanary's postcards only show 5-star review excerpts, this could be seen as deceptive
- Safest approach: show the aggregate rating (which inherently includes all reviews) rather than individual review quotes

---

## SOURCES

1. **Google Maps Platform Terms of Service** -- https://cloud.google.com/maps-platform/terms (Section 3.1, 3.2.3, Section 20 definitions)
2. **Google Maps Platform Service Specific Terms** -- https://cloud.google.com/maps-platform/terms/maps-service-terms (Section 10: Places API caching limited to lat/lng for 30 days)
3. **Places API Policies and Attributions** -- https://developers.google.com/maps/documentation/places/web-service/policies (attribution requirements, review display rules)
4. **Google Geo Brand Guidelines** -- https://about.google/brand-resource-center/products-and-services/geo-guidelines (print permissions for Google Maps content, QR code allowance)
5. **FTC Consumer Review Rule enforcement** -- https://www.ftc.gov/business-guidance/blog/2025/12/warning-letter-or-ten-businesses-comply-ftcs-consumer-review-rule

---

*This analysis is based on publicly available terms and guidelines as of April 2026. It is not legal advice. Consult an attorney for definitive legal guidance on your specific use case.*
