import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { TargetingFilters } from '@/types/campaign'
import type { TargetingFilterSupport } from '@/types/targeting'
import PanelTabFilters from './PanelTabFilters.vue'

const FILTERS: TargetingFilters = {
  homeowner: 'homeowner',
  homeValueMin: 150000,
  homeValueMax: 800000,
  yearBuiltMin: 1950,
  yearBuiltMax: 2010,
  propertyTypes: ['Single Family'],
  hhageMin: 3,
  hhageMax: 6,
  incomeMin: 'C',
  loresMin: 2,
  loresMax: 10,
  squareFootageMin: 1500,
  squareFootageMax: 3000,
  hasEmail: true,
}

const DATA_RETRIEVER_FILTERS: TargetingFilterSupport = {
  homeowner: false,
  homeValueMin: false,
  homeValueMax: false,
  yearBuiltMin: false,
  yearBuiltMax: false,
  propertyTypes: false,
  hhageMin: true,
  hhageMax: true,
  incomeMin: false,
  loresMin: false,
  loresMax: false,
  squareFootageMin: false,
  squareFootageMax: false,
  hasEmail: false,
}

const LEADGEN_FILTERS: TargetingFilterSupport = {
  homeowner: true,
  homeValueMin: true,
  homeValueMax: true,
  yearBuiltMin: true,
  yearBuiltMax: true,
  propertyTypes: true,
  hhageMin: true,
  hhageMax: true,
  incomeMin: true,
  loresMin: true,
  loresMax: true,
  squareFootageMin: true,
  squareFootageMax: true,
  hasEmail: true,
}

function mountFilters(
  filterCapabilities: TargetingFilterSupport | null,
  targetingProvider: 'leadgen' | 'data_retriever' | 'planner',
) {
  return mount(PanelTabFilters, {
    props: {
      filters: structuredClone(FILTERS),
      excludePastCustomers: true,
      excludeMailedWithinDays: 30,
      doNotMailCount: 0,
      filterCapabilities,
      targetingProvider,
    },
  })
}

describe('PanelTabFilters provider capabilities', () => {
  it('fails closed while provider capabilities are unavailable', () => {
    const wrapper = mountFilters(null, 'planner')

    const filterControls = wrapper.findAll(
      '[data-testid^="filter-control-"], [data-testid="filter-property-types"] input',
    )
    expect(filterControls.length).toBeGreaterThan(0)
    expect(filterControls.every((control) =>
      control.attributes('disabled') !== undefined,
    )).toBe(true)
  })

  it('disables unsupported Data Retriever controls and leaves household age enabled', () => {
    const wrapper = mountFilters(DATA_RETRIEVER_FILTERS, 'data_retriever')

    expect(wrapper.get('[data-testid="targeting-capability-notice"]').text()).toContain('Data Retriever')
    expect(wrapper.get('[data-testid="filter-control-homeowner"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-home-value-min"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-home-value-max"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-year-built-min"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-year-built-max"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-property-types"] input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-income"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-lores-min"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-lores-max"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-hhage-min"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="filter-control-hhage-max"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="filter-control-square-footage-min"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="filter-control-email-availability"]').attributes('disabled')).toBeDefined()
  })

  it('keeps all filter controls enabled for LeadGen', () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'leadgen')

    expect(wrapper.find('[data-testid="targeting-capability-notice"]').exists()).toBe(false)
    expect(wrapper.findAll('select, input').every((control) => !control.attributes('disabled'))).toBe(true)
  })

  it('exposes planner property filters without exposing email values', () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner')

    expect(wrapper.find('[data-testid="targeting-capability-notice"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="filter-control-square-footage-min"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="filter-control-email-availability"]').text()).toContain('Has email')
    expect(wrapper.text()).toContain('Email addresses are not sent to the print partner')
  })
})
