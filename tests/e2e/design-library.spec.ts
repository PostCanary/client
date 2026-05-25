import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

test("Designs page shows curated render-backed templates and starts the wizard from one", async ({
  page,
}) => {
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/designs");

  await expect(
    page.getByRole("main").getByRole("heading", { name: "Designs" }),
  ).toBeVisible();
  await expect(page.getByTestId("design-library-template")).toHaveCount(3);
  const offerTemplate = page
    .getByTestId("design-library-template")
    .filter({ hasText: "HVAC Neighborhood Offer" });
  await expect(offerTemplate).toBeVisible();
  await expect(offerTemplate.getByText("hac-1000-front-v1")).toBeVisible();

  await offerTemplate
    .getByRole("button", { name: "Start from template" })
    .click();

  await expect(page).toHaveURL(
    /\/app\/send\/mock-draft-001\?templateId=hvac-hac-1000-full-bleed-offer-v1&goal=neighbor_marketing$/,
  );
  await expect(
    page.getByRole("heading", {
      name: "To send postcards, we need a couple things first:",
    }),
  ).toBeVisible();
});
