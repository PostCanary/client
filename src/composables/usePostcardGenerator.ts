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
// D-09 (Phase 2): normalize logoUrl so empty strings and undefined both
// become null, triggering the wordmark fallback in PostcardFront.vue.
// Firecrawl returns empty logoUrl when scraping misses a CSS background-
// image logo (RISK-02 in research). The wordmark is the production
// safety net for every such business.
// ---------------------------------------------------------------------------
export function normalizeLogoUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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

// Front-of-card offer teaser (≤4 words, uppercase). One per goal type.
// These render inside OfferBadge — the "$79 OFF" / "FREE ESTIMATE" burst
// that sits on the hero photo. This is the front counterpart to the
// stacked value-stack OfferBox on the back. Added 2026-04-09 per visual
// taste audit finding (front-of-card offer present in 100% of PostcardMania
// HVAC samples).
//
// Typed against CampaignGoalType so TS catches key typos. Every goal in the
// enum must have an entry (enforced via Record<CampaignGoalType, string>).
//
// Defaults for cross_service_promo, new_mover, and other are deliberately
// neutral ("SPECIAL OFFER" / "FREE ESTIMATE") rather than a fabricated
// dollar amount — these goals don't have a single canonical discount the
// business has committed to, and inventing one would show a price the
// business never agreed to.
const TEASERS: Record<CampaignGoalType, string> = {
  neighbor_marketing:  "$50 OFF",
  seasonal_tuneup:     "$79 TUNE-UP",
  target_area:         "$50 OFF",
  storm_response:      "FREE ESTIMATE",
  win_back:            "15% OFF",
  cross_service_promo: "SPECIAL OFFER",
  new_mover:           "WELCOME OFFER",
  other:               "SPECIAL OFFER",
};

const DEFAULT_TEASER = "SPECIAL OFFER";

// Salient follow-up nouns for price anchors ("$79 TUNE-UP" > "$79 AC").
// When a price anchor like "$79 AC Tune-Up" is encountered, prefer one of
// these terms over whatever token happens to appear first.
const PREFERRED_SERVICE_NOUNS = [
  "TUNE-UP",
  "TUNE UP",
  "MAINTENANCE",
  "INSPECTION",
  "SERVICE",
  "INSTALL",
  "REPAIR",
  "CLEANING",
  "CHECK-UP",
  "CHECKUP",
];

// Truncate a UTF-8-ish string at the last word boundary that fits within
// `maxChars`. Never cut mid-word. Used for free-noun teasers so
// "FREE DRAIN CLEANING" doesn't become "FREE DRAIN CLEANI".
function truncateAtWord(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str;
  const slice = str.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
}

// Best-effort teaser derivation from a full offer text string. Parses
// explicit discount phrases — "$50 off", "10% off", "free X" — in a single
// pass with word-boundary regex. If nothing matches, falls back to the
// goal-type default.
//
// Does NOT fabricate discounts from bare price anchors. "JUST $79" on its
// own is a price, not a discount — previous implementation turned this into
// "$79 OFF" which was wrong.
//
// Examples (verified against the regexes below):
//  "$50 off your first service"        -> "$50 OFF"
//  "Save $50 on repairs over $500"     -> "$50 OFF"  (first `$N off` wins)
//  "Free Drain Cleaning"               -> "FREE DRAIN CLEANING"
//  "Free 24/7 Service"                 -> "FREE 24/7 SERVICE"
//  "Free $100 Credit"                  -> "FREE $100 CREDIT"
//  "$79 AC Tune-Up"                    -> "$79 TUNE-UP" (prefers salient noun)
//  "$79 A/C Maintenance"               -> "$79 MAINTENANCE"
//  "$79 Office Visit"                  -> "$79 OFFICE" (not "$79 OFF"!)
//  "10% off any repair"                -> "10% OFF"
//  "Free estimate + 10% off"           -> "FREE ESTIMATE" (earliest wins)
//  "Insurance Claim Assistance"        -> goal-type fallback
export function deriveTeaser(
  offerText: string,
  goalType: CampaignGoalType | string,
): string {
  const goalFallback =
    (TEASERS as Record<string, string>)[goalType] ?? DEFAULT_TEASER;
  if (!offerText) return goalFallback;

  const lower = offerText.toLowerCase();

  // 1. Earliest-match-wins: find the first recognized incentive phrase in
  //    the string. This is text-order, not category priority, so
  //    "free estimate + 10% off" picks "FREE ESTIMATE" (the lead offer),
  //    not "10% OFF".
  interface Match {
    index: number;
    teaser: string;
  }
  const candidates: Match[] = [];

  // (a) "$N off" OR "save $N" — dollar discount. Word-boundary /off/ avoids
  //     matching "offer", "office", "offers". "save $N" is a common way
  //     to express a dollar discount without the literal word "off".
  {
    const m = lower.match(/\$(\d{1,4})\s+off\b/);
    if (m && m.index !== undefined) {
      candidates.push({ index: m.index, teaser: `$${m[1]} OFF` });
    }
    const saveDollar = lower.match(/\bsave\s+\$(\d{1,4})\b/);
    if (saveDollar && saveDollar.index !== undefined) {
      candidates.push({
        index: saveDollar.index,
        teaser: `$${saveDollar[1]} OFF`,
      });
    }
  }

  // (b) "N% off" OR "save N%" — percent discount.
  {
    const m = lower.match(/(\d{1,2})%\s+off\b/);
    if (m && m.index !== undefined) {
      candidates.push({ index: m.index, teaser: `${m[1]}% OFF` });
    }
    const savePercent = lower.match(/\bsave\s+(\d{1,2})%/);
    if (savePercent && savePercent.index !== undefined) {
      candidates.push({
        index: savePercent.index,
        teaser: `${savePercent[1]}% OFF`,
      });
    }
  }

  // (c) "Free <phrase>" — use the actual noun phrase, not hardcoded
  //     "ESTIMATE". Allows numeric/$ leading tokens so "Free 24/7 Service",
  //     "Free $100 Credit", "Free 2nd Opinion" all match.
  //     Captures up to 3 whitespace-separated tokens where each token is
  //     either a word, a number (possibly $N), or a short alphanumeric
  //     like "A/C". Word boundary before "free" avoids "freeze" / "freeway".
  {
    const tokenRe = /[$A-Za-z0-9][A-Za-z0-9/\-]*/.source;
    const re = new RegExp(`\\bfree\\s+(${tokenRe}(?:\\s+${tokenRe}){0,2})`, "i");
    const m = offerText.match(re);
    if (m && m.index !== undefined) {
      const raw = m[1].trim().toUpperCase();
      const capped = truncateAtWord(raw, 20);
      candidates.push({
        index: m.index,
        teaser: `FREE ${capped}`,
      });
    }
  }

  // (d) "$N <noun>" — price anchor with following words. Captures up to 3
  //     tokens after the dollar amount, then picks the most salient noun
  //     phrase (TUNE-UP / MAINTENANCE / SERVICE / INSTALL / REPAIR /
  //     CLEANING / INSPECTION / CHECK-UP) if one appears in the captured
  //     phrase; otherwise first token. Uses substring .includes() so that
  //     multi-word entries ("TUNE UP", "CHECK UP") work even when
  //     .split(/\s+/) would split them into separate tokens.
  //     Tokens accept A/C, HVAC, alphanumerics.
  {
    const tokenRe = /[A-Za-z][A-Za-z0-9/\-]*/.source;
    const re = new RegExp(`\\$(\\d{1,4})\\s+(${tokenRe}(?:\\s+${tokenRe}){0,2})`);
    const m = offerText.match(re);
    if (m && m.index !== undefined) {
      const amount = `$${m[1]}`;
      const phraseUpper = m[2].toUpperCase();
      // Prefer the first salient service noun phrase that APPEARS in the
      // captured text (substring match, not token match — so multi-word
      // entries like "TUNE UP" / "CHECK UP" work).
      const salient = PREFERRED_SERVICE_NOUNS.find((noun) =>
        phraseUpper.includes(noun),
      );
      const chosen = salient ?? phraseUpper.split(/\s+/)[0];
      candidates.push({
        index: m.index,
        teaser: `${amount} ${chosen}`,
      });
    }
  }

  // 2. Return the earliest-appearing recognized phrase.
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.index - b.index);
    return candidates[0]!.teaser;
  }

  // 3. Nothing matched — goal-type fallback.
  return goalFallback;
}

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
    ...(brandKit.photos ?? [])
      .filter((p) => p.printReady !== false)
      .sort((a, b) => b.qualityScore - a.qualityScore),
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
        offerTeaser: deriveTeaser(offerText, goalType),
        // P0-F content density 2026-04-10: local generator returns empty
        // offerItems because deriving per-service dollar values without
        // customer input risks fabricating prices (Kennedy/Halbert: use
        // THEIR offer, don't invent). Server AI generator (Brief #6 Task 10)
        // will populate real items from brandKit.serviceTypes crossed with
        // their published pricing. Until then, empty = OfferBox renders
        // headline + deadline only (same as pre-2026-04-10 behavior).
        offerItems: [],
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
  goalType: string,
): CardDesign {
  const photos = [
    ...(brandKit.photos ?? [])
      .filter((p) => p.printReady !== false)
      .sort((a, b) => b.qualityScore - a.qualityScore),
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
      offerTeaser: deriveTeaser(card.offer.text, goalType),
      // Server mapper for AI-generated cards. The server currently does
      // not return structured offer stack items (Brief #6 Task 10 is
      // where that gets wired — the Kennedy/Halbert "anchored value
      // stack" work). Until the server emits items, mapServerCardToDesign
      // falls back to empty, same as the local generator. When the server
      // adds an `offer_stack` field, map it here:
      //     offerItems: (card.offer.stack ?? []).map(...)
      offerItems: [],
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
        goalType,
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
