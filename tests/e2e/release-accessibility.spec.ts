import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { contrastRatio, failures, measureFocusRing, measureStates } from "./support/contrast";
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

/**
 * POS-277: axe evaluates the resting state only. POS-265 dropped the home
 * focus ring to 2.01:1 and shipped green. These assertions drive :hover and
 * :focus-visible for real, so a state regression fails CI instead of review.
 */
test("interactive surfaces hold contrast in rest, hover and focus", async ({ page }) => {
  await openMockApp(page, "/app/home");
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();

  const surfaces: Array<{ label: string; locator: ReturnType<typeof page.locator> }> = [
    { label: "sidebar Send Postcards CTA", locator: page.locator(".cta-expanded").first() },
    { label: "home card", locator: page.locator(".home-card").first() },
    { label: "sidebar nav item", locator: page.locator(".sidebar-item").first() },
  ];

  const found: string[] = [];
  for (const { label, locator } of surfaces) {
    // The sidebar collapses on narrow viewports, so a surface can be absent
    // or hidden per project. Measure what this viewport actually renders.
    if ((await locator.count()) === 0) continue;
    if (!(await locator.isVisible())) continue;
    found.push(label);
    expect(failures(await measureStates(page, locator, label)), `${label} text contrast`).toEqual([]);

    const ring = await measureFocusRing(page, locator, label);
    if (ring) {
      expect(failures([ring]), `${label} focus ring (WCAG 1.4.11)`).toEqual([]);
    }
  }

  // Guard the guard: if the markup is renamed, this test must not quietly
  // pass by measuring nothing.
  expect(found.length, "no interactive surfaces matched — selectors are stale").toBeGreaterThan(0);
});

/**
 * The interactive tokens are the single source of truth for actionable
 * surfaces. Pin their contrast so a token edit cannot silently regress every
 * button at once.
 */
test("interactive palette tokens satisfy WCAG AA", async ({ page }) => {
  await openMockApp(page, "/app/home");

  const tokens = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const resolve = (name: string, depth = 0): string => {
      const raw = root.getPropertyValue(name).trim();
      const match = raw.match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/);
      if (!match || depth > 5) return raw;
      return resolve(match[1], depth + 1) || (match[2] ?? "").trim();
    };
    const hex = (value: string) => {
      const probe = document.createElement("div");
      probe.style.color = value;
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      return rgb;
    };
    return {
      fill: hex(resolve("--app-btn-bg")),
      fillHover: hex(resolve("--app-btn-bg-hover")),
      label: hex(resolve("--app-btn-fg")),
      onTeal: hex(resolve("--app-on-teal")),
      teal: hex(resolve("--app-teal")),
      ring: hex(resolve("--app-focus-ring")),
      pageBg: hex(resolve("--app-bg")),
    };
  });

  const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const pairs = [
    { name: "button label on fill", fg: tokens.label, bg: tokens.fill, min: 4.5 },
    { name: "button label on hover fill", fg: tokens.label, bg: tokens.fillHover, min: 4.5 },
    { name: "text on teal accent", fg: tokens.onTeal, bg: tokens.teal, min: 4.5 },
    { name: "focus ring vs page", fg: tokens.ring, bg: tokens.pageBg, min: 3 },
  ];

  const broken = pairs
    .map((pair) => ({ ...pair, ratio: contrastRatio(rgb(pair.fg), rgb(pair.bg)) }))
    .filter((pair) => pair.ratio < pair.min)
    .map((pair) => `${pair.name}: ${pair.ratio}:1 (needs ${pair.min}) — ${pair.fg} on ${pair.bg}`);

  expect(broken).toEqual([]);
});
