/**
 * generate-seo-pages.mjs
 *
 * Run after `vite build` to generate per-route HTML files with correct
 * meta tags for SEO, plus robots.txt and sitemap.xml.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const SITE_URL = "https://www.postcanary.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const DIST = join(dirname(new URL(import.meta.url).pathname), "..", "dist");

/** Same data as src/config/seo.ts — duplicated here to avoid TS compilation in the build script */
const marketingRoutes = [
  {
    path: "/",
    title: "Direct Mail Analytics & Tracking - Direct Mail ROI - PostCanary",
    description:
      "See how your direct mail really performs. PostCanary tracks ROI, conversions & attribution beyond QR codes capturing the 70-90% other tracking tools miss.",
  },
  {
    path: "/attribution-gap-calculator",
    title: "Direct Mail Attribution Gap Calculator | Free Tool",
    description:
      "See how much revenue your direct mail is missing. Most QR codes track under 10% of conversions. Calculate your real attribution gap in 60 seconds.",
  },
  {
    path: "/direct-mail-roi-calculator",
    title: "Direct Mail ROI Calculator | Free Tool - PostCanary",
    description:
      "Calculate your real direct mail ROI, not just what QR codes track. Input your mail volume and see the gap between tracked and actual campaign performance.",
  },
  {
    path: "/savings-calculator",
    title: "Direct Mail Tracking Savings Calculator | PostCanary",
    description:
      "See how much time and money you waste matching addresses in Excel. Calculate your savings with automated direct mail matchback tracking. Free calculator.",
  },
  {
    path: "/hvac-direct-mail-tracking",
    title: "HVAC Direct Mail Tracking | Prove Your Mail ROI",
    description:
      "Track which HVAC mailers actually drive service calls. Match mailed addresses to booked jobs automatically, no QR codes needed. See real campaign ROI.",
  },
  {
    path: "/plumbing-direct-mail-tracking",
    title: "Plumbing Direct Mail Tracking | Prove Your Mail ROI",
    description:
      "Track which mailers drive plumbing jobs. Match mailed addresses to service calls automatically without QR codes. See your real direct mail ROI.",
  },
  {
    path: "/real-estate-direct-mail-tracking",
    title: "Real Estate Direct Mail Tracking | Prove Farming ROI",
    description:
      "Track which Just Listed and farming postcards generate listings and closings. Match mailed addresses to clients automatically. No QR codes needed.",
  },
  {
    path: "/home-services-direct-mail-tracking",
    title: "Home Services Direct Mail Tracking | Prove Your Mail ROI - PostCanary",
    description:
      "Track which mailers drive jobs for roofers, HVAC, plumbers & home service companies. Match mailed addresses to booked jobs automatically. No QR codes needed.",
  },
  {
    path: "/terms",
    title: "Terms of Service - PostCanary",
    description: "",
  },
  {
    path: "/privacy",
    title: "Privacy Policy - PostCanary",
    description: "",
  },
  {
    path: "/help",
    title: "Help - PostCanary",
    description: "",
  },
];

// ---------------------------------------------------------------------------
// 1. Generate per-route HTML files
// ---------------------------------------------------------------------------

const template = readFileSync(join(DIST, "index.html"), "utf-8");

for (const route of marketingRoutes) {
  const url = `${SITE_URL}${route.path}`;
  let html = template;

  // Title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(route.description)}" />`
  );

  // Canonical
  html = html.replace(
    /<link rel="canonical" id="canonical-url" href="[^"]*" \/>/,
    `<link rel="canonical" id="canonical-url" href="${url}" />`
  );

  // OG tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeAttr(route.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeAttr(route.description)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${url}" />`
  );

  // Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`
  );

  // Write file
  if (route.path === "/") {
    writeFileSync(join(DIST, "index.html"), html);
  } else {
    const filePath = join(DIST, `${route.path.slice(1)}.html`);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, html);
  }

  console.log(`  SEO ✓ ${route.path}`);
}

// ---------------------------------------------------------------------------
// 2. Generate robots.txt
// ---------------------------------------------------------------------------

const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml

Disallow: /app/
Disallow: /dashboard
Disallow: /settings
Disallow: /history
Disallow: /demographics
Disallow: /analytics
Disallow: /map
`;

writeFileSync(join(DIST, "robots.txt"), robotsTxt);
console.log("  SEO ✓ robots.txt");

// ---------------------------------------------------------------------------
// 3. Generate sitemap.xml
// ---------------------------------------------------------------------------

const today = new Date().toISOString().split("T")[0];

const sitemapEntries = marketingRoutes
  .filter((r) => r.description) // skip pages with no description (terms, privacy, help)
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${r.path === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

writeFileSync(join(DIST, "sitemap.xml"), sitemapXml);
console.log("  SEO ✓ sitemap.xml");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
