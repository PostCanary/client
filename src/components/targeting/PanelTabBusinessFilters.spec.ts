import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { TargetingFilters } from '@/types/campaign'
import type { BusinessTargetingFilterSupport } from '@/types/targeting'
import { emptyTargetingFilters } from '@/utils/emptyTargetingFilters'
import PanelTabBusinessFilters from './PanelTabBusinessFilters.vue'

const FILTERS: TargetingFilters = {
  homeowner: null,
  homeValueMin: null,
  homeValueMax: null,
  yearBuiltMin: null,
  yearBuiltMax: null,
  propertyTypes: [],
  hhageMin: null,
  hhageMax: null,
  incomeMin: null,
  loresMin: null,
  loresMax: null,
  businessSicCodes: ['171102'],
  businessNaicsCodes: [],
  businessJobTitles: ['Owner'],
  businessManagementLevels: ['C-Level'],
  businessEmployeeMin: 5,
  businessEmployeeMax: 50,
  businessSalesMin: null,
  businessSalesMax: null,
  businessHasEmail: true,
  businessWorkAtHome: false,
}

const SUPPORT = Object.fromEntries([
  'businessSicCodes',
  'businessNaicsCodes',
  'businessJobTitles',
  'businessManagementLevels',
  'businessEmployeeMin',
  'businessEmployeeMax',
  'businessSalesMin',
  'businessSalesMax',
  'businessHasEmail',
  'businessWorkAtHome',
].map((key) => [key, true])) as unknown as BusinessTargetingFilterSupport

describe('PanelTabBusinessFilters', () => {
  it('shows supported Business targeting without exposing contact values', () => {
    const wrapper = mount(PanelTabBusinessFilters, {
      props: {
        filters: structuredClone(FILTERS),
        filterCapabilities: SUPPORT,
        excludePastCustomers: true,
        excludeMailedWithinDays: 60,
        doNotMailCount: 0,
      },
    })

    expect(wrapper.get('[data-testid="filter-business-sic"]').attributes('disabled')).toBeUndefined()
    expect((wrapper.get('[data-testid="filter-business-employees-min"]').element as HTMLInputElement).value).toBe('5')
    expect((wrapper.get('[data-testid="filter-business-management-levels"]').element as HTMLInputElement).value).toBe('C-Level')
    expect((wrapper.get('[data-testid="filter-business-has-email"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.text()).toContain('Contact email and phone values are not purchased')
  })

  it('disables a Business filter when the capability is false', () => {
    const wrapper = mount(PanelTabBusinessFilters, {
      props: {
        filters: structuredClone(FILTERS),
        filterCapabilities: { ...SUPPORT, businessSalesMin: false },
        excludePastCustomers: true,
        excludeMailedWithinDays: 60,
        doNotMailCount: 0,
      },
    })

    expect(wrapper.get('[data-testid="filter-business-sales-min"]').attributes('disabled')).toBeDefined()
  })

  it('shows Reset filters when active and clears filters without touching exclusions', async () => {
    const wrapper = mount(PanelTabBusinessFilters, {
      props: {
        filters: structuredClone(FILTERS),
        filterCapabilities: SUPPORT,
        excludePastCustomers: true,
        excludeMailedWithinDays: 60,
        doNotMailCount: 0,
      },
    })

    expect(wrapper.get('[data-testid="reset-filters"]').text()).toBe('Reset filters')
    await wrapper.get('[data-testid="reset-filters"]').trigger('click')

    const emitted = wrapper.emitted('update:filters') ?? []
    expect(emitted.length).toBeGreaterThan(0)
    const cleared = (emitted[emitted.length - 1] ?? [])[0] as TargetingFilters
    expect(cleared).toEqual(emptyTargetingFilters())
    expect(wrapper.emitted('update:excludePastCustomers')).toBeUndefined()
    expect(wrapper.emitted('update:excludeMailedWithinDays')).toBeUndefined()
  })

  it('hides Reset filters when no filters are active', () => {
    const wrapper = mount(PanelTabBusinessFilters, {
      props: {
        filters: emptyTargetingFilters(),
        filterCapabilities: SUPPORT,
        excludePastCustomers: true,
        excludeMailedWithinDays: 60,
        doNotMailCount: 0,
      },
    })

    expect(wrapper.find('[data-testid="reset-filters"]').exists()).toBe(false)
  })
})
