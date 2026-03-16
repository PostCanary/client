<script setup lang="ts">
import { ref, computed } from "vue";
import { useCampaignStore } from "@/stores/useCampaignStore";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const campaignStore = useCampaignStore();

const editingId = ref<string | null>(null);
const editName = ref("");
const deletingId = ref<string | null>(null);

function startEdit(id: string, currentName: string) {
  editingId.value = id;
  editName.value = currentName;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = "";
}

async function saveEdit(id: string) {
  const name = editName.value.trim();
  if (!name) {
    cancelEdit();
    return;
  }
  try {
    await campaignStore.updateCampaign(id, { name });
  } catch (e) {
    console.error("Failed to rename campaign", e);
  }
  cancelEdit();
}

function confirmDelete(id: string) {
  deletingId.value = id;
}

function cancelDelete() {
  deletingId.value = null;
}

async function doDelete(id: string) {
  try {
    await campaignStore.deleteCampaign(id);
    window.dispatchEvent(
      new CustomEvent("mt:campaign-changed", { detail: { campaignId: null } }),
    );
  } catch (e) {
    console.error("Failed to delete campaign", e);
  }
  deletingId.value = null;
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <header class="modal-header">
        <h3>Manage Campaigns</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </header>

      <div class="modal-body">
        <div
          v-if="campaignStore.campaigns.length === 0"
          class="empty-state"
        >
          No campaigns yet. Create one from the campaign dropdown.
        </div>

        <ul class="campaign-list">
          <li
            v-for="c in campaignStore.campaigns"
            :key="c.id"
            class="campaign-item"
          >
            <!-- Editing mode -->
            <template v-if="editingId === c.id">
              <input
                v-model="editName"
                class="edit-input"
                @keydown.enter.prevent="saveEdit(c.id)"
                @keydown.escape.prevent="cancelEdit"
                autofocus
              />
              <div class="item-actions">
                <button class="action-btn save" @click="saveEdit(c.id)">Save</button>
                <button class="action-btn cancel" @click="cancelEdit">Cancel</button>
              </div>
            </template>

            <!-- Delete confirmation -->
            <template v-else-if="deletingId === c.id">
              <span class="campaign-name delete-confirm-text">
                Delete "{{ c.name }}"?
              </span>
              <div class="item-actions">
                <button class="action-btn delete" @click="doDelete(c.id)">Delete</button>
                <button class="action-btn cancel" @click="cancelDelete">Cancel</button>
              </div>
            </template>

            <!-- Normal display -->
            <template v-else>
              <span class="campaign-name">{{ c.name }}</span>
              <div class="item-actions">
                <button class="action-btn edit" @click="startEdit(c.id, c.name)">Rename</button>
                <button class="action-btn delete-trigger" @click="confirmDelete(c.id)">Delete</button>
              </div>
            </template>
          </li>
        </ul>
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
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(12, 45, 80, 0.15);
  width: 100%;
  max-width: 460px;
  max-height: 80vh;
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
  color: #0c2d50;
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
  color: #0c2d50;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 24px 0;
}

.campaign-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campaign-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.campaign-name {
  font-size: 15px;
  font-weight: 500;
  color: #0c2d50;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-confirm-text {
  color: #dc2626;
  font-weight: 600;
}

.edit-input {
  flex: 1;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #47bfa9;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  color: #0c2d50;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.edit-input:focus {
  outline: none;
}

.item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.12s ease;
}

.action-btn.edit {
  background: #e0f2fe;
  color: #0369a1;
}
.action-btn.edit:hover {
  background: #bae6fd;
}

.action-btn.delete-trigger {
  background: #fee2e2;
  color: #dc2626;
}
.action-btn.delete-trigger:hover {
  background: #fecaca;
}

.action-btn.save {
  background: #d1fae5;
  color: #047857;
}
.action-btn.save:hover {
  background: #a7f3d0;
}

.action-btn.delete {
  background: #dc2626;
  color: #fff;
}
.action-btn.delete:hover {
  background: #b91c1c;
}

.action-btn.cancel {
  background: #f1f5f9;
  color: #64748b;
}
.action-btn.cancel:hover {
  background: #e2e8f0;
}
</style>
