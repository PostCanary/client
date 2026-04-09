# Trust Badge Artwork — Legal Rationale

## Purpose
These assets (`bbb.svg`, `angi.svg`, `homeadvisor.svg`) render the real brand marks of third-party certifications that customer businesses hold. They are used on customer-facing postcard templates where the customer's business is ACTUALLY BBB-accredited, Angi-certified, or HomeAdvisor-rated.

## Legal Basis: Nominative Fair Use
Per CONTEXT.md D-14 and the three-factor nominative fair use test (New Kids on the Block v. News America Publishing):

1. **The product/service cannot be readily identified without using the mark.** BBB accreditation, Angi certification, and HomeAdvisor ratings cannot be identified without using the actual organization name and logo — these marks ARE the identifier.
2. **Only so much of the mark is used as is reasonably necessary to identify the product/service.** The badges are rendered at their natural brand proportions and colors. No modification, stretching, or creative reinterpretation.
3. **The user does nothing that would, in conjunction with the mark, suggest sponsorship or endorsement.** PostCanary does not claim BBB/Angi/HomeAdvisor endorse PostCanary. The badges appear on postcards for businesses that have earned those credentials.

## Scope of Use
- Allowed: Customer businesses that genuinely hold the credential (verified via their BrandKit.trustBadges array during scraping).
- Not allowed: Customer businesses that do NOT hold the credential. The `TrustBadges.vue` component MUST route each badge by `type` and only render the real artwork when the customer's scraped `trustBadges[]` includes a matching entry.

## Source Attribution
Each SVG/PNG in this directory was sourced from the respective organization's official brand assets portal. No artwork was modified or recolored away from the published brand specifications.

## Swap Path for Production
If legal counsel later requires a different approach (license agreement, text-facsimile fallback), the swap point is `src/components/design/TrustBadges.vue` and this directory. Every consumer goes through that one component.
