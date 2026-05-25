// src/data/stockPhotos.ts
//
// Session 61 (2026-04-18, demo T-2): emptied PHOTOS array. All Unsplash URLs
// were being silently blocked by render_worker/services/url_guard.py
// (PHOTO_BLOCKED_BY_URL_GUARD warning surfaced only to console, not user).
// Picker appeared to accept selection but preview kept the previous photo,
// breaking operator trust. S60 QA Bug #3 — see sessions/session-60-bug-catalog.md.
// Picker now falls back to brand-kit photos only. Post-demo, re-populate with
// local /media/stock/<industry>/ URLs that the url_guard allowlist accepts,
// OR add Unsplash to the allowlist if we want external stock photography.

import type { Industry } from "@/types/campaign";

export interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  industry: Industry | "generic";
  emotion: "trust" | "comfort" | "urgency" | "proof";
  description: string;
}

const PHOTOS: StockPhoto[] = [];

export function getPhotosForIndustry(industry: Industry | string | null): StockPhoto[] {
  if (!industry) return PHOTOS.filter((p) => p.industry === "generic");
  const matches = PHOTOS.filter((p) => p.industry === industry);
  if (matches.length === 0) return PHOTOS.filter((p) => p.industry === "generic");
  return matches;
}

export function getAllPhotos(): StockPhoto[] {
  return PHOTOS;
}
