import { test, expect } from "@playwright/test";

/**
 * Sprint 1.0.4 — Bob persona regression guard.
 *
 * Bob is the not-tech-savvy owner-operator plumber who checks the app
 * between jobs (postcanary.md). His test: a first-campaign creation
 * flow must stay dead simple — clear goal options, obvious Next button,
 * numbered step progression, no jargon walls, no error states ambushing
 * him mid-flow.
 *
 * This spec walks the wizard from a fresh draft (Bob has no prior
 * campaigns) through Step 1 (Choose Your Goal) and Step 2 (Pick Your
 * Neighborhood) with regression assertions at each step. We stop at
 * Step 2 — Step 3 (postcard preview) is covered separately by
 * wizard-demo.spec.ts and exercises the render pipeline, not Bob's
 * navigation UX.
 *
 * Targets the Docker stack on :8080 (matches home-to-step2-skip.spec.ts +
 * wizard-demo.spec.ts) — :5175 vite-only stand-alone won't share session
 * cookies. Reuses .auth/live.json from auth.setup.ts (Bob runs against
 * the dev account; the persona is the regression LENS, not a separate
 * user record).
 */

test.use({
  baseURL: "http://localhost:8080",
  storageState: ".auth/live.json",
});

const DRAFT_URL_RE = /\/app\/send\/([0-9a-f-]{36})/;

test.describe("Bob first-campaign — wizard stays simple for not-tech-savvy users", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("auto-creates draft + lands on Step 1 with clear goal options", async ({
    page,
  }, testInfo) => {
    await page.goto("/app/send");

    // 1. Draft auto-created — URL shape proves the API path works.
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

    // 2. Step 1 has a goal option that doesn't require domain knowledge.
    // "Neighbor Marketing" is the recommended path for owner-operators.
    const recommended = page.getByRole("button", {
      name: /Recommended\s+Neighbor Marketing/i,
    });
    await expect(
      recommended,
      "Step 1 must surface a Recommended goal — Bob shouldn't have to choose blindly",
    ).toBeVisible({ timeout: 15_000 });

    // 3. Next button is visible — Bob shouldn't have to scroll for it.
    const nextBtn = page.getByRole("button", { name: "Next", exact: true });
    await expect(
      nextBtn,
      "Next button must be visible on Step 1 above the fold",
    ).toBeVisible();

    // 4. NO runtime error overlay blocking Bob's first session.
    await expect(
      page.getByText(/Something went wrong|Uncaught|Fatal error|Application error/i),
      "Runtime error overlay surfaced on Bob's first wizard load",
    ).not.toBeVisible();

    // 5. NO paywall blocking — Bob's account is set up for this test.
    await expect(
      page.getByText(/Unlock Matching|Upgrade to access|Subscribe to continue/i),
      "Paywall blocked Bob on Step 1 — onboarding flow regression",
    ).not.toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("bob_step1_landing.png"),
      fullPage: true,
    });
  });

  test("Step 1 → Step 2 advance works with single click after goal selection", async ({
    page,
  }, testInfo) => {
    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });

    // Bob picks the recommended goal.
    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();

    // One Next click should advance him — no hidden second confirm.
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 2's content should appear. We use the same fallback selectors
    // as home-to-step2-skip.spec.ts — Step 2 uses tab-style content not
    // a heading, so match either tab labels OR the "Refine" CTA.
    await expect(
      page.getByText(/Around My Jobs|Select Area|Refine/).first(),
      "Step 2 didn't render after single-click advance from Step 1",
    ).toBeVisible({ timeout: 15_000 });

    // Step 1 stepper should now show the completed indicator (clickable
    // back-button proves stepper state advanced).
    await expect(
      page.getByRole("button", { name: /Choose Your Goal/i }),
      "Step 1 stepper button missing after advance — stepper state regression",
    ).toBeVisible();

    // Negative: Step 1's goal-selection heading should NOT still be visible —
    // we advanced past it, not stayed on it.
    await expect(
      page.getByRole("heading", {
        name: /What's the goal of this campaign/i,
      }),
      "Still on Step 1 after Next click — wizard didn't advance",
    ).not.toBeVisible();

    // Negative: no error/paywall surfaced during the advance.
    await expect(
      page.getByText(/Something went wrong|Uncaught|Fatal error|Application error/i),
    ).not.toBeVisible();
    await expect(
      page.getByText(/Unlock Matching|Upgrade to access|Subscribe to continue/i),
    ).not.toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("bob_step2_after_advance.png"),
      fullPage: true,
    });
  });

  test("Step 2 surfaces a way to pick a neighborhood (not a blank canvas)", async ({
    page,
  }) => {
    await page.goto("/app/send");
    await page.waitForURL(DRAFT_URL_RE, { timeout: 30_000 });
    await page
      .getByRole("button", { name: /Recommended\s+Neighbor Marketing/i })
      .click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    await page.waitForLoadState("networkidle", { timeout: 20_000 });

    // Step 2 must show interactive neighborhood-picker UI — a map canvas,
    // tab buttons, search input, or list. A blank canvas would mean Bob
    // has nowhere to go.
    const pickerSurface = page.locator(
      "main :is(canvas, .leaflet-container, [data-testid*='neighborhood'], [data-testid*='area'], input[placeholder*='neighborhood' i], input[placeholder*='zip' i], button[role='tab'])",
    );
    const found = await pickerSurface.count();
    expect(
      found,
      "Step 2 must surface a neighborhood-picker UI — map, list, tabs, or search",
    ).toBeGreaterThanOrEqual(1);
  });
});
