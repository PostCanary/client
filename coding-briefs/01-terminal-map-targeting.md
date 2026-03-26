# Coding Brief #1: Terminal 1 — Map & Targeting (Wizard Step 2)

> **Owner:** Claude Terminal 1
> **Branch from:** `main` (after prerequisites merged) or `feat/campaign-prerequisites`
> **Branch name:** `feat/campaign-targeting`
> **Depends on:** Brief #0 (Prerequisites) — shared types, draft store, wizard shell
> **Estimated scope:** ~12 new files, ~3 modified files
> **Round 1 rule:** Mock household counts. No Melissa Data. Shaded area overlay, NOT individual dots.
> **CI requirement:** If adding any server Python, it must pass `ruff check`, `black --check`, `mypy`, and `pytest`. See Brief #0 for full CI details.
> **Import existing config:** Use `PlanCode` from `@/api/billing` and `PLAN_DISPLAY_DETAILS` from `@/config/plans.ts` — do NOT redefine plan names or pricing tiers.

---

## What This Terminal Builds

**Wizard Step 2: "Pick Your Neighborhood"** — the targeting map where customers select who gets their postcards.

Full-width Leaflet map with a collapsible right panel. Three targeting methods (around jobs, draw shapes, enter ZIPs) that can combine. Filters, exclusions, household count, and cost estimate — all updating in real time.

Also: minor upgrades to the existing sidebar Map page (layer toggles, "Send Postcards" button).

---

## DO NOT BUILD (belongs to other terminals or rounds)

- Wizard shell, progress bar, navigation (Brief #0)
- Step 1 goal selection (Terminal 3)
- Step 3 design (Terminal 2)
- Step 4 review (Terminal 3)
- Campaigns page, Campaign detail (Terminal 3)
- Real Melissa Data integration (Round 2+)
- Saved audience management UI beyond save dialog (Round 2)
- Home page (Round 2)
- Sidebar redesign (Round 2)

---

## Codebase Patterns (same as Brief #0 — abbreviated here)

- Vue 3 `<script setup lang="ts">`, Pinia stores, Tailwind + CSS vars
- Existing map: `src/pages/Heatmap.vue` uses Leaflet 1.9.4 + MarkerCluster
- Existing composable: `src/composables/useHeatmapPoints.ts`
- Map tile layer: check existing Heatmap.vue for the tile URL pattern
- All data scoped by `org_id` via session cookie

---

## Architecture (from spec)

```
┌─────────────────────────────────────────────────────┐
│  WIZARD STEP 2: "Pick Your Neighborhood"            │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │                      │  │   Right Panel         │ │
│  │                      │  │   (collapsible)       │ │
│  │     LEAFLET MAP      │  │                       │ │
│  │                      │  │   Tab: Target         │ │
│  │  - Drawing tools     │  │   Tab: Refine         │ │
│  │  - Job pins          │  │   Tab: Summary        │ │
│  │  - Shaded areas      │  │                       │ │
│  │  - Layer toggles     │  │                       │ │
│  │                      │  │                       │ │
│  └──────────────────────┘  └──────────────────────┘ │
│                                                      │
│  [← Back]                              [Next →]     │
└─────────────────────────────────────────────────────┘
```

---

## File List

### New Files — Client

| File | Purpose |
|------|---------|
| `src/components/wizard/StepTargeting.vue` | **Main component** — replaces StepTargetingStub. Full-width map + collapsible right panel |
| `src/components/targeting/TargetingMap.vue` | Leaflet map with drawing tools, job pins, shaded areas |
| `src/components/targeting/TargetingPanel.vue` | Right panel container with 3 tabs |
| `src/components/targeting/PanelTabTarget.vue` | Tab 1: targeting method selection (Around Jobs / Draw / ZIP) |
| `src/components/targeting/PanelTabRefine.vue` | Tab 2: filters + exclusions |
| `src/components/targeting/PanelTabSummary.vue` | Tab 3: household count + cost + save audience |
| `src/components/targeting/DrawingToolbar.vue` | Circle/Rectangle/Polygon drawing tools |
| `src/components/targeting/JobSelector.vue` | Job list with checkboxes + radius slider |
| `src/components/targeting/ZipInput.vue` | ZIP code entry (type or paste multiple) |
| `src/components/targeting/FilterSlider.vue` | Reusable range slider for home value / year built |
| `src/components/targeting/ExclusionToggles.vue` | Past customer toggle, frequency cap, do-not-mail display |
| `src/composables/useTargetingMap.ts` | Map initialization, drawing handlers, area calculation |

### Modified Files

| File | Change |
|------|--------|
| `src/components/wizard/WizardShell.vue` | Import `StepTargeting` instead of `StepTargetingStub` |
| `src/pages/Heatmap.vue` | Add layer toggles (customers/mail/matched), "Send Postcards" button |
| `src/types/campaign.ts` | Add any missing targeting-specific types (should already be there from Brief #0) |

---

## Component Tree

```
StepTargeting.vue
├── TargetingMap.vue
│   ├── (Leaflet map instance)
│   ├── DrawingToolbar.vue
│   └── (Tile layer + markers + shaded areas)
├── TargetingPanel.vue
│   ├── PanelTabTarget.vue
│   │   ├── JobSelector.vue (if "Around My Jobs")
│   │   ├── DrawingToolbar controls (if "Draw on Map")
│   │   └── ZipInput.vue (if "Enter ZIP Codes")
│   ├── PanelTabRefine.vue
│   │   ├── FilterSlider.vue (home value)
│   │   ├── FilterSlider.vue (year built)
│   │   └── ExclusionToggles.vue
│   └── PanelTabSummary.vue
│       ├── Household count breakdown
│       ├── Cost estimate
│       └── Save audience dialog
└── (reads from useCampaignDraftStore.draft.goal)
    (writes to useCampaignDraftStore.setTargeting())
```

---

## Build Order

### Phase 1: Map Foundation

**Task 1: Create `useTargetingMap` composable**

Handles all Leaflet map logic. Keeps the Vue components clean.

```typescript
// src/composables/useTargetingMap.ts
export function useTargetingMap(mapContainer: Ref<HTMLElement | null>) {
  const map = shallowRef<L.Map | null>(null)
  const drawnAreas = ref<TargetingArea[]>([])
  const jobPins = ref<JobReference[]>([])
  const activeDrawTool = ref<'circle' | 'rectangle' | 'polygon' | null>(null)

  function initMap() {
    // Initialize Leaflet map
    // Use same tile layer as existing Heatmap.vue
    // Center on user's location (from brand kit or browser geolocation)
  }

  function startDraw(tool: 'circle' | 'rectangle' | 'polygon') {
    // EXPLICIT activation — no accidental draws
    // Set activeDrawTool, add draw event listeners
  }

  function finishDraw(layer: L.Layer) {
    // Convert drawn layer to TargetingArea
    // Add resize handles, drag-to-move, X-to-delete
    // Add to drawnAreas
    // Recalculate household count
  }

  function addJobRadii(jobs: JobReference[], radiusMiles: number) {
    // Draw teal semi-transparent circles around each job
    // Merge overlapping areas
    // Show job pins with unchecking capability
  }

  function highlightZips(zipCodes: string[]) {
    // Highlight ZIP code areas on map
    // Use approximate ZIP boundaries (GeoJSON or centroid + radius)
  }

  function clearAll() {
    // Remove all drawn areas, job radii, ZIP highlights
  }

  function getShading(): L.Layer {
    // Teal semi-transparent overlay for all selected areas
    // NOT individual household dots
  }

  // Computed: union of all targeting areas
  const totalAreaSqMiles = computed(() => { /* calculate */ })

  return {
    map, drawnAreas, jobPins, activeDrawTool,
    initMap, startDraw, finishDraw,
    addJobRadii, highlightZips, clearAll,
    totalAreaSqMiles,
  }
}
```

**Key decisions:**
- Use Leaflet's built-in L.Draw plugin (add `leaflet-draw` package) for circle/rectangle/polygon
- Teal shading: `fillColor: '#47bfa9', fillOpacity: 0.2, strokeColor: '#47bfa9', strokeWeight: 2`
- Job pins: dark navy markers with service icon
- Each drawn shape gets: resize handles, drag to reposition, X button to delete
- Drawing requires EXPLICIT click on tool button — no default draw mode

**Task 2: Create `TargetingMap.vue`**

```vue
<!-- Full-width Leaflet map -->
<template>
  <div class="relative flex-1 h-full">
    <div ref="mapEl" class="w-full h-full" />

    <!-- Drawing toolbar overlay (top-left of map) -->
    <DrawingToolbar
      v-if="showDrawTools"
      :active-tool="targetMap.activeDrawTool.value"
      @select="targetMap.startDraw"
      @clear="targetMap.clearAll"
    />

    <!-- First-time guided prompt (overlay, dismissible) -->
    <div v-if="showFirstTimePrompt" class="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
      <div class="bg-white rounded-xl p-8 max-w-md text-center shadow-xl">
        <h3 class="text-lg font-semibold text-[#0b2d50] mb-4">How would you like to target?</h3>
        <div class="flex flex-col gap-3">
          <button @click="selectMethod('around_jobs')" class="...">📍 Around My Jobs</button>
          <button @click="selectMethod('draw')" class="...">✏️ I'll Draw on the Map</button>
          <button @click="selectMethod('zip')" class="...">🔢 Enter ZIP Codes</button>
        </div>
      </div>
    </div>

    <!-- Layer toggle controls (top-right) -->
    <div class="absolute top-3 right-3 bg-white rounded-lg shadow p-2 z-10">
      <!-- Checkboxes: Past Customers, Mail Sent, Matched Jobs -->
      <!-- Marker display: Clustered / Markers / Hidden -->
    </div>
  </div>
</template>
```

**First-time guided prompt:**
- Shows on first visit only (check localStorage: `pc:targeting-intro-seen`)
- 3 clear buttons: Around My Jobs / I'll Draw / Enter ZIP Codes
- Disappears after first use
- If no CRM data (no jobs): "Around My Jobs" button is disabled with tooltip "Upload CRM data first"

### Phase 2: Right Panel

**Task 3: Create `TargetingPanel.vue`**
- Collapsible panel on right side (← toggle button)
- 3 tabs: "Target" | "Refine" | "Summary"
- Default width: 360px
- Collapsed: 0px (map takes full width)
- Tab indicator shows relevant info: "Target" tab shows method, "Refine" shows "X filters applied"

**Task 4: Create `PanelTabTarget.vue`**
Three sections, one per targeting method. All methods can COMBINE (select multiple).

**Around My Jobs section:**
```vue
<JobSelector
  :jobs="mockJobs"
  :radius-miles="jobRadius"
  @update:radius="updateRadius"
  @toggle-job="toggleJob"
/>
```
- List of recent jobs (mock data for Round 1 — 5-10 fake jobs in Scottsdale area)
- Each job: checkbox + address + service type + date
- Radius slider: 0.25 to 2.0 miles, default 0.5
- "Select All" / "Deselect All" links
- When jobs selected: map shows pins + teal radius circles

**Draw on Map section:**
- Buttons: Circle | Rectangle | Polygon
- Instructions text: "Click a tool, then draw on the map"
- List of drawn shapes with delete (X) buttons
- "Clear All" link

**Enter ZIP Codes section:**
```vue
<ZipInput
  :zips="enteredZips"
  @add="addZip"
  @remove="removeZip"
/>
```
- Text input with "Add" button
- Support pasting comma-separated ZIPs
- Validate against known ZIP list (or 5-digit format for Round 1)
- Show entered ZIPs as pills with X to remove
- Map highlights each ZIP area

**Task 5: Create `PanelTabRefine.vue`**

**Filters (collapsed by default, "X applied" indicator):**

```vue
<div>
  <button @click="showFilters = !showFilters" class="...">
    Filters {{ activeFilterCount > 0 ? `(${activeFilterCount} applied)` : '' }}
    <ChevronIcon :class="{ 'rotate-180': showFilters }" />
  </button>

  <div v-if="showFilters" class="space-y-4 mt-3">
    <!-- Homeowner/Renter toggle -->
    <div>
      <label>Property ownership</label>
      <select v-model="filters.homeowner">
        <option :value="null">Any</option>
        <option :value="true">Homeowners only</option>
        <option :value="false">Renters only</option>
      </select>
    </div>

    <!-- Home value range slider -->
    <FilterSlider
      label="Home value"
      :min="50000" :max="2000000" :step="25000"
      v-model:min-value="filters.homeValueMin"
      v-model:max-value="filters.homeValueMax"
      :format="formatCurrency"
    />

    <!-- Year built range slider -->
    <FilterSlider
      label="Year built"
      :min="1900" :max="2026" :step="1"
      v-model:min-value="filters.yearBuiltMin"
      v-model:max-value="filters.yearBuiltMax"
    />

    <!-- Property type checkboxes -->
    <div>
      <label>Property type</label>
      <div class="flex flex-wrap gap-2">
        <label v-for="type in propertyTypes" :key="type">
          <input type="checkbox" :value="type" v-model="filters.propertyTypes" />
          {{ type }}
        </label>
      </div>
    </div>

    <button @click="resetFilters" class="text-sm text-[#47bfa9]">Reset filters</button>
  </div>
</div>
```

**Smart defaults by industry** (from brand kit):
- Roofing: homeowners, single family, 15+ year homes
- HVAC: homeowners, single family
- Plumbing: any ownership, any type
- Apply on first load if filters are untouched

**Exclusions (Smart Mailing section — always visible):**
```vue
<ExclusionToggles
  :goal="draftStore.draft.goal"
  v-model:exclude-past-customers="excludePastCustomers"
  v-model:exclude-mailed-within-days="excludeMailedWithinDays"
  :do-not-mail-count="doNotMailCount"
/>
```
- Past customer toggle: auto-set from goal defaults (OFF for neighbor, ON for seasonal/win-back)
- Cross-campaign frequency: "Exclude addresses mailed within [dropdown: 15/30/60/90 days]"
- Do Not Mail: "X addresses on your Do Not Mail list" (read-only, managed in Settings)
- Clear labels explaining what each exclusion does

**Task 6: Create `PanelTabSummary.vue`**

**Household count + cost — updates in real time:**

```
┌─────────────────────────────┐
│  Households in your area     │
│  ────────────────────────── │
│  Total in area:        1,247 │
│  - Past customers:      -83  │
│  - Recently mailed:     -41  │
│  - Do Not Mail:          -7  │
│  ────────────────────────── │
│  Final count:          1,116 │
│                              │
│  Cost Estimate               │
│  ────────────────────────── │
│  Card 1: 1,116 × $0.69 = $770│
│  Card 2: 1,116 × $0.69 = $770│
│  Card 3: 1,116 × $0.69 = $770│
│  ────────────────────────── │
│  Total: $2,309               │
│                              │
│  [Save This Audience]        │
└─────────────────────────────┘
```

- Transparent math: show total, each exclusion as separate line, final count
- Cost: `finalCount × perCardRate × sequenceLength` (from Step 1)
- Per-card breakdown for sequences
- **First-time users:** cost only, no estimated return. Show: "After your first campaign, we'll show estimated returns based on your actual results"
- **Returning users (Round 2):** cost + estimated return
- **Small campaigns (<100 households):** positive messaging. "Great start! Even small campaigns drive results."

**Save Audience dialog:**
- Button: "Save This Audience"
- Modal: name input + save button
- Saves targeting CRITERIA (not household list) — recalculates count on load
- Saved audiences available as a 4th targeting method (Round 2)

### Phase 3: Integration + Polish

**Task 7: Wire up to draft store**

`StepTargeting.vue` is the orchestrator:
```vue
<script setup lang="ts">
import { useCampaignDraftStore } from '@/stores/useCampaignDraftStore'
import { useBrandKitStore } from '@/stores/useBrandKitStore'

const draftStore = useCampaignDraftStore()
const brandKit = useBrandKitStore()

// Read goal context from Step 1
const goal = computed(() => draftStore.draft?.goal)
const goalDefaults = computed(() =>
  goal.value ? GOAL_DEFAULTS[goal.value.goalType] : null
)

// Initialize exclusion toggles from goal defaults
const excludePastCustomers = ref(goalDefaults.value?.includePastCustomers === false)
const excludeMailedWithinDays = ref(goalDefaults.value?.frequencyExclusionDays ?? 30)

// Build TargetingSelection and write to store
function commitTargeting() {
  const targeting: TargetingSelection = {
    campaignGoal: goal.value!.goalType,
    serviceType: goal.value!.serviceType,
    sequenceLength: goal.value!.sequenceLength,
    sequenceSpacingDays: goal.value!.sequenceSpacingDays,
    areas: /* from map */,
    method: /* from selected methods */,
    filters: /* from filter panel */,
    // ... all fields
  }
  draftStore.setTargeting(targeting)
}

// Auto-commit on changes (debounced)
watch([areas, filters, exclusions], debounce(commitTargeting, 1000))
</script>
```

**Task 8: Mock data + household count logic**

Create mock data utilities in `StepTargeting.vue` or a helper file:

```typescript
// Mock jobs (Around My Jobs)
const MOCK_JOBS: JobReference[] = [
  { id: '1', address: '7234 E Camelback Rd, Scottsdale, AZ', lat: 33.5092, lng: -111.9280, serviceType: 'Water Heater', jobDate: '2026-03-01', selected: true },
  { id: '2', address: '8501 N Scottsdale Rd, Scottsdale, AZ', lat: 33.5186, lng: -111.9260, serviceType: 'Drain Clearing', jobDate: '2026-03-10', selected: true },
  // ... 3-5 more in the Scottsdale area
]

// Mock household count calculation
function estimateHouseholds(areas: TargetingArea[], filters: TargetingFilters): number {
  const DENSITY = 500 // households per sq mile (suburban)
  let totalSqMiles = 0

  for (const area of areas) {
    if (area.type === 'circle') {
      totalSqMiles += Math.PI * (area.radiusMiles ?? 0.5) ** 2
    } else if (area.type === 'rectangle') {
      // Calculate from coordinates
    } else if (area.type === 'zip') {
      totalSqMiles += 8 // rough avg per ZIP
    }
    // ... polygon uses shoelace formula for area
  }

  let count = Math.round(totalSqMiles * DENSITY)

  // Apply filter reductions (mock)
  if (filters.homeowner === true) count = Math.round(count * 0.65) // 35% renters removed
  if (filters.propertyTypes.length > 0 && filters.propertyTypes.length < 5) {
    count = Math.round(count * 0.7) // property type reduces by ~30%
  }
  if (filters.homeValueMin || filters.homeValueMax) count = Math.round(count * 0.6)
  if (filters.yearBuiltMin || filters.yearBuiltMax) count = Math.round(count * 0.7)

  return Math.max(count, 0)
}

// CRITICAL: Terminal 2 reads targeting.recipientBreakdown to determine
// messaging tone (cold vs past customer). This MUST be populated.
function mockRecipientBreakdown(
  finalCount: number,
  excludePastCustomers: boolean,
  pastCustomersInArea: number
): RecipientBreakdown {
  if (excludePastCustomers) {
    return { newProspects: finalCount, pastCustomers: 0, pastCustomersIncluded: false }
  }
  return {
    newProspects: finalCount - pastCustomersInArea,
    pastCustomers: pastCustomersInArea,
    pastCustomersIncluded: true,
  }
}

// Mock past customers: ~5-10% of households in area are past customers
function mockPastCustomersInArea(totalHouseholds: number): number {
  return Math.round(totalHouseholds * 0.07) // 7% mock rate
}
```

**Task 9: Timing warnings**
- Check scheduled dates against holiday blacklist:
  - Thanksgiving week, Christmas-New Year week, July 4th week
- If targeting completed during these periods, show inline warning (not blocking):
  "Heads up — postcards sent this week may arrive during [holiday]. Consider adjusting your timing in the next step."
- This is informational only in Step 2. Actual date selection happens in Step 4.

**Task 10: Update existing Heatmap page**

Minor changes to `src/pages/Heatmap.vue`:
- Add layer toggles if not already present: Past Customers / Mail Sent / Matched Jobs (existing data shows "matched" only — add the others)
- Add marker display toggle: Clustered / Markers / Hidden
- Add "Send Postcards" button somewhere visible — routes to `/app/send`
- These are small UI additions, not rebuilds

---

## Leaflet Drawing Implementation Notes

**Package:** Add `leaflet-draw` to `package.json`:
```bash
npm install leaflet-draw @types/leaflet-draw
```

**Drawing tool activation flow:**
1. User clicks Circle/Rectangle/Polygon button in `DrawingToolbar`
2. `activeDrawTool` ref set → Leaflet draw handler enabled
3. User draws on map → `draw:created` event fires
4. Shape added to `drawnAreas` array + displayed on map
5. Draw tool auto-deactivates (one shape per click)
6. User can click tool again for another shape

**Shape interaction:**
- Drawn shapes: teal fill (`#47bfa9`, 20% opacity), teal border
- Hover: border thickens
- Click: shows edit handles (resize corners/edges)
- Drag: reposition entire shape
- Delete: X button appears on hover (top-right of shape bounds)

**Self-intersecting polygon:** Validate geometry on `draw:created`. If polygon self-intersects, show error toast: "Your shape crosses itself — please redraw." Don't add to map.

**Invalid ZIP codes:** Validate against 5-digit format. Show inline error for invalid entries. Skip silently (with note) for valid-format but non-existent ZIPs (full validation needs Melissa Data).

---

## Expert Checkpoints

| After Task | Expert | Check |
|-----------|--------|-------|
| Task 1 (composable) | Evan You | Is the composable clean? Proper use of refs, computed, watchers? |
| Task 2 (map component) | Krug | Is the first-time prompt clear? Can Bob figure out targeting without help? |
| Task 4 (target tab) | Norman | What if they have no CRM data? (Draw/ZIP available, "Around My Jobs" disabled with explanation.) |
| Task 5 (filters) | DHH | Are we showing too many filters? Would smart defaults + one "Adjust filters" link be simpler? |
| Task 6 (summary) | Knaflic | Is the count breakdown clear? Does Bob know within 3 seconds how many postcards he's sending and what it costs? |
| Task 6 (summary) | Skok | Is cost framing right? Show cost per household, not just total. |
| Task 8 (mock data) | Beck | Is mock data realistic enough to test the full flow? |
| Task 10 (heatmap) | DHH | Are we adding too much to the existing page? Keep changes minimal. |

---

## Done Criteria

- [ ] Step 2 renders full-width map + collapsible right panel
- [ ] First-time prompt appears and dismisses correctly
- [ ] "Around My Jobs" shows mock job pins with radius circles
- [ ] Drawing tools create circle, rectangle, and polygon shapes
- [ ] Drawn shapes are draggable, resizable, deletable
- [ ] ZIP code entry highlights areas on map
- [ ] All three methods can combine (union areas)
- [ ] Filters collapse/expand with "X applied" indicator
- [ ] Smart defaults applied based on industry from brand kit
- [ ] Exclusion toggles auto-set from Step 1 goal
- [ ] Household count updates in real time as areas/filters change
- [ ] Cost breakdown shows per-card and total
- [ ] Transparent exclusion math: total - each exclusion = final
- [ ] Small campaign encouragement appears for <100 households
- [ ] Save audience dialog works (saves name + criteria to localStorage for Round 1)
- [ ] Data writes to `useCampaignDraftStore.setTargeting()` correctly
- [ ] Existing Heatmap page gets layer toggles + "Send Postcards" button
- [ ] No console errors, no TypeScript errors
- [ ] Map is responsive — panel collapse gives full map width

---

## Data Flow Summary

```
Step 1 (Goal)                  Step 2 (This Terminal)              Step 3 (Design)
─────────────                  ─────────────────────               ──────────────
goalType         ──────►  auto-set exclusions                  reads targeting for
serviceType      ──────►  auto-set filters (smart defaults)    recipient breakdown
sequenceLength   ──────►  cost calculation                     (cold vs past customer
sequenceSpacingDays ───►  cost per card                        messaging)

                           TargetingSelection ─────────────►   recipientBreakdown
                           written to draft store              used for AI text
                                                               generation tone
```
