// src/data/marketing.ts
// Single source of truth for marketing feature copy. The homepage sections and
// the /features/* detail pages both render from here so copy never drifts.

export interface MarketingAccordionItem {
  title: string;
  body: string;
}

export interface MarketingFeature {
  /** URL slug used for the /features/<slug> route and homepage anchor. */
  slug: "eddm" | "targeted-mail" | "analytics";
  /** Homepage anchor id (kept stable for existing e2e + nav links). */
  anchorId: string;
  title: string;
  /** One-line section subheading on the homepage. */
  tagline: string;
  /** Card blurb in the Features grid. */
  cardBlurb: string;
  /** CTA button label. */
  ctaLabel: string;
  /** Accordion items (shared by homepage section and feature page). */
  items: MarketingAccordionItem[];
  /** Expanded use-cases shown only on the /features/<slug> detail page. */
  useCases: { title: string; body: string }[];
  /** SEO meta for the detail page. */
  seo: { title: string; description: string };
}

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    slug: "eddm",
    anchorId: "eddm",
    title: "EDDM",
    tagline: "This strategy is best when anyone can be your customer.",
    cardBlurb:
      "Hit every address on a chosen mail route — regardless of who lives there. Lower price per mailer with high volume of mail sent.",
    ctaLabel: "Send EDDM",
    items: [
      {
        title: "What is EDDM?",
        body: 'EDDM stands for "Every Door Direct Mail". This means your mail will go in every mailbox on a particular route(s) regardless of who is living in that home. You may get someone renting an apartment, a single-family homeowner or even a business. EDDM is a 6.25" x 9" mail piece and does not display the recipient\'s name on the mailer but rather something like "current resident" or similar.',
      },
      {
        title: "Why use EDDM?",
        body: "EDDM is a great supplement to Direct Mail. If you aren't yet sure who your customer is, EDDM casts a wide net. If your business is new to the area and you want to introduce yourself to everyone in the neighborhood, or if anyone could be your customer.",
      },
      {
        title: "How does EDDM work?",
        body: "EDDM works by selecting specific mail routes to deliver your mail to. A single ZIP code can have multiple mail routes. As the postal worker goes through their route they will leave a piece of mail in every resident's mailbox on that route. You don't have to do every route in a ZIP code but can select specific routes within a ZIP code.",
      },
    ],
    useCases: [
      {
        title: "New to the neighborhood",
        body: "Introduce your business to every household around you. EDDM blankets the routes you choose so no potential customer is missed.",
      },
      {
        title: "Broad-appeal offers",
        body: "Restaurants, retail, home services — when nearly anyone could buy, saturation beats targeting and the per-piece cost stays low.",
      },
      {
        title: "Awareness before targeting",
        body: "Not sure who your customer is yet? Cast a wide net with EDDM, read the response data, then narrow to Targeted Mail.",
      },
    ],
    seo: {
      title: "EDDM Every Door Direct Mail | PostCanary",
      description:
        "Send Every Door Direct Mail to entire mail routes and track every response. Lower per-piece cost, full attribution, no subscriber list required.",
    },
  },
  {
    slug: "targeted-mail",
    anchorId: "targeted-mail",
    title: "Targeted Mail",
    tagline:
      "This strategy is great for targeting residents who match your customer profile.",
    cardBlurb:
      "Hit individual residences based on specific customer demographics. Higher price per mailer with high intent recipients.",
    ctaLabel: "Send Mail",
    items: [
      {
        title: "What is Direct Mail?",
        body: "Direct Mail is targeted mail based on criteria you set for your customer. This could be age, income, sex, home value and other variables that fit your customer profile. This strategy is similar to digital ads that target customers based on specific demographic characteristics. Direct mail pieces are 6\" x 9\" and includes the recipient's name and address on the card.",
      },
      {
        title: "Why use Direct Mail?",
        body: "Direct Mail works best when you know your customer's profile. Using filters you can target your specific customer, skipping those who don't fit your customer profile. Although each piece of mail costs a little more than EDDM (for the targeting data) you end up sending less overall mail as you do not hit every door on a mail route.",
      },
      {
        title: "How does Direct Mail work?",
        body: "Once you've identified what geographic area you want to target you can use a variety of filters to narrow down which households in that area will actually receive your mail. This also allows you to get specific with your offer and call to action.",
      },
    ],
    useCases: [
      {
        title: "Known customer profile",
        body: "Filter by age, income, home value and more so only households that match your best customers receive your piece.",
      },
      {
        title: "Higher-intent offers",
        body: "Send less mail, get more response. Targeted pieces cost a bit more but reach people far more likely to convert.",
      },
      {
        title: "Specific calls to action",
        body: "When you know exactly who you're talking to, you can tailor the offer, the deal, and the message to that audience.",
      },
    ],
    seo: {
      title: "Targeted Direct Mail by Demographics | PostCanary",
      description:
        "Target direct mail by age, income, home value and more. Reach high-intent households, skip the rest, and track every conversion back to the piece.",
    },
  },
  {
    slug: "analytics",
    anchorId: "analytics",
    title: "Analytics",
    tagline:
      "Our analytics can track every campaign, conversion, attribution and other important KPIs to guide and report on your direct mail performance.",
    cardBlurb:
      "Track every mail send and every conversion to guide your marketing decisions.",
    ctaLabel: "Track Results",
    items: [
      {
        title: "Dashboard KPIs",
        body: "The dashboard displays your match rate, revenue from mail, total customers, revenue per mailer, days to convert and much more.",
      },
      {
        title: "Analysis",
        body: "AI reviews the results of your analytics and gives you all of the best insight to set you up for success in your subsequent mail campaigns. Where to target, what deals to run, who to target, how frequently to target and more.",
      },
      {
        title: "Audience",
        body: 'AI reviews your results and breaks down who converted based on a variety of demographics. Where "Analysis" guides you in building a campaign, "Audience" will tell you who to send it to.',
      },
      {
        title: "Heat Map",
        body: "The interactive heat map will show you where exactly your customers are on a map. This can give you visual insight into areas missed, areas saturated or areas to double down in to better guide your next campaign.",
      },
    ],
    useCases: [
      {
        title: "Prove ROI on every send",
        body: "Match conversions back to the exact mailer, route, and campaign so you know which sends actually paid off.",
      },
      {
        title: "Optimize the next campaign",
        body: "AI-driven analysis tells you where to target, what to offer, and how often to mail for better results each time.",
      },
      {
        title: "See your customers on a map",
        body: "The heat map reveals saturated areas, missed pockets, and where to double down — visually.",
      },
    ],
    seo: {
      title: "Direct Mail Analytics & Attribution | PostCanary",
      description:
        "Track match rate, revenue per mailer, and days to convert. AI analysis, audience breakdowns, and a heat map show exactly how your mail performs.",
    },
  },
];

export function getFeatureBySlug(
  slug: string,
): MarketingFeature | undefined {
  return MARKETING_FEATURES.find((f) => f.slug === slug);
}
