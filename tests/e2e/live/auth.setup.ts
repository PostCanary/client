import { test as setup, expect } from "@playwright/test";

/**
 * One-time login for live-stack tests. Writes cookies to .auth/live.json so
 * the wizard spec can reuse an authenticated session without hitting login
 * every test.
 *
 * Credentials default to drake@postcanary.com / Djmax123 (documented in the
 * session handoff — dev-user, not a secret). Override via POSTCANARY_TEST_EMAIL
 * / POSTCANARY_TEST_PASSWORD env vars.
 *
 * 3 failed attempts = Auth0 lockout, so do NOT retry on 401 inside this setup.
 */
const AUTH_FILE = ".auth/live.json";
const EMAIL = process.env.POSTCANARY_TEST_EMAIL ?? "drake@postcanary.com";
const PASSWORD = process.env.POSTCANARY_TEST_PASSWORD ?? "Djmax123";

setup("authenticate against live dev stack", async ({ request }) => {
  const loginRes = await request.post("/auth/login-json", {
    data: { email: EMAIL, password: PASSWORD },
    headers: { "Content-Type": "application/json" },
  });
  expect(
    loginRes.ok(),
    `login-json returned ${loginRes.status()} — check dev stack + credentials`,
  ).toBeTruthy();

  const meRes = await request.get("/auth/me");
  expect(meRes.ok(), `auth/me returned ${meRes.status()} after login`).toBeTruthy();
  const me = await meRes.json();
  expect(
    me.authenticated,
    `auth setup failed: /auth/me unauthenticated after login-json — cookie not established`,
  ).toBe(true);

  await request.storageState({ path: AUTH_FILE });
});
