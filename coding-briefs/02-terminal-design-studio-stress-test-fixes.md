# Terminal 2 (Design Studio) — Stress Test Results + Fixes

## 5 Blockers Found, All Fixed Below

---

## BLOCKER FIX 1: All 18 Templates Must Be Fully Defined

Only 3 templates had complete `contentSlots`. The other 15 were comments. Fix: all 18 templates use the SAME slot structure (slots don't vary by layout — the visual rendering varies, not the data). Generate programmatically:

```typescript
// In src/data/templates.ts

const SLOT_BY_PURPOSE: Record<CardPurpose, typeof contentSlots> = {
  offer: {
    headline: { maxChars: 50, placeholder: 'Your Neighbor Just Called Us' },
    offerText: { maxChars: 200, placeholder: '$79 AC Tune-Up includes 21-point inspection...' },
    reviewQuote: { maxChars: 120, placeholder: '"Fixed our leak in 45 minutes. Professional and fair."' },
    urgencyText: { maxChars: 40, placeholder: 'Limited spots this month' },
    riskReversal: { maxChars: 80, placeholder: 'Free estimate · No trip charge · Satisfaction guaranteed' },
  },
  proof: {
    headline: { maxChars: 50, placeholder: 'See Why Your Neighbors Choose Us' },
    offerText: { maxChars: 200, placeholder: 'Still available: $79 AC Tune-Up with full inspection...' },
    reviewQuote: { maxChars: 120, placeholder: '"Best plumber we\'ve ever used. On time, clean, honest pricing."' },
    urgencyText: { maxChars: 40, placeholder: 'Only 5 spots left this month' },
    riskReversal: { maxChars: 80, placeholder: 'Same guarantee: free estimate, no trip charge' },
  },
  last_chance: {
    headline: { maxChars: 50, placeholder: 'Last Chance — This Offer Ends Soon' },
    offerText: { maxChars: 200, placeholder: 'Everything from our first offer PLUS free duct cleaning ($199 value)' },
    reviewQuote: { maxChars: 120, placeholder: '"Called them after getting this card. So glad I did."' },
    urgencyText: { maxChars: 40, placeholder: 'Offer expires in 7 days' },
    riskReversal: { maxChars: 80, placeholder: 'Last chance: free estimate + no-risk guarantee' },
  },
}

const LAYOUTS: { type: TemplateLayoutType; name: string; description: string; bestFor: CampaignGoalType[] }[] = [
  { type: 'full-bleed', name: 'Full-Bleed Photo', description: 'Photo edge-to-edge with headline in color bar overlay. Biggest visual impact.', bestFor: ['neighbor_marketing', 'seasonal_tuneup', 'target_area', 'new_mover'] },
  { type: 'side-split', name: 'Side Split', description: 'Photo left, headline + offer right. Best for offer-heavy campaigns.', bestFor: ['cross_service_promo', 'seasonal_tuneup', 'target_area'] },
  { type: 'photo-top', name: 'Photo Top', description: 'Large photo top, text band bottom. Best for seasonal imagery.', bestFor: ['seasonal_tuneup', 'neighbor_marketing'] },
  { type: 'bold-graphic', name: 'Bold Graphic', description: 'Big bold headline dominates, small photo. Best for urgency.', bestFor: ['storm_response', 'target_area'] },
  { type: 'before-after', name: 'Before / After', description: 'Two photos side by side showing transformation.', bestFor: ['neighbor_marketing', 'target_area', 'cross_service_promo'] },
  { type: 'review-forward', name: 'Review Forward', description: 'Large review quote with stars dominates. Best for trust-building.', bestFor: ['win_back', 'neighbor_marketing'] },
]

const PURPOSES: CardPurpose[] = ['offer', 'proof', 'last_chance']

// Generate all 18 templates
export const TEMPLATES: TemplateDefinition[] = LAYOUTS.flatMap(layout =>
  PURPOSES.map(purpose => ({
    id: `${layout.type}-${purpose}`,
    layoutType: layout.type,
    name: `${layout.name}${purpose === 'offer' ? '' : purpose === 'proof' ? ' — Social Proof' : ' — Last Chance'}`,
    description: layout.description,
    cardPosition: purpose,
    bestFor: layout.bestFor,
    contentSlots: SLOT_BY_PURPOSE[purpose],
    previewImageUrl: '', // not used — TemplateBrowser renders live previews via PostcardPreview
  }))
)
```

This generates all 18 templates programmatically. No missing definitions.

---

## BLOCKER FIX 2: Complete Mock Headlines for All Goals

Replace the partial `getMockHeadline()` with template-based headline patterns that work for ALL goals:

```typescript
const HEADLINE_PATTERNS: Record<CampaignGoalType, Record<CardPurpose, string[]>> = {
  neighbor_marketing: {
    offer: [
      'Your Neighbor at {street} Just Called Us',
      'Attention {city} Homeowners:',
      'Trusted by Your Neighbors Since {sinceYear}',
    ],
    proof: [
      'Here\'s Why Your Neighbors Choose {businessName}',
      '{rating} Stars — See What Your Neighbors Say',
      '{businessName}: Your Neighborhood\'s Choice',
    ],
    last_chance: [
      'Last Chance: Your Neighbors\' Favorite Deal Ends Soon',
      'Don\'t Miss Out — Limited Spots in {city}',
      'Final Notice for {city} Homeowners',
    ],
  },
  seasonal_tuneup: {
    offer: [
      'Is Your AC Ready for Summer?',
      'Time for Your Annual {serviceType} Tune-Up',
      'Spring Special: {serviceType} Check-Up',
    ],
    proof: [
      '{city} Homeowners Trust {businessName} Every Season',
      '{rating} Stars — {yearsInBusiness} Years of Seasonal Service',
      'Why {city} Families Schedule Their Tune-Ups With Us',
    ],
    last_chance: [
      'Last Chance for Pre-Season {serviceType} Pricing',
      'Summer Is Coming — Book Now Before We\'re Full',
      'Final Pre-Season Slots Available in {city}',
    ],
  },
  target_area: {
    offer: [
      '{city}\'s Most Trusted {industry} Company',
      'Now Serving Your Neighborhood in {city}',
      'Professional {industry} Service in {city}',
    ],
    proof: [
      'Why {city} Homeowners Choose {businessName}',
      '{rating} Stars in {city} — See the Reviews',
      '{yearsInBusiness} Years Serving {city}',
    ],
    last_chance: [
      'Limited Time: Special Offer for {city} Residents',
      'This Offer for {city} Homeowners Ends Soon',
      'Final Week: {city} Exclusive Deal',
    ],
  },
  storm_response: {
    offer: [
      'Storm Damage in {city}? We\'re Ready to Help',
      'Emergency {industry} Service — Available Now',
      '{city} Storm Response: Call Us Today',
    ],
    proof: [
      'We\'ve Helped Your Neighbors After the Storm',
      'Emergency Response: {businessName} Is Here',
      'Trusted Storm Recovery in {city}',
    ],
    last_chance: [
      'Don\'t Wait — Storm Damage Gets Worse Over Time',
      'Insurance Deadlines Approaching for {city} Storm Claims',
      'Act Now: Free Storm Damage Assessment',
    ],
  },
  win_back: {
    offer: [
      'We Miss You! Come Back for ${discountAmount} Off',
      'It\'s Been a While, {city} — Here\'s a Welcome-Back Deal',
      '{businessName} Wants You Back',
    ],
    proof: [
      'See What You\'ve Been Missing at {businessName}',
      'Your Neighbors Are Still Choosing Us — Here\'s Why',
      '{rating} Stars and Growing — Come See What\'s New',
    ],
    last_chance: [
      'Last Chance: Your Welcome-Back Offer Expires Soon',
      'We Saved This Deal Just for You',
      'Final Notice: {businessName} Welcome-Back Special',
    ],
  },
  cross_service_promo: {
    offer: [
      'Did You Know {businessName} Also Does {serviceType}?',
      'Your Trusted {industry} Team Now Offers {serviceType}',
      'New Service Alert: {serviceType} from {businessName}',
    ],
    proof: [
      'Same {rating}-Star Service, New Offering',
      'Why Our {industry} Customers Love Our {serviceType} Too',
      '{businessName}: More Ways to Help Your Home',
    ],
    last_chance: [
      'Last Chance: Try Our {serviceType} at a Special Rate',
      'Introductory {serviceType} Pricing Ends Soon',
      'Final Week: {serviceType} Launch Special',
    ],
  },
  new_mover: {
    offer: [
      'Welcome to {city}! Meet Your New {industry} Team',
      'Just Moved to {city}? Your Home Needs This',
      'New to the Neighborhood? {businessName} Is Here for You',
    ],
    proof: [
      'Your New Neighbors Trust {businessName}',
      '{rating} Stars — {city}\'s Favorite {industry} Company',
      'Welcome to {city}: Here\'s Who Your Neighbors Call',
    ],
    last_chance: [
      'New Homeowner Special Expires Soon',
      'Welcome Offer for {city} Newcomers — Last Chance',
      'Don\'t Miss Your New Mover Discount',
    ],
  },
  other: {
    offer: [
      '{businessName}: Your Local {industry} Expert',
      'Professional {industry} Service in {city}',
      'Call {businessName} — {city}\'s Trusted Choice',
    ],
    proof: [
      '{rating} Stars — See Why {city} Trusts {businessName}',
      '{yearsInBusiness} Years of {industry} Excellence',
      'Your Neighbors Recommend {businessName}',
    ],
    last_chance: [
      'This Special Offer Won\'t Last',
      'Limited Time: Call {businessName} Today',
      'Final Notice — Don\'t Miss This Deal',
    ],
  },
}

// Resolution function fills in placeholders from brand kit
function resolveHeadline(pattern: string, brandKit: BrandKit, goal: GoalSelection): string {
  return pattern
    .replace('{businessName}', brandKit.businessName)
    .replace('{city}', brandKit.location?.split(',')[0]?.trim() ?? 'Your Area')
    .replace('{industry}', INDUSTRY_LABELS[brandKit.industry as Industry] ?? 'Home Services')
    .replace('{rating}', String(brandKit.googleRating ?? 4.8))
    .replace('{sinceYear}', String(2026 - (brandKit.yearsInBusiness ?? 10)))
    .replace('{yearsInBusiness}', String(brandKit.yearsInBusiness ?? 10))
    .replace('{serviceType}', goal.serviceType ?? 'Home Service')
    .replace('{street}', 'Elm Street')  // mock for Round 1
    .replace('{discountAmount}', '75')   // mock for Round 1
}
```

Every goal × purpose has 3 headline options. No empty arrays. Placeholders resolved from brand kit.

---

## BLOCKER FIX 3: `trustSignals` Type Mismatch

The `resolveContent()` function returns `trustSignals: string[]` but the `CardDesign.resolvedContent` interface in Prerequisites types doesn't include it.

> **UPDATE: FALSE ALARM.** The Prerequisites brief DOES include `trustSignals: string[]` in the `resolvedContent` interface. This is a false alarm — no fix needed. The type is already defined correctly in Brief #0.

~~**Fix: Add to `src/types/campaign.ts` in the Prerequisites brief:**~~
```typescript
resolvedContent: {
  headline: string
  offerText: string
  photoUrl: string
  reviewQuote: string
  reviewerName: string
  phoneNumber: string
  urgencyText: string
  riskReversal: string
  trustSignals: string[]    // ← ALREADY EXISTS in Prerequisites types
}
```

~~This must be added during Prerequisites build. If Prerequisites is already built, add it as the first task of Terminal 2.~~

---

## BLOCKER FIX 4: Build Order — LockedZoneOverlay Before PostcardBack

PostcardBack.vue imports LockedZoneOverlay.vue. Fix: build overlay first.

**Corrected order:**
1. Template definitions (`templates.ts`)
2. Stock photo library (`stockPhotos.ts`)
3. Postcard generator composable (`usePostcardGenerator.ts`)
4. LockedZoneOverlay.vue (BEFORE PostcardBack)
5. PostcardFront.vue (6 layout modes)
6. PostcardBack.vue (imports LockedZoneOverlay — now exists)
7. Update PostcardPreview.vue (change stub imports → real components)
8. EditPanel.vue + CharacterCounter.vue
9a. EditHeadline.vue
9b. EditOffer.vue
9c. EditReview.vue
9d. EditPhoto.vue
9e. EditColors.vue
10. SequenceView.vue
11. TemplateBrowser.vue + TemplateCard.vue
12. StepDesign.vue (main orchestrator)
13. Update WizardShell import

---

## BLOCKER FIX 5: Split Task 9 (5 Editors) Into 5 Tasks

Original Task 9 creates EditHeadline, EditOffer, EditReview, EditPhoto, EditColors in ONE task.

Split into 9a-9e, one editor per task, each independently verifiable.

---

## IMPORTANT FIXES

### Kennedy Escalation — getMockOffer Must Vary by Card Purpose
```typescript
function getMockOffer(brandKit: BrandKit, purpose: CardPurpose): string {
  const baseOffer = brandKit.currentOffers[0] ?? '$79 Tune-Up includes inspection, filter, 1-year warranty'
  if (purpose === 'offer') return baseOffer
  if (purpose === 'proof') return `Still available: ${baseOffer} — but spots are filling up`
  // last_chance: ADD a sweetener not in earlier cards
  return `${baseOffer} PLUS free duct cleaning ($199 value) — this week only`
}
```

### Remove ai_generation.py — Not Needed for Round 1
All content generation is client-side mock logic in `usePostcardGenerator.ts`. No server AI calls in Round 1. Remove `app/services/ai_generation.py` from the file list. Create it in Round 2 when real AI calls are needed.

### Stock Photo URLs — Provide Real Unsplash URLs
Codex needs actual working URLs, not `'...'` placeholders. Provide at least 2 per industry:
```typescript
// HVAC
{ id: 'hvac-1', url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', industry: 'hvac', emotion: 'trust', description: 'HVAC technician working' },
// Plumbing
{ id: 'plumb-1', url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800', industry: 'plumbing', emotion: 'trust', description: 'Professional plumber' },
```
If Unsplash URLs become stale, Codex should use colored placeholder divs with industry name as fallback.

### Brand Kit Null Safety
Fix array access crashes:
```typescript
// WRONG: crashes on empty array
brandKit.photos.sort((a, b) => b.qualityScore - a.qualityScore)[0].url

// RIGHT: defensive access
const sortedPhotos = [...(brandKit.photos ?? [])].sort((a, b) => b.qualityScore - a.qualityScore)
const topPhoto = sortedPhotos[0]?.url ?? getPhotosForIndustry(brandKit.industry ?? 'other')[0]?.url ?? ''
```

Apply same pattern to `brandKit.certifications ?? []`, `brandKit.guarantees ?? []`, `brandKit.currentOffers ?? []`.

### Template Preview Images Not Needed
TemplateBrowser renders live previews using PostcardPreview component. Remove `previewImageUrl` from template data or set to empty string. Not used.

### PostcardPreview Props Must Be Backward-Compatible
All new props added by Terminal 2 must have DEFAULT VALUES so Terminal 3's code (written against simpler stubs) still works:
```vue
const props = withDefaults(defineProps<{
  card: CardDesign
  brandKit?: BrandKit | null       // optional with default
  size?: 'thumbnail' | 'large'     // optional with default
  side?: 'front' | 'back'          // optional with default
  layoutType?: TemplateLayoutType  // optional with default
}>(), {
  brandKit: null,
  size: 'large',
  side: 'front',
  layoutType: 'full-bleed',
})
```

### commitDesign() Placeholder Fix
Replace `/* from template */` with actual code:
```typescript
function commitDesign() {
  const firstCard = cards.value[0]
  const template = TEMPLATES.find(t => t.id === firstCard.templateId)

  const design: DesignSelection = {
    templateId: firstCard.templateId,
    templateLayoutType: template?.layoutType ?? 'full-bleed',
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: cards.value,
  }
  draftStore.setDesign(design)
}
```

### PostcardFront/Back Are NEW Files (Not Replacements)
Clarify for Codex: create `PostcardFront.vue` and `PostcardBack.vue` as NEW files in `src/components/postcard/`. The stub files (`PostcardFrontStub.vue`, `PostcardBackStub.vue`) remain untouched. Only `PostcardPreview.vue`'s import lines change.

### SequenceLength 4-5 Card Labels
Add labels for cards beyond 3:
```typescript
function cardLabel(n: number): string {
  const labels = ['The Offer', 'Social Proof', 'Last Chance', 'Reminder', 'Final Notice']
  return labels[n - 1] ?? `Card ${n}`
}
```

### Icon Imports
Specify exact icon names for EditPanel:
```typescript
import {
  ImageOutline as PhotoIcon,
  TextOutline as TypeIcon,
  PricetagOutline as TagIcon,
  StarOutline as StarIcon,
  ColorPaletteOutline as PaletteIcon,
  GridOutline as LayoutIcon,
} from '@vicons/ionicons5'
```

### LockedZoneOverlay Uses Slot Pattern
Task description must specify: component wraps children via `<slot />`. The overlay renders on TOP of the slot content.
```vue
<template>
  <div class="locked-zone">
    <slot />
    <div class="locked-overlay">
      <LockIcon /> Required by USPS
    </div>
  </div>
</template>
```

---

## Corrected Task Count: 18 Tasks (was 13)

1. Template definitions (templates.ts) — all 18 generated programmatically
2. Stock photo library (stockPhotos.ts) — real Unsplash URLs
3. Postcard generator composable (usePostcardGenerator.ts) — with complete headlines map
4. LockedZoneOverlay.vue (must come before PostcardBack)
5. PostcardFront.vue — 6 layout modes via v-if
6. PostcardBack.vue — imports LockedZoneOverlay
7. Update PostcardPreview.vue — change stub imports, backward-compatible props
8. EditPanel.vue + CharacterCounter.vue
9a. EditHeadline.vue — 3 options + custom input + 50-char counter
9b. EditOffer.vue — textarea + 200-char counter + varies by card purpose
9c. EditReview.vue — dropdown + paste fallback + word limit
9d. EditPhoto.vue — grid selector + upload
9e. EditColors.vue — brand palette + accents + "apply to all?" prompt
10. SequenceView.vue — with labels for cards 4-5
11. TemplateBrowser.vue + TemplateCard.vue — live previews, no static images
12. StepDesign.vue — main orchestrator with complete commitDesign()
13. Update WizardShell.vue — change one import line

---

## ADDITIONAL FIXES (from data flow trace)

### `previewImageUrl` is dead data in Round 1
`CardDesign.previewImageUrl` is always `''`. Terminal 3 uses the `PostcardPreview` Vue component directly (which works), never the URL. But the `MailCampaign.cards_data` JSONB stores this empty field. Not a crash, but add a code comment: `// Round 1: empty string. Round 2: server-rendered PNG URL for email notifications and PDF proofs.`

### Targeting changes should flag Step 3 for review
Add to Prerequisites draft store `setTargeting()`:
```typescript
setTargeting(targeting: TargetingSelection) {
  if (!this.draft) return
  this.draft.targeting = targeting
  this._markComplete(2)
  this._clearReview(2)
  // If Step 3 is already complete and recipient breakdown changed,
  // flag it for review (messaging tone may need updating)
  if (this.draft.completedSteps.includes(3)) {
    this.draft.needsReviewSteps = [...new Set([...this.draft.needsReviewSteps, 3 as WizardStep])]
  }
  this._debounceSave()
}
```
This ensures the wizard shows a "review" indicator on Step 3 when the user changes targeting. Step 3 still has the old design — it doesn't wipe it — but the indicator tells the user to check it.

### Null guards in StepDesign.vue
Don't use `!` assertions. Guard with explicit checks:
```typescript
onMounted(() => {
  if (draftStore.draft?.design) {
    cards.value = draftStore.draft.design.sequenceCards
  } else if (brandKitStore.brandKit && draftStore.draft?.goal && draftStore.draft?.targeting) {
    cards.value = generator.generateCards(
      brandKitStore.brandKit,
      draftStore.draft.goal.goalType,
      draftStore.draft.goal.sequenceLength,
      draftStore.draft.targeting.recipientBreakdown,
    )
  } else {
    // Missing data — show "Complete previous steps first" message
    // This shouldn't happen via normal wizard flow, but handles direct URL navigation
    showMissingDataError.value = true
  }
})
```

---

## Updated Verification (22 checks)

Original 20 checks plus:
21. All 18 templates load correctly — `getRecommendedTemplateSet()` returns 3 for every goal type
22. Headlines resolve with brand kit data — no `{businessName}` placeholders visible in rendered postcard
