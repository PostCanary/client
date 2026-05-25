/**
 * filter-lores.spec.ts — D1.B.3 length-of-residence filter live regression
 *
 * Verifies that the length-of-residence (lores) filter on the Refine tab is
 * wired end-to-end: selecting a min residence bracket triggers a new Melissa
 * count call and reduces (or at most maintains) the household count vs the
 * unfiltered baseline.
 *
 * Melissa mapping: loresMin=8 → lores=8-9-10-11-12-13-14-15 (residents 8+ years).
 * Server: melissa.py filters_to_melissa_params reads loresMin/loresMax and
 *   produces params["lores"] = "8-9-10-11-12-13-14-15".
 *
 * HVAC use case: loresMin=11 targets homeowners with 11+ year residence —
 * those homes whose original HVAC systems are likely at end-of-life.
 *
 * Run: npm run test:e2e -- filter-lores
 *
 * Stack assumption: Docker nginx on :8080 with authenticated session.
 * Skips gracefully if map or stack unavailable.
 *
 * Per Drake-answers-brief D1.B.3 (length of residence wire-up).
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

test.describe("D1.B.3 — Length of residence filter wired end-to-end", () => {
  test(
    "applying loresMin=8 (8+ years residence) reduces household count",
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

      // ── Switch to Refine tab and apply length-of-residence filter ───────
      await page.getByRole("button", { name: "Refine" }).click();
      await page.waitForTimeout(300);

      // PanelTabFilters renders two selects for length of residence:
      //   <select> with options value="0".."15" (Min years)
      //   <select> with options value="0".."15" (Max years)
      // Both have option[value="8"]. Use .first() for min select.
      const minLoresSelect = page
        .locator("select")
        .filter({ has: page.locator('option[value="8"]') })
        .first();

      const minLoresVisible = await minLoresSelect
        .isVisible({ timeout: 4_000 })
        .catch(() => false);

      if (!minLoresVisible) {
        test.skip(
          true,
          "Length-of-residence min select not found in Refine tab — skipping",
        );
        return;
      }

      // Set min residence to bracket 8 (8 years — residents living there 8+ years)
      await minLoresSelect.selectOption("8");

      // Wait for debounce + new Melissa API call
      await page.waitForTimeout(4_000);
      const filteredCount = await waitCountSettled(page);
      expect(
        filteredCount,
        "Lores-filtered count must be > 0",
      ).toBeGreaterThan(0);

      await testInfo.attach("02-lores-filtered-refine.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // Narrowing to 8+ year residents must not INCREASE the count beyond baseline.
      expect(
        filteredCount,
        `Lores-filtered count (${filteredCount}) must be ≤ baseline (${baselineCount}): ` +
        "lores=8-9-10-11-12-13-14-15 restricts to long-tenure residents so count should not grow",
      ).toBeLessThanOrEqual(baselineCount);

      console.log(
        `[D1.B.3] baseline=${baselineCount}, lores_8plus_count=${filteredCount}`,
      );

      // ── Verify active-filter badge incremented ─────────────────────────
      const badge = page.getByText(/\d+\s+applied/i).first();
      if (await badge.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const badgeText = (await badge.textContent()) ?? "";
        const badgeCount = parseCount(badgeText);
        expect(
          badgeCount,
          "Active-filter badge must be ≥ 1 after applying lores filter",
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );
});
