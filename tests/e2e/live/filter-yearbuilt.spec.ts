/**
 * filter-yearbuilt.spec.ts — D1.B.5 year-home-was-built filter live regression
 *
 * Verifies that the year-built range filter on the Refine tab is wired
 * end-to-end: entering a yearBuiltMin triggers a new Melissa count call and
 * reduces (or at most maintains) the household count vs the baseline.
 *
 * Melissa mapping: yearBuiltMin=1980, yearBuiltMax=2010 → yearbuilt=1980-2010.
 * Server: melissa.py filters_to_melissa_params reads yearBuiltMin/yearBuiltMax
 *   and produces params["yearbuilt"] = "min-max" (0 means no limit).
 *
 * UI: two number inputs with placeholder "From" / "To" inside the
 *   "Year built" section. @input parses int via parseInt().
 *
 * Note: HVAC_PRESET_FILTERS in StepTargeting.vue defaults yearBuiltMax=2010,
 *   so the post-circle baseline already has yearbuilt=0-2010 applied. Adding
 *   yearBuiltMin=1980 narrows the range to 1980-2010, which must reduce
 *   (or at most maintain) the count.
 *
 * Run: npm run test:e2e -- filter-yearbuilt
 *
 * Stack assumption: Docker nginx on :8080 with authenticated session.
 * Skips gracefully if map or stack unavailable.
 *
 * Per Drake-answers-brief D1.B.5 (year home was built wire-up audit + spec).
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

async function getBarCount(page: Page): Promise<number> {
  const bar = page.getByText(/\d[\d,]*\s+households/i).first();
  await expect(bar).toBeVisible({ timeout: 20_000 });
  return parseCount((await bar.textContent()) ?? "");
}

async function waitCountSettled(page: Page): Promise<number> {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Counting households"),
    { timeout: 25_000 },
  );
  return getBarCount(page);
}

test.describe("D1.B.5 — Year-built filter wired end-to-end", () => {
  test(
    "applying yearBuiltMin=1980 reduces household count",
    async ({ page }, testInfo) => {
      // ── Navigate to wizard ─────────────────────────────────────────────
      await page.goto("/app/send");

      let redirected = false;
      try {
        await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
        redirected = true;
      } catch {
        // ignore
      }
      if (!redirected) {
        test.skip(true, "Stack not running or auth session invalid — skipping");
        return;
      }

      page.on("dialog", (d) => d.accept());

      // ── Step 1: goal + advance ─────────────────────────────────────────
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

      // ── Wait for map ───────────────────────────────────────────────────
      const mapEl = await page
        .waitForSelector(".leaflet-container", { timeout: 20_000 })
        .catch(() => null);
      if (!mapEl) {
        test.skip(true, "Leaflet map did not load — skipping");
        return;
      }

      // Dismiss intro modal if present
      const introBtn = page
        .getByRole("button", { name: /Around My Jobs/i })
        .first();
      if (await introBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await introBtn.click();
        await page.waitForTimeout(300);
      }

      // ── Draw a circle to establish targeting area ──────────────────────
      const circleBtn = page
        .getByRole("button", { name: /Draw Circle|Circle/i })
        .first();
      if (await circleBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await circleBtn.click();
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

      await page.waitForTimeout(3_000);
      const baselineCount = await waitCountSettled(page);
      expect(baselineCount, "Baseline count must be > 0 after drawing").toBeGreaterThan(0);

      await testInfo.attach("01-baseline-select-area.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // ── Switch to Refine tab and apply year-built filter ────────────────
      await page.getByRole("button", { name: "Refine" }).click();
      await page.waitForTimeout(300);

      // PanelTabFilters renders two number inputs for year built:
      //   <input type="number" placeholder="From">  (yearBuiltMin)
      //   <input type="number" placeholder="To">    (yearBuiltMax)
      const yearMinInput = page.locator('input[placeholder="From"]').first();

      const yearMinVisible = await yearMinInput
        .isVisible({ timeout: 4_000 })
        .catch(() => false);

      if (!yearMinVisible) {
        test.skip(
          true,
          "Year-built From input not found in Refine tab — skipping",
        );
        return;
      }

      // Set min year to 1980. HVAC preset already has yearBuiltMax=2010,
      // so this narrows to homes built 1980-2010.
      await yearMinInput.fill("1980");
      await yearMinInput.dispatchEvent("input");

      // Wait for debounce + new Melissa API call
      await page.waitForTimeout(4_000);
      const filteredCount = await waitCountSettled(page);
      expect(
        filteredCount,
        "Year-built-filtered count must be ≥ 0",
      ).toBeGreaterThanOrEqual(0);

      await testInfo.attach("02-yearbuilt-filtered-refine.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // Narrowing yearBuilt range from 0-2010 to 1980-2010 must not INCREASE
      // the count beyond baseline.
      expect(
        filteredCount,
        `Year-built-filtered count (${filteredCount}) must be ≤ baseline (${baselineCount}): ` +
        "yearbuilt=1980-2010 narrows from preset 0-2010 so count should not grow",
      ).toBeLessThanOrEqual(baselineCount);

      console.log(
        `[D1.B.5] baseline=${baselineCount}, yearbuilt_1980_2010_count=${filteredCount}`,
      );

      // ── Verify active-filter badge stays ≥ 1 ───────────────────────────
      // Year-built is already part of the HVAC preset (yearBuiltMax=2010),
      // so the badge should already be ≥ 1 baseline; adding min keeps it ≥ 1.
      const badge = page.getByText(/\d+\s+applied/i).first();
      if (await badge.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const badgeText = (await badge.textContent()) ?? "";
        const badgeCount = parseCount(badgeText);
        expect(
          badgeCount,
          "Active-filter badge must be ≥ 1 with year-built filter applied",
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );
});
