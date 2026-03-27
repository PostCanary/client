<script setup lang="ts">
import type { CardDesign, TemplateLayoutType } from "@/types/campaign";

const props = defineProps<{
  card: CardDesign;
  layoutType: TemplateLayoutType;
  brandColors?: string[];
  businessName?: string;
  logoUrl?: string | null;
}>();

const primary = props.brandColors?.[0] ?? "#47bfa9";
const dark = props.brandColors?.[1] ?? "#0b2d50";
</script>

<template>
  <div
    class="relative rounded-lg overflow-hidden bg-white"
    :style="{ aspectRatio: '9 / 6' }"
  >
    <!-- Full-bleed layout -->
    <template v-if="layoutType === 'full-bleed'">
      <div class="absolute inset-0">
        <img
          v-if="card.resolvedContent.photoUrl"
          :src="card.resolvedContent.photoUrl"
          class="w-full h-full object-cover"
          alt=""
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
      <div class="absolute inset-0 p-4 flex flex-col justify-between text-white">
        <div class="flex justify-between items-start">
          <span class="text-xs font-medium opacity-80">{{ businessName }}</span>
          <span class="text-[10px] opacity-60">Licensed & Insured</span>
        </div>
        <div>
          <h3 class="text-lg font-bold leading-tight">{{ card.resolvedContent.headline }}</h3>
          <p class="text-sm mt-1 opacity-90">{{ card.resolvedContent.offerText }}</p>
          <div class="mt-2 text-sm font-bold">{{ card.resolvedContent.phoneNumber }}</div>
        </div>
      </div>
    </template>

    <!-- Side-split layout -->
    <template v-else-if="layoutType === 'side-split'">
      <div class="flex h-full">
        <div class="w-1/2 relative">
          <img
            v-if="card.resolvedContent.photoUrl"
            :src="card.resolvedContent.photoUrl"
            class="w-full h-full object-cover"
            alt=""
          />
        </div>
        <div class="w-1/2 p-3 flex flex-col justify-between" :style="{ backgroundColor: dark }">
          <div>
            <span class="text-[10px] text-white/60">{{ businessName }}</span>
            <h3 class="text-sm font-bold text-white mt-1 leading-tight">{{ card.resolvedContent.headline }}</h3>
            <p class="text-xs text-white/80 mt-1">{{ card.resolvedContent.offerText }}</p>
          </div>
          <div class="text-xs font-bold text-white">{{ card.resolvedContent.phoneNumber }}</div>
        </div>
      </div>
    </template>

    <!-- Photo-top layout -->
    <template v-else-if="layoutType === 'photo-top'">
      <div class="flex flex-col h-full">
        <div class="h-1/2 relative">
          <img
            v-if="card.resolvedContent.photoUrl"
            :src="card.resolvedContent.photoUrl"
            class="w-full h-full object-cover"
            alt=""
          />
        </div>
        <div class="h-1/2 p-3 flex flex-col justify-between" :style="{ backgroundColor: primary + '10' }">
          <div>
            <h3 class="text-sm font-bold" :style="{ color: dark }">{{ card.resolvedContent.headline }}</h3>
            <p class="text-xs mt-1" :style="{ color: dark + 'cc' }">{{ card.resolvedContent.offerText }}</p>
          </div>
          <div class="flex justify-between items-end">
            <span class="text-[10px]" :style="{ color: dark + '80' }">{{ businessName }}</span>
            <span class="text-xs font-bold" :style="{ color: primary }">{{ card.resolvedContent.phoneNumber }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Bold-graphic layout -->
    <template v-else-if="layoutType === 'bold-graphic'">
      <div class="h-full p-4 flex flex-col justify-between" :style="{ backgroundColor: dark }">
        <div class="flex justify-between items-start">
          <span class="text-[10px] text-white/60">{{ businessName }}</span>
          <span class="text-[10px] text-white/40">Licensed & Insured</span>
        </div>
        <div class="text-center">
          <h3 class="text-xl font-black text-white leading-tight">{{ card.resolvedContent.headline }}</h3>
          <p class="text-sm mt-2" :style="{ color: primary }">{{ card.resolvedContent.offerText }}</p>
        </div>
        <div class="text-center">
          <span class="text-sm font-bold" :style="{ color: primary }">{{ card.resolvedContent.phoneNumber }}</span>
        </div>
      </div>
    </template>

    <!-- Before-after layout -->
    <template v-else-if="layoutType === 'before-after'">
      <div class="flex h-full">
        <div class="w-1/2 bg-gray-200 flex items-center justify-center text-xs text-gray-400">Before</div>
        <div class="w-1/2 relative">
          <img
            v-if="card.resolvedContent.photoUrl"
            :src="card.resolvedContent.photoUrl"
            class="w-full h-full object-cover"
            alt=""
          />
          <div class="absolute bottom-0 inset-x-0 bg-black/60 p-2">
            <span class="text-xs text-white font-medium">After</span>
          </div>
        </div>
      </div>
      <div class="absolute bottom-0 inset-x-0 p-2" :style="{ backgroundColor: primary }">
        <div class="flex justify-between items-center text-white text-xs">
          <span class="font-bold">{{ card.resolvedContent.headline }}</span>
          <span>{{ card.resolvedContent.phoneNumber }}</span>
        </div>
      </div>
    </template>

    <!-- Review-forward layout -->
    <template v-else>
      <div class="h-full p-4 flex flex-col justify-between bg-white">
        <div class="flex justify-between items-start">
          <span class="text-[10px]" :style="{ color: dark + '80' }">{{ businessName }}</span>
          <div class="text-yellow-400 text-xs">★★★★★</div>
        </div>
        <div class="text-center px-2">
          <p class="text-sm italic" :style="{ color: dark }">
            "{{ card.resolvedContent.reviewQuote }}"
          </p>
          <span class="text-xs mt-1 block" :style="{ color: dark + '80' }">
            — {{ card.resolvedContent.reviewerName }}
          </span>
        </div>
        <div class="text-center">
          <div class="text-xs" :style="{ color: primary }">{{ card.resolvedContent.offerText }}</div>
          <div class="text-sm font-bold mt-1" :style="{ color: dark }">{{ card.resolvedContent.phoneNumber }}</div>
        </div>
      </div>
    </template>
  </div>
</template>
