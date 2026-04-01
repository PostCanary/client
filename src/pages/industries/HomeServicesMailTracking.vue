<!-- src/pages/industries/HomeServicesMailTracking.vue -->
<script setup lang="ts">
import HomeVisualize from "@/components/home/HomeVisualize.vue";
import HomeHowItWorks from "@/components/home/HomeHowItWorks.vue";
import HomePricing from "@/components/home/HomePricing.vue";
import IndustryHero from "@/components/industry/IndustryHero.vue";
import IndustryPainPoints from "@/components/industry/IndustryPainPoints.vue";
import IndustryFAQ from "@/components/industry/IndustryFAQ.vue";
import IndustryTestimonials from "@/components/industry/IndustryTestimonials.vue";
import PromoBanner from "@/components/marketing/PromoBanner.vue";

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
  headline: "Know Exactly Which Mailers Drive Your Service Calls",
  subheadline:
    "If your business sends direct mail, PostCanary shows you which pieces actually generate jobs. Works with your current mail provider. No switching. No QR codes. Just real attribution.",
  steps: {
    step1: "Sign Up / Login",
    step2: "Upload Mail & Jobs",
    step3: "See Your Real ROI in Minutes",
  },
};

const painPointsContent: IndustryPainPointsContent = {
  heading: "Is Your Mail Working? Now You'll Know.",
  subheading:
    "Home service companies spend thousands on direct mail every month—but without real attribution, you're flying blind on what's working.",
  cards: [
    {
      icon: qrIcon,
      iconAlt: "QR code tracking problems",
      title: "QR Codes Miss Most Jobs",
      body: "When a pipe bursts or the AC dies, nobody scans a QR code. They call the number or Google your name. You're missing 70–90% of the jobs your mail actually drives.",
    },
    {
      icon: wastedAdIcon,
      iconAlt: "Wasted marketing spend",
      title: "Spending Without Proof",
      body: "You're mailing thousands of pieces a month across zip codes and routes, but you can't tell which neighborhoods actually convert. Every untracked campaign is a budget gamble.",
    },
    {
      icon: spreadsheetsIcon,
      iconAlt: "Manual spreadsheet matching",
      title: "Spreadsheet Matching Is Broken",
      body: "Manually cross-referencing job addresses against mail lists takes hours and still misses most matches. One typo or 'St' vs 'Street' and the connection is lost.",
    },
    {
      icon: noAttributionIcon,
      iconAlt: "No attribution visibility",
      title: "CRM and Mail Data Don't Talk",
      body: "Your CRM shows completed jobs. Your mail house shows deliveries. Nothing connects them—so you can't prove which campaigns actually pay for themselves.",
    },
  ],
};

const faqContent: IndustryFAQContent = {
  heading: "Home Services Mail Tracking FAQs",
  faqs: [
    {
      question: "Which home service trades does PostCanary work for?",
      answer:
        "PostCanary works for any trade that sends direct mail and tracks jobs by address—roofing, HVAC, plumbing, electrical, pest control, landscaping, painting, cleaning, and more. If you have a mailing list and a job list, we can match them.",
    },
    {
      question: "Do I need to switch my mail provider?",
      answer:
        "No. PostCanary works alongside your existing mail vendor—whether that's a local print shop, a national mail house, or an in-house operation. No integrations, no switching. Just export your mail list as a CSV and upload it.",
    },
    {
      question: "How does it work with my CRM?",
      answer:
        "Export your completed jobs from ServiceTitan, Housecall Pro, Jobber, or any CRM as a CSV. Upload it alongside your mail list, and PostCanary matches every job address to the mailers you sent. No API integration required—just two CSV files.",
    },
    {
      question: "How accurate is the address matching?",
      answer:
        "Our normalization handles variations like 'Ave' vs 'Avenue', unit numbers, and common data entry differences. With clean address data, you'll see 95%+ match accuracy.",
    },
    {
      question: "How long does it take to see results?",
      answer:
        "Upload takes 2 minutes. Matching completes in seconds. You'll have your full ROI report with revenue attribution immediately—no waiting days or weeks.",
    },
    {
      question: "What ROI can I expect from tracked direct mail?",
      answer:
        "Industry data shows direct mail delivers $42 ROI for every $1 spent when properly tracked. The key is knowing which campaigns and neighborhoods actually convert—that's what PostCanary reveals so you can double down on what works.",
    },
    {
      question: "What is the unlimited uploads offer?",
      answer:
        "New accounts get unlimited mail list uploads for the first 30 days—no volume caps, no overage fees. Upload as many campaigns as you want while you evaluate PostCanary with your real data. After 30 days, standard plan limits apply.",
    },
  ],
};
</script>

<template>
  <div>
    <IndustryHero :content="heroContent" />
    <PromoBanner
      badge="Limited Time Offer"
      headline="Unlimited Mail Uploads for 30 Days"
      body="Sign up today and upload as many mail lists as you want for your first 30 days—no volume caps, no overage charges. See your real ROI with your real data."
      cta-label="Start Your Free Trial"
    />
    <IndustryPainPoints :content="painPointsContent" />
    <HomeVisualize />
    <HomeHowItWorks />
    <IndustryTestimonials />
    <HomePricing hide-calculator />
    <IndustryFAQ :content="faqContent" />
  </div>
</template>
