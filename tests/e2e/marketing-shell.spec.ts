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

test("desktop features menu links to feature pages, pricing scrolls to home anchor", async ({ page }) => {
  await openMarketingHome(page);

  const features = page.getByRole("button", { name: "Features" });
  await features.hover();
  await expect(page.getByRole("menuitem", { name: "EDDM" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Targeted Mail" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Analytics" })).toBeVisible();

  await page.getByRole("menuitem", { name: "EDDM" }).click();
  await expect(page).toHaveURL(/\/features\/eddm$/);
  await expect(page.getByRole("heading", { name: "EDDM", level: 1 })).toBeVisible();

  // Pricing stays on the homepage — nav returns and scrolls to the section.
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

test("mobile hamburger exposes feature pages, why-postcanary, and pricing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMarketingHome(page);

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.locator("#mobile-marketing-menu");
  await expect(menu.getByRole("link", { name: "EDDM" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Targeted Mail" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Analytics" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Why PostCanary" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Pricing" })).toBeVisible();

  await menu.getByRole("link", { name: "Analytics" }).click();
  await expect(page).toHaveURL(/\/features\/analytics$/);
  await expect(page.getByRole("heading", { name: "Analytics", level: 1 })).toBeVisible();
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

test("homepage keeps pricing and adds story, stats, and closing bands", async ({
  page,
}) => {
  await openMarketingHome(page);

  // v2 inserts story + stats after the hero and a closing CTA at the end,
  // but pricing and all feature sections stay on the homepage.
  await expect(page.locator("#how-it-works")).toBeVisible();
  await expect(page.locator("#pricing")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "From mailbox to revenue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Know exactly what your mail is worth." }),
  ).toBeVisible();
});

test("feature pages render hero, use-cases, and shared FAQ", async ({ page }) => {
  const state = createMockAppState();
  state.authMe = { authenticated: false };
  await installMockApi(page, state);

  const pages = [
    { path: "/features/eddm", title: "EDDM", faq: "What is EDDM?" },
    { path: "/features/targeted-mail", title: "Targeted Mail", faq: "What is Direct Mail?" },
    { path: "/features/analytics", title: "Analytics", faq: "Dashboard KPIs" },
  ] as const;

  for (const { path, title, faq } of pages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: new RegExp(`When to use ${title}`) }),
    ).toBeVisible();
    // Shared FAQ accordion renders the same copy as the homepage.
    await expect(page.getByRole("button", { name: faq })).toBeVisible();
  }
});

test("why-postcanary page renders gap story and calculator links", async ({
  page,
}) => {
  const state = createMockAppState();
  state.authMe = { authenticated: false };
  await installMockApi(page, state);

  await page.goto("/why-postcanary");
  await expect(
    page.getByRole("heading", { name: "QR codes miss most of your response.", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Run your own numbers" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Attribution Gap Calculator/ }).first(),
  ).toHaveAttribute("href", "/attribution-gap-calculator");
});

test("footer links to the new feature pages and why-postcanary", async ({ page }) => {
  await openMarketingHome(page);

  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "EDDM" })).toHaveAttribute(
    "href",
    "/features/eddm",
  );
  await expect(
    footer.getByRole("link", { name: "Targeted Mail" }),
  ).toHaveAttribute("href", "/features/targeted-mail");
  await expect(footer.getByRole("link", { name: "Analytics" })).toHaveAttribute(
    "href",
    "/features/analytics",
  );
  await expect(
    footer.getByRole("link", { name: "Why PostCanary" }),
  ).toHaveAttribute("href", "/why-postcanary");
});
