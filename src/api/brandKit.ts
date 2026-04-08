// src/api/brandKit.ts
import { get, putJson, postJson } from "@/api/http";
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
    completenessPercent: d.completenessPercent ?? 0,
    updatedAt: r.updated_at,
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
