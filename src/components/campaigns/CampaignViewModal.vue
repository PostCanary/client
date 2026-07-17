<script setup lang="ts">
// POS-151: "Your Campaign" overlay opened from a Campaigns list card.
// Design ref: PostCanary Dashboard Flow.md, Flow 3.
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import type { MailCampaign } from "@/types/campaign";
import { getAudienceCsv } from "@/api/mailCampaigns";
import {
  campaignAudienceType,
  campaignAreas,
  campaignDesignPreviewUrl,
  campaignPiecesSent,
} from "@/utils/campaignDisplay";
import CampaignStatusBadge from "./CampaignStatusBadge.vue";
import CampaignAreaMapPreview from "./CampaignAreaMapPreview.vue";

const props = defineProps<{
  open: boolean;
  campaign: MailCampaign | null;
  loading?: boolean;
}>();
const emit = defineEmits<{ (e: "close"): void }>();

const router = useRouter();
const showMap = ref(false);

watch(
  () => props.campaign?.id,
  () => {
    showMap.value = false;
  },
);

const audienceType = computed(() =>
  props.campaign ? campaignAudienceType(props.campaign) : null,
);
const areas = computed(() =>
  props.campaign ? campaignAreas(props.campaign) : [],
);
const piecesSent = computed(() =>
  props.campaign ? campaignPiecesSent(props.campaign) : null,
);
const previewUrl = computed(() =>
  props.campaign ? campaignDesignPreviewUrl(props.campaign) : null,
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function close() {
  emit("close");
}

function viewFullDetails() {
  if (!props.campaign) return;
  const id = props.campaign.id;
  close();
  router.push(`/app/campaigns/${id}`);
}

const downloadingAudience = ref(false);

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// This client-generated summary CSV is the fallback used whenever the real
// per-recipient list can't be fetched: area campaigns (no audience at all),
// list campaigns approved before the audience_id migration (server PR
// #132), or the real-CSV request 404ing/erroring for any other reason.
function downloadSummaryCsv(c: MailCampaign) {
  const rows: [string, string][] = [
    ["Campaign", c.name],
    ["Audience Type", "List"],
    ["Campaign Date", formatDate(c.createdAt)],
    ["Households", String(c.householdCount)],
    ["Pieces Sent", String(piecesSent.value ?? 0)],
    ["Total Cost", c.totalCost.toFixed(2)],
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerBlobDownload(
    blob,
    `${c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "campaign"}-audience.csv`,
  );
}

// POS-154: server PR #132 now serializes audience_id and exposes the real
// per-recipient CSV at /api/mail-campaigns/<id>/audience-csv. When a
// campaign has one, fetch it; otherwise (or on any failure — including the
// server not being deployed yet) fall back to the summary CSV above rather
// than blocking the download.
async function downloadAudience() {
  const c = props.campaign;
  if (!c) return;

  if (!c.audienceId) {
    downloadSummaryCsv(c);
    return;
  }

  downloadingAudience.value = true;
  try {
    const blob = await getAudienceCsv(c.id);
    triggerBlobDownload(
      blob,
      `${c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "campaign"}-recipients.csv`,
    );
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : null;
    console.warn(
      `[CampaignViewModal] audience-csv fetch failed (status=${status ?? "network"}); falling back to summary CSV`,
      err,
    );
    downloadSummaryCsv(c);
  } finally {
    downloadingAudience.value = false;
  }
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="close">
    <div
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-label="Your Campaign"
    >
      <header class="modal-header">
        <h3>Your Campaign</h3>
        <button class="close-btn" aria-label="Close" @click="close">&times;</button>
      </header>

      <div v-if="loading || !campaign" class="modal-body loading-state">
        <div class="spinner" />
      </div>

      <div v-else class="modal-body">
        <div class="preview-wrap">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="Campaign design preview"
            class="preview-img"
          />
          <div
            v-else
            class="preview-placeholder"
            data-testid="campaign-modal-preview-placeholder"
          >
            Preview pending
          </div>
        </div>

        <div class="flex items-center justify-between mt-4 mb-2">
          <h4 class="campaign-name">{{ campaign.name }}</h4>
          <CampaignStatusBadge :status="campaign.status" />
        </div>

        <dl class="detail-grid">
          <div class="detail-row">
            <dt>Campaign Date</dt>
            <dd>{{ formatDate(campaign.createdAt) }}</dd>
          </div>
          <div class="detail-row">
            <dt>Audience Type</dt>
            <dd class="capitalize">{{ audienceType }}</dd>
          </div>
          <div class="detail-row">
            <dt>Number of Pieces Sent</dt>
            <dd>{{ piecesSent !== null ? piecesSent.toLocaleString() : "—" }}</dd>
          </div>
        </dl>

        <!-- Sent to a list: audience download -->
        <button
          v-if="audienceType === 'list'"
          class="primary-btn"
          :disabled="downloadingAudience"
          @click="downloadAudience"
        >
          {{ downloadingAudience ? "Downloading…" : "Download Audience" }}
        </button>

        <!-- Sent to an area: map view -->
        <template v-else-if="audienceType === 'area'">
          <button class="primary-btn" @click="showMap = !showMap">
            {{ showMap ? "Hide Map" : "View Map" }}
          </button>
          <CampaignAreaMapPreview
            v-if="showMap"
            :areas="areas"
            class="mt-3"
          />
        </template>

        <button class="link-btn" @click="viewFullDetails">
          View full campaign details →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(12, 45, 80, 0.15);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0b2d50;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #0b2d50;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #47bfa9;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-wrap {
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
}

.campaign-name {
  font-size: 16px;
  font-weight: 700;
  color: #0b2d50;
  margin: 0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.detail-row dt {
  color: #64748b;
}

.detail-row dd {
  color: #0b2d50;
  font-weight: 600;
}

.primary-btn {
  width: 100%;
  background: #47bfa9;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.primary-btn:hover {
  background: #3aa893;
}

.link-btn {
  display: block;
  width: 100%;
  text-align: center;
  margin-top: 14px;
  background: none;
  border: none;
  color: #47bfa9;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
