<template>
  <div class="terms-page">
    <div class="terms-container">
      <h1 class="terms-title">Privacy Policy</h1>
      <p class="terms-updated">Last updated: January 22, 2025</p>

      <div class="terms-content">
        <section class="terms-section">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, use the Service, or communicate with us. This may include your name, email address, and any other information you choose to provide.
          </p>
          <p>
            We also automatically collect certain information when you use the Service, including your IP address, browser type, operating system, and usage data.
          </p>
        </section>

        <section class="terms-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>provide, maintain, and improve the Service;</li>
            <li>process transactions and send related information;</li>
            <li>send you technical notices, updates, security alerts, and support messages;</li>
            <li>respond to your comments, questions, and customer service requests;</li>
            <li>monitor and analyze trends, usage, and activities in connection with the Service.</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to outside parties. We may share information with trusted third parties who assist us in operating the Service, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
          </p>
        </section>

        <section class="terms-section">
          <h2>4. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
          </p>
        </section>

        <section class="terms-section">
          <h2>5. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section class="terms-section">
          <h2>6. Third-Party Services</h2>
          <p>
            Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>
        </section>

        <section class="terms-section">
          <h2>7. Data Retention</h2>
          <p>
            We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
          </p>
        </section>

        <section class="terms-section">
          <h2>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>access the personal data we hold about you;</li>
            <li>request correction of inaccurate personal data;</li>
            <li>request deletion of your personal data;</li>
            <li>object to processing of your personal data;</li>
            <li>request a copy of your personal data in a portable format.</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>9. Children's Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.
          </p>
        </section>

        <section class="terms-section">
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section class="terms-section">
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at
            <a :href="`mailto:${BRAND.email.support}`" class="text-link">{{ BRAND.email.support }}</a>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BRAND } from "@/config/brand";
</script>

<style scoped>
.terms-page {
  min-height: 100vh;
  background: var(--pc-navy);
  padding: 40px 20px;
  color: var(--pc-text);
}

.terms-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--pc-card);
  border: 1px solid var(--pc-border);
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
}

.terms-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--pc-text);
  margin-bottom: 8px;
}

.terms-updated {
  font-size: 14px;
  color: var(--pc-text-soft);
  margin-bottom: 32px;
}

.terms-content {
  line-height: 1.7;
  color: var(--pc-text-muted);
}

.terms-section {
  margin-bottom: 32px;
}

.terms-section h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--pc-text);
  margin-bottom: 12px;
  margin-top: 0;
}

.terms-section p {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--pc-text-muted);
}

.terms-section ul {
  margin-left: 24px;
  margin-top: 8px;
  margin-bottom: 12px;
}

.terms-section li {
  font-size: 16px;
  color: var(--pc-text-muted);
  margin-bottom: 8px;
}

.text-link {
  color: var(--pc-teal, #24b39b);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .terms-container {
    padding: 24px;
  }

  .terms-title {
    font-size: 28px;
  }

  .terms-section h2 {
    font-size: 20px;
  }
}
</style>
