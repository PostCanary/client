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

async function selectIndustry(
  page: Page,
  opts: { search?: string; slug: string },
) {
  const input = page.getByTestId("industry-combobox-input");
  await input.click();
  if (opts.search) {
    await input.fill(opts.search);
  }
  await page.getByTestId(`industry-option-${opts.slug}`).click();
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

  await selectIndustry(page, { search: "plumber", slug: "plumbing" });
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

  await selectIndustry(page, { slug: "hvac" });
  await page.getByTestId("first-run-continue").click();

  await expect(page).toHaveURL(/\/app\/home$/);
  await expect.poll(() => state.profile.industry).toBe("hvac");
  await expect.poll(() => state.returnAddress?.address).toBe("100 Main Street");
  await expect.poll(() => state.returnAddress?.city).toBe("Scottsdale");
  expect(state.requestLog.returnAddressUpdates).toEqual([]);
});

test("sign out from first-run lands on marketing home, not setup", async ({
  page,
}) => {
  await boot(page, (s) => {
    s.profile.industry = "Roofing";
    s.profile.profile_complete = true;
    s.profile.is_invited_user = false;
    s.brandKit.data = {
      ...(s.brandKit.data ?? {}),
      location: "Atlanta, GA",
      industry: "roofing",
    };
    s.returnAddress = null;
  });

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("first-run-sign-out")).toBeVisible();

  await page.getByTestId("first-run-sign-out").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Get Started/i })).toBeVisible();

  await page.goto("/login");
  await expect(page).not.toHaveURL(/\/app\/setup/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Sign in" }),
  ).toBeVisible();
});

test("login while first-run is needed stays on the login modal", async ({
  page,
}) => {
  await boot(page, (s) => {
    s.profile.industry = "Roofing";
    s.profile.profile_complete = true;
    s.returnAddress = null;
  });

  await page.goto("/login");
  await expect(page).not.toHaveURL(/\/app\/setup/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);
  await expect(
    page.getByRole("paragraph").filter({ hasText: "Sign in" }),
  ).toBeVisible();
});

test("ZIP keystroke does not wipe industry or address", async ({ page }) => {
  await boot(page, incompleteNewUser);

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);

  await selectIndustry(page, { search: "plumber", slug: "plumbing" });
  await page.getByTestId("first-run-street").fill("123 Palm Ave");
  await page.getByTestId("first-run-city").fill("Scottsdale");
  await page.getByTestId("first-run-state").fill("AZ");
  await page.getByTestId("first-run-zip").pressSequentially("85251", {
    delay: 30,
  });

  await expect(page.getByTestId("first-run-street")).toHaveValue("123 Palm Ave");
  await expect(page.getByTestId("first-run-city")).toHaveValue("Scottsdale");
  await expect(page.getByTestId("first-run-state")).toHaveValue("AZ");
  await expect(page.getByTestId("first-run-zip")).toHaveValue("85251");
  await expect(page.getByTestId("industry-combobox-input")).toHaveValue(
    "Plumbing",
  );
});

test("owner with industry and brand location but no return address lands on setup", async ({
  page,
}) => {
  await boot(page, (s) => {
    s.profile.industry = "Roofing";
    s.profile.profile_complete = true;
    s.profile.is_invited_user = false;
    s.brandKit.data = {
      ...(s.brandKit.data ?? {}),
      location: "Atlanta, GA",
      industry: "roofing",
    };
    s.returnAddress = null;
  });

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("first-run-setup")).toBeVisible();
  await expect(page.getByTestId("first-run-street")).toHaveValue("");
  await expect(page.getByTestId("first-run-city")).toHaveValue("Atlanta");
  await expect(page.getByTestId("first-run-state")).toHaveValue("GA");
  await expect(page.getByTestId("first-run-zip")).toHaveValue("");

  await page.goto("/app/setup");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("first-run-setup")).toBeVisible();
});

test("invited teammate skips setup even with a blank return address", async ({
  page,
}) => {
  const state = await boot(page, (s) => {
    s.profile.is_invited_user = true;
    s.profile.industry = "Roofing";
    s.profile.profile_complete = true;
    s.profile.full_name = "Jordan Member";
    s.authMe.org_role = "member";
    s.returnAddress = null;
    const org = s.orgs.find((o) => o.id === s.authMe.org_id);
    if (org) org.role = "member";
  });

  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);

  await page.goto("/app/setup");
  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByTestId("first-run-setup")).toHaveCount(0);

  await page.goto("/app/settings");
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByTestId("settings-profile-badge")).toContainText(
    "Profile incomplete",
  );
  await expect(page.getByTestId("settings-return-name")).toBeDisabled();
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

test("Settings badge is complete only when mailing address is filled", async ({
  page,
}) => {
  await boot(page);
  await page.goto("/app/settings");
  await expect(page.getByTestId("settings-profile-badge")).toContainText(
    "Profile complete",
  );
});

test("typing in the industry combobox replaces the selected label", async ({
  page,
}) => {
  await boot(page);
  await page.goto("/app/settings");

  const input = page.getByTestId("industry-combobox-input");
  await expect(input).toHaveValue("Roofing");

  await input.click();
  await expect(page.getByTestId("industry-combobox-list")).toBeVisible();
  await expect(input).toHaveValue("");
  await input.pressSequentially("plumber");
  await expect(input).toHaveValue("plumber");
  await expect(page.getByTestId("industry-option-plumbing")).toHaveText(
    "Plumbing",
  );
  await expect(page.getByTestId("industry-option-roofing")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(input).toHaveValue("Roofing");
});

test("Settings and first-run share the searchable grouped industry combobox", async ({
  page,
}) => {
  const state = await boot(page);
  await page.goto("/app/settings");

  const input = page.getByTestId("industry-combobox-input");
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("Roofing");
  await expect(page.getByTestId("industry-other-text")).toHaveCount(0);
  await expect(page.getByTestId("industry-pill-hvac")).toHaveCount(0);

  await input.click();
  await expect(page.getByTestId("industry-group-home_services")).toBeVisible();
  await expect(page.getByTestId("industry-group-health")).toBeVisible();
  await input.fill("ac");
  await expect(page.getByTestId("industry-option-hvac")).toHaveText("HVAC");

  await selectIndustry(page, { slug: "other" });
  await page.getByTestId("industry-other-text").fill("Pool service");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect.poll(() => state.profile.industry).toBe("Pool service");
  await expect.poll(() => state.brandKit.data.industry).toBe("other");

  await selectIndustry(page, { slug: "other" });
  await page.getByTestId("industry-other-text").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => state.profile.industry).toBe("Pool service");
});

test("existing hvac hydrates in Settings and Other needs custom text on first-run", async ({
  page,
}) => {
  await boot(page, (s) => {
    s.profile.industry = "hvac";
    s.brandKit.data = {
      ...(s.brandKit.data ?? {}),
      industry: "hvac",
    };
  });
  await page.goto("/app/settings");
  await expect(page.getByTestId("industry-combobox-input")).toHaveValue("HVAC");

  await boot(page, incompleteNewUser);
  await page.goto("/app/home");
  await expect(page).toHaveURL(/\/app\/setup$/);
  await expect(page.getByTestId("industry-picker")).toBeVisible();
  await expect(page.getByTestId("industry-pill-plumbing")).toHaveCount(0);

  const continueBtn = page.getByTestId("first-run-continue");
  await expect(continueBtn).toBeDisabled();

  await page.getByTestId("industry-combobox-input").click();
  await expect(page.getByTestId("industry-group-home_services")).toBeVisible();
  await page.getByTestId("industry-combobox-input").fill("plumber");
  await expect(page.getByTestId("industry-option-plumbing")).toHaveText(
    "Plumbing",
  );

  await selectIndustry(page, { slug: "other" });
  await expect(page.getByTestId("industry-other-text")).toBeVisible();
  await expect(continueBtn).toBeDisabled();
  await page.getByTestId("industry-other-text").fill("Pool service");
  await page.getByTestId("first-run-street").fill("123 Palm Ave");
  await page.getByTestId("first-run-city").fill("Scottsdale");
  await page.getByTestId("first-run-state").fill("AZ");
  await page.getByTestId("first-run-zip").fill("85251");
  await expect(continueBtn).toBeEnabled();
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
