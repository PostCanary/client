import { expect, test, type Page } from "@playwright/test";

import { createMockAppState, installMockApi, type MockAppState } from "./support/mockApi";

async function setup(page: Page, mutate?: (state: MockAppState) => void) {
  const state = createMockAppState();
  mutate?.(state);
  await installMockApi(page, state);
  return state;
}

function csvFile(name: string, body: string) {
  return {
    name,
    mimeType: "text/csv",
    buffer: Buffer.from(body),
  };
}

test("analytics shows entry state (upload prompt) when no match data exists", async ({ page }) => {
  await setup(page, (draft) => {
    draft.runStatusByOrg["org-alpha"] = null;
    draft.runResultByOrg["org-alpha"] = null;
    draft.runMatchesByOrg["org-alpha"] = null;
  });

  await page.goto("/analytics");

  await expect(page.getByRole("heading", { name: "Upload your Customer List" })).toBeVisible();
  await expect(page.getByText("See who's converting from your mail.")).toBeVisible();
  await expect(page.locator("#mailCsv")).toBeVisible();
  await expect(page.locator("#crmCsv")).toBeVisible();

  // Results screen content must not be present yet.
  await expect(page.getByText("Match Rate")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "AI Insights" })).toHaveCount(0);
});

test("analytics shows results state with four stat cards and detail panel once matched", async ({ page }) => {
  await setup(page);

  await page.goto("/analytics");

  await expect(page.getByRole("heading", { name: "Upload your Customer List" })).toHaveCount(0);

  // Hero stat cards.
  await expect(page.locator(".hero-card", { has: page.getByText("Match Rate") })).toBeVisible();
  await expect(page.locator(".hero-card", { has: page.getByText("Match Revenue") })).toBeVisible();
  await expect(page.locator(".hero-card", { has: page.getByText("Total Matches") })).toBeVisible();
  await expect(page.locator(".hero-card", { has: page.getByText("Days to Convert") })).toBeVisible();
  await expect(page.locator(".hero-card", { has: page.getByText("Total Matches") })).toContainText("42");

  // Detail panel (advanced KPI variant).
  await expect(page.locator(".adv-stat", { has: page.getByText("Total Mail") })).toContainText("2,500");
  await expect(page.locator(".adv-stat", { has: page.getByText("Unique Addresses") })).toBeVisible();
  await expect(page.locator(".adv-stat", { has: page.getByText("Unique CRM Jobs") })).toBeVisible();
  await expect(page.locator(".adv-stat", { has: page.getByText("Revenue / Mailer") })).toBeVisible();
  await expect(page.locator(".adv-stat", { has: page.getByText("Avg Ticket / Match") })).toBeVisible();

  // Re-upload dropzone stays available alongside results.
  await expect(page.locator("#mailCsv")).toBeVisible();

  // AI Insights preserved below results.
  await expect(page.getByRole("heading", { name: "AI Insights" })).toBeVisible();
});

test("analytics zero-state stat cards render 0.0% / $0.00 / 0 / 0 when kpis are all zero", async ({ page }) => {
  await setup(page, (draft) => {
    draft.runStatusByOrg["org-alpha"] = {
      run_id: "run-alpha-zero",
      status: "done",
      step: "done",
      message: "Run complete",
    };
    draft.runResultByOrg["org-alpha"] = {
      run_id: "run-alpha-zero",
      preview_mode: false,
      kpis: {
        total_mail: 0,
        unique_mail_addresses: 0,
        total_jobs: 0,
        matches: 0,
        match_rate: 0,
        conv_30d_rate: 0,
        conv_60d_rate: 0,
        conv_90d_rate: 0,
        match_revenue: 0,
        revenue_per_mailer: 0,
        avg_ticket_per_match: 0,
        median_days_to_convert: 0,
      },
    };
  });

  await page.goto("/analytics");

  await expect(page.locator(".hero-card", { has: page.getByText("Match Rate") })).toContainText("0.0%");
  await expect(page.locator(".hero-card", { has: page.getByText("Match Revenue") })).toContainText("$0.00");
  await expect(page.locator(".hero-card", { has: page.getByText("Total Matches") })).toContainText("0");
  await expect(page.locator(".hero-card", { has: page.getByText("Days to Convert") })).toContainText("0");
});
