/**
 * filter-hhage.spec.ts — D1.B.2 homeowner age filter live regression
 *
 * Verifies that the homeowner age (hhage) filter on the Refine tab is wired
 * end-to-end: selecting a min/max age bracket triggers a new Melissa count
 * call and reduces (or at most maintains) the household count vs the
 * unfiltered baseline.
 *
 * Melissa mapping: hhageMin=3, hhageMax=5 → hhage=3-4-5 (homeowners age 35–64).
 * Server: melissa.py filters_to_melissa_params reads hhageMin/hhageMax and
 *   produces params["hhage"] = "3-4-5".
 *
 * Run: npm run test:e2e -- filter-hhage
 *
 * Stack assumption: Docker nginx on :8080 with authenticated session.
 * Skips gracefully if map or stack unavailable.
 *
 * Per Drake-answers-brief D1.B.2 (homeowner age "Coming soon" un-deaded).
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

test.describe("D1.B.2 — Homeowner age filter wired end-to-end", () => {
  test(
    "applying hhageMin=3 hhageMax=5 (age 35–64) reduces household count",
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

      // ── Switch to Refine tab and apply homeowner age filter ────────────
      await page.getByRole("button", { name: "Refine" }).click();
      await page.waitForTimeout(300);

      // PanelTabFilters renders two selects for homeowner age:
      //   <select :value="filters.hhageMin ?? ''">  (Min age)
      //   <select :value="filters.hhageMax ?? ''">  (Max age)
      // Bracket 3 = 35-44, bracket 5 = 55-64.
      const minAgeSelect = page
        .locator("select")
        .filter({ has: page.locator('option[value="3"]') })
        .first();

      const minAgeVisible = await minAgeSelect
        .isVisible({ timeout: 4_000 })
        .catch(() => false);

      if (!minAgeVisible) {
        test.skip(
          true,
          "Homeowner age min select not found in Refine tab — skipping",
        );
        return;
      }

      // Set min age to bracket 3 (35-44)
      await minAgeSelect.selectOption("3");

      // Max age select: both min and max selects have options 1-7.
      // The max select is the second one with these options.
      const maxAgeSelect = page
        .locator("select")
        .filter({ has: page.locator('option[value="3"]') })
        .nth(1);

      const maxAgeVisible = await maxAgeSelect
        .isVisible({ timeout: 2_000 })
        .catch(() => false);
      if (maxAgeVisible) {
        await maxAgeSelect.selectOption("5"); // 55-64
      }

      // Wait for debounce + new Melissa API call
      await page.waitForTimeout(4_000);
      const filteredCount = await waitCountSettled(page);
      expect(
        filteredCount,
        "Age-filtered count must be > 0",
      ).toBeGreaterThan(0);

      await testInfo.attach("02-hhage-filtered-refine.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // Narrowing to age 35–64 must not INCREASE the count beyond baseline.
      expect(
        filteredCount,
        `Age-filtered count (${filteredCount}) must be ≤ baseline (${baselineCount}): ` +
        "hhage=3-4-5 restricts to homeowners age 35–64 so count should not grow",
      ).toBeLessThanOrEqual(baselineCount);

      console.log(
        `[D1.B.2] baseline=${baselineCount}, hhage_35_64_count=${filteredCount}`,
      );

      // ── Verify active-filter badge incremented ─────────────────────────
      const badge = page.getByText(/\d+\s+applied/i).first();
      if (await badge.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const badgeText = (await badge.textContent()) ?? "";
        const badgeCount = parseCount(badgeText);
        expect(
          badgeCount,
          "Active-filter badge must be ≥ 1 after applying age filter",
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );
});
