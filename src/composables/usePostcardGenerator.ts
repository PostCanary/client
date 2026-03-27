// src/composables/usePostcardGenerator.ts
// Client-side content generation for Round 1 (no AI service needed)
import type {
  BrandKit,
  CampaignGoalType,
  CardDesign,
  CardPurpose,
  RecipientBreakdown,
} from "@/types/campaign";
import { getRecommendedTemplateSet } from "@/data/templates";
import { getPhotosForIndustry } from "@/data/stockPhotos";

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

export function generateCards(
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

  // Determine messaging tone from recipient breakdown
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
      brandKit.currentOffers?.[0] ?? offerPool[i % Math.max(offerPool.length, 1)] ?? "";

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
        offerText: isWarm && purpose === "offer"
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
        qrCodeUrl: "",
      },
    };
  });
}
