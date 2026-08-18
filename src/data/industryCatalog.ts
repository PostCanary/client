// Canonical industry list for first-run, Settings, send gate, and brand kit.
// Stable slugs are the source of truth — do not rename without a migration.

export const INDUSTRY_GROUPS = [
  { id: "home_services", label: "Home services" },
  { id: "health", label: "Health" },
  { id: "food", label: "Food" },
  { id: "property", label: "Property" },
  { id: "auto", label: "Auto" },
  { id: "professional", label: "Professional" },
  { id: "local_other", label: "Local other" },
] as const;

export type IndustryGroupId = (typeof INDUSTRY_GROUPS)[number]["id"];

export type IndustryCatalogEntry = {
  slug: string;
  label: string;
  group: IndustryGroupId | null;
  aliases: readonly string[];
};

export const INDUSTRY_CATALOG = [
  // Home services
  {
    slug: "hvac",
    label: "HVAC",
    group: "home_services",
    aliases: [
      "ac",
      "hvac",
      "heating",
      "air conditioning",
      "heating and cooling",
      "ac repair",
    ],
  },
  {
    slug: "plumbing",
    label: "Plumbing",
    group: "home_services",
    aliases: ["plumber"],
  },
  {
    slug: "roofing",
    label: "Roofing",
    group: "home_services",
    aliases: ["roofer"],
  },
  {
    slug: "electrical",
    label: "Electrical",
    group: "home_services",
    aliases: ["electrician"],
  },
  {
    slug: "cleaning",
    label: "Cleaning",
    group: "home_services",
    aliases: [
      "maid",
      "janitorial",
      "carpet cleaning",
      "house cleaning",
      "pressure washing",
    ],
  },
  {
    slug: "pest_control",
    label: "Pest Control",
    group: "home_services",
    aliases: ["exterminator", "pest control"],
  },
  {
    slug: "landscaping",
    label: "Landscaping",
    group: "home_services",
    aliases: ["lawn", "lawn care", "lawn service"],
  },
  {
    slug: "painting",
    label: "Painting",
    group: "home_services",
    aliases: ["painter"],
  },
  {
    slug: "remodeling",
    label: "Remodeling / GC",
    group: "home_services",
    aliases: ["general contractor", "contractor", "gc"],
  },
  {
    slug: "windows_doors",
    label: "Windows & Doors",
    group: "home_services",
    aliases: ["windows", "doors", "windows and doors"],
  },
  {
    slug: "solar",
    label: "Solar",
    group: "home_services",
    aliases: [],
  },
  {
    slug: "garage_doors",
    label: "Garage Doors",
    group: "home_services",
    aliases: ["garage door"],
  },
  {
    slug: "handyman",
    label: "Handyman",
    group: "home_services",
    aliases: [],
  },

  // Health
  {
    slug: "dental",
    label: "Dental",
    group: "health",
    aliases: ["dentist"],
  },
  {
    slug: "chiropractic",
    label: "Chiropractic",
    group: "health",
    aliases: ["chiropractor"],
  },
  {
    slug: "primary_care",
    label: "Primary Care",
    group: "health",
    aliases: ["doctor", "family medicine"],
  },
  {
    slug: "urgent_care",
    label: "Urgent Care",
    group: "health",
    aliases: [],
  },
  {
    slug: "optometry",
    label: "Optometry",
    group: "health",
    aliases: ["eye doctor"],
  },
  {
    slug: "veterinary",
    label: "Veterinary",
    group: "health",
    aliases: ["vet"],
  },
  {
    slug: "mental_health",
    label: "Mental Health",
    group: "health",
    aliases: ["therapist"],
  },
  {
    slug: "fitness",
    label: "Fitness / Gym",
    group: "health",
    aliases: ["gym"],
  },
  {
    slug: "salon_spa",
    label: "Salon / Spa",
    group: "health",
    aliases: ["salon", "spa"],
  },

  // Food
  {
    slug: "restaurant",
    label: "Restaurant",
    group: "food",
    aliases: [],
  },
  {
    slug: "pizza_qsr",
    label: "Pizza / QSR",
    group: "food",
    aliases: ["pizza", "fast food", "qsr"],
  },
  {
    slug: "cafe_bakery",
    label: "Cafe / Bakery",
    group: "food",
    aliases: ["coffee", "bakery", "cafe"],
  },

  // Property
  {
    slug: "real_estate",
    label: "Real Estate",
    group: "property",
    aliases: ["realtor"],
  },
  {
    slug: "property_management",
    label: "Property Management",
    group: "property",
    aliases: [],
  },
  {
    slug: "mortgage",
    label: "Mortgage",
    group: "property",
    aliases: [],
  },

  // Auto
  {
    slug: "auto_repair",
    label: "Auto Repair",
    group: "auto",
    aliases: ["mechanic"],
  },
  {
    slug: "auto_dealer",
    label: "Auto Dealer",
    group: "auto",
    aliases: ["car dealer"],
  },
  {
    slug: "auto_body",
    label: "Auto Body",
    group: "auto",
    aliases: [],
  },

  // Professional
  {
    slug: "legal",
    label: "Legal",
    group: "professional",
    aliases: ["lawyer", "attorney"],
  },
  {
    slug: "insurance",
    label: "Insurance",
    group: "professional",
    aliases: [],
  },
  {
    slug: "financial_advisor",
    label: "Financial Advisor",
    group: "professional",
    aliases: [],
  },
  {
    slug: "accounting",
    label: "Accounting",
    group: "professional",
    aliases: ["cpa", "bookkeeper"],
  },

  // Local other
  {
    slug: "retail",
    label: "Retail",
    group: "local_other",
    aliases: [],
  },
  {
    slug: "furniture",
    label: "Furniture",
    group: "local_other",
    aliases: [],
  },
  {
    slug: "childcare",
    label: "Childcare",
    group: "local_other",
    aliases: ["daycare"],
  },
  {
    slug: "education",
    label: "Education",
    group: "local_other",
    aliases: [],
  },
  {
    slug: "nonprofit",
    label: "Nonprofit",
    group: "local_other",
    aliases: ["non-profit", "non profit"],
  },

  // Other is not a first-class vertical — required custom text on save.
  {
    slug: "other",
    label: "Other",
    group: null,
    aliases: [],
  },
] as const satisfies readonly IndustryCatalogEntry[];

export type Industry = (typeof INDUSTRY_CATALOG)[number]["slug"];

export const INDUSTRY_LABELS: Record<Industry, string> = Object.fromEntries(
  INDUSTRY_CATALOG.map((entry) => [entry.slug, entry.label]),
) as Record<Industry, string>;

const GROUP_LABELS: Record<IndustryGroupId, string> = Object.fromEntries(
  INDUSTRY_GROUPS.map((group) => [group.id, group.label]),
) as Record<IndustryGroupId, string>;

function normalizeQuery(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

export function industrySearchTerms(entry: IndustryCatalogEntry): string[] {
  const terms = new Set<string>([
    normalizeQuery(entry.slug),
    normalizeQuery(entry.slug.replace(/_/g, " ")),
    normalizeQuery(entry.label),
    ...entry.aliases.map((alias) => normalizeQuery(alias)),
  ]);
  return [...terms].filter(Boolean);
}

export function industryMatchesQuery(
  entry: IndustryCatalogEntry,
  query: string,
): boolean {
  const needle = normalizeQuery(query);
  if (!needle) return true;
  return industrySearchTerms(entry).some((term) => term.includes(needle));
}

export const INDUSTRY_ALIASES: Record<string, Industry> = (() => {
  const aliases: Record<string, Industry> = {};
  for (const entry of INDUSTRY_CATALOG) {
    for (const term of industrySearchTerms(entry)) {
      aliases[term] = entry.slug;
    }
  }
  return aliases;
})();

export type IndustryOptionGroup = {
  id: IndustryGroupId | "other";
  label: string;
  options: Array<(typeof INDUSTRY_CATALOG)[number]>;
};

export function filterIndustryCatalog(query: string): IndustryOptionGroup[] {
  const grouped = new Map<IndustryGroupId | "other", IndustryOptionGroup>();
  const otherEntry = INDUSTRY_CATALOG.find((entry) => entry.slug === "other");

  for (const entry of INDUSTRY_CATALOG) {
    if (entry.slug === "other") continue;
    if (!industryMatchesQuery(entry, query)) continue;
    const id = entry.group ?? "other";
    const label = entry.group ? GROUP_LABELS[entry.group] : "Other";
    const existing = grouped.get(id);
    if (existing) {
      existing.options.push(entry);
    } else {
      grouped.set(id, { id, label, options: [entry] });
    }
  }

  // Always offer Other so unmatched verticals (credit-card/bank mailers)
  // can still be saved with required custom text.
  if (otherEntry) {
    grouped.set("other", { id: "other", label: "Other", options: [otherEntry] });
  }

  const order: Array<IndustryGroupId | "other"> = [
    ...INDUSTRY_GROUPS.map((group) => group.id),
    "other",
  ];
  return order
    .map((id) => grouped.get(id))
    .filter((group): group is IndustryOptionGroup => !!group);
}

export function industryLabel(slug: Industry): string {
  return INDUSTRY_LABELS[slug];
}
