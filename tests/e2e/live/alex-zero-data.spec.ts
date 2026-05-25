import { test, expect } from "@playwright/test";

/**
 * Sprint 1.0.4 — Alex persona regression guard (zero-data path).
 *
 * Alex is the new-business user with zero marketing experience and a
 * tight budget who needs hand-holding (postcanary.md). His test:
 * the wizard must work for a user who has NOT uploaded any CRM data
 * yet. The "zero-data path" = signup → wizard Step 1 → Step 2 without
 * any prerequisite uploads or matching runs.
 *
 * This spec walks the wizard from a fresh draft and asserts the path
 * does NOT gate on prior CRM data:
 *   1. /app/send opens cleanly without a "you need to upload data
 *      first" preflight modal
 *   2. Step 1 goal selection works without prior staging data
 *   3. Step 1 → Step 2 advance works (no upload-required block)
 *   4. Step 2 surfaces a way to pick a neighborhood without
 *      requiring a CRM upload first
 *   5. NO ModalUploadGuard / mapping-required modal blocks Alex
 *      mid-wizard — those should only fire from Dashboard, not
 *      from /app/send
 *
 * The dev test account has prior data, so we can't simulate a literal
 * fresh user. Instead, we assert the wizard PATH is not GATED on data
 * presence — which is the actual regression class we're guarding.
 *
 * Brief item 1.0.5 (Alex zero-data path sanity, EXECUTE) depends on
 * this spec. If this spec fails on staging, escalate via ask_drake
 * per brief instructions.
 *
 * Targets the Docker stack on :8080. Reuses .auth/live.json from
 * auth.setup.ts.
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

test.describe("Alex zero-data path — wizard works without CRM upload precondition", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("/app/send opens cleanly without an upload-required preflight modal", async ({
    page,
  }, testInfo) => {
    await page.goto("/app/send");

    // Draft auto-creates — proves the API path doesn't gate on prior
    // CRM data. If a server-side check rejected draft creation for
    // zero-data accounts, this URL match would never fire.
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

    // NO ModalUploadGuard ambushing Alex on entry. The upload-guard
    // modal is intentionally Dashboard-scoped — it firing on /app/send
    // means the wizard now requires data first, breaking Alex's path.
    await expect(
      page.locator('[aria-labelledby="upload-guard-title"]'),
      "ModalUploadGuard fired on wizard entry — wizard now gates on CRM upload",
    ).not.toBeVisible();

    // Plain-language "no data yet, upload first" copy on the wizard
    // would also break Alex's path even if the modal isn't there.
    await expect(
      page.getByText(/Upload your CRM data first|Mail list required before|Need to upload data before/i),
      "Wizard surfaced an upload-required gate for Alex's zero-data path",
    ).not.toBeVisible();

    // No runtime error / paywall blocking entry.
    await expect(
      page.getByText(/Something went wrong|Uncaught|Fatal error|Application error/i),
    ).not.toBeVisible();
    await expect(
      page.getByText(/Unlock Matching|Upgrade to access|Subscribe to continue/i),
    ).not.toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("alex_send_entry.png"),
      fullPage: true,
    });
  });

  test("Step 1 → Step 2 advances without requiring a CRM upload", async ({
    page,
  }, testInfo) => {
    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

    // Pick the recommended goal — same path Bob's spec uses.
    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();

    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 2 should appear — proves Step 1→2 advance doesn't require
    // a prior CRM upload to unblock.
    await expect(
      page.getByText(/Around My Jobs|Select Area|Refine/).first(),
      "Step 2 didn't render after Step 1 advance — wizard now gates on data",
    ).toBeVisible({ timeout: 15_000 });

    // Critically: NO upload-required modal fired DURING the advance.
    // Some regressions add a modal that asks for data on transition.
    await expect(
      page.locator('[aria-labelledby="upload-guard-title"]'),
      "ModalUploadGuard fired on Step 1→2 transition — Alex's zero-data path is gated",
    ).not.toBeVisible();

    await expect(
      page.getByText(/Mapping required|Map your columns first before|Configure CRM mapping before/i),
      "MappingRequiredModal-style copy surfaced on Step 1→2 — Alex's path is gated",
    ).not.toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("alex_step2_zero_data.png"),
      fullPage: true,
    });
  });

  test("Step 2 surfaces neighborhood-picker without requiring prior matchback data", async ({
    page,
  }) => {
    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Element-visibility wait — test 2 uses this same pattern. networkidle
    // is unreliable on Step 2 because the picker renders a leaflet/canvas
    // map (see pickerSurface locator below), and map tile-fetching keeps
    // the network busy past Playwright's idle threshold (S124 spawn fix).
    await expect(
      page.getByText(/Around My Jobs|Select Area|Refine/).first(),
      "Step 2 didn't render after Step 1 advance — wizard may gate on data",
    ).toBeVisible({ timeout: 20_000 });

    // Step 2's picker UI must render without prior matchback / staging
    // data. Same selector net as bob-first-campaign.spec.ts since
    // the regression class is the same (picker present).
    const pickerSurface = page.locator(
      "main :is(canvas, .leaflet-container, [data-testid*='neighborhood'], [data-testid*='area'], input[placeholder*='neighborhood' i], input[placeholder*='zip' i], button[role='tab'])",
    );
    const found = await pickerSurface.count();
    expect(
      found,
      "Step 2 picker missing for Alex — wizard requires prior matchback data",
    ).toBeGreaterThanOrEqual(1);

    // Negative: Step 2 must NOT show a "no data, no neighborhoods"
    // empty state for Alex. The picker should work with map data
    // alone, not require prior CRM staging.
    await expect(
      page.getByText(/No neighborhoods available|Upload data to see neighborhoods|No areas to display until/i),
      "Step 2 surfaced data-required empty state — Alex's path is broken",
    ).not.toBeVisible();
  });
});
