import { expect, test, type Page } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

async function openMarketingHome(page: Page) {
  const state = createMockAppState();
  state.authMe = { authenticated: false };
  await installMockApi(page, state);
  // Freeze marketing animations (hero reel, dropdown transition) so
  // stability checks don't race the compositor under parallel workers.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
}

test("home renders one-page section stubs in order", async ({ page }) => {
  await openMarketingHome(page);

  const ids = ["hero", "features", "eddm", "targeted-mail", "analytics", "pricing"];
  for (const id of ids) {
    await expect(page.locator(`section#${id}`)).toBeVisible();
  }

  await expect(page.locator("#hero-heading")).toBeVisible();
  await expect(page.locator("#features-heading")).toHaveText("Features");
  await expect(page.locator("#eddm-heading")).toHaveText("EDDM");
  await expect(page.locator("#targeted-mail-heading")).toHaveText("Targeted Mail");
  await expect(page.locator("#analytics-heading")).toHaveText("Analytics");
  await expect(page.locator("#pricing-heading")).toBeVisible();
});

test("desktop features menu and pricing scroll to home anchors", async ({ page }) => {
  await openMarketingHome(page);

  const features = page.getByRole("button", { name: "Features" });
  await features.hover();
  await expect(page.getByRole("menuitem", { name: "EDDM" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Targeted Mail" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Analytics" })).toBeVisible();

  await page.getByRole("menuitem", { name: "EDDM" }).click();
  await expect(page).toHaveURL(/\/#eddm$/);
  await expect(page.locator("#eddm")).toBeInViewport();

  await page.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/#pricing$/);
  await expect(page.locator("#pricing")).toBeInViewport();
});

test("nav hash links from another marketing route land on home then scroll", async ({ page }) => {
  const state = createMockAppState();
  state.authMe = { authenticated: false };
  await installMockApi(page, state);

  await page.goto("/help");
  await expect(page.getByRole("heading", { name: /help/i }).first()).toBeVisible();

  await page.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/#pricing$/);
  await expect(page.locator("#pricing")).toBeVisible();
  await expect(page.locator("#pricing")).toBeInViewport();
});

test("log in keeps the existing Auth0/login-modal trigger", async ({ page }) => {
  await openMarketingHome(page);

  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.locator("#login-email")).toBeVisible();
});

test("mobile hamburger exposes the same feature and pricing links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMarketingHome(page);

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "EDDM" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Targeted Mail" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Analytics" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();

  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page).toHaveURL(/\/#analytics$/);
  await expect(page.locator("#analytics")).toBeInViewport();
});

test("industry marketing pages keep the shared navy nav and existing content", async ({ page }) => {
  const state = createMockAppState();
  state.authMe = { authenticated: false };
  await installMockApi(page, state);

  await page.goto("/hvac-direct-mail-tracking");
  await expect(page.getByRole("button", { name: "Features" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
  await expect(page.locator("footer").getByRole("link", { name: "Help Center" })).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
});

test("footer keeps legal and help links on the navy shell", async ({ page }) => {
  await openMarketingHome(page);

  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "Help Center" })).toHaveAttribute(
    "href",
    "/help",
  );
  await expect(footer.getByRole("link", { name: "Terms of Service" })).toHaveAttribute(
    "href",
    "/terms",
  );
  await expect(footer.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
});

test("section accordions expand one item at a time and CTAs stay visible", async ({
  page,
}) => {
  await openMarketingHome(page);

  const sections = [
    { id: "eddm", cta: "Send EDDM", closedTitle: "Why use EDDM?" },
    { id: "targeted-mail", cta: "Send Mail", closedTitle: "Why use Direct Mail?" },
    { id: "analytics", cta: "Track Results", closedTitle: "Analysis" },
  ] as const;

  for (const { id, cta, closedTitle } of sections) {
    const section = page.locator(`section#${id}`);
    await expect(section.getByRole("button", { name: cta })).toBeVisible();

    const triggers = section.locator("[aria-expanded]");
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");

    await section.getByRole("button", { name: closedTitle }).click();
    await expect(section.getByRole("button", { name: closedTitle })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(section.locator("button[aria-expanded='true']")).toHaveCount(1);
  }
});

test("pricing publishes the POS-230 two-tier sheet and nothing older", async ({
  page,
}) => {
  await openMarketingHome(page);

  const pricing = page.locator("section#pricing");
  const tiers = pricing.locator(".pricing-tiers li");
  await expect(tiers).toHaveCount(2);
  await expect(tiers.nth(0)).toContainText("1 – 1,499 postcards");
  await expect(tiers.nth(0)).toContainText("$0.89");
  await expect(tiers.nth(1)).toContainText("1,500+ postcards");
  await expect(tiers.nth(1)).toContainText("$0.85");

  // The superseded sheet must never come back — checkout cannot honor it.
  for (const dead of ["$0.99", "$0.79", "$0.69", "10,000"]) {
    await expect(pricing).not.toContainText(dead);
  }

  // EDDM carries no price until it has a billing path (POS-231).
  await expect(pricing.locator(".pricing-card")).toHaveCount(2);
  await expect(pricing).not.toContainText("EDDM");
  await expect(pricing).not.toContainText("$0.47");
});
