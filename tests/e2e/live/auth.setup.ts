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

setup("authenticate against live dev stack", async ({ request, baseURL }) => {
  const origin = (baseURL ?? "http://localhost:8080").replace(/\/+$/, "");
  const csrfRes = await request.get("/auth/csrf-token", {
    headers: { Origin: origin, Referer: `${origin}/app/send` },
  });
  expect(csrfRes.ok(), `csrf-token returned ${csrfRes.status()}`).toBeTruthy();
  const csrf = (await csrfRes.json()).csrf_token as string;

  const loginRes = await request.post("/auth/login-json", {
    data: { email: EMAIL, password: PASSWORD },
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
      Origin: origin,
      Referer: `${origin}/app/send`,
    },
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

  const authedCsrfRes = await request.get("/auth/csrf-token", {
    headers: { Origin: origin, Referer: `${origin}/app/send` },
  });
  expect(authedCsrfRes.ok(), `authed csrf-token returned ${authedCsrfRes.status()}`).toBeTruthy();
  const authedCsrf = (await authedCsrfRes.json()).csrf_token as string;

  const profileRes = await request.patch("/api/users/me", {
    data: {
      full_name: "Drake Demo",
      industry: "hvac",
      website_url: "https://postcanary.com",
      tour_completed: true,
    },
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": authedCsrf,
      Origin: origin,
      Referer: `${origin}/app/send`,
    },
  });
  expect(profileRes.ok(), `api/users/me patch returned ${profileRes.status()}`).toBeTruthy();
  if (me.org_id) {
    const orgRes = await request.patch(`/api/orgs/${me.org_id}`, {
      data: {
        business_name: "Desert Diamond Air",
        location: "123 Main St, Phoenix, AZ 85001",
        service_types: ["AC Repair", "Heating", "Maintenance"],
      },
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": authedCsrf,
        Origin: origin,
        Referer: `${origin}/app/send`,
      },
    });
    expect(orgRes.ok(), `api/orgs patch returned ${orgRes.status()}`).toBeTruthy();
  }
  const existingBrandKitRes = await request.get("/api/brand-kit");
  expect(
    existingBrandKitRes.ok(),
    `api/brand-kit get returned ${existingBrandKitRes.status()}`,
  ).toBeTruthy();
  const brandKitRes = await request.put("/api/brand-kit", {
    data: {
      businessName: "Desert Diamond Air",
      location: "Phoenix, AZ",
      address: "123 Main St, Phoenix, AZ 85001",
      phone: "(602) 555-0199",
      websiteUrl: "https://postcanary.com",
      logoUrl: "/media/brand-photos/postcanary-logo.png",
      logoQualityScore: 0.95,
      brandColors: ["#47bfa9", "#0b2d50", "#f5a623"],
      photos: [
        {
          url: "/media/brand-photos/hvac-hero.jpg",
          alt: "HVAC technician servicing an outdoor condenser",
          source: "manual",
          qualityScore: 0.95,
          printReady: true,
        },
        {
          url: "/media/brand-photos/hvac-seasonal.png",
          alt: "Seasonal HVAC service reminder graphic",
          source: "manual",
          qualityScore: 0.9,
          printReady: true,
        },
      ],
      industry: "hvac",
      serviceTypes: ["AC Repair", "Heating", "Maintenance"],
      certifications: ["Licensed & Insured"],
      currentOffers: ["$79 seasonal tune-up"],
      guarantees: ["100% satisfaction guaranteed"],
      yearsInBusiness: 12,
      googleRating: 4.8,
      reviewCount: 147,
    },
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": authedCsrf,
      Origin: origin,
      Referer: `${origin}/app/send`,
    },
  });
  expect(brandKitRes.ok(), `api/brand-kit put returned ${brandKitRes.status()}`).toBeTruthy();

  // Seed demo reviews ONLY when absent — this setup runs before every live
  // suite, and unconditional posts duplicated the same two reviews dozens
  // of times in drake's brand kit (S73 cleanup pass removed 69 copies).
  const existingBk = await request
    .get("/api/brand-kit")
    .then((r) => r.json())
    .catch(() => ({}));
  const existingQuotes = new Set(
    (existingBk?.data?.reviews ?? []).map((r: any) => r.quote ?? ""),
  );
  for (const review of [
    {
      review_text:
        "Desert Diamond Air showed up on time, explained the repair clearly, and had our AC running before dinner.",
      reviewer_name: "Maria S.",
      rating: 5,
    },
    {
      review_text:
        "The maintenance visit was fast and professional. Our upstairs rooms finally feel comfortable again.",
      reviewer_name: "James R.",
      rating: 5,
    },
  ]) {
    if (existingQuotes.has(review.review_text)) continue;
    const reviewRes = await request.post("/api/brand-kit/reviews", {
      data: review,
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": authedCsrf,
        Origin: origin,
        Referer: `${origin}/app/send`,
      },
    });
    expect(reviewRes.ok(), `api/brand-kit/reviews returned ${reviewRes.status()}`).toBeTruthy();
  }

  await request.storageState({ path: AUTH_FILE });
});
