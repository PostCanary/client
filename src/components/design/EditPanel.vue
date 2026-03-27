<script setup lang="ts">
import { ref } from "vue";
import type { CardDesign, BrandKit } from "@/types/campaign";

const props = defineProps<{
  card: CardDesign;
  brandKit: BrandKit | null;
}>();

const emit = defineEmits<{
  (e: "update-field", field: string, value: string): void;
  (e: "update-photo", url: string): void;
  (e: "open-template-browser"): void;
  (e: "reset"): void;
}>();

type EditorType = "headline" | "offer" | "review" | "photo" | null;
const activeEditor = ref<EditorType>(null);

function toggleEditor(editor: EditorType) {
  activeEditor.value = activeEditor.value === editor ? null : editor;
}

const editableHeadline = ref(props.card.resolvedContent.headline);
const editableOffer = ref(props.card.resolvedContent.offerText);

function applyHeadline() {
  emit("update-field", "headline", editableHeadline.value);
}

function applyOffer() {
  emit("update-field", "offerText", editableOffer.value);
}
</script>

<template>
  <div class="w-80 border-l border-gray-200 p-4 overflow-y-auto bg-white">
    <h3 class="text-sm font-semibold text-[#0b2d50] mb-4">Edit Card</h3>

    <div class="space-y-2">
      <!-- Edit Headline -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'headline' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('headline')"
      >
        ✏️ Edit Headline
      </button>
      <div v-if="activeEditor === 'headline'" class="px-3 pb-3">
        <input
          v-model="editableHeadline"
          type="text"
          maxlength="50"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          @input="applyHeadline"
        />
        <div class="text-[10px] text-gray-400 mt-1 text-right">
          {{ editableHeadline.length }}/50
        </div>
      </div>

      <!-- Edit Offer -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors"
        :class="activeEditor === 'offer' ? 'border-[#47bfa9] bg-[#47bfa9]/5' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleEditor('offer')"
      >
        🏷️ Edit Offer
      </button>
      <div v-if="activeEditor === 'offer'" class="px-3 pb-3">
        <textarea
          v-model="editableOffer"
          maxlength="200"
          rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
          @input="applyOffer"
        />
        <div class="text-[10px] text-gray-400 mt-1 text-right">
          {{ editableOffer.length }}/200
        </div>
      </div>

      <!-- Change Photo -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 text-sm transition-colors"
        @click="toggleEditor('photo')"
      >
        📷 Change Photo
      </button>

      <!-- Change Review -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 text-sm transition-colors"
        @click="toggleEditor('review')"
      >
        ⭐ Change Review
      </button>

      <!-- Template browser -->
      <button
        class="w-full text-center px-3 py-2.5 rounded-lg bg-[#47bfa9] text-white text-sm font-medium hover:bg-[#3aa893] transition-colors mt-4"
        @click="emit('open-template-browser')"
      >
        Try Different Template
      </button>

      <!-- Reset -->
      <button
        class="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2"
        @click="emit('reset')"
      >
        Reset to Original
      </button>
    </div>
  </div>
</template>
