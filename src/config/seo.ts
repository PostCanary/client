export interface RouteSeoData {
  path: string;
  title: string;
  description: string;
}

export const SITE_URL = "https://www.postcanary.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const BRAND_NAME = "PostCanary";

export const marketingRoutes: RouteSeoData[] = [
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

/** Look up SEO data for a given path */
export function getSeoData(path: string): RouteSeoData | undefined {
  return marketingRoutes.find((r) => r.path === path);
}
