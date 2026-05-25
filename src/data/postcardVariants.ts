import type { CardDesign, CardPurpose } from "@/types/campaign";

export type PostcardVariantType =
  | "thank_you"
  | "referral_incentive"
  | "refer_for_me";

export type PostcardVariantSourceKind = "job" | "campaign" | "manual";

export interface PostcardVariantPayload {
  variantType: PostcardVariantType;
  orgId: string;
  source: {
    kind: PostcardVariantSourceKind;
    sourceId: string;
    occurredAt?: string;
  };
  recipient: {
    firstName?: string;
    fullName?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  service?: {
    serviceType?: string;
    jobDate?: string;
    jobValueCents?: number;
  };
  brandSnapshot: {
    businessName: string;
    phone: string;
    websiteUrl?: string;
    logoUrl?: string;
    brandColors?: string[];
    industry?: string;
  };
  offer?: {
    headline?: string;
    body?: string;
    terms?: string;
    expiresAt?: string;
  };
  referral?: {
    code?: string;
    url?: string;
    qrCodeUrl?: string;
    referrerReward?: string;
    friendReward?: string;
  };
  compliance?: {
    canUseCustomerName: boolean;
    canMentionService: boolean;
    suppressPersonalizationReason?: string;
  };
}

export interface VariantCardDesignOptions {
  cardNumber?: number;
  templateId?: string;
  photoUrl?: string;
  previewImageUrl?: string;
}

const DEFAULT_TEMPLATE_ID = "hac-1000-front-v1";
const SOURCE_KINDS: ReadonlySet<string> = new Set(["job", "campaign", "manual"]);

function requireField(value: unknown, message: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }
}

function assertBasePayload(payload: PostcardVariantPayload) {
  requireField(payload.orgId, "variant payload requires orgId");
  requireField(payload.source?.kind, "variant payload requires source.kind");
  if (!SOURCE_KINDS.has(payload.source.kind)) {
    throw new Error(`unsupported variant source.kind: ${payload.source.kind}`);
  }
  requireField(payload.source?.sourceId, "variant payload requires source.sourceId");
  requireField(payload.recipient?.addressLine1, "variant payload requires recipient.addressLine1");
  requireField(payload.recipient?.city, "variant payload requires recipient.city");
  requireField(payload.recipient?.state, "variant payload requires recipient.state");
  requireField(payload.recipient?.zip, "variant payload requires recipient.zip");
  requireField(
    payload.brandSnapshot?.businessName,
    "variant payload requires brandSnapshot.businessName",
  );
  requireField(payload.brandSnapshot?.phone, "variant payload requires brandSnapshot.phone");
}

function assertVariantSpecificPayload(payload: PostcardVariantPayload) {
  if (payload.variantType === "thank_you") {
    if (payload.source.kind !== "job") {
      throw new Error("thank_you variants require source.kind=job");
    }
    return;
  }

  if (
    payload.variantType === "referral_incentive" ||
    payload.variantType === "refer_for_me"
  ) {
    requireField(payload.referral?.code, "referral variants require referral.code");
    requireField(payload.referral?.url, "referral variants require referral.url");
    return;
  }

  throw new Error(`unsupported postcard variant: ${payload.variantType}`);
}

export function validatePostcardVariantPayload(payload: PostcardVariantPayload) {
  assertBasePayload(payload);
  assertVariantSpecificPayload(payload);
}

function customerName(payload: PostcardVariantPayload): string | null {
  if (payload.compliance?.canUseCustomerName !== true) return null;
  return payload.recipient.firstName ?? payload.recipient.fullName ?? null;
}

function serviceName(payload: PostcardVariantPayload): string {
  if (payload.compliance?.canMentionService !== true) return "home service";
  return payload.service?.serviceType ?? "home service";
}

function cardPurposeForVariant(variantType: PostcardVariantType): CardPurpose {
  if (variantType === "thank_you") return "proof";
  if (variantType === "refer_for_me") return "proof";
  return "offer";
}

function headlineForVariant(payload: PostcardVariantPayload): string {
  const name = customerName(payload);
  const service = serviceName(payload);
  const business = payload.brandSnapshot.businessName;

  if (payload.offer?.headline) return payload.offer.headline;
  if (payload.variantType === "thank_you") {
    return name ? `Thanks, ${name}` : `Thank you for choosing ${business}`;
  }
  if (payload.variantType === "referral_incentive") {
    return payload.referral?.referrerReward && payload.referral?.friendReward
      ? `Give ${payload.referral.friendReward}, get ${payload.referral.referrerReward}`
      : `Refer a friend to ${business}`;
  }

  return payload.compliance?.canMentionService === true
    ? `Local homeowners trust ${business} for ${service}`
    : `Local homeowners trust ${business}`;
}

function offerTextForVariant(payload: PostcardVariantPayload): string {
  if (payload.offer?.body) return payload.offer.body;

  if (payload.variantType === "thank_you") {
    const service = serviceName(payload);
    return payload.compliance?.canMentionService === true
      ? `We appreciate the chance to help with your ${service}. Call us when you need us again.`
      : "We appreciate your business. Call us when you need us again.";
  }

  if (payload.variantType === "referral_incentive") {
    const parts = [
      payload.referral?.friendReward ? `Your friend gets ${payload.referral.friendReward}.` : "",
      payload.referral?.referrerReward ? `You get ${payload.referral.referrerReward}.` : "",
    ].filter(Boolean);
    return parts.length > 0
      ? parts.join(" ")
      : "Share your referral code with a friend and ask us about our current thank-you offer.";
  }

  return payload.referral?.friendReward
    ? `Book with this neighbor offer: ${payload.referral.friendReward}.`
    : "Ask about the neighbor offer when you call.";
}

function teaserForVariant(payload: PostcardVariantPayload): string {
  if (payload.variantType === "thank_you") return "THANK YOU";
  if (payload.variantType === "refer_for_me") return "NEIGHBOR OFFER";
  if (payload.referral?.friendReward && payload.referral?.referrerReward) {
    return "REFER & SAVE";
  }
  return "REFERRAL";
}

export function variantPayloadToCardDesign(
  payload: PostcardVariantPayload,
  options: VariantCardDesignOptions = {},
): CardDesign {
  validatePostcardVariantPayload(payload);

  const phone = payload.brandSnapshot.phone;
  const referralUrl = payload.referral?.qrCodeUrl ?? payload.referral?.url ?? "";
  const websiteUrl = payload.brandSnapshot.websiteUrl ?? "";

  return {
    cardNumber: options.cardNumber ?? 1,
    cardPurpose: cardPurposeForVariant(payload.variantType),
    templateId: options.templateId ?? DEFAULT_TEMPLATE_ID,
    previewImageUrl: options.previewImageUrl ?? "",
    overrides: {},
    resolvedContent: {
      headline: headlineForVariant(payload),
      offerText: offerTextForVariant(payload),
      offerTeaser: teaserForVariant(payload),
      offerItems: [],
      photoUrl: options.photoUrl ?? "",
      reviewQuote:
        payload.variantType === "refer_for_me"
          ? "Trusted by local homeowners."
          : "",
      reviewerName: "",
      phoneNumber: phone,
      urgencyText: payload.offer?.expiresAt
        ? `Offer expires ${payload.offer.expiresAt}`
        : "",
      riskReversal: "Satisfaction guaranteed.",
      trustSignals: [],
    },
    backContent: {
      guarantee: "Satisfaction guaranteed.",
      certifications: [],
      licenseNumber: "",
      companyAddress: "",
      websiteUrl,
      qrCodeUrl: referralUrl,
    },
    headlineCandidates: [],
    offerReason: "Mapped from approved postcard variant payload.",
    reviewReason:
      payload.variantType === "refer_for_me"
        ? "Generic local trust line used to avoid exposing private customer details."
        : "",
    templateReason:
      "Variant adapters intentionally map into the existing approved render template boundary.",
  };
}
