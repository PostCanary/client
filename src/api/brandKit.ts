// src/api/brandKit.ts
import { get, post, putJson, postJson, del_ } from "@/api/http";
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
    tagline: d.tagline ?? null,
    licenseNumber: d.licenseNumber ?? null,
    logoPrintReady: d.logoPrintReady ?? undefined,
    logoWidth: d.logoWidth ?? undefined,
    logoHeight: d.logoHeight ?? undefined,
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

export interface GeneratedHeadlineLines {
  red_1: string;
  red_2: string;
  bridge: string;
  blue_1: string;
  blue_2: string;
}

export interface GeneratedCardContent {
  headlines: Array<{
    text: string;
    // S72: the AI writes the five card lines directly (per-slot caps
    // enforced server-side). Absent on fallback candidates — the client
    // seeds lines from `text` via splitHeadline in that case.
    lines?: GeneratedHeadlineLines;
    formula: string;
    reason: string;
  }>;
  offer: { text: string; reason: string };
  // S74: good/better/best coupon tiers — 2-3 validated entries or [] (the
  // single-offer strip renders below 2).
  offerTiers?: Array<{ value: string; label: string }>;
  selectedReview: {
    quote: string;
    reviewerName: string;
    rating: number;
    reason: string;
  } | null;
  templateRecommendation: string;
  templateReason: string;
  // S76-C: letter-note copy. Present when the AI recommends (or could
  // recommend) the personal-letter layout; the server always emits a
  // well-formed object (salutation city-defaulted, body synthesized from
  // offer + review when the model omits it). Optional for older payloads.
  letter?: { salutation: string; body: string };
}

export interface GeneratedContent {
  cards: GeneratedCardContent[];
}

export async function generateContent(
  data: GenerateContentRequest,
): Promise<GeneratedContent> {
  return postJson<GeneratedContent>("/api/brand-kit/generate", data);
}

// --- Stock photos (Pexels-backed; S72) ---

export interface StockPhotoResult {
  id: number;
  alt: string;
  photographer: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
}

export interface StockSearchResponse {
  configured: boolean;
  photos: StockPhotoResult[];
  totalResults: number;
  page?: number;
}

export async function searchStockPhotos(
  query: string,
  page = 1,
): Promise<StockSearchResponse> {
  const params = new URLSearchParams({ query, page: String(page) });
  return get<StockSearchResponse>(`/api/brand-kit/stock-photos?${params}`);
}

export async function importStockPhoto(
  url: string,
  alt: string,
): Promise<BrandKit> {
  const res = await postJson<BrandKitResponse>(
    "/api/brand-kit/stock-photos/import",
    { url, alt },
  );
  return toBrandKit(res);
}

// --- AI image generation (fal.ai; S72) ---

export interface MediaFeatures {
  stockConfigured: boolean;
  aiConfigured: boolean;
}

export async function getMediaFeatures(): Promise<MediaFeatures> {
  return get<MediaFeatures>("/api/brand-kit/media-features");
}

export async function generateAiImage(prompt: string): Promise<BrandKit> {
  const res = await postJson<BrandKitResponse>("/api/brand-kit/ai-images", {
    prompt,
  });
  return toBrandKit(res);
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

/**
 * Designer "Change Photo" upload path. Multipart field name: photo.
 * Server validates type/size/decodability and stores under the org's
 * media directory; the new photo lands in brandKit.photos.
 */
export async function uploadBrandPhoto(file: File): Promise<BrandKit> {
  const fd = new FormData();
  fd.append("photo", file);
  const res = await post<BrandKitResponse>("/api/brand-kit/photos", fd);
  return toBrandKit(res.data);
}

/** S72 Business Info: upload an org logo (validated server-side for
 * print dimensions; logoPrintReady=false when under 600px wide). */
export async function uploadBrandLogo(file: File): Promise<BrandKit> {
  const fd = new FormData();
  fd.append("logo", file);
  const res = await post<BrandKitResponse>("/api/brand-kit/logo", fd);
  return toBrandKit(res.data);
}

export async function removeBrandPhoto(url: string): Promise<BrandKit> {
  const res = await del_<BrandKitResponse>("/api/brand-kit/photos", {
    data: { url },
  });
  return toBrandKit(res);
}
