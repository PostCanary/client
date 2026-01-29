<script setup lang="ts">
import landingLogo from "@/assets/source-logo-02.png";
import linkedinIcon from "@/assets/home/linkedin-icon.svg?url";
</script>

<template>
  <footer class="bg-white">
    <!-- top content row -->
    <div
      class="mx-auto flex w-full max-w-[1660px] 2xl:max-w-[1760px] flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-10 md:gap-16 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 pt-10 pb-8 md:pt-14 md:pb-10"
    >
      <!-- logo -->
      <div
        class="shrink-0 w-full md:w-auto flex justify-center md:justify-start md:pr-10 lg:pr-16"
      >
        <img :src="landingLogo" alt="MailTrace" class="h-12 w-auto md:h-12" />
      </div>

      <!-- middle nav columns -->
      <!-- 
      <div
        class="flex flex-col md:flex-row flex-1 items-center md:items-start justify-center md:justify-start gap-6 md:gap-24 text-[16px] md:text-[18px] leading-8 md:leading-10 tracking-[-0.04em] text-black mt-2 md:mt-0"
      > -->
      <!-- left column -->
      <!-- <div class="flex flex-col space-y-1 text-center md:text-left">
          <a
            href="#about"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            About
          </a>
          <a
            href="#pricing"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            FAQ
          </a>
          <a
            href="#demo"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Get a Demo
          </a>
          <a
            href="#contact"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Contact
          </a>
        </div>
        -->
      <!-- right column -->
      <!-- <div class="flex flex-col space-y-1 text-center md:text-left">
          <a
            href="#careers"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Careers
          </a>
          <a
            href="#products"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Products
          </a>
          <a
            href="#blog"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Blog
          </a>
          <a
            href="#testimonials"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Testimonials
          </a>
          <a
            href="#support"
            class="inline-block pb-0.5 border-b-2 border-transparent hover:border-[#47bfa9] transition-colors"
          >
            Support
          </a>
        </div>
      </div>
      -->
      <!-- right contact block -->
      <div
        class="flex flex-col items-center md:items-end gap-4 md:gap-6 shrink-0 mt-2 md:mt-0"
      >
        <a
          href="mailto:support@mailtrace.ai"
          class="text-[16px] md:text-[18px] text-black"
        >
          support@mailtrace.ai
        </a>

        <a
          href="https://www.linkedin.com/company/mailtrace/"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="MailTrace on LinkedIn"
        >
          <img :src="linkedinIcon" alt="" class="h-[26px] w-[26px]" />
        </a>
      </div>
    </div>

    <!-- copyright -->
    <div class="pb-6">
      <p
        class="mx-auto max-w-[1660px] 2xl:max-w-[1760px] px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-20 text-center text-[14px] sm:text-[16px] md:text-[18px] text-black"
      >
        © 2025 MailTrace LLC. All rights reserved
      </p>
    </div>

    <!-- bottom dark bar -->
    <div class="h-20 w-full bg-[#0b2d50]" />
  </footer>
</template>
