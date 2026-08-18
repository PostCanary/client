// Feature flags — default OFF; enable per-flag via env vars.
// Production deploy: leave unset (OFF). Operator override: set VITE_ENABLE_AROUND_MY_JOBS=true.
export const AROUND_MY_JOBS = import.meta.env.VITE_ENABLE_AROUND_MY_JOBS === 'true'
// EDDM (Every Door Direct Mail) campaign type. Off until carrier-routes data + Step 2 EDDM path land.
export const EDDM_ENABLED = import.meta.env.VITE_ENABLE_EDDM === 'true'
// First-run 4-step OnboardingModal. Keep OFF — v1 uses /app/setup instead.
// Re-enable with VITE_ENABLE_ONBOARDING=true only if product revives the modal.
export const ONBOARDING_ENABLED = import.meta.env.VITE_ENABLE_ONBOARDING === 'true'
