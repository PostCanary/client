<template>
  <div class="terms-page">
    <div class="terms-container">
      <h1 class="terms-title">Terms of Service</h1>
      <p class="terms-updated">Last updated: January 22, 2025</p>

      <div class="terms-content">
        <section class="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using {{ BRAND.name }} ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section class="terms-section">
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily use {{ BRAND.name }} for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on {{ BRAND.name }}'s website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
          </p>
        </section>

        <section class="terms-section">
          <h2>4. Data and Privacy</h2>
          <p>
            You retain all rights to your data. By using {{ BRAND.name }}, you grant us permission to process and analyze your data solely for the purpose of providing the Service. We are committed to protecting your privacy and will handle your data in accordance with our Privacy Policy.
          </p>
        </section>

        <section class="terms-section">
          <h2>5. Prohibited Uses</h2>
          <p>You may not use {{ BRAND.name }}:</p>
          <ul>
            <li>in any way that violates any applicable national or international law or regulation;</li>
            <li>to transmit, or procure the sending of, any advertising or promotional material without our prior written consent;</li>
            <li>to impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity;</li>
            <li>in any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful.</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>6. Service Availability</h2>
          <p>
            We reserve the right to withdraw or amend the Service, and any service or material we provide via the Service, in our sole discretion without notice. We will not be liable if, for any reason, all or any part of the Service is unavailable at any time or for any period.
          </p>
        </section>

        <section class="terms-section">
          <h2>7. Disclaimer</h2>
          <p>
            The materials on {{ BRAND.name }}'s website are provided on an 'as is' basis. {{ BRAND.name }} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section class="terms-section">
          <h2>8. Limitations</h2>
          <p>
            In no event shall {{ BRAND.name }} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on {{ BRAND.name }}'s website, even if {{ BRAND.name }} or a {{ BRAND.name }} authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section class="terms-section">
          <h2>9. Revisions and Errata</h2>
          <p>
            The materials appearing on {{ BRAND.name }}'s website could include technical, typographical, or photographic errors. {{ BRAND.name }} does not warrant that any of the materials on its website are accurate, complete, or current. {{ BRAND.name }} may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <section class="terms-section">
          <h2>10. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>
        </section>

        <section class="terms-section">
          <h2>11. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section class="terms-section">
          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us through our support channels.
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
  background: #f8f9fa;
  padding: 40px 20px;
}

.terms-container {
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(12, 45, 80, 0.08);
}

.terms-title {
  font-size: 36px;
  font-weight: 700;
  color: #0b2d4f;
  margin-bottom: 8px;
}

.terms-updated {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
}

.terms-content {
  line-height: 1.7;
  color: #334155;
}

.terms-section {
  margin-bottom: 32px;
}

.terms-section h2 {
  font-size: 24px;
  font-weight: 600;
  color: #0b2d4f;
  margin-bottom: 12px;
  margin-top: 0;
}

.terms-section p {
  font-size: 16px;
  margin-bottom: 12px;
  color: #475569;
}

.terms-section ul {
  margin-left: 24px;
  margin-top: 8px;
  margin-bottom: 12px;
}

.terms-section li {
  font-size: 16px;
  color: #475569;
  margin-bottom: 8px;
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
