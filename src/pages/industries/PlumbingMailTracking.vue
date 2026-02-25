<!-- src/pages/industries/PlumbingMailTracking.vue -->
<script setup lang="ts">
import HomeVisualize from "@/components/home/HomeVisualize.vue";
import HomeHowItWorks from "@/components/home/HomeHowItWorks.vue";
import HomePricing from "@/components/home/HomePricing.vue";
import HomeFooter from "@/components/home/HomeFooter.vue";

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
  headline: "Know Exactly Which Mailers Drive Your Plumbing Calls",
  subheadline:
    "One plumbing company generated $753k in revenue at 7x ROI from direct mail—because they could prove what worked. PostCanary gives you that same visibility.",
  steps: {
    step1: "Sign Up / Login",
    step2: "Upload Mail & Jobs",
    step3: "See Your Real ROI",
  },
};

const painPointsContent: IndustryPainPointsContent = {
  heading: "Plumbing Direct Mail ROI Is a Guessing Game. Until Now.",
  subheading:
    "Direct mail can reduce your cost per lead by 250%—but only if you know which campaigns actually convert.",
  cards: [
    {
      icon: qrIcon,
      iconAlt: "QR code tracking problems",
      title: "QR Codes Don't Work",
      body: "When a pipe bursts, homeowners call—they don't scan codes. 71% of people read mail the day it arrives, but they respond by phone, not QR.",
    },
    {
      icon: wastedAdIcon,
      iconAlt: "Wasted marketing spend",
      title: "Budget Black Holes",
      body: "Without attribution, you're paying $300 per lead instead of $120. The difference? Knowing which neighborhoods with older homes actually convert.",
    },
    {
      icon: spreadsheetsIcon,
      iconAlt: "Manual spreadsheet matching",
      title: "Excel Nightmares",
      body: "Manually matching job addresses to mail lists takes hours and still misses most connections. One plumber got more leads in 3 months with proper tracking than a full year without it.",
    },
    {
      icon: noAttributionIcon,
      iconAlt: "No attribution visibility",
      title: "No Clear Attribution",
      body: "Your CRM shows completed jobs. Your mail house shows deliveries. Nothing connects them—so you can't prove that drain cleaning special drove $50k in revenue.",
    },
  ],
};

const faqContent: IndustryFAQContent = {
  heading: "Plumbing Mail Tracking FAQs",
  faqs: [
    {
      question: "How does PostCanary work with my plumbing CRM?",
      answer:
        "Export your completed jobs from ServiceTitan, Housecall Pro, or any CRM as a CSV. Upload it alongside your mail list, and we match every job address to the mailers you sent. No integration required—just two CSV files.",
    },
    {
      question: "What if customers don't use the QR code or promo code?",
      answer:
        "That's exactly why PostCanary exists. We match by physical address, not tracking codes. If they received a mailer and called you for service, we'll find the connection—even if they Googled you or called directly.",
    },
    {
      question: "How accurate is the address matching?",
      answer:
        "Our normalization handles variations like 'Ave' vs 'Avenue', unit numbers, and common data entry differences. With clean address data, you'll see 95%+ match accuracy.",
    },
    {
      question: "Can I see which zip codes perform best?",
      answer:
        "Yes. PostCanary shows conversion rates and revenue by zip code, city, and mailing route so you can focus on neighborhoods with older homes and plumbing systems that need your services most.",
    },
    {
      question: "How long before I see results?",
      answer:
        "Upload takes 2 minutes. Matching completes in seconds. You'll have your full ROI report with revenue attribution immediately—no waiting days or weeks.",
    },
    {
      question: "Does this work for all plumbing services?",
      answer:
        "Absolutely. If the job address matches a mailed address, we attribute it—whether it's a drain cleaning, water heater install, repipe, or emergency repair.",
    },
    {
      question: "What kind of ROI can plumbers expect from direct mail?",
      answer:
        "With proper tracking, plumbing companies have seen 7x ROI on direct mail campaigns. One company reduced their cost per lead from $300 to $120—a 250% improvement—simply by knowing which campaigns worked.",
    },
    {
      question: "Which neighborhoods should I target?",
      answer:
        "PostCanary helps you identify high-performing areas. Generally, neighborhoods with older homes (12+ years) have more plumbing issues. Target high homeownership rates, not rentals, and double down on zip codes where you've already had success.",
    },
  ],
};
</script>

<template>
  <div class="min-h-screen">
    <IndustryHero :content="heroContent" />
    <IndustryPainPoints :content="painPointsContent" />
    <HomeVisualize />
    <HomeHowItWorks />
    <IndustryTestimonials />
    <HomePricing />
    <IndustryFAQ :content="faqContent" />
    <HomeFooter />
  </div>
</template>
