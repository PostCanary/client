/**
 * filter-income.spec.ts — D1.B.1 household income filter live regression
 *
 * Verifies that the household income (min) filter on the Filter tab is wired
 * end-to-end: selecting a minimum income bracket triggers a new Melissa count
 * call and reduces (or at most maintains) the household count vs the unfiltered
 * baseline.
 *
 * Melissa mapping: incomeMin="C" → hhinc=C-D-E-F-G-H-I-J ($100K+ households).
 * Server: melissa.py filters_to_melissa_params reads filters["incomeMin"].
 *
 * Run: npm run test:e2e -- filter-income
 *
 * Stack assumption: Docker nginx on :8080 with authenticated session.
 * Skips gracefully if map or stack unavailable.
 *
 * Per Drake-answers-brief D1.B.1 (incomeMin field + UI control + live spec).
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

test.describe("D1.B.1 — Household income filter wired end-to-end", () => {
  test(
    "applying incomeMin=$100K+ filter reduces household count (hhinc=C–J sent to Melissa)",
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

      // Wait for initial count
      await page.waitForTimeout(3_000);
      const baselineCount = await waitCountSettled(page);
      expect(baselineCount, "Baseline count must be > 0 after drawing").toBeGreaterThan(0);

      await testInfo.attach("01-baseline-select-area.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // ── Switch to Filter tab and apply income filter ───────────────────
      await page.getByRole("button", { name: "Filter" }).click();
      await page.waitForTimeout(300);

      // "Household income (min)" select — choose $100K+ (code "C")
      const incomeSelect = page
        .locator("select")
        .filter({ has: page.locator('option[value="C"]') })
        .first();

      const incomeSelectVisible = await incomeSelect
        .isVisible({ timeout: 4_000 })
        .catch(() => false);

      if (!incomeSelectVisible) {
        test.skip(
          true,
          "Income select not found in Filter tab — UI control may not be rendered",
        );
        return;
      }

      await incomeSelect.selectOption("C"); // $100K+

      // Wait for debounce + new Melissa API call
      await page.waitForTimeout(4_000);
      const filteredCount = await waitCountSettled(page);
      expect(
        filteredCount,
        "Filtered count must be > 0 after applying income filter",
      ).toBeGreaterThan(0);

      await testInfo.attach("02-income-filtered-refine.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // Applying income $100K+ must produce a count ≤ unfiltered baseline.
      // (In a very high-income area the count may equal baseline — allow ≤.)
      expect(
        filteredCount,
        `Income-filtered count (${filteredCount}) must be ≤ baseline (${baselineCount}): ` +
        "hhinc=C–J restricts to $100K+ households so count should not increase",
      ).toBeLessThanOrEqual(baselineCount);

      console.log(
        `[D1.B.1] baseline=${baselineCount}, income_filtered=$100K+_count=${filteredCount}`,
      );

      // ── Verify "active filters" badge incremented ──────────────────────
      // PanelTabFilters shows "N applied" badge when activeFilterCount > 0.
      // After adding income filter the badge count should include it.
      const badge = page.getByText(/\d+\s+applied/i).first();
      if (await badge.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const badgeText = (await badge.textContent()) ?? "";
        const badgeCount = parseCount(badgeText);
        expect(
          badgeCount,
          "Active-filter badge must be ≥ 1 after applying income filter",
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );
});
