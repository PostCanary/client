export type TargetingProvider = 'leadgen' | 'data_retriever'

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
}

export type TargetingFilterKey = keyof TargetingFilterSupport

export interface TargetingCapabilities {
  provider: TargetingProvider
  geographyTypes: TargetingGeographyType[]
  filters: TargetingFilterSupport
}
