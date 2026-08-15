/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  plugins: [],

  theme: {
    extend: {
      fontFamily: {
        // App default (existing)
        sans: ['"Instrument Sans"', "system-ui", "sans-serif"],

        // --- Brief #6 Phase 2: Curated print font pairings ---
        // Draplin fix — replaces font extraction. We pick the closest pair
        // to the customer's website style instead of trying to license their
        // fonts. All pairings are Google Fonts, commercially licensed for print.
        // Consumed by PostcardFront.vue and PostcardBack.vue via classes like
        // `font-pc-display` and `font-pc-body`.

        // Default: Inter — clean, modern, works for nearly any vertical.
        "pc-display":  ["Inter", '"Instrument Sans"', "system-ui", "sans-serif"],
        "pc-body":     ["Inter", '"Instrument Sans"', "system-ui", "sans-serif"],

        // Trades (HVAC, plumbing, electrical, roofing, landscaping) — bold, masculine.
        "pc-display-trades":  ["Oswald", "Impact", "system-ui", "sans-serif"],
        "pc-body-trades":     ['"Source Sans Pro"', "system-ui", "sans-serif"],

        // Friendly / consumer services (house cleaning, pet care, childcare).
        "pc-display-friendly": ["Montserrat", "system-ui", "sans-serif"],
        "pc-body-friendly":    ['"Open Sans"', "system-ui", "sans-serif"],

        // Brand match (PostCanary-native) — Instrument Sans pairing.
        "pc-display-brand":    ['"Instrument Sans"', "system-ui", "sans-serif"],
        "pc-body-brand":       ['"Instrument Sans"', "system-ui", "sans-serif"],
      },
    },
  },
}