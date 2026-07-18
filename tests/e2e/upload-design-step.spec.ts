// Flow v2 (POS-147/148): wizard step 3 is now "Upload Your Design" —
// upload print-ready artwork, or request a $199 professional design.
import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";
import { makeSolidPng } from "./support/pngFixture";

// Lands directly on step 3 without driving the whole wizard by hand —
// draftOverride short-circuits GET /api/campaign-drafts/:id (see mockApi.ts).
async function gotoStep3(page: import("@playwright/test").Page, mutate?: (state: ReturnType<typeof createMockAppState>) => void) {
  const state = createMockAppState();
  state.draftOverride = {
    current_step: 3,
    completed_steps: [1, 2],
    needs_review_steps: [],
    data: { campaignType: "targeted", goal: null, targeting: null, audience: null, design: null, review: null },
  };
  mutate?.(state);
  await installMockApi(page, state);
  await page.goto("/app/send/mock-draft-001");
  await expect(page.getByRole("heading", { name: "Upload Your Design" })).toBeVisible();
  return state;
}

test("rejecting an undersized image shows an actionable error message", async ({ page }) => {
  await gotoStep3(page);

  const undersized = makeSolidPng(1200, 800);
  await page.getByTestId("upload-front-input").setInputFiles({
    name: "front.png",
    mimeType: "image/png",
    buffer: undersized,
  });

  await expect(page.getByTestId("upload-front-error")).toContainText("1200x800");
  await expect(page.getByTestId("upload-front-error")).toContainText("1875x2775");
  await expect(page.getByTestId("upload-front-preview")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("accepting a print-spec-compliant PNG shows the preview and enables Next", async ({ page }) => {
  const state = await gotoStep3(page);

  const validPng = makeSolidPng(1875, 2775);
  await page.getByTestId("upload-front-input").setInputFiles({
    name: "front.png",
    mimeType: "image/png",
    buffer: validPng,
  });

  await expect(page.getByTestId("upload-front-preview")).toBeVisible();
  await expect(page.getByTestId("upload-front-preview")).toContainText("front.png");
  await expect(page.getByTestId("upload-front-error")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();

  // POS-156: file is posted to /api/design-uploads (server-stored URL), not
  // inlined as base64 on the draft.
  await expect.poll(() => state.requestLog.designUploads.length).toBe(1);
});

test("opening the design-request modal blurs the background content", async ({ page }) => {
  await gotoStep3(page);

  await expect(page.getByTestId("upload-design-content")).not.toHaveClass(/blurred/);
  await page.getByTestId("buy-design-link").click();
  await expect(page.getByTestId("design-request-modal")).toBeVisible();
  await expect(page.getByTestId("upload-design-content")).toHaveClass(/blurred/);

  await page.getByTestId("design-request-close").click();
  await expect(page.getByTestId("design-request-modal")).toHaveCount(0);
});

test("design-request form blocks submit until required fields are filled", async ({ page }) => {
  await gotoStep3(page);

  await page.getByTestId("buy-design-link").click();
  await expect(page.getByTestId("design-request-submit")).toBeDisabled();

  // Full Name + Email prefill from the mock auth user, but no template is
  // selected yet — still blocked.
  await expect(page.getByTestId("design-request-fullname")).toHaveValue("Alex Owner");
  await expect(page.getByTestId("design-request-email")).toHaveValue("alex@alpha.example");
  await expect(page.getByTestId("design-request-submit")).toBeDisabled();

  await page.getByTestId("design-request-template-2").click();
  // Template picked, but phone (server-required) is still empty — blocked.
  await expect(page.getByTestId("design-request-submit")).toBeDisabled();

  await page.getByTestId("design-request-phone").fill("555-123-4567");
  await expect(page.getByTestId("design-request-submit")).toBeEnabled();
});

test("submitting a valid design request enables Next and posts the brief", async ({ page }) => {
  const state = await gotoStep3(page);

  await page.getByTestId("buy-design-link").click();
  await page.getByTestId("design-request-notes").fill("Please use our brand colors.");
  await page.getByTestId("design-request-template-3").click();
  // Phone is required by the server contract — Submit must stay disabled
  // until it's filled (staging QA regression, 2026-07-17).
  await expect(page.getByTestId("design-request-submit")).toBeDisabled();
  await page.getByTestId("design-request-phone").fill("555-123-4567");
  await expect(page.getByTestId("design-request-submit")).toBeEnabled();
  await page.getByTestId("design-request-submit").click();

  await expect(page.getByTestId("design-request-modal")).toHaveCount(0);
  await expect(page.getByTestId("design-request-summary")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();

  await expect.poll(() => state.requestLog.designRequests.length).toBe(1);
  const request = state.requestLog.designRequests[0];
  expect(request.template).toBe(3);
  expect(request.email).toBe("alex@alpha.example");
  expect(request.notes).toBe("Please use our brand colors.");
  expect(request.draft_id).toBe("mock-draft-001");
  expect(request.full_name).toBeTruthy();
});
