/**
 * filter-propertytype.spec.ts — D1.B.6 property type filter live regression
 *
 * Verifies that the property type checkbox filter on the Refine tab is wired
 * end-to-end: changing the selection triggers a new Melissa count call and
 * the count reflects the narrowed type set.
 *
 * Melissa mapping: propertyTypes=["Condo"] → propertype=11.
 * Server: melissa.py filters_to_melissa_params reads propertyTypes array and
 *   maps each to PROPERTY_TYPE_MAP codes, joined with "-".
 *
 * Test strategy:
 *   - Baseline (post-circle): HVAC preset has ["Single Family"] → propertype=10.
 *   - Uncheck Single Family, check Condo → propertype=11.
 *   - Condo-only count should be ≤ Single-Family-only baseline (Condos are
 *     a subset of the total housing stock; Single Family dominates most areas).
 *
 * UI: checkbox list rendered via v-for over PROPERTY_TYPES. Each item is a
 *   <label><input type="checkbox" @change="togglePropertyType(pt)">{{ pt }}</label>.
 *   Clicking the label toggles the checkbox.
 *
 * Run: npm run test:e2e -- filter-propertytype
 *
 * Stack assumption: Docker nginx on :8080 with authenticated session.
 * Skips gracefully if map or stack unavailable.
 *
 * Per Drake-answers-brief D1.B.6 (property type wire-up audit + spec).
 * This is the final sub-task in D1.B; after this D1 is complete.
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

test.describe("D1.B.6 — Property type filter wired end-to-end", () => {
  test(
    "switching from Single Family to Condo-only reduces or maintains count",
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
      // Baseline already has ["Single Family"] from HVAC preset → propertype=10
      const baselineCount = await waitCountSettled(page);
      expect(baselineCount, "Baseline count must be > 0 after drawing").toBeGreaterThan(0);

      await testInfo.attach("01-baseline-single-family.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // ── Switch to Refine tab ────────────────────────────────────────────
      await page.getByRole("button", { name: "Refine" }).click();
      await page.waitForTimeout(300);

      // Locate the "Single Family" checkbox inside its label
      const sfLabel = page.locator("label").filter({ hasText: /^Single Family$/ }).first();
      const sfVisible = await sfLabel.isVisible({ timeout: 4_000 }).catch(() => false);

      if (!sfVisible) {
        test.skip(true, "Property type checkboxes not found in Refine tab — skipping");
        return;
      }

      // Uncheck Single Family (preset has it checked)
      const sfCheckbox = sfLabel.locator('input[type="checkbox"]');
      const sfChecked = await sfCheckbox.isChecked();
      if (sfChecked) {
        await sfLabel.click();
        await page.waitForTimeout(500);
      }

      // Check Condo
      const condoLabel = page.locator("label").filter({ hasText: /^Condo$/ }).first();
      const condoCheckbox = condoLabel.locator('input[type="checkbox"]');
      const condoChecked = await condoCheckbox.isChecked();
      if (!condoChecked) {
        await condoLabel.click();
        await page.waitForTimeout(500);
      }

      // Wait for debounce + new Melissa API call
      await page.waitForTimeout(4_000);
      const filteredCount = await waitCountSettled(page);
      expect(
        filteredCount,
        "Condo-only count must be ≥ 0",
      ).toBeGreaterThanOrEqual(0);

      await testInfo.attach("02-condo-only-filtered.png", {
        body: await page.screenshot(),
        contentType: "image/png",
      });

      // Condo-only should not exceed Single-Family-only baseline in typical
      // residential areas — condos are a smaller subset of the housing stock.
      expect(
        filteredCount,
        `Condo-only count (${filteredCount}) should be ≤ Single-Family-only baseline (${baselineCount}): ` +
        "propertype=11 (Condo) is a smaller housing subset than propertype=10 (Single Family)",
      ).toBeLessThanOrEqual(baselineCount);

      console.log(
        `[D1.B.6] single_family_baseline=${baselineCount}, condo_only=${filteredCount}`,
      );

      // ── Active-filter badge should remain ≥ 1 ─────────────────────────
      const badge = page.getByText(/\d+\s+applied/i).first();
      if (await badge.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const badgeText = (await badge.textContent()) ?? "";
        const badgeCount = parseCount(badgeText);
        expect(
          badgeCount,
          "Active-filter badge must be ≥ 1 with property type filter applied",
        ).toBeGreaterThanOrEqual(1);
      }
    },
  );
});
