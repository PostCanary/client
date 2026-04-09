<script setup lang="ts">
import { useCampaignDraftStore } from "@/stores/useCampaignDraftStore";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import PostcardPreview from "@/components/postcard/PostcardPreview.vue";
import type { DesignSelection } from "@/types/campaign";

const draftStore = useCampaignDraftStore();
const brandKitStore = useBrandKitStore();

function approve() {
  const design: DesignSelection = {
    templateId: "stub-template-001",
    templateLayoutType: "full-bleed",
    isCustomUpload: false,
    customUploadUrl: null,
    sequenceCards: [
      {
        cardNumber: 1,
        cardPurpose: "offer",
        templateId: "stub-template-001",
        previewImageUrl: "",
        overrides: {},
        resolvedContent: {
          headline: "Your Neighbors Trust Us",
          offerText: "$50 Off Your First Service",
          offerTeaser: "$50 OFF",
          offerItems: [], // Stub fallback — real value stack comes from AI generator
          photoUrl: "",
          reviewQuote: "Great service, very professional!",
          reviewerName: "John D.",
          phoneNumber: brandKitStore.brandKit?.phone ?? "(555) 123-4567",
          urgencyText: "Limited time offer",
          riskReversal: "100% satisfaction guaranteed",
          trustSignals: ["Licensed & Insured", "5-Star Google Rating"],
        },
        backContent: {
          guarantee: "100% Satisfaction Guarantee",
          certifications: ["Licensed & Insured"],
          licenseNumber: "",
          companyAddress: "",
          websiteUrl: brandKitStore.brandKit?.websiteUrl ?? "",
          qrCodeUrl: "",
        },
      },
    ],
  };
  draftStore.setDesign(design);
}
</script>

<template>
  <div class="max-w-lg mx-auto py-8 px-4">
    <h2 class="text-xl font-semibold text-[#0b2d50] mb-4">Your Postcard</h2>
    <p class="text-sm text-gray-500 mb-6">
      Stub — Terminal 2 replaces this with the real design studio
    </p>

    <div class="mb-6 flex justify-center">
      <PostcardPreview
        :brand-colors="brandKitStore.brandKit?.brandColors"
        size="large"
      />
    </div>

    <button
      class="bg-[#47bfa9] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors w-full"
      @click="approve"
    >
      Approve Design
    </button>
  </div>
</template>
