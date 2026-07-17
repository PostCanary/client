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
    .getByRole("button", { name: "Send this Postcard" })
    .click();

  await expect(page).toHaveURL(
    /\/app\/send\/mock-draft-001\?templateId=hvac-hac-1000-full-bleed-offer-v1&goal=neighbor_marketing$/,
  );
  // Flow v2 (POS-146): Step 1 is now the two-option audience choice.
  await expect(page.getByTestId("choose-target-area")).toBeVisible();
  await expect(page.getByTestId("choose-send-to-list")).toBeVisible();
});

test("Download PDF is hidden until a design has a real rendered asset", async ({
  page,
}) => {
  // The design-library data model (DesignLibraryTemplate) has no
  // pdfUrl/assetUrl field yet — templates are curated layout definitions,
  // not rendered artifacts. Download PDF should stay hidden rather than
  // linking to a fake or missing asset until that field is populated.
  const state = createMockAppState();
  await installMockApi(page, state);

  await page.goto("/app/designs");

  const cards = page.getByTestId("design-library-template");
  await expect(cards).toHaveCount(3);
  await expect(cards.getByRole("link", { name: "Download PDF" })).toHaveCount(0);
  await expect(cards.getByRole("button", { name: "Download PDF" })).toHaveCount(0);
  await expect(
    cards.getByRole("button", { name: "Send this Postcard" }),
  ).toHaveCount(3);
});
