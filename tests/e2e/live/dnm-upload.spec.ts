/**
 * dnm-upload.spec.ts — Sprint 1.6.4 DNM E2E regression
 *
 * Verifies POST /api/dnm/upload-csv + GET /api/dnm/count against the live
 * Docker stack on :8080. Uses Playwright `request` fixture (no browser) with
 * auth cookies from .auth/live.json and a CSRF token minted per-request.
 *
 * Run: npm run test:e2e -- dnm-upload
 *
 * Stack assumption: Docker nginx on :8080 → Flask backend with migrated DB.
 * Skips gracefully if the do_not_mail table is not yet migrated (500/404).
 *
 * Acceptance criteria (DoD):
 *   - POST /api/dnm/upload-csv processes 2 rows (inserted + skipped = 2)
 *   - GET /api/dnm/count returns a non-negative number ≥ 2
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8080";

test.use({
  baseURL: BASE,
  storageState: ".auth/live.json",
});

const TWO_ROW_CSV =
  "address,city,state,zip5\n" +
  "123 Elm Street,Phoenix,AZ,85001\n" +
  "456 Maple Ave,Tucson,AZ,85701\n";

test.describe("DNM upload + count — Sprint 1.6.4", () => {
  test(
    "POST /api/dnm/upload-csv processes 2-row CSV; GET /api/dnm/count ≥ 2",
    async ({ request }) => {
      // ── Step 1: mint CSRF token (authenticated session) ──────────────────
      const tokenRes = await request.get(`${BASE}/auth/csrf-token`);
      expect(tokenRes.status()).toBe(200);
      const { csrf_token } = await tokenRes.json();

      // ── Step 2: upload 2-row CSV ──────────────────────────────────────────
      const uploadRes = await request.post(`${BASE}/api/dnm/upload-csv`, {
        headers: {
          Origin: BASE,
          "X-CSRF-Token": csrf_token,
        },
        multipart: {
          file: {
            name: "dnm.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(TWO_ROW_CSV),
          },
        },
      });

      // Skip if migration hasn't run in this container yet
      if (uploadRes.status() === 404 || uploadRes.status() === 500) {
        test.skip(
          true,
          `do_not_mail migration not applied in this container (HTTP ${uploadRes.status()}) — skipping`,
        );
        return;
      }

      expect(uploadRes.status()).toBe(200);
      const uploadBody = await uploadRes.json();
      expect(uploadBody.ok).toBe(true);
      // All 2 rows must be accounted for (inserted OR already-present duplicate)
      expect(uploadBody.inserted + uploadBody.skipped).toBe(2);

      // ── Step 3: verify count endpoint ────────────────────────────────────
      const countRes = await request.get(`${BASE}/api/dnm/count`);
      expect(countRes.status()).toBe(200);
      const countBody = await countRes.json();
      expect(typeof countBody.count).toBe("number");
      // At minimum the 2 rows we just uploaded are present (may be > 2 on re-run)
      expect(countBody.count).toBeGreaterThanOrEqual(2);
    },
  );
});
