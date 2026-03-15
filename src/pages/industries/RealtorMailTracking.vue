<!-- src/pages/industries/RealtorMailTracking.vue -->
<script setup lang="ts">
import HomeVisualize from "@/components/home/HomeVisualize.vue";
import HomeHowItWorks from "@/components/home/HomeHowItWorks.vue";
import HomePricing from "@/components/home/HomePricing.vue";
import IndustryHero from "@/components/industry/IndustryHero.vue";
import IndustryPainPoints from "@/components/industry/IndustryPainPoints.vue";
import IndustryFAQ from "@/components/industry/IndustryFAQ.vue";
import IndustryTestimonials from "@/components/industry/IndustryTestimonials.vue";

import qrIcon from "@/assets/home/qr-code-icon.svg?url";
import wastedAdIcon from "@/assets/home/cash-burn-icon.svg?url";
import spreadsheetsIcon from "@/assets/home/spreadsheet-icon.svg?url";
import noAttributionIcon from "@/assets/home/network-icon.svg?url";

import type {
  IndustryHeroContent,
  IndustryPainPointsContent,
  IndustryFAQContent,
} from "@/types/industry";

const heroContent: IndustryHeroContent = {
  headline: "Prove Which Mailers Actually Generate Listings",
  subheadline:
    "Direct mail delivers 112% ROI and 92% of millennials have made decisions based on it—but only if you can prove which farms convert. PostCanary connects your closings to the mailers that drove them.",
  steps: {
    step1: "Sign Up / Login",
    step2: "Upload Mail & Clients",
    step3: "See Your Real ROI",
  },
};

const painPointsContent: IndustryPainPointsContent = {
  heading: "Real Estate Direct Mail ROI Is Invisible. Until Now.",
  subheading:
    "Direct mail has a 91% open rate and recipients keep mailers for 17 days—but without attribution, you can't prove which farms actually convert.",
  cards: [
    {
      icon: qrIcon,
      iconAlt: "QR code tracking problems",
      title: "QR Codes Don't Work",
      body: "Homeowners don't scan QR codes—they Google your name or call directly. 70% feel direct mail is more personal than digital, but they respond on their terms.",
    },
    {
      icon: wastedAdIcon,
      iconAlt: "Wasted marketing spend",
      title: "Budget Black Holes",
      body: "You send Just Listed and Just Sold cards monthly, but can't prove which farms turn into listing appointments. 51% of recipients share mail with others—are you capturing that reach?",
    },
    {
      icon: spreadsheetsIcon,
      iconAlt: "Manual spreadsheet matching",
      title: "Excel Nightmares",
      body: "Manually matching client addresses to mail lists takes hours and still misses most connections. Real estate has long sales cycles—by closing, you've forgotten which mailer started it.",
    },
    {
      icon: noAttributionIcon,
      iconAlt: "No attribution visibility",
      title: "No Clear Attribution",
      body: "Follow Up Boss shows closings. Your mail house shows deliveries. Nothing connects them—so you can't prove that geographic farm generated $45k in GCI.",
    },
  ],
};

const faqContent: IndustryFAQContent = {
  heading: "Real Estate Mail Tracking FAQs",
  faqs: [
    {
      question: "How does PostCanary work with my real estate CRM?",
      answer:
        "Export your clients from Follow Up Boss, kvCORE, or any CRM as a CSV. Upload it alongside your mail list, and we match every client address to the mailers you sent. No integration required—just two CSV files.",
    },
    {
      question: "What if leads don't use the QR code or promo code?",
      answer:
        "That's exactly why PostCanary exists. We match by physical address, not tracking codes. If they received a mailer and became a client, we'll find the connection—even if they Googled you or called your office directly.",
    },
    {
      question: "How accurate is the address matching?",
      answer:
        "Our normalization handles variations like 'Ave' vs 'Avenue', unit numbers, and common data entry differences. With clean address data, you'll see 95%+ match accuracy.",
    },
    {
      question: "Can I see which farm areas perform best?",
      answer:
        "Yes. PostCanary shows conversion rates and GCI by zip code, neighborhood, and mailing route so you can double down on farms that convert and cut spend on areas that don't respond.",
    },
    {
      question: "How long before I see results?",
      answer:
        "Upload takes 2 minutes. Matching completes in seconds. You'll have your full ROI report with commission attribution immediately—no waiting days or weeks.",
    },
    {
      question: "Does this work for all types of real estate mailings?",
      answer:
        "Absolutely. If the client address matches a mailed address, we attribute it—whether it's from Just Listed cards, Just Sold cards, market updates, geographic farming, or handwritten note campaigns.",
    },
    {
      question: "What ROI can agents expect from direct mail?",
      answer:
        "Industry data shows direct mail delivers 112% ROI when properly tracked. With 91% open rates and mail kept in homes for 17 days on average, the opportunity is massive—you just need to prove which campaigns actually convert.",
    },
    {
      question: "How does direct mail compare to digital for real estate?",
      answer:
        "Direct mail response rates are 3-9% compared to 0.6% for email. Plus, 82% of millennials trust print ads and 92% have made purchasing decisions based on direct mail. When combined with digital follow-up, campaigns see a 118% lift in response rates.",
    },
  ],
};
</script>

<template>
  <div>
    <IndustryHero :content="heroContent" />
    <IndustryPainPoints :content="painPointsContent" />
    <HomeVisualize />
    <HomeHowItWorks />
    <IndustryTestimonials />
    <HomePricing />
    <IndustryFAQ :content="faqContent" />
  </div>
</template>
