<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { useCampaignStore } from "@/stores/useCampaignStore";

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "confirm", campaignId: string | null): void;
  (e: "skip"): void;
}>();

const campaignStore = useCampaignStore();
campaignStore.hydrate();

const dialogEl = ref<HTMLElement | null>(null);
const selectedCampaignId = ref<string | null>(null);
const showNewInput = ref(false);
const newName = ref("");
const newInputEl = ref<HTMLInputElement | null>(null);
const creating = ref(false);

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    selectedCampaignId.value = campaignStore.activeCampaignId;
    showNewInput.value = false;
    newName.value = "";
    await campaignStore.fetchCampaigns();
    await nextTick();
    dialogEl.value?.focus();
  },
  { immediate: true },
);

function onSelectChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  if (val === "__new__") {
    showNewInput.value = true;
    nextTick(() => newInputEl.value?.focus());
    // Reset select to previous value visually
    (event.target as HTMLSelectElement).value = selectedCampaignId.value ?? "";
    return;
  }
  selectedCampaignId.value = val || null;
}

async function createCampaign() {
  const name = newName.value.trim();
  if (!name) {
    showNewInput.value = false;
    return;
  }
  creating.value = true;
  try {
    const campaign = await campaignStore.createCampaign(name);
    selectedCampaignId.value = campaign.id;
  } catch (err) {
    console.error("[CampaignPrompt] Failed to create campaign", err);
  } finally {
    newName.value = "";
    showNewInput.value = false;
    creating.value = false;
  }
}

function cancelNew() {
  newName.value = "";
  showNewInput.value = false;
}

function onConfirm() {
  campaignStore.setActiveCampaign(selectedCampaignId.value);
  window.dispatchEvent(
    new CustomEvent("mt:campaign-changed", {
      detail: { campaignId: selectedCampaignId.value },
    }),
  );
  emit("confirm", selectedCampaignId.value);
}

function onSkip() {
  emit("skip");
}

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) onSkip();
}

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) onSkip();
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener("keydown", onEsc);
    else window.removeEventListener("keydown", onEsc);
  },
);

onBeforeUnmount(() => window.removeEventListener("keydown", onEsc));
</script>

<template>
  <div
    v-if="open"
    class="prompt-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="campaign-prompt-title"
    @click="onBackdrop"
  >
    <section class="prompt-modal" role="document" tabindex="-1" ref="dialogEl">
      <header class="prompt-header">
        <span class="dot" aria-hidden="true" />
        <h3 id="campaign-prompt-title">Assign to a Campaign</h3>
      </header>

      <div class="prompt-body">
        <p class="prompt-blurb">
          It's best practice to assign your mail to a campaign. This allows you
          to track different campaigns to see how different promotions, deals,
          and overall strategies work compared to one another. Without creating
          campaigns, all of your mail will be grouped together. Even with
          campaigns you can still view your mail's performance as a total group.
        </p>
        <p class="prompt-hint">
          Use a naming convention like
          <strong>Season/Year/Promotion</strong> — e.g.
          <em>Spring 2026: 50% Off</em>
        </p>

        <div class="campaign-field">
          <label class="field-label">Campaign</label>
          <template v-if="showNewInput">
            <input
              ref="newInputEl"
              v-model="newName"
              type="text"
              placeholder="Campaign name…"
              class="campaign-input"
              @keydown.enter.prevent="createCampaign"
              @keydown.escape.prevent="cancelNew"
            />
            <div class="new-actions">
              <button type="button" class="btn-link" @click="cancelNew">
                Cancel
              </button>
              <button
                type="button"
                class="btn-link btn-link--primary"
                :disabled="!newName.trim() || creating"
                @click="createCampaign"
              >
                {{ creating ? 'Creating…' : 'Create' }}
              </button>
            </div>
          </template>
          <template v-else>
            <select
              class="campaign-select"
              :value="selectedCampaignId ?? ''"
              @change="onSelectChange"
            >
              <option value="">— Select a campaign —</option>
              <option
                v-for="c in campaignStore.campaigns"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }}
              </option>
              <option disabled>───────────</option>
              <option value="__new__">+ New Campaign</option>
            </select>
          </template>
        </div>
      </div>

      <footer class="prompt-footer">
        <button type="button" class="btn btn-ghost" @click="onSkip">
          No thanks
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!selectedCampaignId || creating"
          @click="onConfirm"
        >
          Assign &amp; Continue
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.prompt-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.prompt-modal {
  width: min(480px, 94vw);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.16);
  border: 1px solid #dde3ea;
  display: flex;
  flex-direction: column;
  outline: none;
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 14px 20px 10px;
  border-bottom: 1px solid #e2e8f0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, #5eead4 0%, #47bfa9 55%, #0f766e 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 0 0 2px rgba(71, 191, 169, 0.25);
}

.prompt-header h3 {
  font-size: 16px;
  margin: 0;
  color: #0c2d50;
}

.prompt-body {
  padding: 16px 20px;
}

.prompt-blurb {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.55;
  color: #4b5563;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
}

.prompt-hint {
  margin: 0 0 16px;
  font-size: 12px;
  color: #6b7280;
}

.prompt-hint strong {
  font-weight: 600;
  color: #0c2d50;
}

.prompt-hint em {
  font-style: normal;
  color: #0f766e;
  font-weight: 500;
}

.campaign-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #0c2d50;
}

.campaign-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #0c2d50;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.campaign-select:hover {
  border-color: #47bfa9;
}

.campaign-select:focus {
  outline: none;
  border-color: #47bfa9;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.campaign-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #47bfa9;
  background: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #0c2d50;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.campaign-input:focus {
  outline: none;
}

.new-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-link {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  padding: 2px 4px;
}

.btn-link:hover {
  color: #0c2d50;
}

.btn-link--primary {
  color: #0f766e;
}

.btn-link--primary:hover {
  color: #0a5c54;
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: default;
}

.prompt-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 10px 20px 14px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  height: 40px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 0 14px;
}

.btn-primary {
  background: #47bfa9;
  color: #ffffff;
  border-color: #47bfa9;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: default;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.98);
}

.btn-ghost {
  background: #ffffff;
  color: #0c2d50;
  border-color: #cfd6dd;
}

.btn-ghost:hover {
  background: #f8fafb;
}
</style>
