// src/data/mockTargetingData.ts
// Mock data for Round 1 — replaced by Melissa Data in Round 2
import type { JobReference, TargetingFilters } from "@/types/campaign";

// S69 demo prep (Desert Diamond HVAC): 12 completed jobs in the past 30
// days relative to demo day 2026-04-20. All dates shifted into the
// 2026-03-22 .. 2026-04-19 window so the Home page "You completed 12
// jobs in the past 30 days" narrative lines up with on-screen data.
// Addresses are real Scottsdale / Paradise Valley / Phoenix cross-
// streets in the Desert Diamond service area; value mix spans small
// service calls ($185-$425), mid-sized repairs ($575-$895), a large
// duct job ($2,180), and a showpiece install ($9,650) + new install
// ($8,250). Post-demo: replace with real job-history query from the
// CRM sync service.
export const MOCK_JOBS: JobReference[] = [
  { id: "j1", address: "7521 E Camelback Rd, Scottsdale, AZ 85251", lat: 33.5092, lng: -111.9280, serviceType: "AC Repair", jobDate: "2026-04-02", selected: true, value: 445 },
  { id: "j2", address: "8344 E Shea Blvd, Scottsdale, AZ 85260", lat: 33.5811, lng: -111.9097, serviceType: "Heating", jobDate: "2026-04-08", selected: true, value: 620 },
  { id: "j3", address: "15034 N Scottsdale Rd, Scottsdale, AZ 85254", lat: 33.6157, lng: -111.9256, serviceType: "AC Repair", jobDate: "2026-03-25", selected: true, value: 2180 },
  { id: "j4", address: "4747 N Goldwater Blvd, Scottsdale, AZ 85251", lat: 33.4997, lng: -111.9248, serviceType: "Duct Cleaning", jobDate: "2026-03-28", selected: true, value: 385 },
  { id: "j5", address: "10455 E Via Linda, Scottsdale, AZ 85259", lat: 33.5697, lng: -111.8645, serviceType: "AC Repair", jobDate: "2026-04-12", selected: true, value: 185 },
  { id: "j6", address: "6900 E Camelback Rd, Scottsdale, AZ 85251", lat: 33.5088, lng: -111.9370, serviceType: "Heating", jobDate: "2026-03-22", selected: true, value: 895 },
  { id: "j7", address: "9617 N Hayden Rd, Scottsdale, AZ 85258", lat: 33.5569, lng: -111.9092, serviceType: "Installation", jobDate: "2026-03-30", selected: true, value: 9650 },
  { id: "j8", address: "7014 E 5th Ave, Scottsdale, AZ 85251", lat: 33.4932, lng: -111.9262, serviceType: "AC Tune-Up", jobDate: "2026-04-15", selected: true, value: 320 },
  { id: "j9", address: "8300 E Mountain View Rd, Scottsdale, AZ 85258", lat: 33.5504, lng: -111.9085, serviceType: "AC Repair", jobDate: "2026-04-05", selected: true, value: 575 },
  { id: "j10", address: "14236 N Frank Lloyd Wright Blvd, Scottsdale, AZ 85260", lat: 33.6090, lng: -111.8938, serviceType: "Installation", jobDate: "2026-04-10", selected: true, value: 8250 },
  { id: "j11", address: "5245 E Lincoln Dr, Paradise Valley, AZ 85253", lat: 33.5250, lng: -111.9685, serviceType: "AC Repair", jobDate: "2026-04-17", selected: true, value: 395 },
  { id: "j12", address: "11023 N 76th Pl, Scottsdale, AZ 85260", lat: 33.5788, lng: -111.9186, serviceType: "Heating", jobDate: "2026-03-26", selected: true, value: 425 },
];

const DENSITY_PER_SQ_MILE = 500;

/**
 * Estimate households in a given area.
 * Circle: π × r². Rectangle: width × height. ZIP: ~8 sq miles avg.
 */
export function estimateHouseholds(areaSqMiles: number): number {
  return Math.round(areaSqMiles * DENSITY_PER_SQ_MILE);
}

/**
 * Calculate circle area from radius in miles.
 */
export function circleAreaSqMiles(radiusMiles: number): number {
  return Math.PI * radiusMiles * radiusMiles;
}

/**
 * Approximate ZIP code area (average ~8 sq miles).
 */
export function zipAreaSqMiles(): number {
  return 8;
}

/**
 * Apply filter reductions to household count.
 */
export function applyFilterReductions(
  baseCount: number,
  filters: TargetingFilters,
): number {
  let count = baseCount;
  if (filters.homeowner === 'homeowner') count = Math.round(count * 0.65); // -35%
  if (filters.homeowner === 'investor') count = Math.round(count * 0.5); // -50%
  if (filters.propertyTypes.length > 0 && filters.propertyTypes.length < 5)
    count = Math.round(count * 0.7); // -30%
  if (filters.homeValueMin !== null || filters.homeValueMax !== null)
    count = Math.round(count * 0.6); // -40%
  if (filters.yearBuiltMin !== null || filters.yearBuiltMax !== null)
    count = Math.round(count * 0.7); // -30%
  return Math.max(count, 0);
}

/**
 * Mock past customers in area — ~7% of total.
 */
export function mockPastCustomersInArea(totalHouseholds: number): number {
  return Math.round(totalHouseholds * 0.07);
}

/**
 * Mock recipient breakdown.
 */
export function mockRecipientBreakdown(
  finalCount: number,
  excludePastCustomers: boolean,
) {
  const past = mockPastCustomersInArea(finalCount);
  return {
    newProspects: excludePastCustomers ? finalCount : finalCount - past,
    pastCustomers: past,
    pastCustomersIncluded: !excludePastCustomers,
  };
}
