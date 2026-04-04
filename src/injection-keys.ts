// src/injection-keys.ts
// Symbol keys for provide/inject — prevents collisions, sets precedent for codebase.
import type { InjectionKey, Ref } from 'vue'

export const HOUSEHOLD_COUNT_KEY = Symbol('householdCount') as InjectionKey<{
  loading: Ref<boolean>
  error: Ref<string | null>
  source: Ref<'melissa' | 'mock'>
  fetchTotalIfNeeded: () => void
}>
