export const BRAND = {
  name: "PostCanary",
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

  /** Logo file paths (POS-220 web-ready assets). Wordmark is pre-rendered — never recreate as text. */
  logo: {
    primary: "/src/assets/brand/logo-hz-800.png",
    horizontal: "/src/assets/brand/logo-hz-800.png",
    horizontal2x: "/src/assets/brand/logo-hz-2000.png",
    vertical: "/src/assets/brand/logo-vt-800.png",
    dark: "/src/assets/brand/logo-webheader-dark.png",
    mark: "/src/assets/brand/mark-512.png",
    svg: "/src/assets/logo.svg",
  },

  /** Brand colors */
  colors: {
    navy: "#1C2430",
    canary: "#FACF41",
    tealBrand: "#26AFA3",
    primaryDark: "#1C2430",
    primaryAccent: "#26AFA3",
    primaryAccentHover: "#1F9A8F",
    background: "#E4E9EF",
    lightBackground: "#F7F9FB",
    white: "#ffffff",
    black: "#000000",
    textDark: "#1C2430",
    textSecondary: "#5A6B7D",
    textBody: "#3D4A5C",
    textMuted: "#8A97A8",
    borderLight: "#C8D0DB",
    borderMedium: "#B8C2D0",
    scrollbarTrack: "#e2e8f0",
    scrollbarThumb: "#cbd5f5",
  },

  /** Typography */
  typography: {
    fontFamily: '"Instrument Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontDisplay: '"Oswald", system-ui, sans-serif',
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
    demo: "https://calendly.com/postcanary-sales",
  },

  /** Legal footer text template */
  legal: {
    copyright: (year: number) => `© ${year} PostCanary LLC. All rights reserved`,
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
