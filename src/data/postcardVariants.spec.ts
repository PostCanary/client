import { describe, expect, it } from "vitest";

import {
  validatePostcardVariantPayload,
  variantPayloadToCardDesign,
  type PostcardVariantPayload,
} from "./postcardVariants";

function basePayload(
  overrides: Partial<PostcardVariantPayload> = {},
): PostcardVariantPayload {
  return {
    variantType: "thank_you",
    orgId: "org-1",
    source: { kind: "job", sourceId: "job-1" },
    recipient: {
      firstName: "Sarah",
      fullName: "Sarah Jones",
      addressLine1: "123 Main St",
      city: "Atlanta",
      state: "GA",
      zip: "30301",
    },
    service: { serviceType: "AC tune-up" },
    brandSnapshot: {
      businessName: "Canary HVAC",
      phone: "(404) 555-0100",
      websiteUrl: "postcanary.test",
    },
    compliance: {
      canUseCustomerName: true,
      canMentionService: true,
    },
    ...overrides,
  };
}

describe("postcard variant adapter", () => {
  it("maps thank-you payloads into existing CardDesign fields", () => {
    const card = variantPayloadToCardDesign(basePayload());

    expect(card.cardPurpose).toBe("proof");
    expect(card.templateId).toBe("hac-1000-front-v1");
    expect(card.resolvedContent.headline).toBe("Thanks, Sarah");
    expect(card.resolvedContent.offerText).toContain("AC tune-up");
    expect(card.resolvedContent.offerTeaser).toBe("THANK YOU");
    expect(card.backContent.qrCodeUrl).toBe("");
  });

  it("falls back to generic copy when personalization compliance is off", () => {
    const card = variantPayloadToCardDesign(
      basePayload({
        compliance: {
          canUseCustomerName: false,
          canMentionService: false,
          suppressPersonalizationReason: "No explicit testimonial release",
        },
      }),
    );

    expect(card.resolvedContent.headline).toBe(
      "Thank you for choosing Canary HVAC",
    );
    expect(card.resolvedContent.offerText).not.toContain("AC tune-up");
    expect(card.resolvedContent.offerText).toContain("We appreciate your business");
  });

  it("defaults missing compliance to no customer or service personalization", () => {
    const card = variantPayloadToCardDesign(
      basePayload({
        compliance: undefined,
      }),
    );

    expect(card.resolvedContent.headline).toBe(
      "Thank you for choosing Canary HVAC",
    );
    expect(card.resolvedContent.offerText).not.toContain("Sarah");
    expect(card.resolvedContent.offerText).not.toContain("AC tune-up");
  });

  it("maps referral incentive rewards and QR through existing back content", () => {
    const card = variantPayloadToCardDesign(
      basePayload({
        variantType: "referral_incentive",
        source: { kind: "campaign", sourceId: "campaign-1" },
        referral: {
          code: "SARAH50",
          url: "https://postcanary.test/r/SARAH50",
          qrCodeUrl: "/media/qr/SARAH50.png",
          referrerReward: "$50",
          friendReward: "$50",
        },
      }),
    );

    expect(card.cardPurpose).toBe("offer");
    expect(card.resolvedContent.headline).toBe("Give $50, get $50");
    expect(card.resolvedContent.offerText).toContain("Your friend gets $50.");
    expect(card.resolvedContent.offerText).toContain("You get $50.");
    expect(card.resolvedContent.offerTeaser).toBe("REFER & SAVE");
    expect(card.backContent.qrCodeUrl).toBe("/media/qr/SARAH50.png");
  });

  it("does not leak referral URLs into the brand website field", () => {
    const card = variantPayloadToCardDesign(
      basePayload({
        variantType: "referral_incentive",
        source: { kind: "campaign", sourceId: "campaign-1" },
        brandSnapshot: {
          businessName: "Canary HVAC",
          phone: "(404) 555-0100",
        },
        referral: {
          code: "SARAH50",
          url: "https://postcanary.test/r/SARAH50",
        },
      }),
    );

    expect(card.backContent.qrCodeUrl).toBe("https://postcanary.test/r/SARAH50");
    expect(card.backContent.websiteUrl).toBe("");
  });

  it("does not invent referral rewards when reward copy is missing", () => {
    const card = variantPayloadToCardDesign(
      basePayload({
        variantType: "referral_incentive",
        source: { kind: "manual", sourceId: "manual-1" },
        referral: {
          code: "GENERIC",
          url: "https://postcanary.test/r/GENERIC",
        },
      }),
    );

    expect(card.resolvedContent.headline).toBe("Refer a friend to Canary HVAC");
    expect(card.resolvedContent.offerText).toContain("current thank-you offer");
    expect(card.resolvedContent.offerText).not.toContain("$");
    expect(card.resolvedContent.offerTeaser).toBe("REFERRAL");
  });

  it("keeps refer-for-me proof generic unless compliance allows service detail", () => {
    const card = variantPayloadToCardDesign(
      basePayload({
        variantType: "refer_for_me",
        source: { kind: "manual", sourceId: "neighbor-1" },
        compliance: {
          canUseCustomerName: false,
          canMentionService: false,
        },
        referral: {
          code: "NEIGHBOR",
          url: "https://postcanary.test/r/NEIGHBOR",
          friendReward: "free estimate",
        },
      }),
    );

    expect(card.cardPurpose).toBe("proof");
    expect(card.resolvedContent.headline).toBe(
      "Local homeowners trust Canary HVAC",
    );
    expect(card.resolvedContent.reviewQuote).toBe("Trusted by local homeowners.");
    expect(card.resolvedContent.offerTeaser).toBe("NEIGHBOR OFFER");
  });

  it("validates required shared and variant-specific fields", () => {
    expect(() =>
      validatePostcardVariantPayload(
        basePayload({
          recipient: { city: "Atlanta", state: "GA", zip: "30301" },
        }),
      ),
    ).toThrow("recipient.addressLine1");

    expect(() =>
      validatePostcardVariantPayload(
        basePayload({
          source: { kind: "webhook" as any, sourceId: "event-1" },
        }),
      ),
    ).toThrow("unsupported variant source.kind");

    expect(() =>
      validatePostcardVariantPayload(
        basePayload({
          variantType: "thank_you",
          source: { kind: "manual", sourceId: "manual-1" },
        }),
      ),
    ).toThrow("source.kind=job");

    expect(() =>
      validatePostcardVariantPayload(
        basePayload({
          variantType: "referral_incentive",
          referral: { code: "NOURL" },
        }),
      ),
    ).toThrow("referral.url");
  });
});
