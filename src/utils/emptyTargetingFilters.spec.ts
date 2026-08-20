import { describe, expect, it } from 'vitest'
import { emptyTargetingFilters } from './emptyTargetingFilters'

describe('emptyTargetingFilters', () => {
  it('returns a fresh TargetingFilters with empty array fields', () => {
    const a = emptyTargetingFilters()
    const b = emptyTargetingFilters()

    expect(a.homeowner).toBeNull()
    expect(a.dogOwner).toBeNull()
    expect(a.catOwner).toBeNull()
    expect(a.otherPetOwner).toBeNull()
    expect(a.propertyTypes).toEqual([])
    expect(a.businessSicCodes).toEqual([])
    expect(a.businessNaicsCodes).toEqual([])
    expect(a.businessJobTitles).toEqual([])
    expect(a.businessManagementLevels).toEqual([])

    a.propertyTypes.push('Single Family')
    expect(b.propertyTypes).toEqual([])
  })
})
