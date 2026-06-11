// src/data/stockPhotos.ts
//
// Session 61 (2026-04-18, demo T-2): emptied PHOTOS array. All Unsplash URLs
// were being silently blocked by render_worker/services/url_guard.py
// (PHOTO_BLOCKED_BY_URL_GUARD warning surfaced only to console, not user).
// Picker appeared to accept selection but preview kept the previous photo,
// breaking operator trust. S60 QA Bug #3 — see sessions/session-60-bug-catalog.md.
// S75 Phase B (2026-06-11): repopulated with the bundled industry starter
// packs — people-first Pexels photos (free commercial use, no attribution)
// served by the API at /media/industry-photos/<industry>/<file>, which the
// worker url_guard accepts via the default /media/ path prefix.

import type { Industry } from "@/types/campaign";

export interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  industry: Industry | "generic";
  emotion: "trust" | "comfort" | "urgency" | "proof";
  description: string;
}

const PHOTOS: StockPhoto[] = [
  {
    id: "pack-hvac-1",
    url: "/media/industry-photos/hvac/hero.jpg",
    thumbnailUrl: "/media/industry-photos/hvac/hero.jpg",
    industry: "hvac",
    emotion: "trust",
    description: "Technician at an outdoor unit",
  },
  {
    id: "pack-hvac-2",
    url: "/media/industry-photos/hvac/02.jpg",
    thumbnailUrl: "/media/industry-photos/hvac/02.jpg",
    industry: "hvac",
    emotion: "proof",
    description: "Technician servicing an A/C",
  },
  {
    id: "pack-hvac-3",
    url: "/media/industry-photos/hvac/03.jpg",
    thumbnailUrl: "/media/industry-photos/hvac/03.jpg",
    industry: "hvac",
    emotion: "trust",
    description: "Technician with gauges",
  },
  {
    id: "pack-hvac-4",
    url: "/media/industry-photos/hvac/04.jpg",
    thumbnailUrl: "/media/industry-photos/hvac/04.jpg",
    industry: "hvac",
    emotion: "comfort",
    description: "Two techs on a rooftop unit",
  },
  {
    id: "pack-hvac-5",
    url: "/media/industry-photos/hvac/05.jpg",
    thumbnailUrl: "/media/industry-photos/hvac/05.jpg",
    industry: "hvac",
    emotion: "comfort",
    description: "Technician with tools",
  },
  {
    id: "pack-plumbing-1",
    url: "/media/industry-photos/plumbing/hero.jpg",
    thumbnailUrl: "/media/industry-photos/plumbing/hero.jpg",
    industry: "plumbing",
    emotion: "trust",
    description: "Plumber at work",
  },
  {
    id: "pack-plumbing-2",
    url: "/media/industry-photos/plumbing/02.jpg",
    thumbnailUrl: "/media/industry-photos/plumbing/02.jpg",
    industry: "plumbing",
    emotion: "proof",
    description: "Plumber at the boiler",
  },
  {
    id: "pack-plumbing-3",
    url: "/media/industry-photos/plumbing/03.jpg",
    thumbnailUrl: "/media/industry-photos/plumbing/03.jpg",
    industry: "plumbing",
    emotion: "trust",
    description: "Plumber fixing pipes",
  },
  {
    id: "pack-plumbing-4",
    url: "/media/industry-photos/plumbing/04.jpg",
    thumbnailUrl: "/media/industry-photos/plumbing/04.jpg",
    industry: "plumbing",
    emotion: "comfort",
    description: "Radiator service",
  },
  {
    id: "pack-roofing-1",
    url: "/media/industry-photos/roofing/hero.jpg",
    thumbnailUrl: "/media/industry-photos/roofing/hero.jpg",
    industry: "roofing",
    emotion: "trust",
    description: "Roofer on a tile roof",
  },
  {
    id: "pack-roofing-2",
    url: "/media/industry-photos/roofing/02.jpg",
    thumbnailUrl: "/media/industry-photos/roofing/02.jpg",
    industry: "roofing",
    emotion: "proof",
    description: "Roofer climbing",
  },
  {
    id: "pack-roofing-3",
    url: "/media/industry-photos/roofing/03.jpg",
    thumbnailUrl: "/media/industry-photos/roofing/03.jpg",
    industry: "roofing",
    emotion: "trust",
    description: "Two roofers at work",
  },
  {
    id: "pack-roofing-4",
    url: "/media/industry-photos/roofing/04.jpg",
    thumbnailUrl: "/media/industry-photos/roofing/04.jpg",
    industry: "roofing",
    emotion: "comfort",
    description: "Fresh tile roof",
  },
  {
    id: "pack-cleaning-1",
    url: "/media/industry-photos/cleaning/hero.jpg",
    thumbnailUrl: "/media/industry-photos/cleaning/hero.jpg",
    industry: "cleaning",
    emotion: "trust",
    description: "Cleaners working a living room",
  },
  {
    id: "pack-cleaning-2",
    url: "/media/industry-photos/cleaning/02.jpg",
    thumbnailUrl: "/media/industry-photos/cleaning/02.jpg",
    industry: "cleaning",
    emotion: "proof",
    description: "Vacuuming a wood floor",
  },
  {
    id: "pack-cleaning-3",
    url: "/media/industry-photos/cleaning/03.jpg",
    thumbnailUrl: "/media/industry-photos/cleaning/03.jpg",
    industry: "cleaning",
    emotion: "trust",
    description: "Team making a bed",
  },
  {
    id: "pack-cleaning-4",
    url: "/media/industry-photos/cleaning/04.jpg",
    thumbnailUrl: "/media/industry-photos/cleaning/04.jpg",
    industry: "cleaning",
    emotion: "comfort",
    description: "Clean home exterior",
  },
  {
    id: "pack-electrical-1",
    url: "/media/industry-photos/electrical/hero.jpg",
    thumbnailUrl: "/media/industry-photos/electrical/hero.jpg",
    industry: "electrical",
    emotion: "trust",
    description: "Electricians at a panel",
  },
  {
    id: "pack-electrical-2",
    url: "/media/industry-photos/electrical/02.jpg",
    thumbnailUrl: "/media/industry-photos/electrical/02.jpg",
    industry: "electrical",
    emotion: "proof",
    description: "Electrician wiring a panel",
  },
  {
    id: "pack-electrical-3",
    url: "/media/industry-photos/electrical/03.jpg",
    thumbnailUrl: "/media/industry-photos/electrical/03.jpg",
    industry: "electrical",
    emotion: "trust",
    description: "Testing a breaker panel",
  },
  {
    id: "pack-electrical-4",
    url: "/media/industry-photos/electrical/04.jpg",
    thumbnailUrl: "/media/industry-photos/electrical/04.jpg",
    industry: "electrical",
    emotion: "comfort",
    description: "Panel diagnostics",
  },
  {
    id: "pack-pest_control-1",
    url: "/media/industry-photos/pest_control/hero.jpg",
    thumbnailUrl: "/media/industry-photos/pest_control/hero.jpg",
    industry: "pest_control",
    emotion: "trust",
    description: "Fogging treatment",
  },
  {
    id: "pack-pest_control-2",
    url: "/media/industry-photos/pest_control/02.jpg",
    thumbnailUrl: "/media/industry-photos/pest_control/02.jpg",
    industry: "pest_control",
    emotion: "proof",
    description: "Suited exterminator spraying",
  },
  {
    id: "pack-pest_control-3",
    url: "/media/industry-photos/pest_control/03.jpg",
    thumbnailUrl: "/media/industry-photos/pest_control/03.jpg",
    industry: "pest_control",
    emotion: "trust",
    description: "Garden treatment",
  },
  {
    id: "pack-landscaping-1",
    url: "/media/industry-photos/landscaping/hero.jpg",
    thumbnailUrl: "/media/industry-photos/landscaping/hero.jpg",
    industry: "landscaping",
    emotion: "trust",
    description: "Mower on a fresh lawn",
  },
  {
    id: "pack-landscaping-2",
    url: "/media/industry-photos/landscaping/02.jpg",
    thumbnailUrl: "/media/industry-photos/landscaping/02.jpg",
    industry: "landscaping",
    emotion: "proof",
    description: "Mowing in progress",
  },
  {
    id: "pack-landscaping-3",
    url: "/media/industry-photos/landscaping/03.jpg",
    thumbnailUrl: "/media/industry-photos/landscaping/03.jpg",
    industry: "landscaping",
    emotion: "trust",
    description: "Trimmed hedges",
  },
  {
    id: "pack-landscaping-4",
    url: "/media/industry-photos/landscaping/04.jpg",
    thumbnailUrl: "/media/industry-photos/landscaping/04.jpg",
    industry: "landscaping",
    emotion: "comfort",
    description: "Gardener at work",
  },
  {
    id: "pack-generic-1",
    url: "/media/industry-photos/generic/hero.jpg",
    thumbnailUrl: "/media/industry-photos/generic/hero.jpg",
    industry: "generic",
    emotion: "trust",
    description: "Smiling contractor",
  },
  {
    id: "pack-generic-2",
    url: "/media/industry-photos/generic/02.jpg",
    thumbnailUrl: "/media/industry-photos/generic/02.jpg",
    industry: "generic",
    emotion: "proof",
    description: "Smiling tradeswoman",
  },
  {
    id: "pack-generic-3",
    url: "/media/industry-photos/generic/03.jpg",
    thumbnailUrl: "/media/industry-photos/generic/03.jpg",
    industry: "generic",
    emotion: "trust",
    description: "Tradesman with tape measure",
  },
  {
    id: "pack-generic-4",
    url: "/media/industry-photos/generic/04.jpg",
    thumbnailUrl: "/media/industry-photos/generic/04.jpg",
    industry: "generic",
    emotion: "comfort",
    description: "Painter at work",
  },
];

export function getPhotosForIndustry(industry: Industry | string | null): StockPhoto[] {
  if (!industry) return PHOTOS.filter((p) => p.industry === "generic");
  const matches = PHOTOS.filter((p) => p.industry === industry);
  if (matches.length === 0) return PHOTOS.filter((p) => p.industry === "generic");
  return matches;
}

export function getAllPhotos(): StockPhoto[] {
  return PHOTOS;
}
