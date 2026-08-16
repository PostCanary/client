import { expect, test } from "@playwright/test";

import { createMockAppState, installMockApi } from "./support/mockApi";

const MOCK_REPLY =
  "Targeted Mail is $0.89 per postcard for 1-1,499 and $0.85 at 1,500 or more.";

test("chat widget renders the streamed reply and never posts without CSRF", async ({
  page,
}) => {
  const state = createMockAppState();
  state.authMe = { authenticated: false };
  await installMockApi(page, state);
  await page.goto("/");

  await page.locator(".chat-fab").click();
  const panel = page.locator(".chat-panel");
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "Show me pricing" }).click();

  const assistantBubble = panel.locator(".chat-msg--assistant .chat-msg__bubble");
  await expect(assistantBubble).toContainText(MOCK_REPLY);
  await expect(assistantBubble).not.toHaveClass(/chat-msg__bubble--streaming/);

  await expect
    .poll(() => state.requestLog.chatRequests.some((req) => req.path === "/api/chat/session"))
    .toBe(true);

  const missingCsrf = state.requestLog.chatRequests.filter((req) => !req.hasCsrfToken);
  expect(missingCsrf, JSON.stringify(state.requestLog.chatRequests)).toEqual([]);

  const chatPosts = state.requestLog.chatRequests.filter((req) => req.path === "/api/chat");
  expect(chatPosts.length).toBe(1);
});
