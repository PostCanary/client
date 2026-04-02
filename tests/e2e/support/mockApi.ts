import type { Page, Route } from "@playwright/test";

type JsonMap = Record<string, any>;

type RequestLog = {
  heatmapQueries: Array<{ start: string | null; end: string | null; kind: string | null }>;
  normalizeCalls: string[];
  switches: string[];
  profileUpdates: JsonMap[];
  orgUpdates: Array<{ orgId: string; name: string }>;
  inviteEmails: string[];
  pauseCalls: number;
  resumeCalls: number;
  cancelCalls: number;
  changePlanCalls: string[];
};

export type MockAppState = {
  authMe: JsonMap;
  profile: JsonMap;
  orgs: JsonMap[];
  membersByOrg: Record<string, JsonMap[]>;
  invitationsByOrg: Record<string, JsonMap[]>;
  invitationDetailsByToken: Record<string, JsonMap>;
  campaignsByOrg: Record<string, JsonMap[]>;
  batchesByOrg: Record<string, JsonMap[]>;
  runStatusByOrg: Record<string, JsonMap | null>;
  runResultByOrg: Record<string, JsonMap | null>;
  runMatchesByOrg: Record<string, JsonMap | null>;
  postUploadRunByOrg: Record<string, { status: JsonMap; result: JsonMap; matches: JsonMap }>;
  analyticsByOrg: Record<string, JsonMap>;
  regeneratedAnalyticsByOrg: Record<string, JsonMap>;
  demographicsByViewByOrg: Record<string, Record<string, JsonMap>>;
  heatmapByOrg: Record<string, JsonMap>;
  headersByBatchId: Record<string, JsonMap>;
  mappingByBatchId: Record<string, JsonMap>;
  normalizeByBatchId: Record<string, { status: number; body: JsonMap }>;
  billingPortalUrl: string;
  requestLog: RequestLog;
};

const ORG_ALPHA = {
  id: "org-alpha",
  name: "Alpha Roofing",
  slug: "alpha-roofing",
  role: "owner",
};

const ORG_BETA = {
  id: "org-beta",
  name: "Beta Plumbing",
  slug: "beta-plumbing",
  role: "admin",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function activeOrgId(state: MockAppState): string {
  if (state.authMe.authenticated && state.authMe.org_id) {
    return String(state.authMe.org_id);
  }
  return state.orgs[0]?.id ?? ORG_ALPHA.id;
}

function activeOrg(state: MockAppState): JsonMap {
  return state.orgs.find((org) => org.id === activeOrgId(state)) ?? state.orgs[0];
}

function syncSession(state: MockAppState) {
  if (!state.authMe.authenticated) return;
  const current = activeOrg(state);
  state.authMe.org_id = current.id;
  state.authMe.org_name = current.name;
  state.authMe.org_role = current.role;
  state.authMe.orgs = state.orgs.map(({ id, name, slug, role }) => ({
    id,
    name,
    slug,
    role,
  }));
}

function setActiveOrg(state: MockAppState, orgId: string) {
  const org = state.orgs.find((candidate) => candidate.id === orgId);
  if (!org) return;
  state.authMe.org_id = org.id;
  syncSession(state);
}

function setBillingState(state: MockAppState, billing: JsonMap) {
  state.authMe.billing = {
    ...state.authMe.billing,
    ...billing,
  };
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function noContent(route: Route) {
  return route.fulfill({ status: 204, body: "" });
}

function parseJson(route: Route): JsonMap {
  try {
    return route.request().postDataJSON() as JsonMap;
  } catch {
    return {};
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeSummaryRows() {
  return [
    {
      id: 1,
      run_id: "run-alpha",
      user_id: "user-owner",
      crm_batch_id: "crm-batch-alpha",
      mail_batch_ids: ["mail-batch-alpha"],
      crm_line_no: 1,
      job_index: "crm-001",
      mail_ids: ["mail-001"],
      matched_mail_dates: ["2024-02-01"],
      crm_job_date: "2024-02-18",
      job_value: 2400,
      crm_city: "Atlanta",
      crm_state: "GA",
      crm_zip: "30309",
      crm_full_address: "123 Peachtree St, Atlanta, GA 30309",
      mail_full_address: "123 Peachtree St, Atlanta, GA 30309",
      mail_city: "Atlanta",
      mail_state: "GA",
      mail_zip: "30309",
      confidence_percent: 97,
      match_notes: "Address matched",
      zip5: "30309",
      state: "GA",
    },
  ];
}

function makeRunResult(runId: string, totalMail: number, matches: number) {
  return {
    run_id: runId,
    preview_mode: false,
    kpis: {
      total_mail: totalMail,
      unique_mail_addresses: 1900,
      total_jobs: 310,
      matches,
      match_rate: 0.168,
      conv_30d_rate: 0.05,
      conv_60d_rate: 0.11,
      conv_90d_rate: 0.168,
      match_revenue: 102400,
      revenue_per_mailer: 40.96,
      avg_ticket_per_match: 2438,
      median_days_to_convert: 16,
    },
    graph: {
      months: ["2024-01", "2024-02", "2024-03"],
      labels: ["JAN", "FEB", "MAR"],
      mailers: [800, 900, 800],
      jobs: [95, 104, 111],
      matches: [36, 39, 42],
    },
    top_cities: [
      { city: "Atlanta", matches: 24, match_rate: 0.22 },
      { city: "Roswell", matches: 9, match_rate: 0.17 },
    ],
    top_zips: [
      { zip5: "30309", matches: 13, match_rate: 0.21 },
      { zip5: "30075", matches: 7, match_rate: 0.18 },
    ],
  };
}

export function createMockAppState(): MockAppState {
  const alphaRun = makeRunResult("run-alpha", 2500, 42);
  const betaRun = makeRunResult("run-beta", 980, 18);

  const state: MockAppState = {
    authMe: {
      authenticated: true,
      user_id: "user-owner",
      email: "alex@alpha.example",
      full_name: "Alex Owner",
      role: "owner",
      avatar_url: "",
      billing: {
        subscription_status: "active",
        is_subscribed: true,
        can_run_matching: true,
        needs_paywall: false,
        plan_code: "INSIGHT",
        resume_plan_code: null,
        cancel_at_period_end: false,
        pause_at_period_end: false,
      },
      org_id: ORG_ALPHA.id,
      org_name: ORG_ALPHA.name,
      org_role: ORG_ALPHA.role,
      orgs: [clone(ORG_ALPHA), clone(ORG_BETA)],
    },
    profile: {
      id: "user-owner",
      email: "alex@alpha.example",
      full_name: "Alex Owner",
      website_url: "https://alpha.example",
      industry: "Roofing",
      crm: "HubSpot",
      mail_provider: "Lob",
      avatar_url: null,
      role: "owner",
      is_invited_user: false,
      profile_complete: true,
      tour_completed: true,
      created_at: "2024-01-10T12:00:00Z",
    },
    orgs: [clone(ORG_ALPHA), clone(ORG_BETA)],
    membersByOrg: {
      [ORG_ALPHA.id]: [
        {
          user_id: "user-owner",
          email: "alex@alpha.example",
          full_name: "Alex Owner",
          role: "owner",
          status: "active",
          accepted_at: "2024-01-10T12:00:00Z",
        },
        {
          user_id: "user-admin",
          email: "jordan@alpha.example",
          full_name: "Jordan Admin",
          role: "admin",
          status: "active",
          accepted_at: "2024-01-12T12:00:00Z",
        },
        {
          user_id: "user-member",
          email: "casey@alpha.example",
          full_name: "Casey Member",
          role: "member",
          status: "active",
          accepted_at: "2024-01-15T12:00:00Z",
        },
      ],
      [ORG_BETA.id]: [
        {
          user_id: "user-beta-owner",
          email: "sam@beta.example",
          full_name: "Sam Operator",
          role: "owner",
          status: "active",
          accepted_at: "2024-01-20T12:00:00Z",
        },
        {
          user_id: "user-owner",
          email: "alex@alpha.example",
          full_name: "Alex Owner",
          role: "admin",
          status: "active",
          accepted_at: "2024-01-22T12:00:00Z",
        },
      ],
    },
    invitationsByOrg: {
      [ORG_ALPHA.id]: [
        {
          id: "invite-pending-1",
          email: "pending@alpha.example",
          role: "member",
          invited_by: "Alex Owner",
          token: "invite-pending-token",
          expires_at: "2026-12-31T00:00:00Z",
          created_at: "2026-03-01T00:00:00Z",
        },
      ],
      [ORG_BETA.id]: [],
    },
    invitationDetailsByToken: {
      "invite-accept-token": {
        org_id: ORG_BETA.id,
        org_slug: ORG_BETA.slug,
        org_name: ORG_BETA.name,
        email: "alex@alpha.example",
        role: "admin",
        invited_by: "Sam Operator",
        expires_at: "2026-12-31T00:00:00Z",
        accepted: false,
        expired: false,
      },
    },
    campaignsByOrg: {
      [ORG_ALPHA.id]: [
        {
          id: "camp-alpha-spring",
          name: "Spring Reactivation",
          description: null,
          created_at: "2026-01-12T00:00:00Z",
          updated_at: "2026-01-12T00:00:00Z",
        },
        {
          id: "camp-alpha-renewal",
          name: "Warranty Renewal",
          description: null,
          created_at: "2026-02-10T00:00:00Z",
          updated_at: "2026-02-10T00:00:00Z",
        },
      ],
      [ORG_BETA.id]: [
        {
          id: "camp-beta-launch",
          name: "West Region Launch",
          description: null,
          created_at: "2026-02-20T00:00:00Z",
          updated_at: "2026-02-20T00:00:00Z",
        },
      ],
    },
    batchesByOrg: {
      [ORG_ALPHA.id]: [
        {
          id: "mail-batch-alpha",
          source: "mail",
          filename: "alpha-mail.csv",
          created_at: "2026-03-20T10:00:00Z",
          status: "normalized",
          raw_count: 1500,
          normalized_count: 1488,
          deduped_count: 1422,
        },
        {
          id: "crm-batch-alpha",
          source: "crm",
          filename: "alpha-crm.csv",
          created_at: "2026-03-21T10:00:00Z",
          status: "normalized",
          raw_count: 310,
          normalized_count: 310,
          deduped_count: 310,
        },
      ],
      [ORG_BETA.id]: [
        {
          id: "mail-batch-beta",
          source: "mail",
          filename: "beta-mail.csv",
          created_at: "2026-03-18T10:00:00Z",
          status: "normalized",
          raw_count: 820,
          normalized_count: 801,
          deduped_count: 790,
        },
      ],
    },
    runStatusByOrg: {
      [ORG_ALPHA.id]: {
        run_id: "run-alpha",
        status: "done",
        step: "done",
        message: "Run complete",
      },
      [ORG_BETA.id]: {
        run_id: "run-beta",
        status: "done",
        step: "done",
        message: "Run complete",
      },
    },
    runResultByOrg: {
      [ORG_ALPHA.id]: alphaRun,
      [ORG_BETA.id]: betaRun,
    },
    runMatchesByOrg: {
      [ORG_ALPHA.id]: {
        run_id: "run-alpha",
        total: 1,
        matches: makeSummaryRows(),
      },
      [ORG_BETA.id]: {
        run_id: "run-beta",
        total: 1,
        matches: [
          {
            ...makeSummaryRows()[0],
            id: 2,
            run_id: "run-beta",
            job_index: "crm-101",
            crm_city: "Dallas",
            crm_state: "TX",
            crm_zip: "75201",
            crm_full_address: "55 Elm St, Dallas, TX 75201",
            mail_full_address: "55 Elm St, Dallas, TX 75201",
            mail_city: "Dallas",
            mail_state: "TX",
            mail_zip: "75201",
            zip5: "75201",
            state: "TX",
          },
        ],
      },
    },
    postUploadRunByOrg: {
      [ORG_ALPHA.id]: {
        status: {
          run_id: "run-upload-alpha",
          status: "done",
          step: "done",
          message: "Run complete",
        },
        result: alphaRun,
        matches: {
          run_id: "run-upload-alpha",
          total: 1,
          matches: makeSummaryRows(),
        },
      },
      [ORG_BETA.id]: {
        status: {
          run_id: "run-upload-beta",
          status: "done",
          step: "done",
          message: "Run complete",
        },
        result: betaRun,
        matches: {
          run_id: "run-upload-beta",
          total: 1,
          matches: makeSummaryRows(),
        },
      },
    },
    analyticsByOrg: {
      [ORG_ALPHA.id]: {
        run_id: "run-alpha",
        generated_at: "2026-03-22T14:00:00Z",
        model_used: "test-model",
        insights: {
          executive_summary:
            "Alpha Roofing is winning its best response rates in high-home-value ZIP codes around Atlanta.",
          sections: [
            {
              title: "Best-performing segment",
              icon: "target",
              body: "Higher-value homeowners are converting at the strongest rate.",
              highlights: ["$750k+ home value leads the pack"],
              recommendation: "Increase spend in premium suburban routes.",
            },
          ],
          top_recommendations: [
            {
              priority: "high",
              action: "Expand top Atlanta ZIPs",
              rationale: "Those ZIPs generate the highest match revenue.",
            },
          ],
          data_context: {
            total_matches: 42,
            total_mail: 2500,
            unique_addresses: 1900,
            total_jobs: 310,
            date_range: {
              earliest_mail: "2024-01-01",
              latest_job: "2024-03-31",
              months_span: 3,
            },
            sufficiency: "high",
            warnings: [],
          },
        },
      },
      [ORG_BETA.id]: {
        run_id: "run-beta",
        generated_at: "2026-03-22T14:00:00Z",
        model_used: "test-model",
        insights: {
          executive_summary:
            "Beta Plumbing is seeing strong performance from its west-region maintenance mailers.",
          sections: [],
          top_recommendations: [],
        },
      },
    },
    regeneratedAnalyticsByOrg: {
      [ORG_ALPHA.id]: {
        run_id: "run-alpha",
        generated_at: "2026-03-23T14:00:00Z",
        model_used: "test-model",
        insights: {
          executive_summary:
            "Fresh regenerated summary: Alpha Roofing should double down on premium homeowner clusters.",
          sections: [
            {
              title: "Fresh recommendation",
              icon: "sparkles",
              body: "The regenerated pass surfaced a stronger premium-homeowner signal.",
              highlights: ["Premium neighborhoods now lead by 1.9x"],
              recommendation: "Shift more spend into those neighborhoods.",
            },
          ],
          top_recommendations: [
            {
              priority: "high",
              action: "Increase premium-homeowner reach",
              rationale: "The regenerated analysis shows better lift there.",
            },
          ],
        },
      },
      [ORG_BETA.id]: {
        run_id: "run-beta",
        generated_at: "2026-03-23T14:00:00Z",
        model_used: "test-model",
        insights: {
          executive_summary:
            "Fresh regenerated summary: Beta Plumbing should keep leaning into west-region nurture campaigns.",
          sections: [],
          top_recommendations: [],
        },
      },
    },
    demographicsByViewByOrg: {
      [ORG_ALPHA.id]: {
        matches: {
          view: "matches",
          match_count: 42,
          confidence_tier: "sufficient",
          hero: {
            best_audience: {
              label: "Homes valued at $750k+",
              multiplier: 1.8,
              multiplier_text: "1.8x higher conversion",
            },
            top_home_value: {
              label: "$750k+",
              pct: 41,
              pct_text: "41%",
            },
            top_income_range: {
              label: "$150k-$199k",
              pct: 34,
              pct_text: "34%",
            },
            homeowner_rate: {
              value: 88,
              diff: 12,
              diff_text: "+12 pts vs mailed audience",
            },
          },
          charts: {
            home_value: { labels: ["$500k-$749k", "$750k+"], values: [19, 23] },
            age_range: { labels: ["35-44", "45-54"], values: [14, 18] },
            income: { labels: ["$100k-$149k", "$150k-$199k"], values: [17, 25] },
            property_type: { labels: ["Single Family", "Townhome"], values: [33, 9] },
            comparison: {
              labels: ["$500k-$749k", "$750k+"],
              mailed: [420, 320],
              matched: [19, 23],
            },
          },
          insight_message: {
            text: "Homeowners aged 45-54 are converting 1.8x more often than the mailed average.",
          },
          recommendations: [
            {
              segment: "High-value suburban homeowners",
              pct_mailers: 22,
              pct_matches: 39,
              segment_match_rate: 0.24,
              lift: 1.8,
              lift_text: "1.8x",
              response_strength: "high",
              recommendation: "Expand volume in premium ZIP clusters.",
              insufficient: false,
            },
          ],
          coverage: {
            total_zips: 12,
            enriched_zips: 12,
            pct: 100,
          },
          data_note:
            "Matched-household demographics are based on 42 verified conversions from the latest run.",
        },
        all_customers: {
          view: "all_customers",
          match_count: 42,
          confidence_tier: "sufficient",
          hero: {
            total_customers: 310,
            top_home_value: {
              label: "$500k-$749k",
              pct: 36,
              pct_text: "36%",
            },
            top_income_range: {
              label: "$100k-$149k",
              pct: 31,
              pct_text: "31%",
            },
            homeowner_rate: {
              value: 79,
              diff_text: "Stable homeowner share",
            },
          },
          charts: {
            home_value: { labels: ["$300k-$499k", "$500k-$749k"], values: [80, 112] },
            age_range: { labels: ["35-44", "45-54"], values: [74, 95] },
            income: { labels: ["$75k-$99k", "$100k-$149k"], values: [88, 96] },
            property_type: { labels: ["Single Family", "Townhome"], values: [244, 66] },
          },
          insight_message: null,
          recommendations: [],
          coverage: {
            total_zips: 12,
            enriched_zips: 12,
            pct: 100,
          },
          data_note:
            "All-customer demographics show a broad homeowner base centered on mid-to-high value homes.",
        },
      },
      [ORG_BETA.id]: {
        matches: {
          view: "matches",
          match_count: 18,
          confidence_tier: "sufficient",
          hero: {
            best_audience: {
              label: "Older homes with high service frequency",
              multiplier: 1.4,
              multiplier_text: "1.4x higher conversion",
            },
            top_home_value: {
              label: "$300k-$499k",
              pct: 38,
              pct_text: "38%",
            },
            top_income_range: {
              label: "$100k-$149k",
              pct: 29,
              pct_text: "29%",
            },
            homeowner_rate: {
              value: 82,
            },
          },
          charts: {
            home_value: { labels: ["$300k-$499k"], values: [18] },
            age_range: { labels: ["45-54"], values: [18] },
            income: { labels: ["$100k-$149k"], values: [18] },
            property_type: { labels: ["Single Family"], values: [18] },
          },
          insight_message: {
            text: "West-region maintenance campaigns continue to drive the steadiest response.",
          },
          recommendations: [],
          coverage: {
            total_zips: 6,
            enriched_zips: 6,
            pct: 100,
          },
          data_note: "Beta Plumbing demographic insights are based on 18 conversions.",
        },
      },
    },
    heatmapByOrg: {
      [ORG_ALPHA.id]: {
        ok: true,
        count: 2,
        points: [
          {
            lat: 33.781,
            lon: -84.388,
            kind: "matched",
            address: "123 Peachtree St, Atlanta, GA 30309",
            event_date: "2024-02-18",
          },
          {
            lat: 33.9526,
            lon: -84.5499,
            kind: "matched",
            address: "50 Oak St, Roswell, GA 30075",
            event_date: "2024-03-01",
          },
        ],
      },
      [ORG_BETA.id]: {
        ok: true,
        count: 1,
        points: [
          {
            lat: 32.7767,
            lon: -96.797,
            kind: "matched",
            address: "55 Elm St, Dallas, TX 75201",
            event_date: "2024-02-10",
          },
        ],
      },
    },
    headersByBatchId: {},
    mappingByBatchId: {},
    normalizeByBatchId: {},
    billingPortalUrl: "https://billing.example.test/portal",
      requestLog: {
        heatmapQueries: [],
        normalizeCalls: [],
        switches: [],
        profileUpdates: [],
        orgUpdates: [],
        inviteEmails: [],
        pauseCalls: 0,
        resumeCalls: 0,
        cancelCalls: 0,
        changePlanCalls: [],
      },
  };

  syncSession(state);
  return state;
}

function ensureUploadMocks(state: MockAppState, batchId: string, source: "mail" | "crm") {
  if (!state.headersByBatchId[batchId]) {
    state.headersByBatchId[batchId] =
      source === "mail"
        ? {
            headers: ["Address", "City", "State", "ZIP", "Sent Date"],
            sample_rows: [
              {
                Address: "123 Peachtree St",
                City: "Atlanta",
                State: "GA",
                ZIP: "30309",
                "Sent Date": "2024-02-01",
              },
            ],
            header_types: {
              Address: "string",
              City: "string",
              State: "string",
              ZIP: "string",
              "Sent Date": "date",
            },
          }
        : {
            headers: ["Address", "City", "State", "ZIP", "Job Date", "Job Value"],
            sample_rows: [
              {
                Address: "123 Peachtree St",
                City: "Atlanta",
                State: "GA",
                ZIP: "30309",
                "Job Date": "2024-02-18",
                "Job Value": "2400",
              },
            ],
            header_types: {
              Address: "string",
              City: "string",
              State: "string",
              ZIP: "string",
              "Job Date": "date",
              "Job Value": "number",
            },
          };
  }

  if (!state.mappingByBatchId[batchId]) {
    state.mappingByBatchId[batchId] =
      source === "mail"
        ? {
            mapping: {
              Address: "address1",
              City: "city",
              State: "state",
              ZIP: "zip",
              "Sent Date": "sent_date",
            },
            fields: ["address1", "city", "state", "zip", "sent_date"],
            required: ["address1", "city", "state", "zip", "sent_date"],
            optional: [],
            missing: [],
            from_auto: false,
            labels: {
              address1: "Address",
              city: "City",
              state: "State",
              zip: "ZIP",
              sent_date: "Sent Date",
            },
          }
        : {
            mapping: {
              Address: "address1",
              City: "city",
              State: "state",
              ZIP: "zip",
              "Job Date": "job_date",
              "Job Value": "job_value",
            },
            fields: ["address1", "city", "state", "zip", "job_date", "job_value"],
            required: ["address1", "city", "state", "zip", "job_date"],
            optional: ["job_value"],
            missing: [],
            from_auto: false,
            labels: {
              address1: "Address",
              city: "City",
              state: "State",
              zip: "ZIP",
              job_date: "Job Date",
              job_value: "Job Value",
            },
          };
  }

  if (!state.normalizeByBatchId[batchId]) {
    const orgId = activeOrgId(state);
    const uploadOutcome = state.postUploadRunByOrg[orgId];
    state.normalizeByBatchId[batchId] = {
      status: 202,
      body: {
        ok: true,
        batch_id: batchId,
        source,
        deduped_count: source === "mail" ? 1422 : 310,
        run_id: uploadOutcome.status.run_id,
      },
    };
  }
}

export async function installMockApi(page: Page, state: MockAppState) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      if (url.hostname === "tile.openstreetmap.org") {
        return route.fulfill({ status: 204, body: "" });
      }
      return route.abort("blockedbyclient");
    }

    const { pathname, searchParams } = url;
    const method = request.method();

    if (pathname === "/auth/me") {
      return json(route, state.authMe);
    }

    if (pathname === "/auth/logout") {
      state.authMe = { authenticated: false };
      return noContent(route);
    }

    if (pathname === "/api/users/me" && method === "GET") {
      return json(route, state.profile);
    }

    if (pathname === "/api/users/me" && method === "PATCH") {
      const payload = parseJson(route);
      state.profile = {
        ...state.profile,
        ...payload,
      };
      state.requestLog.profileUpdates.push(payload);
      if (payload.full_name) {
        state.authMe.full_name = payload.full_name;
      }
      return json(route, state.profile);
    }

    if (pathname === "/api/users/me" && method === "DELETE") {
      state.authMe = { authenticated: false };
      return noContent(route);
    }

    if (pathname === "/api/orgs" && method === "GET") {
      return json(route, { orgs: state.orgs });
    }

    const orgMembersMatch = pathname.match(/^\/api\/orgs\/([^/]+)\/members\/?$/);
    if (orgMembersMatch && method === "GET") {
      const orgId = decodeURIComponent(orgMembersMatch[1]);
      return json(route, { members: state.membersByOrg[orgId] ?? [] });
    }

    const orgInvitationsMatch = pathname.match(/^\/api\/orgs\/([^/]+)\/invitations\/?$/);
    if (orgInvitationsMatch && method === "GET") {
      const orgId = decodeURIComponent(orgInvitationsMatch[1]);
      return json(route, { invitations: state.invitationsByOrg[orgId] ?? [] });
    }

    if (orgInvitationsMatch && method === "POST") {
      const orgId = decodeURIComponent(orgInvitationsMatch[1]);
      const payload = parseJson(route);
      const invitation = {
        id: `invite-${Date.now()}`,
        email: String(payload.email ?? "").toLowerCase(),
        role: payload.role ?? "member",
        invited_by: state.authMe.full_name ?? "Alex Owner",
        token: `token-${Date.now()}`,
        expires_at: "2026-12-31T00:00:00Z",
        created_at: "2026-03-23T00:00:00Z",
      };
      state.invitationsByOrg[orgId] = [invitation, ...(state.invitationsByOrg[orgId] ?? [])];
      state.requestLog.inviteEmails.push(invitation.email);
      return json(route, invitation, 201);
    }

    const orgMemberMutationMatch = pathname.match(/^\/api\/orgs\/([^/]+)\/members\/([^/]+)$/);
    if (orgMemberMutationMatch && method === "PATCH") {
      const orgId = decodeURIComponent(orgMemberMutationMatch[1]);
      const userId = decodeURIComponent(orgMemberMutationMatch[2]);
      const payload = parseJson(route);
      state.membersByOrg[orgId] = (state.membersByOrg[orgId] ?? []).map((member) =>
        member.user_id === userId ? { ...member, role: payload.role } : member,
      );
      return noContent(route);
    }

    if (orgMemberMutationMatch && method === "DELETE") {
      const orgId = decodeURIComponent(orgMemberMutationMatch[1]);
      const userId = decodeURIComponent(orgMemberMutationMatch[2]);
      state.membersByOrg[orgId] = (state.membersByOrg[orgId] ?? []).filter(
        (member) => member.user_id !== userId,
      );
      return noContent(route);
    }

    const orgSwitchMatch = pathname.match(/^\/api\/orgs\/([^/]+)\/switch$/);
    if (orgSwitchMatch && method === "POST") {
      const orgId = decodeURIComponent(orgSwitchMatch[1]);
      setActiveOrg(state, orgId);
      state.requestLog.switches.push(orgId);
      return json(route, { ok: true, org_id: orgId });
    }

    const orgUpdateMatch = pathname.match(/^\/api\/orgs\/([^/]+)$/);
    if (orgUpdateMatch && method === "PATCH") {
      const orgId = decodeURIComponent(orgUpdateMatch[1]);
      const payload = parseJson(route);
      state.orgs = state.orgs.map((org) =>
        org.id === orgId ? { ...org, name: payload.name ?? org.name } : org,
      );
      syncSession(state);
      state.requestLog.orgUpdates.push({ orgId, name: payload.name });
      return json(route, state.orgs.find((org) => org.id === orgId));
    }

    const invitationAcceptMatch = pathname.match(/^\/api\/invitations\/([^/]+)\/accept$/);
    if (invitationAcceptMatch && method === "POST") {
      const token = decodeURIComponent(invitationAcceptMatch[1]);
      const invitation = state.invitationDetailsByToken[token];
      if (!invitation) {
        return json(route, { error: "invitation_not_found" }, 404);
      }

      invitation.accepted = true;

      if (state.authMe.authenticated) {
        const existingOrg = state.orgs.find((org) => org.id === invitation.org_id);
        if (!existingOrg) {
          state.orgs.push({
            id: invitation.org_id,
            name: invitation.org_name,
            slug: invitation.org_slug ?? slugify(invitation.org_name),
            role: invitation.role,
          });
        }
        setActiveOrg(state, invitation.org_id);
      }

      return noContent(route);
    }

    const invitationDetailsMatch = pathname.match(/^\/api\/invitations\/([^/]+)$/);
    if (invitationDetailsMatch && method === "GET") {
      const token = decodeURIComponent(invitationDetailsMatch[1]);
      const invitation = state.invitationDetailsByToken[token];
      if (!invitation) {
        return json(route, { error: "Invitation not found" }, 404);
      }
      return json(route, invitation);
    }

    if (pathname.match(/^\/api\/campaigns\/?$/) && method === "GET") {
      return json(route, { campaigns: state.campaignsByOrg[activeOrgId(state)] ?? [] });
    }

    if (pathname.match(/^\/api\/campaigns\/?$/) && method === "POST") {
      const payload = parseJson(route);
      const orgId = activeOrgId(state);
      const campaign = {
        id: `camp-${Date.now()}`,
        name: payload.name ?? "New Campaign",
        description: payload.description ?? null,
        created_at: "2026-03-23T00:00:00Z",
        updated_at: "2026-03-23T00:00:00Z",
      };
      state.campaignsByOrg[orgId] = [campaign, ...(state.campaignsByOrg[orgId] ?? [])];
      return json(route, campaign, 201);
    }

    const campaignMutationMatch = pathname.match(/^\/api\/campaigns\/([^/]+)$/);
    if (campaignMutationMatch && method === "PATCH") {
      const campaignId = decodeURIComponent(campaignMutationMatch[1]);
      const orgId = activeOrgId(state);
      const payload = parseJson(route);
      let updatedCampaign: JsonMap | null = null;
      state.campaignsByOrg[orgId] = (state.campaignsByOrg[orgId] ?? []).map((campaign) => {
        if (campaign.id !== campaignId) return campaign;
        updatedCampaign = { ...campaign, ...payload, updated_at: "2026-03-23T00:00:00Z" };
        return updatedCampaign;
      });
      return json(route, updatedCampaign);
    }

    if (campaignMutationMatch && method === "DELETE") {
      const campaignId = decodeURIComponent(campaignMutationMatch[1]);
      const orgId = activeOrgId(state);
      state.campaignsByOrg[orgId] = (state.campaignsByOrg[orgId] ?? []).filter(
        (campaign) => campaign.id !== campaignId,
      );
      return noContent(route);
    }

    const campaignBatchMatch = pathname.match(/^\/api\/campaigns\/([^/]+)\/batches\/?$/);
    if (campaignBatchMatch && method === "POST") {
      return json(route, { updated: 1 });
    }

    if (pathname === "/api/batches" && method === "GET") {
      return json(route, { ok: true, batches: state.batchesByOrg[activeOrgId(state)] ?? [] });
    }

    const batchDeleteMatch = pathname.match(/^\/api\/batches\/([^/]+)$/);
    if (batchDeleteMatch && method === "DELETE") {
      const batchId = decodeURIComponent(batchDeleteMatch[1]);
      const orgId = activeOrgId(state);
      state.batchesByOrg[orgId] = (state.batchesByOrg[orgId] ?? []).filter(
        (batch) => batch.id !== batchId,
      );
      return json(route, {
        ok: true,
        batch_id: batchId,
        source: "mail",
        deleted_matches: 1,
        deleted_mappings: 0,
      });
    }

    const uploadStartMatch = pathname.match(/^\/api\/upload\/(mail|crm)\/start$/);
    if (uploadStartMatch && method === "POST") {
      const source = uploadStartMatch[1] as "mail" | "crm";
      const orgId = activeOrgId(state);
      const batchId = `${source}-upload-${(Object.keys(state.headersByBatchId).length + 1).toString(10)}`;
      const filename = source === "mail" ? "mail.csv" : "crm.csv";
      ensureUploadMocks(state, batchId, source);
      state.batchesByOrg[orgId] = [
        {
          id: batchId,
          source,
          filename,
          created_at: "2026-03-23T00:00:00Z",
          status: "uploaded",
          raw_count: source === "mail" ? 1500 : 310,
          normalized_count: null,
          deduped_count: null,
        },
        ...(state.batchesByOrg[orgId] ?? []),
      ];
      return json(
        route,
        {
          batch_id: batchId,
          source,
          filename,
        },
        201,
      );
    }

    const headersMatch = pathname.match(/^\/api\/upload\/([^/]+)\/headers$/);
    if (headersMatch && method === "GET") {
      const batchId = decodeURIComponent(headersMatch[1]);
      return json(route, state.headersByBatchId[batchId] ?? {});
    }

    const mappingMatch = pathname.match(/^\/api\/upload\/([^/]+)\/mapping$/);
    if (mappingMatch && method === "GET") {
      const batchId = decodeURIComponent(mappingMatch[1]);
      return json(route, state.mappingByBatchId[batchId] ?? {});
    }

    if (mappingMatch && method === "POST") {
      const batchId = decodeURIComponent(mappingMatch[1]);
      const payload = parseJson(route);
      const current = state.mappingByBatchId[batchId] ?? {};
      state.mappingByBatchId[batchId] = {
        ...current,
        mapping: payload.mapping ?? current.mapping ?? {},
      };
      return noContent(route);
    }

    const normalizeMatch = pathname.match(/^\/api\/upload\/([^/]+)\/normalize$/);
    if (normalizeMatch && method === "POST") {
      const batchId = decodeURIComponent(normalizeMatch[1]);
      state.requestLog.normalizeCalls.push(batchId);
      const response = state.normalizeByBatchId[batchId];
      const orgId = activeOrgId(state);
      const uploadOutcome = state.postUploadRunByOrg[orgId];
      state.runStatusByOrg[orgId] = clone(uploadOutcome.status);
      state.runResultByOrg[orgId] = clone(uploadOutcome.result);
      state.runMatchesByOrg[orgId] = clone(uploadOutcome.matches);
      return json(route, response.body, response.status);
    }

    if (pathname === "/api/runs/latest/status" && method === "GET") {
      const response = state.runStatusByOrg[activeOrgId(state)];
      return response ? json(route, response) : noContent(route);
    }

    if (pathname === "/api/runs/latest/result" && method === "GET") {
      const response = state.runResultByOrg[activeOrgId(state)];
      return response ? json(route, response) : noContent(route);
    }

    if (pathname === "/api/runs/latest/matches" && method === "GET") {
      const response = state.runMatchesByOrg[activeOrgId(state)];
      return response ? json(route, response) : noContent(route);
    }

    if (pathname === "/api/analytics/insights" && method === "GET") {
      return json(route, state.analyticsByOrg[activeOrgId(state)]);
    }

    if (pathname === "/api/analytics/regenerate" && method === "POST") {
      const orgId = activeOrgId(state);
      state.analyticsByOrg[orgId] = clone(state.regeneratedAnalyticsByOrg[orgId]);
      return json(route, state.analyticsByOrg[orgId]);
    }

    if (pathname === "/api/demographics/payload" && method === "GET") {
      const orgId = activeOrgId(state);
      const view = searchParams.get("view") ?? "matches";
      return json(route, state.demographicsByViewByOrg[orgId][view]);
    }

    if (pathname === "/api/geocodes/heatmap" && method === "GET") {
      state.requestLog.heatmapQueries.push({
        start: searchParams.get("start"),
        end: searchParams.get("end"),
        kind: searchParams.get("kind"),
      });
      const response = clone(state.heatmapByOrg[activeOrgId(state)]);
      if (response && response.matched_total == null && Array.isArray(response.points)) {
        response.matched_total = response.points.reduce((sum, point) => {
          const count = Number(point?.event_count ?? 1);
          return sum + (Number.isFinite(count) && count > 0 ? count : 1);
        }, 0);
      }
      return json(route, response);
    }

    if (pathname === "/api/billing/create-portal-session" && method === "POST") {
      return json(route, { url: state.billingPortalUrl });
    }

    if (pathname === "/api/billing/create-checkout-session" && method === "POST") {
      return json(route, { url: "https://checkout.example.test/session" });
    }

    if (pathname === "/api/billing/pause-subscription" && method === "POST") {
      state.requestLog.pauseCalls += 1;
      setBillingState(state, {
        subscription_status: "active",
        is_subscribed: true,
        can_run_matching: true,
        needs_paywall: false,
        plan_code: state.authMe.billing?.plan_code ?? "INSIGHT",
        resume_plan_code: state.authMe.billing?.plan_code ?? "INSIGHT",
        cancel_at_period_end: false,
        pause_at_period_end: true,
        paywall_config: null,
      });
      return json(route, { billing: state.authMe.billing });
    }

    if (pathname === "/api/billing/change-plan" && method === "POST") {
      const payload = parseJson(route);
      const planCode = String(payload.plan_code ?? "INSIGHT").toUpperCase();
      state.requestLog.changePlanCalls.push(planCode);
      setBillingState(state, {
        subscription_status: "active",
        is_subscribed: true,
        can_run_matching: true,
        needs_paywall: false,
        plan_code: planCode,
        resume_plan_code: null,
        cancel_at_period_end: false,
        pause_at_period_end: false,
        paywall_config: null,
      });
      return json(route, { billing: state.authMe.billing });
    }

    if (pathname === "/api/billing/resume-subscription" && method === "POST") {
      state.requestLog.resumeCalls += 1;
      setBillingState(state, {
        subscription_status: "active",
        is_subscribed: true,
        can_run_matching: true,
        needs_paywall: false,
        plan_code: state.authMe.billing?.resume_plan_code ?? state.authMe.billing?.plan_code ?? "INSIGHT",
        resume_plan_code: null,
        cancel_at_period_end: false,
        pause_at_period_end: false,
        paywall_config: null,
      });
      return json(route, { billing: state.authMe.billing });
    }

    if (pathname === "/api/billing/cancel-subscription" && method === "POST") {
      state.requestLog.cancelCalls += 1;
      setBillingState(state, {
        cancel_at_period_end: true,
        pause_at_period_end: false,
      });
      return json(route, { billing: state.authMe.billing });
    }

    if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
      return json(
        route,
        {
          error: "unhandled_mock_request",
          path: pathname,
          method,
        },
        404,
      );
    }

    return route.continue();
  });
}
