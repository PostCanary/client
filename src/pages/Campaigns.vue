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
import { draftListDisplayName } from "@/utils/defaultCampaignName";
import { useAuthStore } from "@/stores/auth";
import { usePermissions } from "@/composables/usePermissions";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { canPurchase } = usePermissions();
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
  } catch (err) {
    // Stale deep link (?open=<deleted id>) or fetch failure — without this
    // the modal spun forever on `!campaign` (cross-phase review finding).
    console.warn(`[Campaigns] failed to load campaign ${id}`, err);
    modalOpen.value = false;
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
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
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

function draftCreatorLabel(createdBy: string): string {
  return auth.me?.authenticated === true && createdBy === auth.me.user_id
    ? "Created by you"
    : `Created by ${createdBy}`;
}

const emptyMessages: Record<CampaignTab, string> = {
  draft: "No drafts. Start a new campaign to see it here.",
  sent: "No sent campaigns yet.",
};
</script>

<template>
  <div class="w-full max-w-6xl mx-auto py-8 px-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-[var(--pc-navy,#1c2430)]">Campaigns</h1>
      <button
        class="bg-[var(--app-btn-bg,#1c2430)] text-white font-semibold text-sm px-5 py-2.5 rounded-[2px] hover:bg-[var(--app-btn-bg-hover,#2a3544)] transition-colors"
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
            ? 'bg-white text-[var(--pc-navy,#1c2430)]'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="
            tab.key === 'draft' &&
            tabCounts.draft !== null &&
            tabCounts.draft > 0
          "
          class="ml-1 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
          data-testid="campaigns-draft-count"
          :aria-label="`${tabCounts.draft} campaign ${tabCounts.draft === 1 ? 'draft' : 'drafts'}`"
        >
          {{ tabCounts.draft }}
        </span>
        <span
          v-else-if="tab.key === 'sent' && tabCounts.sent > 0"
          class="ml-1 text-xs text-gray-400"
        >
          ({{ tabCounts.sent }})
        </span>
      </button>
    </div>

    <!-- Filters -->
    <CampaignFilters
      v-if="activeTab === 'sent'"
      v-model:search-query="searchQuery"
      v-model:sort-by="sortBy"
      class="mb-4"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="w-6 h-6 border-2 border-[var(--pc-canary,#facf41)] border-t-transparent rounded-full animate-spin"
      />
    </div>

    <!-- Sent campaign list; internal lifecycle statuses stay on the cards. -->
    <template v-else-if="activeTab === 'sent'">
      <div v-if="filtered.length === 0" class="text-center py-12">
        <p class="text-gray-400">{{ emptyMessages[activeTab] }}</p>
      </div>
      <!-- Wireframe Flow 3: preview-forward tiles in a responsive grid,
           not a compact list — the design IS the card. -->
      <div v-else class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

    <!-- Draft tab -->
    <template v-else>
      <div v-if="drafts.length === 0" class="text-center py-12">
        <p class="text-gray-400">{{ emptyMessages.draft }}</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="draft in drafts"
          :key="draft.id"
          class="bg-white rounded-[2px] border border-gray-200 p-5 transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-[var(--pc-navy,#1c2430)]">
                {{ draftListDisplayName(draft) }}
              </h3>
              <p class="text-sm text-gray-500">
                Draft (Step {{ draft.currentStep }} of 4)
              </p>
              <p
                v-if="draft.createdBy"
                class="mt-1 text-xs text-gray-400"
                data-testid="draft-created-by"
              >
                {{ draftCreatorLabel(draft.createdBy) }}
              </p>
              <span
                v-if="draft.completedSteps.includes(4) && !canPurchase"
                class="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                data-testid="draft-awaiting-admin-purchase"
              >
                Awaiting admin purchase
              </span>
              <div class="flex gap-1 mt-2">
                <span
                  v-for="s in 4"
                  :key="s"
                  class="w-8 h-1.5 rounded-full"
                  :class="
                    draft.completedSteps.includes(s as 1 | 2 | 3 | 4)
                      ? 'bg-[var(--app-btn-bg,#1c2430)]'
                      : 'bg-gray-200'
                  "
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="text-sm font-medium text-[var(--pc-navy,#1c2430)] hover:underline"
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
