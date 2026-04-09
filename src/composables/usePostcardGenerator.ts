// src/composables/usePostcardGenerator.ts
// Server-backed AI content generation with local fallback
import type {
  BrandKit,
  CampaignGoalType,
  CardDesign,
  CardPurpose,
  RecipientBreakdown,
  TemplateLayoutType,
} from "@/types/campaign";
import { getRecommendedTemplateSet, ALL_TEMPLATES } from "@/data/templates";
import { getPhotosForIndustry } from "@/data/stockPhotos";
import { generateContent } from "@/api/brandKit";
import type { GeneratedCardContent } from "@/api/brandKit";

// ---------------------------------------------------------------------------
// Local fallback content (used when API is unavailable)
// ---------------------------------------------------------------------------

const HEADLINES: Record<CardPurpose, Record<string, string[]>> = {
  offer: {
    default: [
      "Your Neighbors Trust {business}",
      "{business} — Serving {location}",
      "Special Offer from {business}",
    ],
    storm_response: [
      "Storm Damage? {business} Can Help",
      "Emergency Repairs — {business}",
      "Fast Response from {business}",
    ],
  },
  proof: {
    default: [
      "See Why {location} Chooses {business}",
      "{rating}★ Rated — {business}",
      "Your Neighbors Already Know {business}",
    ],
  },
  last_chance: {
    default: [
      "Last Chance — {business} Special Ends Soon",
      "Don't Miss Out — {business}",
      "Final Reminder from {business}",
    ],
  },
};

const OFFERS: Record<string, string[]> = {
  default: [
    "$50 Off Your First Service",
    "Free Estimate + 10% Off",
    "New Customer Special — Save $75",
  ],
  storm_response: [
    "Free Storm Damage Assessment",
    "Emergency Service — No Extra Charge",
    "Insurance Claim Assistance Included",
  ],
  win_back: [
    "We Miss You — $40 Off Your Next Visit",
    "Come Back Special — 15% Off",
    "Loyalty Discount — $60 Off",
  ],
};

const URGENCY: Record<CardPurpose, string> = {
  offer: "Limited spots this month",
  proof: "Only a few spots left this week",
  last_chance: "Offer expires in 7 days",
};

function fillTemplate(tmpl: string, vars: Record<string, string>): string {
  let result = tmpl;
  for (const [key, val] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(val);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Local fallback generator (same as Round 1)
// ---------------------------------------------------------------------------

function generateCardsLocal(
  brandKit: BrandKit,
  goalType: CampaignGoalType,
  sequenceLength: number,
  recipientBreakdown: RecipientBreakdown,
): CardDesign[] {
  const templates = getRecommendedTemplateSet(goalType);
  const photos = [
    ...(brandKit.photos ?? []).sort((a, b) => b.qualityScore - a.qualityScore),
    ...getPhotosForIndustry(brandKit.industry).map((p) => ({
      url: p.url,
      qualityScore: 50,
      source: "stock" as const,
      alt: p.description,
    })),
  ];

  const vars = {
    business: brandKit.businessName || "Your Business",
    location: brandKit.location || "your area",
    rating: String(brandKit.googleRating ?? 5),
  };

  const isWarm =
    recipientBreakdown.pastCustomersIncluded &&
    recipientBreakdown.pastCustomers > recipientBreakdown.newProspects * 0.5;

  const purposes: CardPurpose[] = ["offer", "proof", "last_chance"];

  return purposes.slice(0, sequenceLength).map((purpose, i) => {
    const template = templates[i] ?? templates[0]!;
    const headlinePool =
      HEADLINES[purpose]?.[goalType] ?? HEADLINES[purpose]?.default ?? [];
    const headline = fillTemplate(
      headlinePool[0] ?? `${brandKit.businessName} — ${purpose}`,
      vars,
    );

    const offerPool = OFFERS[goalType] ?? OFFERS.default ?? [];
    const offerText =
      brandKit.currentOffers?.[0] ??
      offerPool[i % Math.max(offerPool.length, 1)] ??
      "";

    const review = brandKit.reviews?.[0];
    const photo = photos[i % Math.max(photos.length, 1)];

    return {
      cardNumber: i + 1,
      cardPurpose: purpose,
      templateId: template.id,
      previewImageUrl: "",
      overrides: {},
      resolvedContent: {
        headline,
        offerText:
          isWarm && purpose === "offer"
            ? `Welcome back! ${offerText}`
            : offerText,
        photoUrl: photo?.url ?? "",
        reviewQuote: review?.quote ?? "Professional, reliable service!",
        reviewerName: review?.reviewerName ?? "A Happy Customer",
        phoneNumber: brandKit.phone ?? "(555) 123-4567",
        urgencyText: URGENCY[purpose],
        riskReversal:
          brandKit.guarantees?.[0] ?? "100% Satisfaction Guaranteed",
        trustSignals: brandKit.certifications?.slice(0, 3) ?? [
          "Licensed & Insured",
        ],
      },
      backContent: {
        guarantee:
          brandKit.guarantees?.[0] ?? "100% Satisfaction Guaranteed",
        certifications: brandKit.certifications ?? ["Licensed & Insured"],
        licenseNumber: "",
        companyAddress: brandKit.address ?? "",
        websiteUrl: brandKit.websiteUrl ?? "",
        // Brief #6 P0 #3: QR image is server-generated at brand kit save
        // (brand_kit._scrape_job / update_brand_kit). Null when neither
        // websiteUrl nor phone yields a target; CTABox handles empty string.
        qrCodeUrl: brandKit.qrCodeImageUrl ?? "",
      },
      headlineCandidates: [],
      offerReason: "",
      reviewReason: "",
      templateReason: "",
    };
  });
}

// ---------------------------------------------------------------------------
// Template lookup helper
// ---------------------------------------------------------------------------

function findTemplateByLayout(
  layoutType: string,
  cardPurpose: CardPurpose,
): string {
  const match = ALL_TEMPLATES.find(
    (t) => t.layoutType === layoutType && t.cardPosition === cardPurpose,
  );
  return match?.id ?? `${layoutType}-${cardPurpose}`;
}

// ---------------------------------------------------------------------------
// Map server response to CardDesign
// ---------------------------------------------------------------------------

function mapServerCardToDesign(
  card: GeneratedCardContent,
  index: number,
  brandKit: BrandKit,
  purpose: CardPurpose,
  fallbackTemplateId: string,
): CardDesign {
  const photos = [
    ...(brandKit.photos ?? []).sort((a, b) => b.qualityScore - a.qualityScore),
    ...getPhotosForIndustry(brandKit.industry).map((p) => ({
      url: p.url,
      qualityScore: 50,
      source: "stock" as const,
      alt: p.description,
    })),
  ];
  const photo = photos[index % Math.max(photos.length, 1)];

  // Map templateRecommendation to a template ID
  const templateId = card.templateRecommendation
    ? findTemplateByLayout(card.templateRecommendation, purpose)
    : fallbackTemplateId;

  return {
    cardNumber: index + 1,
    cardPurpose: purpose,
    templateId,
    previewImageUrl: "",
    overrides: {},
    resolvedContent: {
      headline: card.headlines[0]?.text ?? `${brandKit.businessName} — Special Offer`,
      offerText: card.offer.text,
      photoUrl: photo?.url ?? "",
      reviewQuote:
        card.selectedReview?.quote ?? "Professional, reliable service!",
      reviewerName:
        card.selectedReview?.reviewerName ?? "A Happy Customer",
      phoneNumber: brandKit.phone ?? "(555) 123-4567",
      urgencyText: URGENCY[purpose],
      riskReversal:
        brandKit.guarantees?.[0] ?? "100% Satisfaction Guaranteed",
      trustSignals: brandKit.certifications?.slice(0, 3) ?? [
        "Licensed & Insured",
      ],
    },
    backContent: {
      guarantee:
        brandKit.guarantees?.[0] ?? "100% Satisfaction Guaranteed",
      certifications: brandKit.certifications ?? ["Licensed & Insured"],
      licenseNumber: "",
      companyAddress: brandKit.address ?? "",
      websiteUrl: brandKit.websiteUrl ?? "",
      // Brief #6 P0 #3: QR from brand kit (server-generated). See note
      // in generateCardsLocal above for rationale.
      qrCodeUrl: brandKit.qrCodeImageUrl ?? "",
    },
    headlineCandidates: card.headlines,
    offerReason: card.offer.reason,
    reviewReason: card.selectedReview?.reason ?? "",
    templateReason: card.templateReason,
  };
}

// ---------------------------------------------------------------------------
// Main export: async server-backed generation with local fallback
// ---------------------------------------------------------------------------

export async function generateCards(
  brandKit: BrandKit,
  goalType: CampaignGoalType,
  sequenceLength: number,
  recipientBreakdown: RecipientBreakdown,
): Promise<CardDesign[]> {
  const purposes: CardPurpose[] = ["offer", "proof", "last_chance"];
  const cardPurposes = purposes.slice(0, sequenceLength);

  // Skip API call in mock mode
  if (import.meta.env.VITE_SKIP_AUTH === "true") {
    return generateCardsLocal(brandKit, goalType, sequenceLength, recipientBreakdown);
  }

  try {
    const response = await generateContent({
      goal_type: goalType,
      card_purposes: cardPurposes,
      recipient_type: recipientBreakdown.pastCustomersIncluded ? "warm" : "cold",
    });

    const fallbackTemplates = getRecommendedTemplateSet(goalType);

    return response.cards.map((card, i) =>
      mapServerCardToDesign(
        card,
        i,
        brandKit,
        cardPurposes[i],
        fallbackTemplates[i]?.id ?? fallbackTemplates[0]?.id ?? "full-bleed-offer",
      ),
    );
  } catch (err) {
    console.error("AI generation failed, using local fallback:", err);
    return generateCardsLocal(
      brandKit,
      goalType,
      sequenceLength,
      recipientBreakdown,
    );
  }
}
