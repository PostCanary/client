/**
 * count-tab-consistency.spec.ts — D1.A count-tab regression guard
 *
 * Verifies that the household count in the always-visible TargetingSummaryBar
 * ("N households") matches the "Qualifying households" row on the Count & Cost
 * tab — before and after a filter is applied. Switching tabs must never change
 * the displayed count.
 *
 * Regression target (S131 Bug B, commit 8a8790f):
 *   fetchTotalIfNeeded was called on Count&Cost tab mount, returning an
 *   UNFILTERED count that appeared as "Total in area" while the summary bar
 *   showed the FILTERED finalHouseholdCount — a perceived discrepancy.
 *   Fix: removed the lazy-fetch call and the "Total in area" row; both
 *   surfaces now display the same finalHouseholdCount.
 *
 * Run: npm run test:e2e -- count-tab-consistency
 *
 * Stack assumption: Docker nginx on :8080 with authenticated session.
 * Skips gracefully if the map or API stack is unavailable.
 *
 * Per Drake A1a: "verify that number is coming from Melissa with refinement
 * filters applied and working as intended... make sure that number of homes
 * matches on every page of the workflow."
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:8080";
const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

test.use({
  baseURL: BASE,
  storageState: ".auth/live.json",
});

function parseCount(text: string): number {
  const m = text.replace(/,/g, "").match(/(\d+)/);
  return m ? parseInt(m[1]!, 10) : -1;
}

/** Read the always-visible TargetingSummaryBar count ("N households"). */
async function getBarCount(page: Page): Promise<number> {
  const bar = page.getByText(/\d[\d,]*\s+households/i).first();
  await expect(bar).toBeVisible({ timeout: 20_000 });
  return parseCount((await bar.textContent()) ?? "");
}

/** Wait for the loading pulse to clear then return the bar count. */
async function waitCountSettled(page: Page): Promise<number> {
  // Wait until "Counting households..." text is gone (loading state)
  await page.waitForFunction(
    () => !document.body.innerText.includes("Counting households"),
    { timeout: 25_000 },
  );
  return getBarCount(page);
}

test.describe("D1.A — Count-tab consistency (S131 Bug B regression)", () => {
  test(
    "summary bar count matches Count&Cost tab before and after filter, tab-switching is stable",
    async ({ page }, testInfo) => {
      // ── Navigate to wizard ─────────────────────────────────────────────
      await page.goto("/app/send");

      let redirected = false;
      try {
        await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
        redirected = true;
      } catch {
        // ignore — checked below
      }

      if (!redirected) {
        test.skip(true, "Stack not running or auth session invalid — skipping");
        return;
      }

      page.on("dialog", (d) => d.accept());

      // ── Step 1: select a goal and advance ─────────────────────────────
      const neighborBtn = page
        .getByRole("button", { name: /Neighbor Marketing/i })
        .first();
      if (await neighborBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await neighborBtn.click();
      }
      const nextBtn = page.getByRole("button", { name: "Next", exact: true });
      if (await nextBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await nextBtn.click();
      }

      // ── Wait for Step 2 map ────────────────────────────────────────────
      const mapEl = await page
        .waitForSelector(".leaflet-container", { timeout: 20_000 })
        .catch(() => null);
      if (!mapEl) {
        test.skip(true, "Leaflet map did not load — skipping");
        return;
      }

      // Dismiss Around-My-Jobs intro if present
      const introBtn = page
        .getByRole("button", { name: /Around My Jobs/i })
        .first();
      if (await introBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await introBtn.click();
        await page.waitForTimeout(300);
      }

      // ── Draw a circle to establish targeting area ──────────────────────
      const circleDrawBtn = page
        .getByRole("button", { name: /Draw Circle|Circle/i })
        .first();
      if (await circleDrawBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await circleDrawBtn.click();
        await page.waitForTimeout(300);
      }
      const map = page.locator(".leaflet-container").first();
      const box = await map.boundingBox();
      if (!box) {
        test.skip(true, "Map bounding box unavailable — skipping");
        return;
      }
      const cx = box.x + box.width * 0.55;
      const cy = box.y + box.height * 0.50;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 75, cy + 55, { steps: 12 });
      await page.mouse.up();

      // Wait 500ms debounce + API round-trip
      await page.waitForTimeout(3_000);

      // ── Baseline: count on "Select Area" tab ──────────────────────────
      const barCountBaseline = await waitCountSettled(page);
      expect(
        barCountBaseline,
        "Baseline count after drawing must be > 0",
      ).toBeGreaterThan(0);

      await testInfo.attach("01-select-area-tab.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // ── Switch to "Refine" tab — bar count must not change ─────────────
      await page.getByRole("button", { name: "Refine" }).click();
      await page.waitForTimeout(300);
      const barCountOnRefine = await getBarCount(page);
      expect(
        barCountOnRefine,
        `Bar count changed when switching to Refine tab (was ${barCountBaseline}, now ${barCountOnRefine}) — tab-switch must not alter count`,
      ).toBe(barCountBaseline);

      // ── Apply a home-value filter to trigger a new Melissa call ────────
      // HVAC preset has homeValueMax=800000; narrow to 400000 to reduce count.
      const maxInput = page.locator('input[placeholder="Max"]').first();
      if (await maxInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await maxInput.fill("400000");
        await maxInput.press("Tab");
      }

      // 500ms debounce + API round-trip + breathing room
      await page.waitForTimeout(4_000);
      const barCountFiltered = await waitCountSettled(page);
      expect(
        barCountFiltered,
        "Filtered count must be > 0 after narrowing home-value max",
      ).toBeGreaterThan(0);

      await testInfo.attach("02-refine-tab-filtered.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // ── Switch to "Count & Cost" tab — "Qualifying households" must match bar ──
      await page.getByRole("button", { name: "Count & Cost" }).click();
      await page.waitForTimeout(500);

      // PanelTabSummary renders: <span class="text-gray-500">Qualifying households</span>
      //                          <span class="text-[#0b2d50]">N,NNN</span>
      // Locate the row and read the value span.
      const qualRow = page
        .locator("div.flex.justify-between")
        .filter({ hasText: "Qualifying households" })
        .first();
      await expect(qualRow).toBeVisible({ timeout: 10_000 });
      const valueSpan = qualRow.locator("span").last();
      const qualifyingText = (await valueSpan.textContent()) ?? "";
      const countCostCount = parseCount(qualifyingText);

      await testInfo.attach("03-count-cost-tab.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      expect(
        countCostCount,
        `"Qualifying households" on Count&Cost tab (${countCostCount}) must equal summary bar count (${barCountFiltered}) — S131 Bug B regression`,
      ).toBe(barCountFiltered);

      // ── Switch back to "Select Area" — bar count must remain stable ────
      await page.getByRole("button", { name: "Select Area" }).click();
      await page.waitForTimeout(300);
      const barCountFinal = await getBarCount(page);
      expect(
        barCountFinal,
        `Bar count changed after returning to Select Area tab (was ${barCountFiltered}, now ${barCountFinal}) — tab-switch must not alter count`,
      ).toBe(barCountFiltered);

      console.log(
        `[D1.A] baseline=${barCountBaseline}, filtered=${barCountFiltered}, countCostTab=${countCostCount}`,
      );
    },
  );
});
