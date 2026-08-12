import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

async function openMockApp(page: Page, path: string) {
  await installMockApi(page, createMockAppState());
  await page.goto(path);
}

test("release accessibility has no serious WCAG A or AA violations", async ({ page }) => {
  await openMockApp(page, "/app/home");
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  await page.locator(".home-card").last().evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const releaseBlockingViolations = results.violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map((node) => node.target),
    }));

  expect(releaseBlockingViolations).toEqual([]);
});

test("keyboard navigation reaches and activates the first home action", async ({ page, browserName }) => {
  await openMockApp(page, "/app/home");
  const firstAction = page.getByRole("button", {
    name: "Send Postcards Launch a new campaign",
  });
  await expect(firstAction).toBeVisible();

  // macOS WebKit uses Option+Tab for controls when full keyboard access is
  // not enabled. Playwright names the Option modifier "Alt".
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let press = 0; press < 30; press += 1) {
    await page.keyboard.press(tabKey);
    if (await firstAction.evaluate((element) => element === document.activeElement)) break;
  }

  await expect(firstAction).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/send$/);
});
