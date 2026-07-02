# Coding Brief #2: Terminal 2 — Design Studio (Wizard Step 3)

> **Owner:** Claude Terminal 2
> **Branch from:** `main` (after prerequisites merged) or `feat/campaign-prerequisites`
> **Branch name:** `feat/campaign-design-studio`
> **Depends on:** Brief #0 (Prerequisites) — shared types, draft store, brand kit store, wizard shell
> **Estimated scope:** ~18 new files, ~2 modified files
> **Round 1 rule:** Template-first with editable text fields. NO Fabric.js. NO drag-and-drop canvas. Fill-in-the-blanks on proven templates. Mock AI-generated content.

---

## What This Terminal Builds

**Wizard Step 3: "Your Postcard"** — the customer sees a near-perfect auto-generated postcard and either approves it or makes small edits.

The step opens with a FINISHED postcard (not a template picker or blank canvas). Two paths from there: "Edit This Card" (change text/photo) or "Try Different Template" (browse 3-6 alternatives). Three cards visible for sequences — same brand, different content.

**DHH Override (critical — from spec):** V1 = pre-built templates with editable TEXT FIELDS. Swap photo from selector. Swap template style. NO Fabric.js canvas editor. This dramatically reduces complexity.

---

## DO NOT BUILD (belongs to other terminals or rounds)

- Wizard shell, progress bar, navigation (Brief #0)
- Step 1 goal selection (Terminal 3)
- Step 2 targeting map (Terminal 1)
- Step 4 review (Terminal 3)
- Fabric.js canvas editor (V2 — only if customers request it)
- Real website scraping with Playwright (Round 2+)
- Real AI headline/offer/review generation (Round 2+)
- Upload custom design feature (Round 2 — escape hatch for agencies)
- Designs library page (Round 2)
- "Why This Design Works" expandable (build if time, deprioritize)
- Campaign seeding UI (Terminal 3 handles in Step 4)

---

## Architecture (from spec)

```
┌──────────────────────────────────────────────────────────────┐
│  WIZARD STEP 3: "Your Postcard"                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  3-card sequence view (horizontal scroll)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │  Card 1   │  │  Card 2   │  │  Card 3   │           │  │
│  │  │  "Offer"  │  │  "Proof"  │  │ "Closer"  │           │  │
│  │  │ [active]  │  │           │  │           │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │                      │  │  Edit Panel (right side)     │ │
│  │   POSTCARD PREVIEW   │  │                              │ │
│  │   (front/back flip)  │  │  [Change Photo]              │ │
│  │                      │  │  [Edit Headline]             │ │
│  │   6x9 proportions    │  │  [Edit Offer]                │ │
│  │   actual content     │  │  [Change Review]             │ │
│  │                      │  │  [Edit Phone]                │ │
│  │                      │  │  [Change Colors]             │ │
│  │                      │  │  [Try Different Template]    │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                                              │
│  [← Back]                                    [Next →]       │
└──────────────────────────────────────────────────────────────┘
```

---

## File List

### New Files — Client

| File | Purpose |
|------|---------|
| `src/components/wizard/StepDesign.vue` | **Main component** — replaces StepDesignStub. Preview + edit panel + sequence view |
| `src/components/postcard/PostcardFront.vue` | Replaces PostcardFrontStub. Real front layout: photo, headline, logo, phone, "Licensed & Insured" |
| `src/components/postcard/PostcardBack.vue` | Replaces PostcardBackStub. Real back layout: offer, review, QR code, risk reversal + locked zone |
| `src/components/design/SequenceView.vue` | Horizontal 3-card selector (Card 1 / Card 2 / Card 3) with thumbnails |
| `src/components/design/EditPanel.vue` | Right-side panel with labeled edit buttons |
| `src/components/design/EditHeadline.vue` | Headline editor: 3 AI options + custom text input |
| `src/components/design/EditOffer.vue` | Offer text editor with value stack formatting |
| `src/components/design/EditReview.vue` | Review selector: dropdown of available reviews |
| `src/components/design/EditPhoto.vue` | Photo selector: brand kit photos + stock library |
| `src/components/design/EditColors.vue` | Color palette: brand colors + 3-4 accent options |
| `src/components/design/TemplateBrowser.vue` | 3-6 template options filtered by goal + industry |
| `src/components/design/TemplateCard.vue` | Single template preview card in browser |
| `src/components/design/LockedZoneOverlay.vue` | Gray overlay for USPS-required zones (address block, postal elements) |
| `src/components/design/CharacterCounter.vue` | Text input with visible character limit |
| `src/data/templates.ts` | Template definitions: 6 layouts × card positions × goal presets |
| `src/data/stockPhotos.ts` | Stock photo library by industry (URLs for Round 1) |
| `src/composables/usePostcardGenerator.ts` | Merges brand kit + goal + template → resolved postcard content |
| `app/services/ai_generation.py` | **(Server)** Model-agnostic AI interface. Mock for Round 1. `call_model(prompt, task_type)` with config switch. |

### Modified Files

| File | Change |
|------|--------|
| `src/components/wizard/WizardShell.vue` | Import `StepDesign` instead of `StepDesignStub` |
| `src/components/postcard/PostcardPreview.vue` | Update to import real PostcardFront/PostcardBack instead of stubs |
| `src/types/campaign.ts` | Verify DesignSelection interface matches implementation |

> **NOTE:** PostcardPreview lives in `src/components/postcard/` (shared, created by Prerequisites brief).
> This terminal replaces the STUB renderers (PostcardFrontStub → PostcardFront, PostcardBackStub → PostcardBack).
> The Preview wrapper and its interface stay the same — Terminal 3 already imports it for Step 4.

---

## Component Tree

```
StepDesign.vue
├── SequenceView.vue
│   └── PostcardPreview.vue (thumbnail × 3, clickable)
├── PostcardPreview.vue (large, active card)
│   ├── PostcardFront.vue (or)
│   └── PostcardBack.vue
│       └── LockedZoneOverlay.vue
├── EditPanel.vue
│   ├── EditHeadline.vue
│   ├── EditOffer.vue
│   ├── EditReview.vue
│   ├── EditPhoto.vue
│   ├── EditColors.vue
│   └── CharacterCounter.vue (used by headline/offer editors)
├── TemplateBrowser.vue (shown when "Try Different Template" clicked)
│   └── TemplateCard.vue (× 3-6)
└── (reads brand kit from useBrandKitStore)
    (reads goal + targeting from useCampaignDraftStore)
    (writes to useCampaignDraftStore.setDesign())
```

---

## Build Order

### Phase 1: Template System + Data

**Task 1: Create template definitions (`src/data/templates.ts`)**

```typescript
import type { TemplateDefinition, TemplateLayoutType, CardPurpose, CampaignGoalType } from '@/types/campaign'

// 6 layout types × 3 card positions = 18 template variants
// Each can serve multiple goals

export const TEMPLATES: TemplateDefinition[] = [
  // --- FULL-BLEED PHOTO ---
  {
    id: 'full-bleed-offer',
    layoutType: 'full-bleed',
    name: 'Full-Bleed Photo',
    description: 'Photo edge-to-edge with headline in color bar overlay. Biggest visual impact.',
    cardPosition: 'offer',
    bestFor: ['neighbor_marketing', 'seasonal_tuneup', 'target_area'],
    contentSlots: {
      headline: { maxChars: 50, placeholder: 'Your Neighbor Just Called Us' },
      offerText: { maxChars: 200, placeholder: '$79 AC Tune-Up includes...' },
      reviewQuote: { maxChars: 120, placeholder: '"Fixed our leak in 45 minutes..."' },
      urgencyText: { maxChars: 40, placeholder: 'Offer expires April 30' },
      riskReversal: { maxChars: 80, placeholder: 'Free estimate · No trip charge · Satisfaction guaranteed' },
    },
    previewImageUrl: '/templates/full-bleed-offer.png',
  },
  {
    id: 'full-bleed-proof',
    layoutType: 'full-bleed',
    name: 'Full-Bleed Photo — Social Proof',
    description: 'New testimonial + real deadline. Creates urgency.',
    cardPosition: 'proof',
    bestFor: ['neighbor_marketing', 'seasonal_tuneup', 'target_area'],
    contentSlots: { /* ... */ },
    previewImageUrl: '/templates/full-bleed-proof.png',
  },
  {
    id: 'full-bleed-closer',
    layoutType: 'full-bleed',
    name: 'Full-Bleed Photo — Last Chance',
    description: 'Final notice + new sweetener not on Cards 1-2.',
    cardPosition: 'last_chance',
    bestFor: ['neighbor_marketing', 'seasonal_tuneup', 'target_area'],
    contentSlots: { /* ... */ },
    previewImageUrl: '/templates/full-bleed-closer.png',
  },

  // --- SIDE SPLIT ---
  // { id: 'side-split-offer', layoutType: 'side-split', ... }
  // { id: 'side-split-proof', ... }
  // { id: 'side-split-closer', ... }

  // --- BOLD GRAPHIC ---
  // Best for storm_response

  // --- REVIEW FORWARD ---
  // Best for win_back

  // --- BEFORE/AFTER ---
  // Best for roofing, remodel, cleaning

  // --- PHOTO TOP ---
  // Best for seasonal
]

// Map: goal → recommended layout
export const GOAL_TEMPLATE_MAP: Record<CampaignGoalType, TemplateLayoutType> = {
  neighbor_marketing: 'full-bleed',
  seasonal_tuneup: 'full-bleed',
  target_area: 'full-bleed',
  storm_response: 'bold-graphic',
  win_back: 'review-forward',
  cross_service_promo: 'side-split',
  new_mover: 'full-bleed',   // placeholder — same as target_area until we have mover-specific designs
  other: 'full-bleed',
}

// Get recommended template set (3 cards) for a goal
export function getRecommendedTemplateSet(goal: CampaignGoalType): TemplateDefinition[] {
  const layoutType = GOAL_TEMPLATE_MAP[goal]
  return TEMPLATES.filter(t =>
    t.layoutType === layoutType && t.bestFor.includes(goal)
  ).sort((a, b) => {
    const order: Record<CardPurpose, number> = { offer: 1, proof: 2, last_chance: 3 }
    return order[a.cardPosition] - order[b.cardPosition]
  })
}
```

Define ALL 18 templates (6 layouts × 3 card positions). Each needs:
- `id`, `layoutType`, `name`, `description`, `cardPosition`, `bestFor`
- `contentSlots` with `maxChars` and `placeholder` text
- `previewImageUrl` — for Round 1, use inline SVG placeholders (colored rectangles with layout name as text label). Do NOT block on finding/creating real template preview images. The PostcardFront/Back components ARE the real preview — the `previewImageUrl` is only for the template browser thumbnails.

**Stock photos:** For Round 1, use Unsplash URLs with `?w=800` resize parameter for the 7 industries (HVAC, plumbing, roofing, cleaning, electrical, pest control, landscaping). 3-5 photos per industry. If Unsplash is slow or unavailable, fall back to solid-color rectangles with industry name. Don't let photo sourcing block the build.

**Task 2: Create stock photo library (`src/data/stockPhotos.ts`)**

```typescript
export interface StockPhoto {
  id: string
  url: string
  thumbnailUrl: string
  industry: string
  emotion: 'trust' | 'comfort' | 'urgency' | 'proof'
  description: string
}

// Curated stock photos per industry
// Round 1: use Unsplash/Pexels URLs (commercially licensed)
export const STOCK_PHOTOS: StockPhoto[] = [
  // HVAC
  { id: 'hvac-1', url: '...', thumbnailUrl: '...', industry: 'hvac', emotion: 'trust', description: 'HVAC technician at door' },
  // ... 3-5 per industry

  // Plumbing
  // Roofing
  // Cleaning
  // Electrical
  // Pest Control
  // Landscaping
]

export function getPhotosForIndustry(industry: string): StockPhoto[] {
  return STOCK_PHOTOS.filter(p => p.industry === industry.toLowerCase())
}
```

**Task 3: Create postcard generator composable (`src/composables/usePostcardGenerator.ts`)**

This is the HARD PART — the logic that merges brand kit + goal + template → fully resolved postcard content.

```typescript
import type { BrandKit, CardDesign, CampaignGoalType, CardPurpose, TemplateDefinition } from '@/types/campaign'
import type { RecipientBreakdown } from '@/types/campaign'
import { getRecommendedTemplateSet, TEMPLATES } from '@/data/templates'
import { getPhotosForIndustry } from '@/data/stockPhotos'

export function usePostcardGenerator() {

  function generateCards(
    brandKit: BrandKit,
    goalType: CampaignGoalType,
    sequenceLength: number,
    recipientBreakdown: RecipientBreakdown,
  ): CardDesign[] {
    const templateSet = getRecommendedTemplateSet(goalType)
    const cards: CardDesign[] = []

    for (let i = 0; i < sequenceLength; i++) {
      const template = templateSet[i] ?? templateSet[templateSet.length - 1]
      const purpose = (['offer', 'proof', 'last_chance'] as CardPurpose[])[i] ?? 'last_chance'

      const card: CardDesign = {
        cardNumber: i + 1,
        cardPurpose: purpose,
        templateId: template.id,
        previewImageUrl: '', // generated after render
        overrides: {},
        resolvedContent: resolveContent(brandKit, goalType, purpose, recipientBreakdown, template),
        backContent: resolveBackContent(brandKit),
      }
      cards.push(card)
    }

    return cards
  }

  function resolveContent(
    brandKit: BrandKit,
    goal: CampaignGoalType,
    purpose: CardPurpose,
    recipients: RecipientBreakdown,
    template: TemplateDefinition,
  ) {
    // Determine messaging tone based on recipient breakdown
    const isCold = recipients.newProspects / (recipients.newProspects + recipients.pastCustomers) > 0.9

    return {
      headline: getMockHeadline(goal, purpose, brandKit, isCold),
      offerText: getMockOffer(brandKit, purpose),
      photoUrl: selectPhoto(brandKit),
      reviewQuote: brandKit.reviews[0]?.quote ?? '',
      reviewerName: brandKit.reviews[0]?.reviewerName ?? '',
      phoneNumber: brandKit.phone ?? '(XXX) XXX-XXXX',
      urgencyText: getMockUrgency(purpose),
      riskReversal: brandKit.guarantees.join(' · ') || 'Free estimate · No trip charge · Satisfaction guaranteed',
      trustSignals: brandKit.certifications.length > 0 ? brandKit.certifications : ['Licensed & Insured'],
    }
  }

  function resolveBackContent(brandKit: BrandKit) {
    return {
      guarantee: brandKit.guarantees[0] ?? 'Satisfaction guaranteed',
      certifications: brandKit.certifications,
      licenseNumber: '',
      companyAddress: brandKit.address ?? '',
      websiteUrl: brandKit.websiteUrl ?? '',
      qrCodeUrl: '', // placeholder — real QR generated server-side
    }
  }

  // --- Mock Content Generators (replaced by real AI in Round 2) ---

  function getMockHeadline(
    goal: CampaignGoalType,
    purpose: CardPurpose,
    brandKit: BrandKit,
    isCold: boolean,
  ): string {
    const headlines: Record<CampaignGoalType, Record<CardPurpose, string[]>> = {
      neighbor_marketing: {
        offer: [
          `Your Neighbor Just Called ${brandKit.businessName}`,
          `Attention ${brandKit.location?.split(',')[0] ?? 'Local'} Homeowners:`,
          `Trusted by Your Neighbors Since ${2026 - (brandKit.yearsInBusiness ?? 10)}`,
        ],
        proof: [
          `Here's Why Your Neighbors Choose ${brandKit.businessName}`,
          `${brandKit.googleRating ?? 4.8} Stars — See What Your Neighbors Say`,
        ],
        last_chance: [
          `Last Chance: This Offer Ends Soon`,
          `Don't Miss Out — Limited Spots This Month`,
        ],
      },
      seasonal_tuneup: {
        offer: [
          `Is Your AC Ready for Summer?`,
          `Time for Your Annual Tune-Up`,
        ],
        proof: [/* ... */],
        last_chance: [/* ... */],
      },
      // ... all goal types
      storm_response: { offer: ['Storm Damage in Your Area?'], proof: ['...'], last_chance: ['...'] },
      win_back: { offer: ['We Miss You! Come Back for $75 Off'], proof: ['...'], last_chance: ['...'] },
      target_area: { offer: [`${brandKit.location?.split(',')[0] ?? 'Your'} Area's Most Trusted`], proof: ['...'], last_chance: ['...'] },
      cross_service_promo: { offer: ['Did You Know We Also...'], proof: ['...'], last_chance: ['...'] },
      other: { offer: ['Your Local Expert'], proof: ['...'], last_chance: ['...'] },
    }

    const options = headlines[goal]?.[purpose] ?? ['Your Local Expert']
    return options[0] // First option as default, others available in editor
  }

  function getMockOffer(brandKit: BrandKit, purpose: CardPurpose): string {
    if (brandKit.currentOffers.length > 0) return brandKit.currentOffers[0]
    return '$79 Tune-Up includes: inspection, filter replacement, and 1-year warranty'
  }

  function getMockUrgency(purpose: CardPurpose): string {
    if (purpose === 'offer') return 'Call today — limited spots this month'
    if (purpose === 'proof') return `Only ${Math.floor(Math.random() * 5) + 3} spots left this month`
    return 'Final notice — offer expires in 7 days'
  }

  function selectPhoto(brandKit: BrandKit): string {
    if (brandKit.photos.length > 0) {
      return brandKit.photos.sort((a, b) => b.qualityScore - a.qualityScore)[0].url
    }
    const industryPhotos = getPhotosForIndustry(brandKit.industry ?? 'general')
    return industryPhotos[0]?.url ?? '/placeholder-postcard.jpg'
  }

  return { generateCards, resolveContent, resolveBackContent }
}
```

### Phase 2: Postcard Preview Components

**Task 4: Create `PostcardFront.vue`**

Renders the FRONT of a postcard at 6x9 proportions. Uses CSS grid/flexbox to position elements following the Z-pattern layout (spec).

```vue
<template>
  <div class="postcard-front" :style="{ '--brand-primary': brandColors[0], '--brand-accent': brandColors[1] }">
    <!-- Photo: 50-60% of card -->
    <div class="photo-area">
      <img :src="content.photoUrl" :alt="brandKit.businessName" class="w-full h-full object-cover" />
    </div>

    <!-- Headline overlay bar -->
    <div class="headline-bar" :style="{ backgroundColor: brandColors[0] || '#1e3a5f' }">
      <h2 class="headline-text">{{ content.headline }}</h2>
    </div>

    <!-- Top-left: Logo (small) -->
    <div class="absolute top-3 left-3">
      <img v-if="brandKit.logoUrl" :src="brandKit.logoUrl" class="h-8 w-auto" />
      <span v-else class="text-sm font-bold text-white drop-shadow">{{ brandKit.businessName }}</span>
    </div>

    <!-- Top-right: Licensed & Insured -->
    <div class="absolute top-3 right-3 text-xs text-white drop-shadow font-medium">
      Licensed &amp; Insured
    </div>

    <!-- Bottom-left: Company name -->
    <div class="absolute bottom-3 left-3 text-sm text-white drop-shadow font-semibold">
      {{ brandKit.businessName }}
    </div>

    <!-- Bottom-right: Phone -->
    <div class="absolute bottom-3 right-3 text-sm text-white drop-shadow font-bold">
      {{ content.phoneNumber }}
    </div>
  </div>
</template>

<style scoped>
.postcard-front {
  position: relative;
  aspect-ratio: 9 / 6;  /* 6x9 landscape */
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0f0;
}
/* ... layout styles per template type */
</style>
```

**Layout variations (6 types):**
Each layout type uses a different CSS arrangement. The `layoutType` prop determines which layout to render. Use `v-if` for simplicity (not dynamic CSS classes for 6 totally different layouts).

- `full-bleed`: Photo fills entire card, headline in colored bar overlay at bottom
- `side-split`: Photo left 50-60%, text right
- `photo-top`: Photo top 2/3, text band bottom 1/3
- `bold-graphic`: Large bold headline dominates, small photo, strong typography
- `before-after`: Two photos side by side (split vertical)
- `review-forward`: Large review quote with stars dominates, small photo

**Task 5: Create `PostcardBack.vue`**

Renders the BACK of a postcard. Left half is editable content, right half is locked USPS zones.

```vue
<template>
  <div class="postcard-back" :style="{ '--brand-primary': brandColors[0] }">
    <!-- TOP: Return address (locked) -->
    <div class="return-address">
      {{ brandKit.businessName }}<br/>
      {{ brandKit.address }}
    </div>

    <!-- TOP-RIGHT: Permit indicia (locked) -->
    <div class="permit-indicia">
      PRESORTED STD<br/>U.S. POSTAGE PAID
    </div>

    <!-- LEFT HALF: Customer content -->
    <div class="content-left">
      <h3 class="offer-headline">{{ content.offerText }}</h3>

      <!-- Review + stars -->
      <div v-if="content.reviewQuote" class="review-block">
        <div class="stars">★★★★★</div>
        <p class="review-quote">"{{ content.reviewQuote }}"</p>
        <p class="reviewer-name">— {{ content.reviewerName }}</p>
      </div>

      <!-- Phone -->
      <p class="phone-number">{{ content.phoneNumber }}</p>
      <p class="phone-cta">Call or text anytime</p>

      <!-- QR Code placeholder -->
      <div class="qr-code">
        <div class="qr-placeholder">QR</div>
        <span>Scan for your special offer</span>
      </div>

      <!-- Risk reversal -->
      <p class="risk-reversal">{{ content.riskReversal }}</p>

      <!-- Company address + years -->
      <p class="company-info">
        {{ backContent.companyAddress }}
        <span v-if="brandKit.yearsInBusiness">
          · Serving {{ brandKit.location }} since {{ 2026 - brandKit.yearsInBusiness }}
        </span>
      </p>

      <!-- Website URL -->
      <p v-if="backContent.websiteUrl" class="website-url">{{ backContent.websiteUrl }}</p>

      <!-- Urgency -->
      <p class="urgency">{{ content.urgencyText }}</p>
    </div>

    <!-- RIGHT HALF: Locked USPS zone -->
    <LockedZoneOverlay>
      <div class="address-block">
        <p class="recipient-name">JANE SMITH</p>
        <p>1234 MAIN ST</p>
        <p>SCOTTSDALE AZ 85251</p>
      </div>
      <div class="imb-barcode">
        ||||||||||||||||||||||||||||||||
      </div>
    </LockedZoneOverlay>
  </div>
</template>
```

**Task 6: Create `LockedZoneOverlay.vue`**
- Gray semi-transparent overlay with lock icon
- "Required by USPS" label
- Cannot be clicked through to edit
- Clear visual boundary between editable and locked zones

**Task 7: Create `PostcardPreview.vue`**
- Wrapper that renders `PostcardFront` or `PostcardBack`
- Flip button to toggle front/back
- Size modes: `thumbnail` (small, in sequence view) and `large` (main preview)
- Large mode shows at 6x9 proportions, max width ~600px
- Thumbnail: max width ~180px

### Phase 3: Editing Components

**Task 8: Create `EditPanel.vue`**

Right-side panel with labeled buttons for each editable element:

```vue
<template>
  <div class="w-80 border-l border-[#e2e8f0] p-5 space-y-3 overflow-y-auto">
    <h3 class="text-sm font-semibold text-[#64748b] uppercase tracking-wider">Edit Card {{ activeCard }}</h3>

    <button @click="activeEditor = 'photo'" class="edit-btn">
      <PhotoIcon class="w-5 h-5" />
      Change Photo
    </button>
    <button @click="activeEditor = 'headline'" class="edit-btn">
      <TypeIcon class="w-5 h-5" />
      Edit Headline
    </button>
    <button @click="activeEditor = 'offer'" class="edit-btn">
      <TagIcon class="w-5 h-5" />
      Edit Offer
    </button>
    <button @click="activeEditor = 'review'" class="edit-btn">
      <StarIcon class="w-5 h-5" />
      Change Review
    </button>
    <button @click="activeEditor = 'colors'" class="edit-btn">
      <PaletteIcon class="w-5 h-5" />
      Change Colors
    </button>

    <hr class="border-[#e2e8f0]" />

    <button @click="showTemplateBrowser = true" class="edit-btn text-[#47bfa9]">
      <LayoutIcon class="w-5 h-5" />
      Try Different Template
    </button>

    <button @click="resetToGenerated" class="text-sm text-[#94a3b8] hover:text-[#64748b]">
      Reset to Original
    </button>

    <!-- Inline editors (expand when clicked) -->
    <EditHeadline v-if="activeEditor === 'headline'" ... />
    <EditOffer v-if="activeEditor === 'offer'" ... />
    <EditReview v-if="activeEditor === 'review'" ... />
    <EditPhoto v-if="activeEditor === 'photo'" ... />
    <EditColors v-if="activeEditor === 'colors'" ... />
  </div>
</template>
```

**Task 9: Create individual editors**

**`EditHeadline.vue`:**
- Shows 3 headline options (mock AI-generated from `usePostcardGenerator`)
- Radio buttons to pick one, OR custom text input
- Character counter (max 50 chars for front headline)
- Live preview updates as they type/select

**`EditOffer.vue`:**
- Text area for offer text (max 200 chars for back)
- Pre-filled with brand kit's scraped offer or industry default
- Character counter
- Suggestion text: "Tip: Value stacks work best — list what's included with dollar values"

**`EditReview.vue`:**
- Dropdown of available reviews from brand kit
- Each shows: quote excerpt + reviewer name + star rating
- "Why this review" tooltip (Kennedy/Halbert reasoning from brand kit)
- "Paste a review" text input as fallback

**`EditPhoto.vue`:**
- Grid of available photos: brand kit photos first, then stock photos for their industry
- Click to select, preview updates immediately
- Upload button: "Upload from your computer" (file input, max 10MB, jpg/png)
- Photo quality indicator for each option

**`EditColors.vue`:**
- Brand palette shown (2-3 colors from brand kit)
- 3-4 recommended accent colors (curated, not full spectrum picker — Schoger)
- Click a color to apply as primary accent
- Preview updates immediately
- "Apply to all cards?" prompt when changing colors on one card

**Task 10: Create `CharacterCounter.vue`**
```vue
<template>
  <div class="flex justify-between text-xs mt-1">
    <span :class="{ 'text-red-500': remaining < 0, 'text-[#94a3b8]': remaining >= 0 }">
      {{ remaining }} characters remaining
    </span>
  </div>
</template>
```

### Phase 4: Sequence View + Template Browser

**Task 11: Create `SequenceView.vue`**

Horizontal row of 3 card thumbnails above the main preview:

```vue
<template>
  <div class="flex gap-4 mb-6">
    <div v-if="sequenceLength > 1" class="text-sm text-[#64748b] mb-2">
      Your {{ sequenceLength }}-card sequence — same branding, different messaging:
    </div>
    <div class="flex gap-3">
      <div
        v-for="card in cards"
        :key="card.cardNumber"
        @click="$emit('select-card', card.cardNumber)"
        :class="[
          'cursor-pointer rounded-lg border-2 transition-all',
          card.cardNumber === activeCard
            ? 'border-[#47bfa9] shadow-md'
            : 'border-[#e2e8f0] hover:border-[#b6c0dc]'
        ]"
      >
        <PostcardPreview :card="card" :brand-kit="brandKit" size="thumbnail" side="front" />
        <div class="text-center text-xs py-1 text-[#64748b]">
          Card {{ card.cardNumber }}: {{ cardLabel(card.cardPurpose) }}
        </div>
      </div>
    </div>
  </div>
</template>
```

Labels:
- Card 1: "The Offer"
- Card 2: "Social Proof"
- Card 3: "Last Chance"

**Task 12: Create `TemplateBrowser.vue`**

Slide-in panel or modal showing alternative templates:

```vue
<template>
  <div class="fixed inset-0 bg-black/30 z-50 flex justify-end">
    <div class="w-[480px] bg-white h-full overflow-y-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-semibold text-[#0b2d50]">Choose a Template Style</h2>
        <button @click="$emit('close')" class="text-[#94a3b8]">✕</button>
      </div>

      <p class="text-sm text-[#64748b] mb-4">
        Templates are filtered for {{ goalLabel }} campaigns.
        Your content auto-fills into any template you pick.
      </p>

      <div class="space-y-4">
        <TemplateCard
          v-for="template in filteredTemplates"
          :key="template.id"
          :template="template"
          :is-recommended="template.id === recommendedId"
          :brand-kit="brandKit"
          @select="selectTemplate(template)"
        />
      </div>

      <button @click="showMore = !showMore" v-if="hiddenTemplates.length" class="text-sm text-[#47bfa9] mt-4">
        {{ showMore ? 'Show fewer' : `More styles (${hiddenTemplates.length})` }}
      </button>
    </div>
  </div>
</template>
```

- Filtered by campaign goal + industry (3-6 relevant options, not all 18)
- "Best Match" star on recommended template
- Templates shown as SEQUENCE SETS (3 coordinated cards)
- Each template auto-populates with THEIR brand kit data when clicked
- "More styles" expandable for additional options

### Phase 5: Integration + Main Component

**Task 13: Create `StepDesign.vue` (main orchestrator)**

```vue
<script setup lang="ts">
import { useCampaignDraftStore } from '@/stores/useCampaignDraftStore'
import { useBrandKitStore } from '@/stores/useBrandKitStore'
import { usePostcardGenerator } from '@/composables/usePostcardGenerator'

const draftStore = useCampaignDraftStore()
const brandKitStore = useBrandKitStore()
const generator = usePostcardGenerator()

const activeCardNumber = ref(1)
const showTemplateBrowser = ref(false)
const showFrontSide = ref(true)

// Generate cards on mount (or use existing design from draft)
const cards = ref<CardDesign[]>([])

onMounted(() => {
  if (draftStore.draft?.design) {
    // Resume from saved design
    cards.value = draftStore.draft.design.sequenceCards
  } else {
    // Auto-generate from brand kit + goal + targeting
    const goal = draftStore.draft!.goal!
    const targeting = draftStore.draft!.targeting!
    cards.value = generator.generateCards(
      brandKitStore.brandKit!,
      goal.goalType,
      goal.sequenceLength,
      targeting.recipientBreakdown,
    )
  }
})

const activeCard = computed(() =>
  cards.value.find(c => c.cardNumber === activeCardNumber.value)
)

// Apply edits as overrides (keep template defaults intact)
function updateCardField(field: string, value: string) {
  if (!activeCard.value) return
  ;(activeCard.value.overrides as any)[field] = value
  ;(activeCard.value.resolvedContent as any)[field] = value
  commitDesign()
}

function selectTemplate(template: TemplateDefinition) {
  // Regenerate all cards with new template layout
  cards.value = generator.generateCards(...)
  // Re-apply any existing overrides
  showTemplateBrowser.value = false
  commitDesign()
}

function commitDesign() {
  const design: DesignSelection = {
    templateId: cards.value[0].templateId,
    templateLayoutType: /* from template */,
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: cards.value,
  }
  draftStore.setDesign(design)
}

// Apply color change to all cards prompt
function changeColors(color: string, applyToAll: boolean) {
  if (applyToAll) {
    cards.value.forEach(c => { /* update color */ })
  } else {
    // update only active card
  }
  commitDesign()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Sequence selector (top) -->
    <SequenceView
      v-if="cards.length > 1"
      :cards="cards"
      :active-card="activeCardNumber"
      :brand-kit="brandKitStore.brandKit!"
      @select-card="activeCardNumber = $event"
    />

    <!-- Main area: Preview + Edit Panel -->
    <div class="flex flex-1 min-h-0">
      <!-- Postcard Preview (left, centered) -->
      <div class="flex-1 flex items-center justify-center p-8 bg-[#f8f9fb]">
        <div class="max-w-[600px] w-full">
          <PostcardPreview
            v-if="activeCard"
            :card="activeCard"
            :brand-kit="brandKitStore.brandKit!"
            size="large"
            :side="showFrontSide ? 'front' : 'back'"
          />
          <button
            @click="showFrontSide = !showFrontSide"
            class="mt-3 text-sm text-[#47bfa9] mx-auto block"
          >
            {{ showFrontSide ? 'Show back →' : '← Show front' }}
          </button>
        </div>
      </div>

      <!-- Edit Panel (right) -->
      <EditPanel
        v-if="activeCard"
        :card="activeCard"
        :brand-kit="brandKitStore.brandKit!"
        @update-field="updateCardField"
        @open-templates="showTemplateBrowser = true"
        @reset="resetCard"
      />
    </div>

    <!-- Template Browser (overlay) -->
    <TemplateBrowser
      v-if="showTemplateBrowser"
      :goal="draftStore.draft!.goal!.goalType"
      :brand-kit="brandKitStore.brandKit!"
      @select="selectTemplate"
      @close="showTemplateBrowser = false"
    />
  </div>
</template>
```

---

## Expert Checkpoints

| After Task | Expert | Check |
|-----------|--------|-------|
| Task 1 (templates) | Gendusa + Kennedy | Are the 6 layouts correct? Card 1/2/3 messaging escalation right? |
| Task 1 (templates) | Draplin | Bold, confident, American aesthetic? Not trendy or corporate? |
| Task 3 (generator) | Beck | Is the generator logic clean? Easy to swap mock content for real AI later? |
| Task 4-5 (preview) | Whitman | Z-pattern on front, F-pattern on back? Visual flow correct? |
| Task 4-5 (preview) | Heath | SUCCESs check: Simple? Unexpected? Concrete? Credible? Emotional? Story? |
| Task 8 (edit panel) | Krug | "Change the words" vs "Try a different look" — labels clear? |
| Task 8 (edit panel) | DHH | Too many edit options? Would fewer be better? |
| Task 9 (editors) | Wiebe | Button labels, placeholder text, suggestion copy all in customer's voice? |
| Task 12 (templates) | Norman | What if they can't decide? (Recommended template is starred. Max 6 options.) |
| Task 13 (main) | Hendrickson | Edge cases: no brand kit? No photos? No reviews? Every element has a fallback? |

---

## Done Criteria

- [ ] Step 3 opens with an auto-generated postcard (not blank, not a picker)
- [ ] Postcard shows real brand kit data (business name, phone, logo, colors)
- [ ] Front layout matches the recommended template for the campaign goal
- [ ] Back shows: offer, review, phone, QR placeholder, risk reversal, locked USPS zone
- [ ] 3-card sequence view shows all cards with different content per Kennedy's escalation
- [ ] Clicking a card thumbnail switches the main preview
- [ ] Front/back flip button works
- [ ] Edit panel opens inline editors for each element
- [ ] Headline editor shows 3 options + custom text input with character counter
- [ ] Offer, review, photo, color editors all work and update preview in real time
- [ ] "Try Different Template" opens browser with 3-6 filtered options
- [ ] Selecting a template auto-populates with brand kit data instantly
- [ ] "Reset to Original" restores auto-generated content
- [ ] Color change prompt: "Apply to all cards?" when editing one card
- [ ] Locked USPS zones are visually distinct and non-interactive
- [ ] Data writes to `useCampaignDraftStore.setDesign()` correctly
- [ ] Every element has a fallback (no brand kit → text logo, no photo → stock, etc.)
- [ ] No console errors, no TypeScript errors

---

## Data Flow Summary

```
Brand Kit Store              Step 1 (Goal)           Step 2 (Targeting)
─────────────              ────────────           ──────────────────
businessName     ──►        goalType ──────►       recipientBreakdown ──►
phone            ──►        serviceType ──►                              │
logoUrl          ──►        sequenceLength ──►     ┌─────────────────────┘
brandColors      ──►                               │
photos           ──►        Step 3 (This Terminal) ◄┘
reviews          ──►        ─────────────────────
certifications   ──►        usePostcardGenerator merges all inputs
guarantees       ──►        → auto-generated CardDesign[]
offers           ──►        → user edits stored as overrides
                            → DesignSelection written to draft store
                                                    │
                                              DesignSelection ──► Step 4 (Review)
                                                                  shows previews
                                                                  + PDF proof
```
