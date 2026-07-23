<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import DesignLibraryUploadModal from "@/components/design/DesignLibraryUploadModal.vue";
import {
  deleteDesign,
  getDesign,
  listDesigns,
  type DesignLibraryEntry,
} from "@/api/designs";
import { mediaSrc } from "@/utils/mediaSrc";
import { captureEvent } from "@/composables/usePostHog";
import {
  visibleDesignLibraryTemplates,
  type DesignLibraryTemplate,
} from "@/data/templates";

type TemplateWithAsset = DesignLibraryTemplate & { pdfUrl?: string };

const message = useMessage();
const router = useRouter();
const designs = ref<DesignLibraryEntry[]>([]);
const templates = computed(
  () => visibleDesignLibraryTemplates as TemplateWithAsset[],
);
const selected = ref<DesignLibraryEntry | null>(null);
const loading = ref(true);
const showUpload = ref(false);

async function load() {
  loading.value = true;
  try {
    designs.value = await listDesigns();
  } catch {
    message.error("Could not load your designs.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  captureEvent("designs_page_viewed");
  void load();
});

function uploaded(design: DesignLibraryEntry) {
  designs.value = [design, ...designs.value];
  showUpload.value = false;
  selected.value = design;
  captureEvent("design_library_uploaded", { design_id: design.id });
}

async function openDetail(design: DesignLibraryEntry) {
  try {
    selected.value = await getDesign(design.id);
  } catch {
    message.error("Could not load that design.");
  }
}

async function remove(design: DesignLibraryEntry) {
  if (!window.confirm(`Delete "${design.name}" from the design library?`)) return;
  try {
    await deleteDesign(design.id);
    designs.value = designs.value.filter((item) => item.id !== design.id);
    if (selected.value?.id === design.id) selected.value = null;
    message.success("Design deleted. Existing campaign references were preserved.");
  } catch {
    message.error("Could not delete that design.");
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function sendThisPostcard(template: DesignLibraryTemplate) {
  captureEvent("designs_template_started", {
    template_id: template.id,
    render_template_id: template.renderTemplateId,
  });
  router.push({
    path: "/app/send",
    query: {
      templateId: template.id,
      goal: template.goalTypes[0],
    },
  });
}

function downloadPdf(template: TemplateWithAsset) {
  if (!template.pdfUrl) return;
  const link = document.createElement("a");
  link.href = template.pdfUrl;
  link.download = `${template.name}.pdf`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
</script>

<template>
  <div class="designs-page">
    <header class="designs-header">
      <div>
        <h1>Designs</h1>
        <p>Reusable postcard artwork shared across your organization.</p>
      </div>
      <button class="primary" type="button" data-testid="upload-design" @click="showUpload = true">
        Upload design
      </button>
    </header>

    <p v-if="loading" class="status">Loading designs…</p>

    <div v-else-if="designs.length" class="designs-grid">
      <article v-for="design in designs" :key="design.id" class="design-card">
        <button class="thumbnail" type="button" @click="openDetail(design)">
          <img
            v-if="design.front_asset.mime_type.startsWith('image/')"
            :src="mediaSrc(design.front_asset.url)"
            :alt="`${design.name} front`"
            data-testid="design-front-thumbnail"
          />
          <object
            v-else
            :data="mediaSrc(design.front_asset.url)"
            type="application/pdf"
            tabindex="-1"
            aria-hidden="true"
          />
        </button>
        <div class="card-meta">
          <strong>{{ design.name }}</strong>
          <span>{{ formatDate(design.created_at) }}</span>
          <span>{{ design.blank_back ? "Blank back" : "Front + back" }}</span>
          <div class="card-actions">
            <button type="button" @click="openDetail(design)">View</button>
            <button type="button" class="danger" @click="remove(design)">Delete</button>
          </div>
        </div>
      </article>
    </div>

    <section v-else class="empty">
      <h2>No saved designs yet</h2>
      <p>Upload print-ready artwork once, then reuse it across campaigns.</p>
      <button class="primary" type="button" @click="showUpload = true">Upload your first design</button>
    </section>

    <DesignLibraryUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @saved="uploaded"
    />

    <section class="templates-section">
      <header>
        <h2>Postcard templates</h2>
        <p>Start a new campaign from an approved launch template.</p>
      </header>
      <div class="template-grid">
        <article
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          data-testid="design-library-template"
        >
          <div class="template-preview">
            <span>{{ template.cardPosition.replace("_", " ") }}</span>
            <strong>{{ template.name }}</strong>
          </div>
          <div class="template-meta">
            <strong>{{ template.name }}</strong>
            <span>{{ template.renderTemplateId }}</span>
            <button type="button" class="primary" @click="sendThisPostcard(template)">
              Send this Postcard
            </button>
            <button
              v-if="template.pdfUrl"
              type="button"
              class="download"
              @click="downloadPdf(template)"
            >
              Download PDF
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="selected" class="detail-shell" role="dialog" aria-modal="true" aria-label="Design detail">
      <button class="detail-backdrop" type="button" aria-label="Close detail" @click="selected = null" />
      <article class="detail-card" data-testid="design-detail">
        <header>
          <div>
            <h2>{{ selected.name }}</h2>
            <p>{{ selected.blank_back ? "Blank back selected" : "Front and back artwork" }}</p>
          </div>
          <button type="button" aria-label="Close" @click="selected = null">×</button>
        </header>
        <div class="detail-sides">
          <figure>
            <figcaption>Front</figcaption>
            <img
              v-if="selected.front_asset.mime_type.startsWith('image/')"
              :src="mediaSrc(selected.front_asset.url)"
              :alt="`${selected.name} front detail`"
            />
            <object
              v-else
              :data="mediaSrc(selected.front_asset.url)"
              type="application/pdf"
              aria-label="Front PDF"
            />
          </figure>
          <figure>
            <figcaption>Back</figcaption>
            <div v-if="selected.blank_back" class="blank-back" data-testid="blank-back-state">
              Blank back
            </div>
            <img
              v-else-if="selected.back_asset?.mime_type.startsWith('image/')"
              :src="mediaSrc(selected.back_asset.url)"
              :alt="`${selected.name} back detail`"
            />
            <object
              v-else-if="selected.back_asset"
              :data="mediaSrc(selected.back_asset.url)"
              type="application/pdf"
              aria-label="Back PDF"
            />
          </figure>
        </div>
        <button class="danger detail-delete" type="button" @click="remove(selected)">Delete design</button>
      </article>
    </div>
  </div>
</template>

<style scoped>
.designs-page { max-width: 1060px; }
.designs-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.designs-header h1 { margin: 0; color: #0c2d50; font-size: 24px; }
.designs-header p, .status, .empty p, .detail-card p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
.primary { border: 0; border-radius: 8px; background: #47bfa9; color: white; cursor: pointer; font-weight: 700; padding: 10px 15px; }
.designs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.design-card { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px; background: white; }
.thumbnail { display: block; width: 100%; aspect-ratio: 6.25 / 9.25; max-height: 280px; padding: 0; border: 0; background: #f1f5f9; cursor: pointer; }
.thumbnail img, .thumbnail object { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.card-meta { display: flex; flex-direction: column; gap: 4px; padding: 14px; color: #64748b; font-size: 12px; }
.card-meta strong { color: #0c2d50; font-size: 14px; }
.card-actions { display: flex; gap: 12px; margin-top: 8px; }
.card-actions button, .danger { border: 0; background: transparent; color: #178e7c; cursor: pointer; font-weight: 700; padding: 0; }
.card-actions .danger, .danger { color: #b42318; }
.empty { padding: 44px; border: 1px dashed #cbd5e1; border-radius: 12px; text-align: center; }
.empty h2 { margin: 0; color: #0c2d50; font-size: 18px; }
.empty .primary { margin-top: 18px; }
.templates-section { margin-top: 36px; padding-top: 28px; border-top: 1px solid #e2e8f0; }
.templates-section h2 { margin: 0; color: #0c2d50; font-size: 18px; }
.templates-section header p { margin: 4px 0 18px; color: #64748b; font-size: 13px; }
.template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.template-card { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 12px; background: white; }
.template-preview { display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; aspect-ratio: 4 / 3; padding: 14px; background: linear-gradient(135deg, rgba(71, 191, 169, .16), rgba(12, 45, 80, .08)); color: #0c2d50; }
.template-preview span { align-self: flex-start; border-radius: 999px; background: rgba(255, 255, 255, .8); padding: 4px 8px; color: #64748b; font-size: 11px; text-transform: capitalize; }
.template-meta { display: flex; flex-direction: column; gap: 6px; padding: 14px; color: #64748b; font-size: 12px; }
.template-meta > strong { color: #0c2d50; font-size: 14px; }
.template-meta .primary { margin-top: 6px; }
.download { border: 0; background: transparent; color: #178e7c; cursor: pointer; font-weight: 700; }
.detail-shell { position: fixed; inset: 0; z-index: 65; display: grid; place-items: center; padding: 20px; }
.detail-backdrop { position: absolute; inset: 0; border: 0; background: rgba(12, 45, 80, .56); }
.detail-card { position: relative; width: min(760px, 100%); border-radius: 16px; background: white; padding: 24px; }
.detail-card header { display: flex; align-items: start; justify-content: space-between; margin-bottom: 20px; }
.detail-card h2 { margin: 0; color: #0c2d50; }
.detail-card header button { border: 0; background: transparent; color: #64748b; cursor: pointer; font-size: 24px; }
.detail-sides { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.detail-sides figure { margin: 0; }
.detail-sides figcaption { margin-bottom: 8px; color: #0c2d50; font-size: 13px; font-weight: 700; }
.detail-sides img, .detail-sides object, .blank-back { width: 100%; aspect-ratio: 6.25 / 9.25; max-height: 430px; border: 1px solid #e2e8f0; border-radius: 10px; object-fit: contain; background: #f8fafc; }
.blank-back { display: grid; place-items: center; color: #94a3b8; }
.detail-delete { margin-top: 20px; }
@media (max-width: 640px) { .designs-header { align-items: flex-start; flex-direction: column; } .detail-sides { grid-template-columns: 1fr; } }
</style>
