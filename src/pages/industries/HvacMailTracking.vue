<!-- src/pages/industries/HvacMailTracking.vue -->
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
  headline: "HVAC Mail Attribution That Actually Works",
  subheadline:
    "Direct mail has a 37% open rate for HVAC companies—but 60% of homeowners who respond never scan a QR code. PostCanary matches every job to the exact mailer sent, so you see your true ROI.",
  steps: {
    step1: "Sign Up / Login",
    step2: "Upload Mail & Jobs",
    step3: "See Your Real ROI",
  },
};

const painPointsContent: IndustryPainPointsContent = {
  heading: "HVAC Direct Mail ROI Is a Mystery. Until Now.",
  subheading:
    "85% of marketers say direct mail delivers the best conversion rates—but only if you can prove which campaigns actually work.",
  cards: [
    {
      icon: qrIcon,
      iconAlt: "QR code tracking problems",
      title: "QR Codes Don't Work",
      body: "Only 9% of mailers include QR codes—and fewer homeowners scan them. When the AC breaks, they call or Google. You're missing 70-90% of conversions.",
    },
    {
      icon: wastedAdIcon,
      iconAlt: "Wasted marketing spend",
      title: "Budget Black Holes",
      body: "HVAC companies spend thousands on seasonal mailers but can't prove which zip codes convert. Without attribution, you're guessing where to double down.",
    },
    {
      icon: spreadsheetsIcon,
      iconAlt: "Manual spreadsheet matching",
      title: "Excel Nightmares",
      body: "Manually matching job addresses to mail lists takes hours and still misses most matches. 'Ave' vs 'Avenue' alone breaks your spreadsheet formulas.",
    },
    {
      icon: noAttributionIcon,
      iconAlt: "No attribution visibility",
      title: "No Clear Attribution",
      body: "ServiceTitan shows completed jobs. Your mail house shows deliveries. Nothing connects them—so you can't prove that $79 tune-up mailer paid off.",
    },
  ],
};

const faqContent: IndustryFAQContent = {
  heading: "HVAC Mail Tracking FAQs",
  faqs: [
    {
      question: "How does PostCanary work with ServiceTitan or Housecall Pro?",
      answer:
        "Export your completed jobs from ServiceTitan, Housecall Pro, or any CRM as a CSV. Upload it alongside your mail list, and we match every job address to the mailers you sent. No integration required—just two CSV files.",
    },
    {
      question: "What if customers don't use the QR code or promo code?",
      answer:
        "That's exactly why PostCanary exists. Studies show only 9% of mailers even include QR codes, and most homeowners skip them entirely. We match by physical address—if they received a mailer and became a customer, we'll find the connection.",
    },
    {
      question: "How accurate is the address matching?",
      answer:
        "Our normalization handles variations like 'Ave' vs 'Avenue', unit numbers, and common data entry differences. With clean address data, you'll see 95%+ match accuracy.",
    },
    {
      question: "Can I see which zip codes perform best?",
      answer:
        "Yes. PostCanary shows conversion rates and revenue by zip code, city, and mailing route. Know exactly which neighborhoods respond to your spring AC tune-up offers vs. fall furnace campaigns.",
    },
    {
      question: "How long before I see results?",
      answer:
        "Upload takes 2 minutes. Matching completes in seconds. You'll have your full ROI report with revenue attribution immediately—no waiting days or weeks.",
    },
    {
      question: "Does this work for seasonal campaigns?",
      answer:
        "Absolutely. Track performance across all campaign types—spring AC tune-ups, fall furnace checks, emergency repair offers, maintenance reminders, and new customer acquisition mailers.",
    },
    {
      question: "What ROI can I expect from direct mail?",
      answer:
        "Industry data shows direct mail delivers $42 ROI for every $1 spent when properly tracked. The key is knowing which campaigns and neighborhoods actually convert—that's what PostCanary reveals.",
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
