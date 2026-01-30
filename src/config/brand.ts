export const BRAND = {
  name: "Postcanary",
  legalEntity: "PostCanary LLC",
  currentYear: new Date().getFullYear(),
  domain: {
    primary: "postcanary.com",
    www: "www.postcanary.com",
    frontend: "https://postcanary.com"
  },

  /** Email addresses */
  email: {
    support: "support@postcanary.com",
    billing: "accounting@postcanary.com",
  },

  /** Logo file paths */
  logo: {
    primary: "/src/assets/source-logo-02.png",
    svg: "/src/assets/logo.svg",
  },

  /** Brand colors */
  colors: {
    primaryDark: "#0b2d50",
    primaryAccent: "#47bfa9",
    primaryAccentHover: "#3aa893",
    background: "#f4f5f7",
    lightBackground: "#f6f5f9",
    white: "#ffffff",
    black: "#000000",
    textDark: "#0c2d50",
    textSecondary: "#64748b",
    textBody: "#475569",
    textMuted: "#94a3b8",
    borderLight: "#e2e8f0",
    borderMedium: "#dde3ea",
    scrollbarTrack: "#e2e8f0",
    scrollbarThumb: "#cbd5f5",
  },

  /** Typography */
  typography: {
    fontFamily: '"Instrument Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  /** Social media */
  social: {
    linkedin: {
      url: "https://www.linkedin.com/company/postcanary/",
      icon: "/src/assets/home/linkedin-icon.svg",
      ariaLabel: "PostCanary on LinkedIn",
    },
  },

  /** External links */
  links: {
    demo: "https://calendly.com/dustin-postcanary",
  },

  /** Legal footer text template */
  legal: {
    copyright: (year: number) => `© ${year} Postcanary LLC. All rights reserved`,
  },
} as const;


export function getCopyrightText(): string {
  return BRAND.legal.copyright(BRAND.currentYear);
}


export function getSupportEmailLink(): string {
  return `mailto:${BRAND.email.support}`;
}

export function getBillingEmailLink(): string {
  return `mailto:${BRAND.email.billing}`;
}
