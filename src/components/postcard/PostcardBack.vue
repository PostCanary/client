<script setup lang="ts">
import type { CardDesign } from "@/types/campaign";
import LockedZoneOverlay from "@/components/design/LockedZoneOverlay.vue";

const props = defineProps<{
  card: CardDesign;
  brandColors?: string[];
  businessName?: string;
  businessAddress?: string;
}>();

const dark = props.brandColors?.[1] ?? "#0b2d50";
</script>

<template>
  <div
    class="relative rounded-lg overflow-hidden bg-white border border-gray-200"
    :style="{ aspectRatio: '9 / 6' }"
  >
    <div class="flex h-full">
      <!-- Left half: editable content (F-pattern) -->
      <div class="w-1/2 p-3 flex flex-col justify-between text-left">
        <!-- Return address (top-left) -->
        <div class="text-[8px] leading-tight" :style="{ color: dark + '80' }">
          <div class="font-medium">{{ businessName }}</div>
          <div>{{ businessAddress }}</div>
        </div>

        <!-- Main content -->
        <div class="space-y-1.5">
          <h4 class="text-xs font-bold" :style="{ color: dark }">
            {{ card.resolvedContent.offerText }}
          </h4>
          <div class="text-[9px] italic" :style="{ color: dark + 'cc' }">
            "{{ card.resolvedContent.reviewQuote }}"
            <span class="not-italic"> — {{ card.resolvedContent.reviewerName }}</span>
          </div>
          <div class="text-[9px]" :style="{ color: dark + '99' }">
            {{ card.resolvedContent.riskReversal }}
          </div>
        </div>

        <!-- CTA + contact (bottom) -->
        <div>
          <div class="text-xs font-bold" :style="{ color: dark }">
            {{ card.resolvedContent.phoneNumber }}
          </div>
          <div class="text-[8px]" :style="{ color: dark + '80' }">
            {{ card.backContent.websiteUrl }}
          </div>
          <!-- QR placeholder -->
          <div class="w-8 h-8 bg-gray-100 border border-gray-200 rounded mt-1 flex items-center justify-center">
            <span class="text-[6px] text-gray-400">QR</span>
          </div>
        </div>
      </div>

      <!-- Right half: USPS locked zone -->
      <div class="w-1/2 relative">
        <LockedZoneOverlay />
        <div class="p-3 flex flex-col justify-between h-full">
          <!-- Permit indicia (top-right) -->
          <div class="text-right">
            <div class="inline-block border border-gray-300 px-2 py-1 text-[7px] text-gray-400">
              PRSRT STD<br />US POSTAGE<br />PAID<br />PERMIT #000
            </div>
          </div>
          <!-- Address block -->
          <div class="text-[9px] leading-relaxed text-gray-500 mt-auto">
            <div>John Doe</div>
            <div>123 Main Street</div>
            <div>Scottsdale, AZ 85251</div>
          </div>
          <!-- IMb barcode placeholder -->
          <div class="mt-2">
            <div class="h-3 bg-gray-200 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
