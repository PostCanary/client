# Execution Plan: Terminal 1 — Map & Targeting (Wizard Step 2)

## Context

This builds the targeting map for the campaign wizard — Step 2: "Pick Your Neighborhood." Customers draw areas on a map, select jobs to target around, or enter ZIP codes. Filters refine the audience, and real-time household counts + cost estimates update as they work.

**Branch:** `feat/campaign-targeting` from `main` (after prerequisites merged)
**Brief:** `C:\Users\drake\postcanary\coding-briefs\01-terminal-map-targeting.md` (definitive reference)
**Depends on:** Prerequisites build complete and merged (shared types, draft store, wizard shell, brand kit store)

## Pre-Flight Checklist

1. Verify prerequisites branch is merged to main: `cd "C:/Users/drake/postcanary/client" && git log --oneline -5`
2. Verify wizard works with stubs: navigate to `/app/send`, click through all 4 stubs
3. Create branch in BOTH repos:
   - `cd "C:/Users/drake/postcanary/client" && git checkout -b feat/campaign-targeting`
   - `cd "C:/Users/drake/postcanary/server" && git checkout -b feat/campaign-targeting`
4. Test `leaflet-draw` compatibility BEFORE building anything:
   ```bash
   cd "C:/Users/drake/postcanary/client"
   npm install leaflet-draw
   ```
   Create a throwaway test component that imports leaflet-draw and renders a map with draw controls. Verify it compiles and renders with Vite 7 + Leaflet 1.9.4. If it fails (ESM issues are common), research alternatives: Leaflet.PM or custom draw handlers using native Leaflet events. Do NOT proceed with the full build until drawing works.
5. Check existing Heatmap.vue to understand the current map tile layer, marker setup, and data flow
6. Verify `npm run build` passes on the branch before making changes

## Build Order (10 tasks, 3 phases)

### Phase 1: Map Foundation (Tasks 1-2)

**Task 1: Create `useTargetingMap` composable**
- File: `src/composables/useTargetingMap.ts`
- Handles all Leaflet map logic — keeps Vue components clean
- Functions: `initMap()`, `startDraw()`, `finishDraw()`, `addJobRadii()`, `highlightZips()`, `clearAll()`
- Use SAME tile layer URL as existing `Heatmap.vue` (read it, copy the URL pattern)
- Map centers on user's location from brand kit store (`brandKit.location`) or falls back to Phoenix, AZ (33.4484, -111.9490) as default
- Teal shading for all selected areas: `fillColor: '#47bfa9', fillOpacity: 0.2, color: '#47bfa9', weight: 2`
- Drawing requires EXPLICIT tool activation (no accidental draws)
- Each drawn shape: resize handles, drag to reposition, X to delete
- **Verify:** Composable can be imported without errors. Map initializes in a test div.

**Task 2: Create `TargetingMap.vue`**
- File: `src/components/targeting/TargetingMap.vue`
- Full-width map rendering using `useTargetingMap` composable
- Drawing toolbar overlay (top-left of map)
- First-time guided prompt: 3 buttons (Around Jobs / Draw / ZIP) — stored in localStorage `pc:targeting-intro-seen`
- Layer toggle controls (top-right): Past Customers / Mail Sent / Matched Jobs checkboxes + marker display toggle
- If no CRM data: "Around My Jobs" disabled with tooltip "Upload CRM data first"
- **Verify:** Map renders, first-time prompt shows, dismiss it, refresh → prompt doesn't show again

### Phase 2: Right Panel (Tasks 3-6)

**Task 3: Create `TargetingPanel.vue`**
- File: `src/components/targeting/TargetingPanel.vue`
- Collapsible right panel: 360px default, 0px collapsed, toggle button on left edge
- 3 tabs: "Target" | "Refine" | "Summary"
- Tab indicators: "Refine" shows "(X applied)" when filters active
- **Verify:** Panel renders, tabs switch, collapse/expand works

**Task 4: Create `PanelTabTarget.vue` + sub-components**
- Files: `src/components/targeting/PanelTabTarget.vue`, `JobSelector.vue`, `ZipInput.vue`, `DrawingToolbar.vue`
- Three targeting method sections, all visible, all combinable
- **Around My Jobs:** JobSelector with mock jobs (5-10 in Scottsdale area), checkbox list, radius slider (0.25-2.0 miles, default 0.5), Select All / Deselect All
- **Draw on Map:** DrawingToolbar with Circle/Rectangle/Polygon buttons, "Click a tool, then draw" instructions, drawn shapes list with delete buttons, Clear All
- **Enter ZIP Codes:** ZipInput with text input + Add button, paste support for comma-separated ZIPs, validation (5-digit format), ZIP pills with X to remove
- Each method updates the map in real-time via the composable
- **Verify:** Select jobs → pins + radii appear on map. Draw shapes → shading appears. Enter ZIP → area highlights. All three combine.

**Task 5: Create `PanelTabRefine.vue` + sub-components**
- Files: `src/components/targeting/PanelTabRefine.vue`, `FilterSlider.vue`, `ExclusionToggles.vue`
- Filters collapsed by default, "X applied" indicator
- FilterSlider: reusable range slider component (home value: $50K-$2M, year built: 1900-2026)
- Property type checkboxes: Single Family, Condo, Townhouse, Apartment, Mobile Home
- Smart defaults by industry from brand kit (roofing = homeowners + single family + 15yr+)
- ExclusionToggles: past customer toggle (auto-set from goal defaults), frequency cap dropdown (15/30/60/90 days), do-not-mail count display
- **Verify:** Filters expand/collapse. Changing filters updates household count. Smart defaults apply on first load based on industry.

**Task 6: Create `PanelTabSummary.vue`**
- File: `src/components/targeting/PanelTabSummary.vue`
- Household count breakdown: total in area, -past customers, -recently mailed, -do not mail = final count
- Cost estimate: per-card breakdown (Card 1: X × $0.69 = $Y) + total
- Reads sequence length from draft store (from Step 1)
- First-time users: cost only. "After your first campaign, we'll show estimated returns."
- Small campaigns (<100): "Great start! Even small campaigns drive results."
- Save Audience button → modal with name input → saves criteria to localStorage (Round 1)
- **Verify:** Count updates in real-time as areas/filters change. Cost math is correct. Save dialog works.

### Phase 3: Integration + Polish (Tasks 7-10)

**Task 7: Create `StepTargeting.vue` (main orchestrator)**
- File: `src/components/wizard/StepTargeting.vue`
- Reads goal context from `useCampaignDraftStore.draft.goal`
- Initializes exclusion defaults from `GOAL_DEFAULTS[goalType]`
- Layout: full-width TargetingMap + collapsible TargetingPanel
- Debounced `commitTargeting()` function builds full `TargetingSelection` and calls `draftStore.setTargeting()`
- **MUST populate `recipientBreakdown`** with mock values (Terminal 2 depends on this)
- Auto-commits on area/filter/exclusion changes (1-second debounce)
- **Verify:** Change targeting → check draft store has correct TargetingSelection with all fields populated including recipientBreakdown

**Task 8: Mock data utilities**
- Mock jobs: 5-10 JobReference objects in Scottsdale, AZ area with realistic addresses, lat/lng, service types, dates
- `estimateHouseholds()`: ~500/sq mile density, filter reductions (homeowner -35%, property type -30%, value range -40%, year range -30%)
- `mockRecipientBreakdown()`: 7% of households are mock past customers
- `mockPastCustomersInArea()`: returns 7% of total
- Circle area: `π × r²`. Rectangle: width × height from coordinates. ZIP: ~8 sq miles avg. Polygon: shoelace formula.
- **Verify:** Draw a 1-mile radius circle → ~1,570 households. Apply homeowner filter → ~1,020. Math checks out.

**Task 9: Timing warnings**
- Holiday blacklist: Thanksgiving week, Christmas-New Year, July 4th week
- If current date falls in these windows, show inline warning (not blocking): "Heads up — postcards sent this week may arrive during [holiday]."
- Informational only — actual date selection is Step 4
- **Verify:** Set system date to late November → warning appears. Normal date → no warning.

**Task 10: Update WizardShell + existing Heatmap**
- `WizardShell.vue`: change import from `StepTargetingStub` to `StepTargeting`
- `Heatmap.vue` (minor additions only):
  - Add layer toggles if missing: Past Customers / Mail Sent / Matched Jobs
  - Add marker display toggle: Clustered / Markers / Hidden
  - Add "Send Postcards" teal button → routes to `/app/send`
  - **Blast radius:** Read Heatmap.vue fully first. Grep for all imports of Heatmap.vue. Check what data the layer toggles need (existing heatmap API supports `kind` filter).
- **Verify:** Wizard Step 2 shows real targeting map (not stub). Existing Heatmap page still works with new toggles.

## Codebase Guardian Rules

- Before modifying `Heatmap.vue` or `WizardShell.vue`: read fully, grep for all consumers
- Before using `leaflet-draw`: verify ESM compatibility in a test component first
- After every task: `npm run build` must pass
- After Task 10: run existing e2e Playwright tests to verify no regressions

## leaflet-draw Fallback Plan

If `leaflet-draw` doesn't work with Vite 7 / ESM:
1. Try `leaflet-draw` with a dynamic import: `const L = await import('leaflet-draw')`
2. Try `@geoman-io/leaflet-geoman-free` (Leaflet.PM) — modern alternative, better ESM support
3. Last resort: build custom draw handlers using native Leaflet events (`L.Circle`, `L.Rectangle`, `L.Polygon` with click-to-place, drag-to-resize). More work but zero dependency risk.

Test the fallback BEFORE building the full system. Don't discover the incompatibility mid-build.

## npm Package Requirements

```bash
npm install leaflet-draw
# If leaflet-draw fails, try:
# npm install @geoman-io/leaflet-geoman-free
```

No `@types/leaflet-draw` needed if using the package's built-in types. Check after install.

## Verification (after all 10 tasks)

1. `npm run build` passes with zero errors
2. Navigate to `/app/send` → complete Step 1 (goal stub) → arrive at Step 2
3. First-time prompt appears with 3 targeting method buttons
4. Click "I'll Draw" → draw a circle on the map → teal shading appears
5. Draw a rectangle → both shapes visible, counts combine
6. Enter a ZIP code → area highlights, count adds to total
7. Click "Around My Jobs" → mock job pins appear with radius circles
8. Open Refine tab → filters expand → change homeowner filter → count updates
9. Exclusion toggles auto-set based on Step 1 goal (neighbor = past customers OFF)
10. Summary tab shows: total - exclusions = final count, per-card cost, total cost
11. Small campaign (<100) shows encouraging message
12. Save Audience → name dialog → saves to localStorage
13. Collapse panel → map takes full width. Expand → panel returns.
14. Click Next → data persists in draft store (check `draftStore.draft.targeting`)
15. Click Back → return to Step 1 → data preserved
16. Existing Heatmap page still works, has new layer toggles + Send button
17. Run existing e2e tests → all pass
18. Drake checkpoint: "Draw an area on the map. Does the count and cost make sense?"
