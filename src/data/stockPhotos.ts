// src/data/stockPhotos.ts
// Round 1: Unsplash URLs with resize parameter
// Round 2: real brand kit photos from website scrape

import type { Industry } from "@/types/campaign";

export interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  industry: Industry | "generic";
  emotion: "trust" | "comfort" | "urgency" | "proof";
  description: string;
}

const BASE = "https://images.unsplash.com";

const PHOTOS: StockPhoto[] = [
  // HVAC
  { id: "hvac-1", url: `${BASE}/photo-1585771724684-38269d6639fd?w=800`, thumbnailUrl: `${BASE}/photo-1585771724684-38269d6639fd?w=200`, industry: "hvac", emotion: "trust", description: "HVAC technician at work" },
  { id: "hvac-2", url: `${BASE}/photo-1631545806609-12dbf58d3723?w=800`, thumbnailUrl: `${BASE}/photo-1631545806609-12dbf58d3723?w=200`, industry: "hvac", emotion: "comfort", description: "Modern AC unit exterior" },
  { id: "hvac-3", url: `${BASE}/photo-1558618666-fcd25c85f82e?w=800`, thumbnailUrl: `${BASE}/photo-1558618666-fcd25c85f82e?w=200`, industry: "hvac", emotion: "trust", description: "Comfortable home interior" },
  // Plumbing
  { id: "plumb-1", url: `${BASE}/photo-1607472586893-edb57bdc0e39?w=800`, thumbnailUrl: `${BASE}/photo-1607472586893-edb57bdc0e39?w=200`, industry: "plumbing", emotion: "trust", description: "Plumber working under sink" },
  { id: "plumb-2", url: `${BASE}/photo-1585704032915-c3400ca199e7?w=800`, thumbnailUrl: `${BASE}/photo-1585704032915-c3400ca199e7?w=200`, industry: "plumbing", emotion: "comfort", description: "Modern bathroom" },
  { id: "plumb-3", url: `${BASE}/photo-1584622650111-993a426fbf0a?w=800`, thumbnailUrl: `${BASE}/photo-1584622650111-993a426fbf0a?w=200`, industry: "plumbing", emotion: "trust", description: "Kitchen with quality fixtures" },
  // Roofing
  { id: "roof-1", url: `${BASE}/photo-1632759145390-ee07ec0eca45?w=800`, thumbnailUrl: `${BASE}/photo-1632759145390-ee07ec0eca45?w=200`, industry: "roofing", emotion: "proof", description: "New roof installation" },
  { id: "roof-2", url: `${BASE}/photo-1558036117-15d82a90b9b1?w=800`, thumbnailUrl: `${BASE}/photo-1558036117-15d82a90b9b1?w=200`, industry: "roofing", emotion: "trust", description: "Beautiful home with new roof" },
  { id: "roof-3", url: `${BASE}/photo-1591588582259-e675bd2e6088?w=800`, thumbnailUrl: `${BASE}/photo-1591588582259-e675bd2e6088?w=200`, industry: "roofing", emotion: "urgency", description: "Storm damage repair" },
  // Cleaning
  { id: "clean-1", url: `${BASE}/photo-1581578731548-c64695cc6952?w=800`, thumbnailUrl: `${BASE}/photo-1581578731548-c64695cc6952?w=200`, industry: "cleaning", emotion: "comfort", description: "Sparkling clean home" },
  { id: "clean-2", url: `${BASE}/photo-1558317374-067fb5f30001?w=800`, thumbnailUrl: `${BASE}/photo-1558317374-067fb5f30001?w=200`, industry: "cleaning", emotion: "trust", description: "Professional cleaning service" },
  { id: "clean-3", url: `${BASE}/photo-1527515637462-cee1395c0b14?w=800`, thumbnailUrl: `${BASE}/photo-1527515637462-cee1395c0b14?w=200`, industry: "cleaning", emotion: "proof", description: "Before and after cleaning" },
  // Generic
  { id: "gen-1", url: `${BASE}/photo-1560518883-ce09059eeffa?w=800`, thumbnailUrl: `${BASE}/photo-1560518883-ce09059eeffa?w=200`, industry: "generic", emotion: "trust", description: "Professional service team" },
  { id: "gen-2", url: `${BASE}/photo-1570129477492-45c003edd2be?w=800`, thumbnailUrl: `${BASE}/photo-1570129477492-45c003edd2be?w=200`, industry: "generic", emotion: "comfort", description: "Happy homeowner" },
  { id: "gen-3", url: `${BASE}/photo-1582268611958-ebfd161ef9cf?w=800`, thumbnailUrl: `${BASE}/photo-1582268611958-ebfd161ef9cf?w=200`, industry: "generic", emotion: "trust", description: "Professional at work" },
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
