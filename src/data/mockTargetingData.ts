// src/data/mockTargetingData.ts
// Mock data for Round 1 — replaced by Melissa Data in Round 2
import type { JobReference, TargetingFilters } from "@/types/campaign";

export const MOCK_JOBS: JobReference[] = [
  { id: "j1", address: "7521 E Camelback Rd, Scottsdale, AZ 85251", lat: 33.5092, lng: -111.9280, serviceType: "AC Repair", jobDate: "2026-03-10", selected: true },
  { id: "j2", address: "8344 E Shea Blvd, Scottsdale, AZ 85260", lat: 33.5811, lng: -111.9097, serviceType: "Heating", jobDate: "2026-03-15", selected: true },
  { id: "j3", address: "15034 N Scottsdale Rd, Scottsdale, AZ 85254", lat: 33.6157, lng: -111.9256, serviceType: "AC Repair", jobDate: "2026-02-28", selected: true },
  { id: "j4", address: "4747 N Goldwater Blvd, Scottsdale, AZ 85251", lat: 33.4997, lng: -111.9248, serviceType: "Duct Cleaning", jobDate: "2026-03-05", selected: true },
  { id: "j5", address: "10455 E Via Linda, Scottsdale, AZ 85259", lat: 33.5697, lng: -111.8645, serviceType: "AC Repair", jobDate: "2026-03-20", selected: true },
  { id: "j6", address: "6900 E Camelback Rd, Scottsdale, AZ 85251", lat: 33.5088, lng: -111.9370, serviceType: "Heating", jobDate: "2026-02-15", selected: false },
  { id: "j7", address: "9617 N Hayden Rd, Scottsdale, AZ 85258", lat: 33.5569, lng: -111.9092, serviceType: "Installation", jobDate: "2026-01-20", selected: false },
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
