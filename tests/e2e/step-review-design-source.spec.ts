import { expect, test, type Page, type Route } from "@playwright/test";

// POS-149: Review & Send checkout deltas for Flow v2 designSource states
// ('requested' = $199 professional design brief, 'uploaded' = customer
// artwork, absent = today's generated-cards behavior). Reuses the
// /dev/step-review-approval-flow harness (POS-149 extended it with a
// ?designSource= query param) since Step 3 UI that SETS designSource is
// being built in parallel — this spec drives the draft store directly.

const DRAFT_ID = "11111111-1111-4111-8111-111111111111";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMocks(page: Page) {
  await page.route("**/auth/me", (route) =>
    json(route, {
      authenticated: true,
      user_id: "user-owner",
      email: "alex@example.test",
      full_name: "Alex Owner",
      role: "owner",
      avatar_url: "",
      features: ["postcards"],
      org_id: "22222222-2222-4222-8222-222222222222",
      org_name: "Alpha HVAC",
      org_role: "owner",
      orgs: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Alpha HVAC",
          slug: "alpha-hvac",
          role: "owner",
        },
      ],
      billing: {
        is_subscribed: true,
        needs_paywall: false,
        can_run_matching: true,
      },
    }),
  );

  await page.route("**/api/users/me", (route) =>
    json(route, {
      ok: true,
      profile_complete: true,
      full_name: "Alex Owner",
      email: "alex@example.test",
    }),
  );

  await page.route("**/auth/csrf-token", (route) =>
    json(route, { csrf_token: "test-csrf" }),
  );

  await page.route("**/api/config", (route) => json(route, { ok: true }));

  await page.route("**/api/billing/pricing", (route) =>
    json(route, {
      pay_per_send_cents: 99,
      subscription_rates_cents: {
        INSIGHT: 79,
        PERFORMANCE: 79,
        PRECISION: 79,
        ELITE: 79,
      },
      custom_design_fee_cents: 19900,
    }),
  );

  await page.route(`**/api/campaign-drafts/${DRAFT_ID}`, (route) =>
    json(route, {
      ok: true,
      id: DRAFT_ID,
      org_id: "22222222-2222-4222-8222-222222222222",
      created_by: "user-owner",
      current_step: 4,
      completed_steps: [1, 2, 3, 4],
      needs_review_steps: [],
      data: route.request().postDataJSON()?.data ?? {},
      schema_version: 1,
      created_at: "2026-05-25T02:20:00.000Z",
      updated_at: "2026-05-25T02:20:01.000Z",
    }),
  );
}

test.describe("StepReview design-source checkout deltas (POS-149)", () => {
  test("requested: shows 'your custom design' placeholder and $199 line item in the total", async ({
    page,
  }) => {
    await installMocks(page);

    await page.goto("/dev/step-review-approval-flow?designSource=requested");

    await expect(page.getByTestId("custom-design-placeholder")).toBeVisible();
    await expect(page.getByTestId("custom-design-placeholder")).toContainText(
      "your custom design",
    );
    // No generated-card carousel controls or purpose label in this mode.
    await expect(page.getByRole("img", { name: /Card \d+ preview/ })).toHaveCount(0);

    const feeLine = page.getByTestId("custom-design-fee-line");
    await expect(feeLine).toBeVisible();
    await expect(feeLine).toContainText("Custom design");
    await expect(feeLine).toContainText("$199.00");

    // Household count in the mock draft is 10, at $0.99/card x 1 card = $9.90,
    // plus the $199.00 design fee = $208.90.
    const costPanel = page.locator("text=Total").locator("..");
    await expect(costPanel).toContainText("$208.90");
  });

  test("uploaded: shows the uploaded front image as the preview, no design fee", async ({
    page,
  }) => {
    await installMocks(page);

    await page.goto("/dev/step-review-approval-flow?designSource=uploaded");

    await expect(page.getByTestId("custom-design-placeholder")).toHaveCount(0);
    const uploadedImg = page.getByRole("img", { name: "Uploaded design preview" });
    await expect(uploadedImg).toBeVisible();
    // POS-156: preview is a server media URL, not a base64 data URL.
    await expect(uploadedImg).toHaveAttribute("src", /\/media\/design-uploads\//);

    await expect(page.getByTestId("custom-design-fee-line")).toHaveCount(0);
  });

  test("absent designSource: unchanged current behavior (no placeholder, no fee line)", async ({
    page,
  }) => {
    await installMocks(page);

    await page.goto("/dev/step-review-approval-flow");

    await expect(page.getByTestId("custom-design-placeholder")).toHaveCount(0);
    await expect(page.getByRole("img", { name: "Uploaded design preview" })).toHaveCount(0);
    await expect(page.getByTestId("custom-design-fee-line")).toHaveCount(0);

    const costPanel = page.locator("text=Total").locator("..");
    await expect(costPanel).toContainText("$9.90");
  });
});
