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
  kidsMin: null,
  kidsMax: null,
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
  kidsMin: false,
  kidsMax: false,
  squareFootageMin: false,
  squareFootageMax: false,
  hasEmail: false,
  dogOwner: false,
  catOwner: false,
  otherPetOwner: false,
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
  kidsMin: true,
  kidsMax: true,
  squareFootageMin: true,
  squareFootageMax: true,
  hasEmail: true,
  dogOwner: true,
  catOwner: true,
  otherPetOwner: true,
}

function mountFilters(
  filterCapabilities: TargetingFilterSupport | null,
  targetingProvider: 'leadgen' | 'data_retriever' | 'planner',
  industry: string | null = 'hvac',
) {
  return mount(PanelTabFilters, {
    props: {
      filters: structuredClone(FILTERS),
      excludePastCustomers: true,
      excludeMailedWithinDays: 30,
      doNotMailCount: 0,
      filterCapabilities,
      targetingProvider,
      industry,
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

    expect(wrapper.get('[data-testid="targeting-capability-notice"]').text()).toContain('Audience targeting')
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

  it('exposes three separate pet-owner checkboxes for Consumer Inds', () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner')

    expect(wrapper.find('[data-testid="filter-pet-owners"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="filter-control-dog-owner"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="filter-control-cat-owner"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="filter-control-other-pet-owner"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('Selecting more than one requires all selected types')
  })

  it('hides pet ownership when Consumer Inds are unsupported', () => {
    const wrapper = mountFilters(DATA_RETRIEVER_FILTERS, 'data_retriever')
    expect(wrapper.find('[data-testid="filter-pet-owners"]').exists()).toBe(false)
  })
})

describe('PanelTabFilters industry preset (POS-293)', () => {
  it('offers the home-services chip for HVAC and applies it on click', async () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner', 'hvac')

    const chip = wrapper.get('[data-testid="industry-filter-preset"]')
    expect(chip.text()).toContain('home services')
    await chip.trigger('click')

    const emitted = wrapper.emitted('update:filters') ?? []
    expect(emitted.length).toBeGreaterThan(0)
    const applied = (emitted[emitted.length - 1] ?? [])[0] as TargetingFilters
    expect(applied.homeowner).toBe('homeowner')
    expect(applied.homeValueMin).toBe(150000)
    expect(applied.homeValueMax).toBe(800000)
    expect(applied.yearBuiltMax).toBe(2010)
    expect(applied.propertyTypes).toEqual(['Single Family'])
  })

  it('labels the chip from the industry pack (dental → health)', () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner', 'dental')
    expect(wrapper.get('[data-testid="industry-filter-preset"]').text()).toContain(
      'health',
    )
  })

  it('applies the professional pack for legal (income + higher value)', async () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner', 'legal')
    await wrapper.get('[data-testid="industry-filter-preset"]').trigger('click')
    const applied = (wrapper.emitted('update:filters') ?? []).slice(-1)[0]?.[0] as TargetingFilters
    expect(applied.incomeMin).toBe('E')
    expect(applied.homeValueMin).toBe(250000)
  })

  it('applies the property pack with recent-mover lores for mortgage', async () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner', 'mortgage')
    await wrapper.get('[data-testid="industry-filter-preset"]').trigger('click')
    const applied = (wrapper.emitted('update:filters') ?? []).slice(-1)[0]?.[0] as TargetingFilters
    expect(applied.loresMin).toBe(0)
    expect(applied.loresMax).toBe(3)
  })

  it('applies kidsMin for health industries', async () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner', 'dental')
    await wrapper.get('[data-testid="industry-filter-preset"]').trigger('click')
    const applied = (wrapper.emitted('update:filters') ?? []).slice(-1)[0]?.[0] as TargetingFilters
    expect(applied.kidsMin).toBe(1)
  })

  it('exposes children-in-household controls for LeadGen', () => {
    const wrapper = mountFilters(LEADGEN_FILTERS, 'planner', 'hvac')
    expect(wrapper.find('[data-testid="filter-kids"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="filter-control-kids-min"]').attributes('disabled')).toBeUndefined()
  })

  it('hides children-in-household when the provider does not support kids', () => {
    const wrapper = mountFilters(DATA_RETRIEVER_FILTERS, 'data_retriever')
    expect(wrapper.find('[data-testid="filter-kids"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('children in household')
  })

  it('hides the preset chip when the provider cannot take property filters', () => {
    const wrapper = mountFilters(DATA_RETRIEVER_FILTERS, 'data_retriever')
    expect(wrapper.find('[data-testid="industry-filter-preset"]').exists()).toBe(false)
  })

  it('hides the preset chip while capabilities are unresolved (fail closed)', () => {
    const wrapper = mountFilters(null, 'planner')
    expect(wrapper.find('[data-testid="industry-filter-preset"]').exists()).toBe(false)
  })
})
