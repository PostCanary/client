<template>
  <div class="help-page">
    <div class="help-container">
      <router-link to="/" class="back-link">&larr; Back to Home</router-link>

      <h1 class="help-title">Help Center</h1>
      <p class="help-subtitle">
        Find answers to common questions about {{ BRAND.name }}.
      </p>

      <div class="search-wrapper">
        <input
          v-model="search"
          type="text"
          placeholder="Search questions..."
          class="search-input"
        />
      </div>

      <div class="faq-sections">
        <template v-for="section in filteredSections" :key="section.title">
          <div class="faq-section">
            <h2 class="section-title">{{ section.title }}</h2>

            <div
              v-for="(item, i) in section.items"
              :key="i"
              class="faq-item"
              :class="{ open: openKeys.has(section.title + i) }"
            >
              <button
                class="faq-question"
                @click="toggle(section.title + i)"
              >
                <span>{{ item.q }}</span>
                <span class="faq-icon">{{
                  openKeys.has(section.title + i) ? "\u2212" : "+"
                }}</span>
              </button>
              <div class="faq-answer-wrapper">
                <div class="faq-answer" v-html="item.a" />
              </div>
            </div>
          </div>
        </template>

        <p v-if="filteredSections.length === 0" class="no-results">
          No questions match your search. Try a different term or
          <a :href="getSupportEmailLink()">contact support</a>.
        </p>
      </div>

      <div class="contact-cta">
        <h2>Still have questions?</h2>
        <p>
          Our team is happy to help. Reach out to us at
          <a :href="getSupportEmailLink()">{{ BRAND.email.support }}</a>
          or
          <button
            type="button"
            class="text-[var(--pc-cyan)] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit"
            @click="demo.open()"
          >book a demo</button>
          for a personalized walkthrough.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { BRAND, getSupportEmailLink } from "@/config/brand";
import { useDemoStore } from "@/stores/demo";

const demo = useDemoStore();

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const search = ref("");
const openKeys = ref<Set<string>>(new Set());

function toggle(key: string) {
  if (openKeys.value.has(key)) {
    openKeys.value.delete(key);
  } else {
    openKeys.value.add(key);
  }
}

const sections: FaqSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is PostCanary?",
        a: `${BRAND.name} is a direct-mail analytics platform that connects your mailing data with customer conversions so you can measure the real ROI of every campaign.`,
      },
      {
        q: "How does PostCanary work?",
        a: "Upload your mail file (who you sent to) and your CRM file (who converted), and we match the two together. You'll see conversion rates, ROI, cost-per-acquisition, geographic heatmaps, and more — all in one dashboard.",
      },
      {
        q: "How do I get started?",
        a: "Sign up for an account, choose a plan, and upload your first pair of CSV files. The three-step process is: <strong>1)</strong> Upload your files, <strong>2)</strong> Map the columns, and <strong>3)</strong> View your results on the dashboard.",
      },
      {
        q: "Do I need technical knowledge to use PostCanary?",
        a: "Not at all. If you can export a CSV from your CRM or mailing platform, you have everything you need. The interface walks you through each step.",
      },
    ],
  },
  {
    title: "Uploading Data",
    items: [
      {
        q: "What file format does PostCanary accept?",
        a: "We accept <strong>CSV</strong> (comma-separated values) files. Most spreadsheet apps and CRM platforms can export to CSV.",
      },
      {
        q: 'What is a "Mail" file vs. a "CRM" file?',
        a: "A <strong>Mail file</strong> contains the list of people you sent a direct-mail piece to (names, addresses). A <strong>CRM file</strong> contains the people who converted — signed up, purchased, or responded. We match the two to determine campaign performance.",
      },
      {
        q: "What columns should my CSV files include?",
        a: "At a minimum you'll need name and address fields (first name, last name, street address, city, state, zip). Additional columns like campaign ID, mail date, or sale amount allow for richer analytics.",
      },
      {
        q: "Is there a file size limit?",
        a: "File size limits depend on your plan. The Starter plan supports up to 50,000 mailers per month, while higher-tier plans handle up to 1,000,000+ rows. Check your plan details for exact limits.",
      },
      {
        q: "Can I upload just one file (mail only or CRM only)?",
        a: "You can upload files individually, but both a Mail file and a CRM file are required to generate match results and KPIs. You can upload them at different times — matching runs once both are present.",
      },
    ],
  },
  {
    title: "Column Mapping",
    items: [
      {
        q: "What is column mapping?",
        a: "Column mapping tells our system which columns in your CSV correspond to fields like first name, last name, street address, city, state, and zip code. This ensures accurate matching between your mail and CRM data.",
      },
      {
        q: 'Why am I seeing a "Mapping Required" message?',
        a: "This means we couldn't automatically detect all the required columns in your file. Navigate to the mapping screen, review the suggested mappings, and manually assign any columns that weren't matched.",
      },
      {
        q: "How do I fix mapping errors?",
        a: "Open the file's mapping view, check each required field, and use the dropdown to select the correct column from your CSV. Once all required fields are assigned, save the mapping and re-run the match.",
      },
    ],
  },
  {
    title: "Dashboard & Analytics",
    items: [
      {
        q: "What KPIs does PostCanary track?",
        a: "The dashboard displays <strong>conversion rate</strong>, <strong>return on investment (ROI)</strong>, <strong>cost per acquisition (CPA)</strong>, total mailers sent, total conversions, and revenue attributed to direct mail.",
      },
      {
        q: "What does the conversion rate mean?",
        a: "Conversion rate is the percentage of people from your mail file who also appear in your CRM file — in other words, the share of recipients who took action.",
      },
      {
        q: "How is ROI calculated?",
        a: "ROI = (Revenue from Conversions − Mail Cost) ÷ Mail Cost × 100. It tells you how much return you earned for every dollar spent on direct mail.",
      },
      {
        q: 'What are the "Top Cities" and "Top Zip Codes" tables?',
        a: "These tables rank the geographic areas where your mailings produced the most conversions, helping you focus future campaigns on your highest-performing markets.",
      },
      {
        q: "How does the Year-over-Year chart work?",
        a: "The YoY chart compares your current period's conversion metrics against the same period from the prior year, so you can spot trends and measure growth over time.",
      },
      {
        q: "How do AI Insights and Demographics relate to the dashboard?",
        a: "The dashboard shows core KPIs from your match results. <strong>AI Insights</strong> provides AI-generated analysis and prioritized recommendations based on that data. <strong>Demographics</strong> adds Census-based audience profiling so you can see who your best-converting customers are. All three work from the same underlying match data.",
      },
    ],
  },
  {
    title: "Heatmap",
    items: [
      {
        q: "What does the heatmap show?",
        a: "The heatmap visualizes where your mail recipients and conversions are concentrated geographically. Warmer colors indicate higher density, making it easy to spot your strongest markets at a glance.",
      },
      {
        q: "Can I filter the heatmap by date or campaign?",
        a: "Yes. Use the filters at the top of the heatmap page to narrow results by date range or specific upload batch.",
      },
    ],
  },
  {
    title: "AI Insights",
    items: [
      {
        q: "What is the AI Insights page?",
        a: "AI Insights uses artificial intelligence to analyze your campaign performance after each match run. It generates an <strong>executive summary</strong>, detailed analysis sections, and <strong>prioritized recommendations</strong> with specific actions you can take to improve results.",
      },
      {
        q: "How are AI Insights generated?",
        a: "Insights are generated automatically after each completed match run. The system analyzes your KPIs, geographic performance, mailing frequency patterns, seasonality trends, and revenue data, then produces a structured report. This happens in the background and doesn't delay your results.",
      },
      {
        q: "What kind of insights will I see?",
        a: "Each report includes an <strong>executive summary</strong> (2–3 sentence overview), <strong>4–6 analysis sections</strong> covering conversion performance, geographic patterns, mailing frequency impact, seasonality, and revenue trends, plus <strong>3–5 prioritized recommendations</strong> with data-backed rationale for each.",
      },
      {
        q: "What does the data sufficiency indicator mean?",
        a: "The indicator shows whether your dataset is large enough for confident analysis. <strong>High</strong> means plenty of data for reliable conclusions. <strong>Moderate</strong> means insights are directional but should be interpreted carefully. <strong>Limited</strong> means very few matches were found — insights may not reflect broader patterns.",
      },
      {
        q: "Can I regenerate my insights?",
        a: "Yes. Click the <strong>Regenerate Insights</strong> button to re-analyze your most recent match run. This is useful if you want a fresh perspective or after additional data has been processed.",
      },
    ],
  },
  {
    title: "Demographics",
    items: [
      {
        q: "What is the Demographics page?",
        a: "The Demographics page shows a demographic profile of your campaign audience. It displays distributions for <strong>home value</strong>, <strong>age range</strong>, <strong>household income</strong>, and <strong>property type</strong>, helping you understand who your customers are and which segments convert best.",
      },
      {
        q: "Where does the demographic data come from?",
        a: "Demographic data comes from the <strong>U.S. Census Bureau American Community Survey (ACS)</strong>. It's matched to your customers' ZIP codes and reflects neighborhood-level trends — not individual-level data. This means the results show general patterns for the areas your customers live in.",
      },
      {
        q: 'What\'s the difference between the "Matches" and "All Customers" tabs?',
        a: "<strong>Matches</strong> analyzes only converted customers — mail recipients who also appeared in your CRM. <strong>All Customers</strong> analyzes your entire CRM customer base regardless of whether they received a mailer. Comparing the two helps you see how your converting audience differs from your broader customer base.",
      },
      {
        q: "What is the Recommendations table?",
        a: "The Recommendations table ranks your <strong>top 10 audience segments</strong> by conversion lift. Each segment combines tenure (homeowner or renter), age bracket, and home value bracket. For each segment you'll see its match rate, lift multiplier, response strength, and a recommended action (Increase Volume, Keep As-Is, or Decrease Volume).",
      },
      {
        q: 'What does "lift" mean?',
        a: "Lift compares a segment's share of conversions to its share of mailers sent. For example, a <strong>2.0× lift</strong> means that segment converts at twice the overall rate — it's pulling more than its weight. Higher lift indicates a stronger-performing audience segment.",
      },
      {
        q: 'Why do I see an "Insufficient Data" message?',
        a: "Demographics recommendations require a minimum number of matches for statistical reliability. Below <strong>25 matches</strong>, charts are limited and recommendations are hidden. Between 25 and 99 matches, results are shown with a low-confidence qualifier. <strong>100+ matches</strong> gives full confidence in the analysis.",
      },
      {
        q: "Can I filter demographics by date range?",
        a: "Yes. Use the filter bar at the top of the page to narrow results by <strong>All Time</strong>, <strong>Last 90 Days</strong>, <strong>Last 6 Months</strong>, <strong>Last Year</strong>, or a <strong>custom date range</strong>.",
      },
    ],
  },
  {
    title: "Billing & Plans",
    items: [
      {
        q: "What plans are available?",
        a: `${BRAND.name} offers tiered plans starting at <strong>$99/month</strong> for smaller mailers and scaling up to <strong>$999/month</strong> for high-volume senders. Each plan includes a set number of mailers per month. Visit the pricing section on our home page for full details.`,
      },
      {
        q: 'What does "mailers per month" mean?',
        a: "It's the maximum number of mail-file rows you can process in a billing cycle. For example, a 50,000-mailer plan lets you upload and match up to 50,000 recipient records each month.",
      },
      {
        q: "How do I upgrade or downgrade my plan?",
        a: "Go to <strong>Settings → Billing</strong> in your account. You can switch plans at any time; changes take effect at the start of your next billing cycle.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "You can cancel from <strong>Settings → Billing</strong>. Your account will remain active until the end of the current billing period. No data is deleted upon cancellation.",
      },
      {
        q: "What happens if my payment fails?",
        a: "We'll notify you by email and retry the charge. If the issue isn't resolved within a few days, your account may be paused until payment is updated.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        q: "How is my data protected?",
        a: "All data is encrypted in transit (TLS) and at rest. We follow industry-standard security practices and never sell or share your data with third parties.",
      },
      {
        q: "Who can access my data?",
        a: "Only authenticated members of your organization can view your uploads and results. Our support team may access data only when assisting with a support request you initiate.",
      },
      {
        q: "Can I delete my data?",
        a: `Yes. You can delete individual uploads from the History page, or contact <a href="${getSupportEmailLink()}">${BRAND.email.support}</a> to request full account data removal.`,
      },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      {
        q: "My upload failed. What should I do?",
        a: "Make sure your file is a valid CSV, is under the size limit for your plan, and contains at least the required columns (name and address fields). If the problem persists, try re-exporting the CSV from your source application.",
      },
      {
        q: "My results look wrong. What might be the issue?",
        a: "The most common cause is incorrect column mapping. Double-check that each field (first name, last name, address, city, state, zip) is mapped to the right column. Also verify that your CRM file covers the same time period as your mail file.",
      },
      {
        q: "I'm having trouble logging in. What should I do?",
        a: `Try resetting your password from the login screen. If you still can't get in, email <a href="${getSupportEmailLink()}">${BRAND.email.support}</a> and we'll help you regain access.`,
      },
    ],
  },
];

const filteredSections = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(term) ||
          item.a.toLowerCase().includes(term)
      ),
    }))
    .filter((section) => section.items.length > 0);
});
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: var(--pc-navy);
  padding: 40px 20px;
  color: var(--pc-text);
}

.help-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--pc-card);
  border: 1px solid var(--pc-border);
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
}

.back-link {
  display: inline-block;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--pc-cyan);
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}

.help-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--pc-text);
  margin-bottom: 8px;
}

.help-subtitle {
  font-size: 16px;
  color: var(--pc-text-muted);
  margin-bottom: 32px;
}

/* search */
.search-wrapper {
  margin-bottom: 36px;
}
.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border-radius: 8px;
  border: 1px solid var(--pc-border);
  background: var(--pc-navy);
  color: var(--pc-text);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.search-input::placeholder {
  color: var(--pc-text-muted);
}
.search-input:focus {
  border-color: var(--pc-cyan);
}

/* sections */
.faq-section {
  margin-bottom: 36px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--pc-cyan);
  margin-bottom: 16px;
  margin-top: 0;
}

/* accordion items */
.faq-item {
  border: 1px solid var(--pc-border);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: transparent;
  border: none;
  color: var(--pc-text);
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  gap: 12px;
}
.faq-question:hover {
  background: rgba(255, 255, 255, 0.03);
}

.faq-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  color: var(--pc-cyan);
}

.faq-answer-wrapper {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.faq-item.open .faq-answer-wrapper {
  max-height: 500px;
}

.faq-answer {
  padding: 0 16px 14px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--pc-text-muted);
}

.faq-answer :deep(a) {
  color: var(--pc-cyan);
  text-decoration: none;
}
.faq-answer :deep(a:hover) {
  text-decoration: underline;
}

.faq-answer :deep(strong) {
  color: var(--pc-text);
}

/* no results */
.no-results {
  font-size: 15px;
  color: var(--pc-text-muted);
  text-align: center;
  padding: 24px 0;
}
.no-results a {
  color: var(--pc-cyan);
  text-decoration: none;
}
.no-results a:hover {
  text-decoration: underline;
}

/* contact CTA */
.contact-cta {
  margin-top: 48px;
  padding: 32px;
  background: var(--pc-navy);
  border: 1px solid var(--pc-border);
  border-radius: 12px;
  text-align: center;
}
.contact-cta h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--pc-text);
  margin-top: 0;
  margin-bottom: 12px;
}
.contact-cta p {
  font-size: 15px;
  color: var(--pc-text-muted);
  line-height: 1.7;
  margin: 0;
}
.contact-cta a {
  color: var(--pc-cyan);
  text-decoration: none;
}
.contact-cta a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .help-container {
    padding: 24px;
  }

  .help-title {
    font-size: 28px;
  }

  .section-title {
    font-size: 18px;
  }

  .contact-cta {
    padding: 24px;
  }
}
</style>
