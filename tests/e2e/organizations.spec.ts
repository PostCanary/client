import { expect, test, type Page } from "@playwright/test";

import { createMockAppState, installMockApi, type MockAppState } from "./support/mockApi";

async function setup(page: Page, mutate?: (state: MockAppState) => void) {
  const state = createMockAppState();
  mutate?.(state);
  await installMockApi(page, state);
  return state;
}

function isMobileViewport(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 640;
}

async function visibleOrgSwitcher(page: Page) {
  if (!isMobileViewport(page)) return page.getByTestId("org-switcher-trigger");

  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  return page
    .getByRole("dialog", { name: "Navigation menu" })
    .getByTestId("org-switcher-trigger");
}

test("team management covers invites, role updates, and member removal", async ({ page }) => {
  const state = await setup(page);

  await page.goto("/team");

  await expect(page.getByRole("main").getByRole("heading", { name: "Team" })).toBeVisible();
  await expect(page.getByTestId("team-invitation-invite-pending-1")).toBeVisible();

  await page.getByRole("button", { name: "Invite member" }).click();
  await page.getByLabel("Email address").fill("newhire@alpha.example");
  await page.getByLabel("Role").selectOption("admin");
  await page.getByRole("button", { name: "Send invitation" }).click();

  await expect.poll(() => state.requestLog.inviteEmails).toContain("newhire@alpha.example");
  await expect(
    page.getByTestId(/team-invitation-/).filter({ hasText: "newhire@alpha.example" }).first(),
  ).toBeVisible();

  await page.getByTestId("team-member-user-admin").locator("select").selectOption("member");
  await expect.poll(() => state.membersByOrg["org-alpha"].find((member) => member.user_id === "user-admin")?.role).toBe("member");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("team-member-user-member").getByRole("button").click();

  await expect(page.getByTestId("team-member-user-member")).toHaveCount(0);
});

test("org switcher reloads the app in the selected organization context", async ({ page }) => {
  const state = await setup(page);

  await page.goto("/dashboard");

  const orgSwitcher = await visibleOrgSwitcher(page);
  await expect(orgSwitcher).toContainText("Alpha Roofing");

  await orgSwitcher.click();
  const orgOptions = isMobileViewport(page)
    ? page.getByRole("dialog", { name: "Navigation menu" })
    : page;
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    orgOptions.getByTestId("org-switcher-item-org-beta").click(),
  ]);

  await expect.poll(() => state.requestLog.switches.at(-1)).toBe("org-beta");
  const switchedOrg = await visibleOrgSwitcher(page);
  await expect(switchedOrg).toContainText("Beta Plumbing");

  if (isMobileViewport(page)) {
    await page.keyboard.press("Escape");
    await expect(page.locator(".hero-card", { has: page.getByText("Total Matches") })).toContainText("18");
  } else {
    await expect(page.getByTestId("campaign-select")).toContainText("West Region Launch");
    await expect(page.getByTestId("campaign-select")).not.toContainText("Spring Reactivation");
  }
});

test("invite accept page prompts unauthenticated users to sign in or sign up", async ({ page }) => {
  await setup(page, (state) => {
    state.authMe = { authenticated: false };
  });

  await page.goto("/invite/invite-accept-token");

  await expect(page.getByText("Sam Operator")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create an account" })).toBeVisible();

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-email")).toBeVisible();
});

test("accepting an invite while signed in joins the org and returns to the dashboard", async ({ page }) => {
  await setup(page, (state) => {
    state.orgs = [state.orgs[0]];
    state.authMe.orgs = [state.orgs[0]];
    state.authMe.org_id = state.orgs[0].id;
    state.authMe.org_name = state.orgs[0].name;
    state.authMe.org_role = state.orgs[0].role;
  });

  await page.goto("/invite/invite-accept-token");

  await page.getByRole("button", { name: "Accept invitation" }).click();

  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByTestId("org-switcher-trigger")).toContainText("Beta Plumbing");
});
