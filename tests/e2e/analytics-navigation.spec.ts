import { expect, test, type Page } from "@playwright/test";
import { createMockAppState, installMockApi } from "./support/mockApi";

async function bootWithFeatures(page: Page, features: string[]) {
  const state = createMockAppState();
  (state.authMe as Record<string, unknown>).features = features;
  await installMockApi(page, state);
}

const analyticsDestinations = [
  { label: "Dashboard", path: "/app/dashboard" },
  { label: "Map", path: "/app/map" },
  { label: "Analysis", path: "/app/analytics" },
  { label: "Audience", path: "/app/demographics" },
  { label: "Upload History", path: "/app/history" },
] as const;

test.describe("POS-167 analytics navigation", () => {
  test.beforeEach(async ({ page }) => {
    await bootWithFeatures(page, ["postcards"]);
  });

  test("renders the approved top-level order and opens Analytics on Dashboard", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");

    const sidebar = page.locator(".app-sidebar .sidebar");
    const topLevelLabels = [
      "Home",
      "Send Postcards",
      "Campaigns",
      "Designs",
      "Analytics",
    ];
    const topPositions = await Promise.all(
      topLevelLabels.map(async (label) => {
        const button = sidebar.getByRole("button", { name: label, exact: true });
        await expect(button).toBeVisible();
        return button.evaluate((element) => element.getBoundingClientRect().top);
      }),
    );
    expect(topPositions).toEqual([...topPositions].sort((a, b) => a - b));

    await page.goto("/app/home");
    await expect(sidebar.locator("#analytics-submenu")).toHaveCount(0);

    await sidebar.getByRole("button", { name: "Analytics", exact: true }).click();

    await expect(page).toHaveURL(/\/app\/dashboard$/);
    await expect(
      sidebar.getByRole("button", { name: "Analytics", exact: true }),
    ).toHaveClass(/active/);
    await expect(
      sidebar.getByRole("button", { name: "Analytics", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      sidebar.getByRole("button", { name: "Dashboard", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("keeps the submenu expanded and moves active state across the route family", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");
    const sidebar = page.locator(".app-sidebar .sidebar");
    const submenu = sidebar.locator("#analytics-submenu");

    await expect(submenu).toBeVisible();
    for (const destination of analyticsDestinations) {
      await submenu
        .getByRole("button", { name: destination.label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
      await expect(submenu).toBeVisible();
      await expect(
        submenu.getByRole("button", {
          name: destination.label,
          exact: true,
        }),
      ).toHaveAttribute("aria-current", "page");
    }

    await sidebar.getByRole("button", { name: "Campaigns", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/campaigns$/);
    await expect(sidebar.locator("#analytics-submenu")).toHaveCount(0);
    await expect(
      sidebar.getByRole("button", { name: "Analytics", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("uses Upload History in navigation and page metadata", async ({ page }) => {
    await page.goto("/app/history");
    const sidebar = page.locator(".app-sidebar .sidebar");

    await expect(
      sidebar.getByRole("button", { name: "Upload History", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".topbar-title")).toHaveText("Upload History");
    await expect(
      sidebar.getByRole("button", { name: "History", exact: true }),
    ).toHaveCount(0);
  });

  test("collapsed desktop navigation keeps icon-only destinations available", async ({
    page,
  }) => {
    await page.goto("/app/home");
    await page.getByRole("button", { name: "Toggle sidebar" }).click();

    const sidebar = page.locator(".app-sidebar .sidebar");
    await expect(sidebar).toHaveClass(/collapsed/);
    for (const label of [
      "Home",
      "Send Postcards",
      "Campaigns",
      "Designs",
      "Analytics",
    ]) {
      const button = sidebar.getByRole("button", { name: label, exact: true });
      await expect(button).toBeVisible();
      await expect(button.locator("svg")).toHaveCount(1);
      await expect(button.locator(".sidebar-label")).toBeHidden();
    }
  });
});

test("organizations without postcard access retain the same Analytics group", async ({
  page,
}) => {
  await bootWithFeatures(page, []);
  await page.goto("/app/dashboard");

  const sidebar = page.locator(".app-sidebar .sidebar");
  await expect(
    sidebar.getByRole("button", { name: "Analytics", exact: true }),
  ).toBeVisible();
  await expect(sidebar.locator("#analytics-submenu")).toBeVisible();
  for (const destination of analyticsDestinations) {
    await expect(
      sidebar.getByRole("button", {
        name: destination.label,
        exact: true,
      }),
    ).toBeVisible();
  }
  await expect(
    sidebar.getByRole("button", { name: "Send Postcards", exact: true }),
  ).toHaveCount(0);
});

test("mobile hamburger still opens the expanded sidebar drawer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootWithFeatures(page, ["postcards"]);
  await page.goto("/app/home");

  await expect(page.locator(".app-sidebar")).toBeHidden();
  const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
  await expect(hamburger).toBeVisible();
  await hamburger.click();

  const drawer = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Analytics", exact: true }),
  ).toBeVisible();
  await drawer.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(drawer).toBeHidden();
});
