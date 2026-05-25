// src/api/brandKit.ts
import { get, putJson, postJson, del_ } from "@/api/http";
import type { BrandKit } from "@/types/campaign";

interface BrandKitResponse {
  ok: boolean;
  id: string;
  org_id: string;
  data: Record<string, any>;
  scrape_status: string;
  created_at: string;
  updated_at: string;
}

function toBrandKit(r: BrandKitResponse): BrandKit {
  const d = r.data || {};
  return {
    id: r.id,
    orgId: r.org_id,
    businessName: d.businessName ?? "",
    location: d.location ?? "",
    address: d.address ?? null,
    phone: d.phone ?? null,
    websiteUrl: d.websiteUrl ?? null,
    logoUrl: d.logoUrl ?? null,
    logoQualityScore: d.logoQualityScore ?? null,
    brandColors: d.brandColors ?? [],
    photos: d.photos ?? [],
    googleRating: d.googleRating ?? null,
    reviews: d.reviews ?? [],
    certifications: d.certifications ?? [],
    currentOffers: d.currentOffers ?? [],
    guarantees: d.guarantees ?? [],
    yearsInBusiness: d.yearsInBusiness ?? null,
    industry: d.industry ?? null,
    serviceTypes: d.serviceTypes ?? [],
    scrapeStatus: (r.scrape_status ?? d.scrapeStatus ?? "pending") as BrandKit["scrapeStatus"],
    scrapeProgress: d.scrapeProgress ?? null,
    completenessPercent: d.completenessPercent ?? 0,
    updatedAt: r.updated_at,
    // --- Brief #6 Extraction R2 + P0 #3 additions (all optional) ---
    reviewCount: d.reviewCount ?? null,
    trustBadges: d.trustBadges ?? [],
    bbbDetected: d.bbbDetected ?? false,
    partnerBadges: d.partnerBadges ?? [],
    confidenceScores: d.confidenceScores ?? {},
    extractionSources: d.extractionSources ?? [],
    // P0 #3: server-generated QR image URL. Without this mapping the
    // server's QR generation would be invisible to the client (Codex HIGH).
    qrCodeImageUrl: d.qrCodeImageUrl ?? null,
  };
}

export async function getBrandKit(): Promise<BrandKit> {
  const res = await get<BrandKitResponse>("/api/brand-kit");
  return toBrandKit(res);
}

export async function updateBrandKit(
  data: Partial<BrandKit>,
): Promise<BrandKit> {
  const res = await putJson<BrandKitResponse>("/api/brand-kit", data);
  return toBrandKit(res);
}

export async function triggerScrape(
  websiteUrl?: string,
): Promise<BrandKit> {
  const res = await postJson<BrandKitResponse>("/api/brand-kit/scrape", {
    website_url: websiteUrl,
  });
  return toBrandKit(res);
}

// --- AI Generation ---

export interface GenerateContentRequest {
  goal_type: string;
  card_purposes: string[];
  recipient_type: string;
}

export interface GeneratedCardContent {
  headlines: Array<{ text: string; formula: string; reason: string }>;
  offer: { text: string; reason: string };
  selectedReview: {
    quote: string;
    reviewerName: string;
    rating: number;
    reason: string;
  } | null;
  templateRecommendation: string;
  templateReason: string;
}

export interface GeneratedContent {
  cards: GeneratedCardContent[];
}

export async function generateContent(
  data: GenerateContentRequest,
): Promise<GeneratedContent> {
  return postJson<GeneratedContent>("/api/brand-kit/generate", data);
}

// --- Manual Reviews ---

export interface AddReviewRequest {
  review_text: string;
  reviewer_name: string;
  rating: number;
}

export async function addManualReview(
  data: AddReviewRequest,
): Promise<BrandKit> {
  const res = await postJson<BrandKitResponse>("/api/brand-kit/reviews", data);
  return toBrandKit(res);
}

export async function removeReview(index: number): Promise<BrandKit> {
  const res = await del_<BrandKitResponse>(`/api/brand-kit/reviews/${index}`);
  return toBrandKit(res);
}
