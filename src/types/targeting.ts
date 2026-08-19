export type TargetingProvider = 'leadgen' | 'data_retriever' | 'planner'

export type TargetingCountSource = 'melissa' | 'melissa_data_retriever' | 'mock'

export type TargetingGeographyType =
  | 'zip'
  | 'circle'
  | 'job_radius'
  | 'polygon'
  | 'rectangle'

export interface TargetingFilterSupport {
  homeowner: boolean
  homeValueMin: boolean
  homeValueMax: boolean
  yearBuiltMin: boolean
  yearBuiltMax: boolean
  propertyTypes: boolean
  hhageMin: boolean
  hhageMax: boolean
  incomeMin: boolean
  loresMin: boolean
  loresMax: boolean
  kidsMin: boolean
  kidsMax: boolean
  squareFootageMin?: boolean
  squareFootageMax?: boolean
  hasEmail?: boolean
  dogOwner?: boolean
  catOwner?: boolean
  otherPetOwner?: boolean
}

export type TargetingFilterKey = keyof TargetingFilterSupport

export interface BusinessTargetingFilterSupport {
  businessSicCodes: boolean
  businessNaicsCodes: boolean
  businessJobTitles: boolean
  businessManagementLevels: boolean
  businessEmployeeMin: boolean
  businessEmployeeMax: boolean
  businessSalesMin: boolean
  businessSalesMax: boolean
  businessHasEmail: boolean
  businessWorkAtHome: boolean
}

export interface TargetingCapabilities {
  provider: TargetingProvider
  geographyTypes: TargetingGeographyType[]
  filters: TargetingFilterSupport
  audienceFilters?: {
    consumer: TargetingFilterSupport
    business: BusinessTargetingFilterSupport
  }
  strategy?: 'per_campaign'
  schemaVersion?: number
  products?: Array<{
    id: string
    audienceType: 'consumer' | 'business'
    enabled: boolean
    implemented: boolean
  }>
  filterCapabilities?: Record<string, {
    mode: 'target' | 'output_only' | 'unavailable'
    products: string[]
  }>
  // Live Melissa-credit guardrail. Read from GET /api/targeting/capabilities.
  // Never invent a client-side default — omit when the server does not send it.
  purchase_records_max_qty?: number
}

export interface AudienceQueryPlan {
  schemaVersion: number
  audienceType: 'consumer' | 'business'
  provider: 'melissa'
  product: string
  areas: import('@/types/campaign').TargetingArea[]
  filters: Partial<import('@/types/campaign').TargetingFilters>
  suppressionPolicy: AudienceSuppressionPolicy
  requests: Array<Record<string, unknown>>
  outputColumns: string[]
  fingerprint: string
  countProof: {
    filteredCount: number
    finalCount: number
    exclusions: {
      pastCustomers: number
      recentlyMailed: number
      doNotMail: number
    }
    source: TargetingCountSource
  }
  attestation: string
}

export interface AudienceSuppressionPolicy {
  excludePastCustomers: boolean
  excludeMailedWithinDays: number | null
}
