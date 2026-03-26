# Terminal 1 (Map & Targeting) — Stress Test Results + Corrected Plan

## Stress Test Summary

11 IMPORTANT issues found, 0 blockers. All fixes below.

## Fix 1: Incomplete `commitTargeting()` — CRITICAL for Terminal 2 + 3

The brief's Task 7 only shows 7 of 22 required fields. Codex would build an incomplete object. Here's the complete function that must be in the brief:

```typescript
function commitTargeting() {
  const totalHouseholds = estimateHouseholds(drawnAreas.value, filters)
  const pastInArea = mockPastCustomersInArea(totalHouseholds)
  const excludedPast = excludePastCustomers.value ? pastInArea : 0
  const excludedRecent = Math.round(totalHouseholds * 0.03) // 3% mock recently mailed
  const excludedDNM = 7 // mock do-not-mail count
  const finalCount = Math.max(totalHouseholds - excludedPast - excludedRecent - excludedDNM, 0)
  const perCardRate = PRICING.payPerSend // default for Round 1

  const targeting: TargetingSelection = {
    campaignGoal: goal.value!.goalType,
    serviceType: goal.value!.serviceType,
    sequenceLength: goal.value!.sequenceLength,
    sequenceSpacingDays: goal.value!.sequenceSpacingDays,
    areas: drawnAreas.value,
    method: determineMethod(),
    filters: { ...filters },
    jobsUsed: selectedJobs.value,
    jobRadiusMiles: jobRadius.value,
    excludePastCustomers: excludePastCustomers.value,
    excludeMailedWithinDays: excludeMailedWithinDays.value,
    doNotMailCount: excludedDNM,
    totalHouseholds,
    excludedPastCustomers: excludedPast,
    excludedRecentlyMailed: excludedRecent,
    excludedDoNotMail: excludedDNM,
    finalHouseholdCount: finalCount,
    pastCustomersInArea: pastInArea,
    recipientBreakdown: mockRecipientBreakdown(finalCount, excludePastCustomers.value, pastInArea),
    estimatedCostSingle: finalCount * perCardRate,
    estimatedCostSequence: finalCount * perCardRate * goal.value!.sequenceLength,
    savedAudienceName: null,
  }
  draftStore.setTargeting(targeting)
}
```

## Fix 2: leaflet-draw TypeScript types + CSS import

Add to Task 1 (or a new pre-task):
```bash
npm install leaflet-draw @types/leaflet-draw
```

Add CSS import to the composable or component:
```typescript
import 'leaflet-draw/dist/leaflet.draw.css'
```

Without this CSS import, the drawing toolbar renders as broken unstyled elements.

Also add to brief's leaflet-draw section: if `@types/leaflet-draw` doesn't exist on npm or is outdated, create a minimal `src/types/leaflet-draw.d.ts` declaration file.

## Fix 3: Map center — BrandKit.location is not geocodable

`BrandKit.location` is a string like "Scottsdale, AZ" — you can't pass this to Leaflet's `setView()`. Fix:

```typescript
// In useTargetingMap composable
const DEFAULT_CENTER: [number, number] = [33.4484, -111.9490] // Phoenix, AZ
const DEFAULT_ZOOM = 11

function initMap() {
  // Round 1: always use default center (no geocoding)
  // Round 2: geocode brandKit.location or use browser geolocation
  map.value = L.map(mapContainer.value!, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  })
}
```

Remove the brief's claim about centering on brandKit.location. For Round 1, all maps center on Phoenix/Scottsdale (where mock jobs are).

## Fix 4: Build order — fix forward dependencies

Current order has Task 2 importing DrawingToolbar (Task 4) and Task 6 needing estimateHouseholds (Task 8).

**Corrected order:**
1. Task 1: `useTargetingMap` composable (map logic only, no toolbar component)
2. Task 2: `DrawingToolbar.vue` + `JobSelector.vue` + `ZipInput.vue` + `FilterSlider.vue` + `ExclusionToggles.vue` (all small sub-components first)
3. Task 3: `TargetingMap.vue` (imports DrawingToolbar — now exists)
4. Task 4: `TargetingPanel.vue` container (imports sub-components — now exist)
5. Task 5: `PanelTabTarget.vue` (uses JobSelector, ZipInput, DrawingToolbar)
6. Task 6: Mock data utilities — `estimateHouseholds()`, `mockRecipientBreakdown()`, `mockPastCustomersInArea()` (needed before summary)
7. Task 7: `PanelTabRefine.vue` (uses FilterSlider, ExclusionToggles)
8. Task 8: `PanelTabSummary.vue` (uses estimateHouseholds — now exists)
9. Task 9: `StepTargeting.vue` main orchestrator (imports everything)
10. Task 10: Update WizardShell + Heatmap page

## Fix 5: Panel collapse → `map.invalidateSize()`

When the 360px right panel collapses, Leaflet doesn't auto-resize. Add to `useTargetingMap`:

```typescript
function handlePanelToggle() {
  // Wait for CSS transition to complete, then tell Leaflet to recalculate
  setTimeout(() => {
    map.value?.invalidateSize()
  }, 350) // match panel transition duration
}
```

Expose this from the composable. Call it from TargetingPanel's collapse toggle.

## Fix 6: Mock data missing `doNotMailCount` and `excludedRecentlyMailed`

The complete `commitTargeting()` function in Fix 1 includes these:
- `excludedRecentlyMailed`: 3% of total households (mock)
- `doNotMailCount`: hardcoded 7 (mock)

Both display in PanelTabSummary's transparent math breakdown.

## Fix 7: Overlapping shapes — deduplication note

Add to estimateHouseholds: "NOTE: Round 1 mock counting sums areas independently. Overlapping shapes WILL double-count. This is acceptable for mock data — real Melissa Data integration (Round 2) handles proper deduplication. Add a comment in the code explaining this."

## Fix 8: Heatmap billing overlay

The existing Heatmap.vue has a billing blur overlay for preview-mode users. New UI elements (layer toggles, "Send Postcards" button) should be ABOVE the blur overlay (higher z-index) or hidden when billing overlay is active. Check `shouldBlur` computed in Heatmap.vue and ensure new elements respect it.

## Fix 9-11: leaflet-draw ESM + CSS consolidated

All three leaflet-draw issues resolved by adding to the execution plan pre-flight:

**Pre-flight step 4 (expanded):**
```bash
npm install leaflet-draw @types/leaflet-draw
```
Then create a test component:
```vue
<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
// Test: does this import without errors?
</script>
```
If import fails: try dynamic import, then Leaflet.PM, then custom handlers. Do NOT proceed until drawing works.

## Additional Fixes from MINOR issues

- **Max area cap:** If estimated households > 50,000, show warning: "That's a large area. Most campaigns target 200-2,000 households." Not blocking.
- **Use CSS variables:** Replace hardcoded `#47bfa9` with `var(--app-teal)` where the variable is available (inside app layout). In map overlays (Leaflet-rendered), hex is fine.
- **Map loading state:** Show "Loading map..." centered text while Leaflet initializes. If tile layer fails, show "Map couldn't load — check your internet connection" with retry button.
- **Window resize:** Add `ResizeObserver` on the map container in the composable, call `map.invalidateSize()` on resize.

## Corrected Execution Plan — One File Per Task

Each task: create ONE file, verify it compiles, test it works. If Codex fails on one task, the damage is contained.

**Phase 1: Foundation (Tasks 1-3)**

Task 1: Install leaflet-draw + verify compatibility
- `npm install leaflet-draw @types/leaflet-draw`
- Create throwaway test component importing leaflet-draw + CSS
- Verify it compiles and renders. If it fails → use Leaflet.PM fallback.
- Read first: `src/pages/Heatmap.vue` (existing map pattern), `package.json`
- Done: leaflet-draw imports without errors

Task 2: Create `src/data/mockTargetingData.ts`
- Mock jobs array (5-10 JobReference objects in Scottsdale)
- `estimateHouseholds()` function
- `mockRecipientBreakdown()` function
- `mockPastCustomersInArea()` function
- Read first: `src/types/campaign.ts` (TargetingSelection, JobReference interfaces)
- Done: all functions can be called with test data, return correct shapes

Task 3: Create `src/composables/useTargetingMap.ts`
- Map init (OpenStreetMap tiles, center on Phoenix default)
- Drawing handlers (startDraw, finishDraw, addJobRadii, highlightZips, clearAll)
- `handlePanelToggle()` with `map.invalidateSize()` after 350ms
- ResizeObserver for window resize
- leaflet-draw CSS imported here
- Read first: `src/pages/Heatmap.vue` (copy tile layer pattern), `src/composables/useHeatmapPoints.ts` (existing composable style)
- Done: composable can be instantiated, map initializes in a test div

**Phase 2: Sub-Components (Tasks 4-8) — one component per task**

Task 4: Create `src/components/targeting/DrawingToolbar.vue`
- Circle / Rectangle / Polygon buttons
- Active tool highlight (teal bg)
- "Click the circle button, then click on the map where you want to mail" instructions
- Clear All link
- List of drawn shapes with X to delete
- Props: `activeTool`, Events: `@select`, `@clear`
- Read first: `src/types/campaign.ts` (TargetingArea type)
- Done: component renders, buttons emit events

Task 5: Create `src/components/targeting/JobSelector.vue`
- Checkbox list of jobs (address + service type + date)
- Radius slider (0.25-2.0 miles, default 0.5)
- Select All / Deselect All links
- Props: `jobs`, `radiusMiles`, Events: `@toggle-job`, `@update:radius`
- Read first: `src/types/campaign.ts` (JobReference type), `src/data/mockTargetingData.ts` (mock jobs)
- Done: component renders with mock jobs, checkboxes work, radius slider works

Task 6: Create `src/components/targeting/ZipInput.vue`
- Text input + Add button
- Paste comma-separated ZIPs support
- 5-digit validation
- ZIP pills with X to remove
- Props: `zips`, Events: `@add`, `@remove`
- Done: can add/remove ZIPs, paste works, invalid ZIPs show error

Task 7: Create `src/components/targeting/FilterSlider.vue`
- Reusable dual-handle range slider
- Props: `label`, `min`, `max`, `step`, `minValue`, `maxValue`, `format` (optional formatter function)
- Events: `@update:minValue`, `@update:maxValue`
- Done: slider renders, handles drag, formatted labels display

Task 8: Create `src/components/targeting/ExclusionToggles.vue`
- Past customer toggle (ON/OFF, label: "Don't mail people you already mailed in the last X days")
- Frequency cap dropdown (15/30/60/90 days)
- Do-not-mail count display (read-only)
- Auto-set from goal defaults when goal prop changes
- Props: `goal` (GoalSelection), `excludePastCustomers`, `excludeMailedWithinDays`, `doNotMailCount`
- Events: `@update:excludePastCustomers`, `@update:excludeMailedWithinDays`
- Read first: `src/types/campaign.ts` (GOAL_DEFAULTS)
- Done: toggles render, auto-set from goal type, labels are customer-friendly

**Phase 3: Container Components (Tasks 9-12)**

Task 9: Create `src/components/targeting/PanelTabTarget.vue`
- Three sections: "Neighbors of my recent jobs" / "I'll pick on the map" / "I know the ZIP codes"
- Each section uses the sub-components from Phase 2
- All methods visible, all combinable
- "Neighbors of my recent jobs" disabled with tooltip if no jobs: "You'll unlock this after uploading your customer list"
- Read first: Tasks 4-6 components
- Done: all 3 targeting methods render, interact with mock data

Task 10: Create `src/components/targeting/PanelTabRefine.vue`
- Filters section: collapsed by default, "(X applied)" indicator
- Uses FilterSlider (home value, year built) + ExclusionToggles
- Property type checkboxes (Single Family, Condo, Townhouse, Apartment, Mobile Home)
- Smart defaults by industry on first load (from brand kit)
- "Reset filters" link
- Read first: Tasks 7-8 components, `src/stores/useBrandKitStore.ts`
- Done: filters expand/collapse, changing filters emits updated values, smart defaults apply

Task 11: Create `src/components/targeting/PanelTabSummary.vue`
- Household count breakdown: total, -past customers, -recently mailed, -do not mail = **FINAL COUNT** (big, bold)
- Cost: per-card breakdown + total
- Industry average hint for first-timers: "HVAC companies typically see 2-4 calls per 100 postcards"
- Small campaign encouragement for <100 households
- Large area warning for >50K households
- Read first: `src/data/mockTargetingData.ts` (estimateHouseholds), `src/types/campaign.ts` (PRICING)
- Done: count and cost update when props change, math is correct, final count is visually emphasized

Task 12: Create `src/components/targeting/TargetingPanel.vue`
- Container with 3 tabs: "Target" | "Filters" | "Count & Cost"
- Collapsible: 360px default, 0px collapsed, toggle button on left edge
- Collapse toggle calls `handlePanelToggle()` from composable
- Tab indicator: "Filters" shows "(X applied)" count
- Read first: Tasks 9-11 (the 3 tab components)
- Done: panel renders, tabs switch, collapse/expand works, map resizes on collapse

**Phase 4: Map + Main Component (Tasks 13-15)**

Task 13: Create `src/components/targeting/TargetingMap.vue`
- Full-width Leaflet map using `useTargetingMap` composable
- First-time guided prompt: "Who should get your postcards?" with 3 buttons
- Layer toggle controls (top-right): Past Customers / Mail Sent / Matched Jobs
- Marker display toggle: Clustered / Markers / Hidden
- Map loading state ("Loading map...") and error state ("Map couldn't load — check your connection")
- Read first: `src/composables/useTargetingMap.ts`, `src/pages/Heatmap.vue` (for layer toggle pattern)
- Done: map renders, first-time prompt shows/dismisses, layers toggle

Task 14: Create `src/components/wizard/StepTargeting.vue` (main orchestrator)
- Layout: TargetingMap (full-width) + TargetingPanel (right, collapsible)
- Reads goal from `useCampaignDraftStore.draft.goal`
- Initializes exclusion defaults from `GOAL_DEFAULTS`
- `commitTargeting()` builds COMPLETE TargetingSelection (ALL 22 fields) on every change
- Debounced 1-second auto-commit
- Timing warnings for holiday blacklists
- Job recency: 60 days if no MailCampaigns exist for org, 30 days if any exist
- Read first: `src/stores/useCampaignDraftStore.ts`, `src/types/campaign.ts`, ALL targeting components
- Done: changing any targeting parameter updates the draft store with complete TargetingSelection. Check: `draftStore.draft.targeting.recipientBreakdown` is populated.

Task 15: Update WizardShell import + Heatmap.vue
- `WizardShell.vue`: change import `StepTargetingStub` → `StepTargeting`
- `Heatmap.vue`: add subtle "Want to send postcards to this area? →" link (NOT big teal button). Respect `shouldBlur` overlay. Add layer toggles if missing.
- Read first: both files fully, grep for all consumers
- Done: wizard Step 2 shows real targeting map. Existing Heatmap still works. E2E tests pass.

## Expert Product Fixes (from full panel review)

### Copy fixes (Wiebe + Krug + Tommy Mello):
- First-time prompt heading: ~~"How would you like to target?"~~ → **"Who should get your postcards?"**
- First-time button 1: ~~"Around My Jobs"~~ → **"Neighbors of my recent jobs"**
- First-time button 2: ~~"I'll Draw on the Map"~~ → **"I'll pick on the map"**
- First-time button 3: ~~"Enter ZIP Codes"~~ → **"I know the ZIP codes"**
- Drawing instructions: ~~"Click a tool, then draw on the map"~~ → **"Click the circle button, then click on the map where you want to mail"**
- Exclusion toggle: ~~"Exclude addresses mailed within 30 days"~~ → **"Don't mail people you already mailed in the last 30 days"**
- Tab "Refine" → **"Filters"**
- Tab "Summary" → **"Count & Cost"**
- No CRM tooltip: ~~"Upload CRM data first"~~ → **"You'll unlock this after uploading your customer list"**

### UX fixes:
- **Remove Save Audience button for Round 1** (Hulick): feature saves but can't reload = broken trust. Ship when it works end-to-end.
- **First-time cost display** (Cialdini): show industry average returns below cost: "HVAC companies typically see 2-4 calls per 100 postcards. Based on industry averages — we'll show YOUR actual results after your first campaign."
- **Final household count emphasized** (Knaflic): the final number (e.g., "1,116 households") should be text-2xl font-bold. Deductions are text-sm text-muted. Bob sees ONE clear number.
- **Heatmap "Send Postcards" button** (Emma): NOT a big teal CTA. Use a subtle link: "Want to send postcards to this area? →" — doesn't confuse analytics-only users.
- **Job recency first-time detection** (Hendrickson): check if org has any MailCampaigns. If zero → 60-day recency. If 1+ → 30-day recency. No localStorage needed — server query.

---

## Verification (unchanged — 18 checks from original plan)

All 18 verification steps from the original execution plan still apply. Adding:
19. Panel collapse → map fills full width with no gaps
20. Large area (>50K households) shows warning
21. Map shows loading state, handles tile failure gracefully
22. leaflet-draw CSS renders correctly (toolbar has icons, not broken text)
