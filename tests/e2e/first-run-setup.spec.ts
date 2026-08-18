import { expect, test, type Page } from "@playwright/test";
import {
  createMockAppState,
  installMockApi,
  type MockAppState,
} from "./support/mockApi";

function incompleteNewUser(state: MockAppState) {
  state.profile.industry = "";
  state.profile.profile_complete = false;
  state.profile.created_at = new Date().toISOString();
  state.profile.is_invited_user = false;
  state.brandKit.data = {
    ...(state.brandKit.data ?? {}),
    location: "",
    industry: null,
  };
  state.returnAddress = null;
}

async function boot(page: Page, mutate?: (state: MockAppState) => void) {
  const state = createMockAppState();
  mutate?.(state);
  await installMockApi(page, state);
  return state;
}

test("new user with empty industry and address sees the first-run page once", async ({
  page,
}) => {
  const state = await boot(page, incompleteNewUser);

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("first-run-setup")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A couple things before you send" }),
  ).toBeVisible();

  await page.getByTestId("industry-pill-plumbing").click();
  await page.getByTestId("first-run-street").fill("123 Palm Ave");
  await page.getByTestId("first-run-city").fill("Scottsdale");
  await page.getByTestId("first-run-state").fill("AZ");
  await page.getByTestId("first-run-zip").fill("85251");
  await page.getByTestId("first-run-continue").click();

  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByRole("heading", { name: /^Welcome, / })).toBeVisible();
  await expect.poll(() => state.profile.industry).toBe("plumbing");
  await expect.poll(() => state.returnAddress?.city).toBe("Scottsdale");
  await expect.poll(() => state.brandKit.data.industry).toBe("plumbing");
  await expect.poll(() => String(state.brandKit.data.location)).toMatch(
    /Scottsdale/,
  );

  await page.goto("/app/send");
  await expect(page).toHaveURL(/\/app\/send/);
  await expect(
    page.getByText("To send postcards, we need a couple things first"),
  ).toHaveCount(0);
  await expect(page.getByTestId("choose-target-area")).toBeVisible();
});

const EXISTING_RETURN = {
  name: "Acme Plumbing",
  address: "100 Main Street",
  address2: null,
  city: "Scottsdale",
  state: "AZ",
  zip: "85251",
};

function industryOnlyMissing(state: MockAppState) {
  state.profile.industry = "";
  state.profile.profile_complete = false;
  state.profile.created_at = new Date().toISOString();
  state.profile.is_invited_user = false;
  state.brandKit.data = {
    ...(state.brandKit.data ?? {}),
    industry: null,
  };
  state.returnAddress = { ...EXISTING_RETURN };
}

test("industry-only missing prefills the return address and does not overwrite it", async ({
  page,
}) => {
  const state = await boot(page, industryOnlyMissing);

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("first-run-street")).toHaveValue("100 Main Street");
  await expect(page.getByTestId("first-run-city")).toHaveValue("Scottsdale");
  await expect(page.getByTestId("first-run-state")).toHaveValue("AZ");
  await expect(page.getByTestId("first-run-zip")).toHaveValue("85251");

  await page.getByTestId("industry-pill-hvac").click();
  await page.getByTestId("first-run-continue").click();

  await expect(page).toHaveURL(/\/app\/home$/);
  await expect.poll(() => state.profile.industry).toBe("hvac");
  await expect.poll(() => state.returnAddress?.address).toBe("100 Main Street");
  await expect.poll(() => state.returnAddress?.city).toBe("Scottsdale");
  expect(state.requestLog.returnAddressUpdates).toEqual([]);
});

test("invited teammate sets industry without writing the org return address", async ({
  page,
}) => {
  const state = await boot(page, (s) => {
    industryOnlyMissing(s);
    s.profile.is_invited_user = true;
    s.profile.full_name = "Jordan Member";
    s.authMe.org_role = "member";
    const org = s.orgs.find((o) => o.id === s.authMe.org_id);
    if (org) org.role = "member";
  });

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("first-run-street")).toHaveCount(0);
  await expect(page.getByTestId("first-run-address-locked")).toBeVisible();

  await page.getByTestId("industry-pill-plumbing").click();
  await page.getByTestId("first-run-continue").click();

  await expect(page).toHaveURL(/\/app\/home$/);
  await expect.poll(() => state.profile.industry).toBe("plumbing");
  await expect.poll(() => state.returnAddress).toEqual(EXISTING_RETURN);
  expect(state.requestLog.returnAddressUpdates).toEqual([]);
});

test("complete profiles and invited teammates never see the first-run page", async ({
  page,
}) => {
  await boot(page);
  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();

  const invited = await boot(page, (state) => {
    state.profile.is_invited_user = true;
    state.profile.industry = "";
    state.profile.full_name = "Jordan Admin";
    state.profile.created_at = "2024-01-12T12:00:00Z";
    // Org already has brand-kit industry + location from the fixture.
  });
  expect(invited.brandKit.data.location).toBe("Atlanta, GA");
  await page.goto("/app/settings");
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);
});

test("Settings industry is a controlled list with Other", async ({ page }) => {
  const state = await boot(page);
  await page.goto("/app/settings");

  const select = page.getByTestId("industry-select");
  await expect(select).toBeVisible();
  await expect(select).toBeEnabled();
  await expect(select).toHaveValue("roofing");
  await expect(page.getByTestId("industry-other-text")).toHaveCount(0);

  await select.selectOption("other");
  await page.getByTestId("industry-other-text").fill("Pool service");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect.poll(() => state.profile.industry).toBe("Pool service");
  await expect.poll(() => state.brandKit.data.industry).toBe("other");

  await select.selectOption("other");
  await page.getByTestId("industry-other-text").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => state.profile.industry).toBe("Pool service");
});

test("/login opens the in-app modal and surfaces SSO errors", async ({
  page,
}) => {
  await boot(page, (state) => {
    state.authMe = { authenticated: false };
  });

  await page.goto("/login?error=access_denied");
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Sign in" }),
  ).toBeVisible();
  await expect(page.getByText(/cancelled or denied/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
