// tests/e2e/support/printJobMockApi.ts
//
// S374 — Playwright route-stub helper for the print-job submit→status flow
// (U.7 phase A on S308 brief print-submit-ui-brief).
//
// Mirrors the catch-all-`page.route` pattern from `support/mockApi.ts` but
// scoped to the four endpoints `usePrintJob` + `SubmitPrintJobButton` /
// `PrintJobConfirmModal` / `PrintJobStatus.vue` actually call:
//
//   GET  /auth/me                           → router-guard satisfaction
//   GET  /api/mail-campaigns/:id            → campaign-detail page bootstrap
//   POST /api/print_jobs/submit             → per-scenario response
//   GET  /api/print_jobs/:id                → per-scenario polling sequence
//
// All other in-app routes pass through (no route.continue() in spec mode —
// vite dev server still serves the SPA assets). External hostnames are
// blocked-by-client (matches `installMockApi` posture).
//
// Server-error shape mirrored verbatim from http.ts decode contract:
// `{error: {code, message}}` so `usePrintJob.submit()` extracts `error.code`
// for the SubmittablePrintJob switch.

import type { Page, Route } from "@playwright/test";

export type PrintJobMockScenario =
  | "happy"
  | "idempotency_409"
  | "empty_400"
  | "membership_403"
  | "watch_404"
  | "poll_timeout";

const HAPPY_POLL_SEQUENCE = [
  "accepted",
  "in_production",
  "printed",
  "mailed",
  "delivered",
] as const;

const MOCK_JOB_ID = "11111111-2222-3333-4444-555555555555";
const EXISTING_JOB_ID = "abc12345-2222-3333-4444-555555555555";
const MOCK_CAMPAIGN_ID = "campaign-mock-id";
const MOCK_ORG_ID = "org-mock-id";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function err(route: Route, code: string, status: number, message?: string) {
  return json(
    route,
    { error: { code, message: message ?? code.replace(/_/g, " ") } },
    status,
  );
}

function authMeFixture() {
  return {
    authenticated: true,
    user_id: "user-mock-id",
    email: "test@example.com",
    full_name: "Mock User",
    role: "owner",
    org_id: MOCK_ORG_ID,
    org_name: "Mock Org",
    org_role: "owner",
    orgs: [{ id: MOCK_ORG_ID, name: "Mock Org", slug: "mock-org", role: "owner" }],
    billing: {
      subscription_status: "active",
      is_subscribed: true,
      can_run_matching: true,
      needs_paywall: false,
    },
  };
}

function campaignFixture() {
  return {
    id: MOCK_CAMPAIGN_ID,
    org_id: MOCK_ORG_ID,
    name: "Mock Campaign",
    status: "draft",
    record_count: 250,
    created_at: "2026-04-29T00:00:00Z",
  };
}

/**
 * Install route stubs for the print-job submit→status flow.
 *
 * The returned counter object lets specs assert call counts (e.g. happy-path
 * "no duplicate POST after 409 idempotency replay").
 */
export async function installPrintJobMockApi(
  page: Page,
  scenario: PrintJobMockScenario,
) {
  const counters = { submitPosts: 0, statusGets: 0 };

  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      return route.abort("blockedbyclient");
    }

    const { pathname } = url;
    const method = request.method();

    if (pathname === "/auth/me" && method === "GET") {
      return json(route, authMeFixture());
    }

    const campaignMatch = pathname.match(/^\/api\/mail-campaigns\/([^/]+)$/);
    if (campaignMatch && method === "GET") {
      return json(route, campaignFixture());
    }

    if (pathname === "/api/print_jobs/submit" && method === "POST") {
      counters.submitPosts += 1;
      switch (scenario) {
        case "happy":
          return json(
            route,
            { job_id: MOCK_JOB_ID, status: "submitted", partner_order_id: "mock-order-001" },
            201,
          );
        case "idempotency_409":
          return json(
            route,
            { error: { code: "idempotency_conflict", existing_job_id: EXISTING_JOB_ID } },
            409,
          );
        case "empty_400":
          return err(route, "campaign_empty", 400);
        case "membership_403":
          return err(route, "membership_inactive", 403);
        case "watch_404":
        case "poll_timeout":
          // These scenarios deep-link straight to /app/print-jobs/:id and
          // never POST — but if a spec accidentally triggers submit, return
          // the happy response so the failure mode is the polling assertion,
          // not a misleading 5xx.
          return json(
            route,
            { job_id: MOCK_JOB_ID, status: "submitted", partner_order_id: null },
            201,
          );
      }
    }

    const statusMatch = pathname.match(/^\/api\/print_jobs\/([^/]+)$/);
    if (statusMatch && method === "GET") {
      counters.statusGets += 1;
      const jobId = statusMatch[1];
      switch (scenario) {
        case "happy": {
          // First call returns the first phase; each subsequent call advances
          // by one. Past the end → stay terminal (`delivered`).
          const idx = Math.min(counters.statusGets - 1, HAPPY_POLL_SEQUENCE.length - 1);
          return json(route, {
            job_id: jobId,
            status: HAPPY_POLL_SEQUENCE[idx],
            partner_id: "mock",
            partner_order_id: "mock-order-001",
          });
        }
        case "idempotency_409":
          return json(route, {
            job_id: jobId,
            status: "submitted",
            partner_id: "mock",
            partner_order_id: null,
          });
        case "empty_400":
        case "membership_403":
          // Submit-error scenarios shouldn't navigate to status page; if
          // somehow reached, return 404 to make the misroute obvious.
          return err(route, "not_found", 404);
        case "watch_404":
          return err(route, "not_found", 404);
        case "poll_timeout":
          // Stay on `submitted` indefinitely; spec uses page.clock to
          // fast-forward past POLL_DEADLINE_MS (120s) to trigger the
          // composable's POLL_TIMEOUT branch.
          return json(route, {
            job_id: jobId,
            status: "submitted",
            partner_id: "mock",
            partner_order_id: null,
          });
      }
    }

    // Pass-through for SPA assets, vite HMR, and any other in-app traffic.
    return route.continue();
  });

  return counters;
}
