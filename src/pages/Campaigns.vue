<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCampaignList, type CampaignTab } from "@/composables/useCampaignList";
import CampaignListCard from "@/components/campaigns/CampaignListCard.vue";
import CampaignFilters from "@/components/campaigns/CampaignFilters.vue";
import CampaignViewModal from "@/components/campaigns/CampaignViewModal.vue";
import { pauseMailCampaign, resumeMailCampaign, getMailCampaign } from "@/api/mailCampaigns";
import { deleteDraft } from "@/api/campaignDrafts";
import type { MailCampaign } from "@/types/campaign";

const router = useRouter();
const route = useRoute();
const {
  drafts,
  loading,
  activeTab,
  searchQuery,
  sortBy,
  filtered,
  tabCounts,
  fetch,
} = useCampaignList();

// "Your Campaign" modal state — clicking a card opens this overlay rather
// than navigating away (Dashboard Flow, Flow 3). Deep links to
// /app/campaigns/:id still resolve via CampaignDetail.vue's full-page route.
const selectedCampaign = ref<MailCampaign | null>(null);
const modalOpen = ref(false);
const modalLoading = ref(false);

async function openCampaign(id: string) {
  modalOpen.value = true;
  modalLoading.value = true;
  selectedCampaign.value = null;
  try {
    selectedCampaign.value = await getMailCampaign(id);
  } finally {
    modalLoading.value = false;
  }
}

function closeModal() {
  modalOpen.value = false;
  selectedCampaign.value = null;
}

onMounted(async () => {
  await fetch();
  // Support deep-linking straight into the modal, e.g. from a notification
  // that points at /app/campaigns?open=<id>.
  const openId = route.query.open;
  if (typeof openId === "string" && openId) {
    openCampaign(openId);
  }
});

const tabs: { key: CampaignTab; label: string }[] = [
  { key: "in_progress", label: "In Progress" },
  { key: "sent", label: "Sent" },
  { key: "drafts", label: "Drafts" },
];

async function handlePause(id: string) {
  await pauseMailCampaign(id);
  await fetch();
}

async function handleResume(id: string) {
  await resumeMailCampaign(id);
  await fetch();
}

async function handleDeleteDraft(draftId: string) {
  await deleteDraft(draftId);
  await fetch();
}

function resumeDraft(draftId: string) {
  router.push(`/app/send/${draftId}`);
}

const emptyMessages: Record<CampaignTab, string> = {
  in_progress: "No campaigns in progress. Send your first postcards →",
  sent: "No sent campaigns yet.",
  drafts: "No drafts. Start a new campaign to see it here.",
};
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-[#0b2d50]">Campaigns</h1>
      <button
        class="bg-[#47bfa9] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#3aa893] transition-colors"
        @click="router.push('/app/send')"
      >
        + Send Postcards
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-2 text-sm font-medium rounded-md transition-all"
        :class="
          activeTab === tab.key
            ? 'bg-white text-[#0b2d50] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tabCounts[tab.key] > 0"
          class="ml-1 text-xs text-gray-400"
        >
          ({{ tabCounts[tab.key] }})
        </span>
      </button>
    </div>

    <!-- Filters -->
    <CampaignFilters
      v-if="activeTab !== 'drafts'"
      v-model:search-query="searchQuery"
      v-model:sort-by="sortBy"
      class="mb-4"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="w-6 h-6 border-2 border-[#47bfa9] border-t-transparent rounded-full animate-spin"
      />
    </div>

    <!-- Campaign list (in_progress/sent tabs) -->
    <template v-else-if="activeTab !== 'drafts'">
      <div v-if="filtered.length === 0" class="text-center py-12">
        <p class="text-gray-400">{{ emptyMessages[activeTab] }}</p>
        <button
          v-if="activeTab === 'in_progress'"
          class="mt-3 text-sm text-[#47bfa9] font-medium hover:underline"
          @click="router.push('/app/send')"
        >
          Send your first postcards
        </button>
      </div>
      <div v-else class="space-y-3">
        <CampaignListCard
          v-for="campaign in filtered"
          :key="campaign.id"
          :campaign="campaign"
          @open="openCampaign"
          @pause="handlePause"
          @resume="handleResume"
        />
      </div>
    </template>

    <!-- Drafts tab -->
    <template v-else>
      <div v-if="drafts.length === 0" class="text-center py-12">
        <p class="text-gray-400">{{ emptyMessages.drafts }}</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="draft in drafts"
          :key="draft.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-[#0b2d50]">
                {{ draft.goal?.goalLabel ?? "Untitled Draft" }}
              </h3>
              <p class="text-sm text-gray-500">
                Draft (Step {{ draft.currentStep }} of 4)
              </p>
              <div class="flex gap-1 mt-2">
                <span
                  v-for="s in 4"
                  :key="s"
                  class="w-8 h-1.5 rounded-full"
                  :class="
                    draft.completedSteps.includes(s as 1 | 2 | 3 | 4)
                      ? 'bg-[#47bfa9]'
                      : 'bg-gray-200'
                  "
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="text-sm font-medium text-[#47bfa9] hover:underline"
                @click="resumeDraft(draft.id)"
              >
                Resume
              </button>
              <button
                class="text-sm font-medium text-red-500 hover:underline"
                @click="handleDeleteDraft(draft.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <CampaignViewModal
      :open="modalOpen"
      :campaign="selectedCampaign"
      :loading="modalLoading"
      @close="closeModal"
    />
  </div>
</template>
