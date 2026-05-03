/**
 * csrf-regression.spec.ts — Sprint 1.1 CSRF defense regression suite
 *
 * Tests the two-layer CSRF defense (Origin/Referer check + synchronizer token)
 * against the live Docker stack on :8080. Uses direct API calls via the
 * Playwright `request` fixture (no browser CORS enforcement) with explicit
 * headers so each case is deterministic.
 *
 * Run: npm run test:e2e -- csrf-regression
 *
 * Stack assumption: Docker nginx on :8080 → Flask backend.
 * No auth session required (token minted as "anon" for unauthenticated requests).
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8080";

// All requests go directly to the backend, not through the Vite dev server.
test.use({ baseURL: BASE });

test.describe("CSRF defense regression — Sprint 1.1.2-1.1.4", () => {
  // -------------------------------------------------------------------------
  // (e) GET /auth/csrf-token endpoint
  // -------------------------------------------------------------------------
  test("(e) GET /auth/csrf-token returns a csrf_token hex string", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/auth/csrf-token`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.csrf_token).toBe("string");
    // SHA-256 hex is 64 lowercase hex chars
    expect(body.csrf_token).toMatch(/^[0-9a-f]{64}$/);
  });

  // -------------------------------------------------------------------------
  // (a) Valid Origin + missing X-CSRF-Token → 403 csrf_token_missing
  //
  // Layer 1 (origin check) passes because Origin matches allowed list.
  // Layer 2 (token check) rejects because header is absent.
  // -------------------------------------------------------------------------
  test("(a) valid origin + no CSRF token → 403 csrf_token_missing", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/auth/login-json`, {
      headers: {
        Origin: BASE,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ email: "csrf-test@example.com", password: "x" }),
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error?.code).toBe("csrf_token_missing");
  });

  // -------------------------------------------------------------------------
  // (b) Valid Origin + valid CSRF token → CSRF checks pass
  //
  // Token is minted against "anon" session_id (no cookie); the POST also has
  // no session cookie so it validates against the same "anon" binding.
  // Business logic returns 401 (bad credentials) — NOT a CSRF 403.
  // -------------------------------------------------------------------------
  test(
    "(b) valid origin + valid CSRF token → CSRF checks pass (non-CSRF response)",
    async ({ request }) => {
      // Step 1: fetch token (unauthenticated session → sid = "anon")
      const tokenRes = await request.get(`${BASE}/auth/csrf-token`);
      expect(tokenRes.status()).toBe(200);
      const { csrf_token } = await tokenRes.json();

      // Step 2: POST with the token
      const res = await request.post(`${BASE}/auth/login-json`, {
        headers: {
          Origin: BASE,
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf_token,
        },
        data: JSON.stringify({
          email: "csrf-test@example.com",
          password: "definitely-wrong",
        }),
      });

      // CSRF cleared — response is business-layer (401 invalid_credentials or 400)
      if (res.status() === 403) {
        const body = await res.json();
        // Fail explicitly with the CSRF error code if it slipped through
        expect(body.error?.code ?? "").not.toMatch(/^csrf_/);
      } else {
        // 401 (invalid creds) or 400 (missing) — both mean CSRF was accepted
        expect([400, 401]).toContain(res.status());
      }
    }
  );

  // -------------------------------------------------------------------------
  // (c) Mismatched Origin header → 403 csrf_origin_mismatch
  //
  // Layer 1 rejects immediately; layer 2 is never reached.
  // -------------------------------------------------------------------------
  test("(c) mismatched origin → 403 csrf_origin_mismatch", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/auth/login-json`, {
      headers: {
        Origin: "https://evil.example.com",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ email: "x", password: "x" }),
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error?.code).toBe("csrf_origin_mismatch");
  });

  // -------------------------------------------------------------------------
  // (d) POST /auth/logout with valid Origin + CSRF token → not a CSRF error
  //
  // Logout is a state-changing POST (1.1.5) and must accept a CSRF token.
  // Without an auth session, server returns 200/204 (already-logged-out) or
  // 401 — never a CSRF 403 when the token is present and valid.
  // -------------------------------------------------------------------------
  test(
    "(d) POST /auth/logout with valid CSRF token → not a CSRF error",
    async ({ request }) => {
      const tokenRes = await request.get(`${BASE}/auth/csrf-token`);
      const { csrf_token } = await tokenRes.json();

      const res = await request.post(`${BASE}/auth/logout`, {
        headers: {
          Origin: BASE,
          "X-CSRF-Token": csrf_token,
        },
      });

      if (res.status() === 403) {
        const body = await res.json();
        expect(body.error?.code ?? "").not.toMatch(/^csrf_/);
      } else {
        // 200 (logged out) or 401 (no session to log out) are both fine
        expect([200, 204, 302, 401]).toContain(res.status());
      }
    }
  );

  // -------------------------------------------------------------------------
  // (f) Token rotation: skipped — 1-minute window is too long for E2E
  // -------------------------------------------------------------------------
  test.skip("(f) expired token → 403 csrf_token_invalid (window too long for E2E)", () => {
    // To test: mint a token with ts_minute - 2 (outside the ±1 window),
    // then POST with that token. Requires server-side time manipulation.
  });
});
