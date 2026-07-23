<script setup lang="ts">
import { computed, ref } from "vue";
import {
  createDesign,
  uploadDesignAsset,
  type DesignLibraryEntry,
} from "@/api/designs";

const emit = defineEmits<{
  close: [];
  saved: [design: DesignLibraryEntry];
}>();

const acceptedTypes = "application/pdf,image/png,image/jpeg";
const name = ref(
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date()),
);
const frontFile = ref<File | null>(null);
const backFile = ref<File | null>(null);
const blankBack = ref(true);
const saving = ref(false);
const error = ref("");

const canSave = computed(
  () => name.value.trim().length > 0 && frontFile.value !== null && !saving.value,
);

function pickFile(event: Event, side: "front" | "back") {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  if (side === "front") frontFile.value = file;
  else backFile.value = file;
}

function chooseBlankBack() {
  blankBack.value = true;
  backFile.value = null;
}

function chooseUploadedBack() {
  blankBack.value = false;
}

async function save() {
  if (!canSave.value || !frontFile.value) return;
  if (!blankBack.value && !backFile.value) {
    error.value = "Choose a back file or select Blank back.";
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    const frontAsset = await uploadDesignAsset(frontFile.value);
    const backAsset =
      blankBack.value || !backFile.value ? null : await uploadDesignAsset(backFile.value);
    const design = await createDesign({
      name: name.value.trim(),
      front_asset: frontAsset,
      back_asset: backAsset,
      blank_back: blankBack.value,
    });
    emit("saved", design);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Could not save this design.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="modal-shell" role="dialog" aria-modal="true" aria-labelledby="upload-design-title">
    <button class="modal-backdrop" type="button" aria-label="Close upload" @click="emit('close')" />
    <form class="modal-card" data-testid="design-upload-modal" @submit.prevent="save">
      <div class="modal-header">
        <div>
          <h2 id="upload-design-title">Upload a design</h2>
          <p>Save print-ready artwork for everyone in your organization.</p>
        </div>
        <button type="button" aria-label="Close" @click="emit('close')">×</button>
      </div>

      <label class="field">
        <span>Design name</span>
        <input v-model="name" data-testid="design-name-input" maxlength="200" />
      </label>

      <label class="field">
        <span>Front artwork <strong>Required</strong></span>
        <input
          type="file"
          :accept="acceptedTypes"
          data-testid="design-front-input"
          @change="pickFile($event, 'front')"
        />
        <small v-if="frontFile">{{ frontFile.name }}</small>
      </label>

      <fieldset class="field">
        <legend>Back artwork</legend>
        <label class="choice">
          <input
            type="radio"
            name="back-choice"
            :checked="blankBack"
            data-testid="design-blank-back"
            @change="chooseBlankBack"
          />
          Blank back
        </label>
        <label class="choice">
          <input
            type="radio"
            name="back-choice"
            :checked="!blankBack"
            data-testid="design-upload-back-choice"
            @change="chooseUploadedBack"
          />
          Upload back artwork
        </label>
        <input
          v-if="!blankBack"
          type="file"
          :accept="acceptedTypes"
          data-testid="design-back-input"
          @change="pickFile($event, 'back')"
        />
      </fieldset>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div class="modal-actions">
        <button type="button" class="secondary" @click="emit('close')">Cancel</button>
        <button type="submit" class="primary" :disabled="!canSave" data-testid="save-design">
          {{ saving ? "Saving…" : "Save design" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.modal-shell { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 20px; }
.modal-backdrop { position: absolute; inset: 0; border: 0; background: rgba(12, 45, 80, .56); }
.modal-card { position: relative; width: min(520px, 100%); border-radius: 16px; background: white; padding: 24px; box-shadow: 0 24px 70px rgba(12, 45, 80, .28); }
.modal-header { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.modal-header h2 { margin: 0; color: #0c2d50; font-size: 20px; }
.modal-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.modal-header button { border: 0; background: transparent; color: #64748b; font-size: 24px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 7px; margin: 16px 0; border: 0; padding: 0; color: #0c2d50; font-size: 13px; font-weight: 700; }
.field input:not([type="radio"]) { border: 1px solid #dbe3ea; border-radius: 8px; padding: 10px; font: inherit; font-weight: 500; }
.field strong { color: #64748b; font-size: 11px; }
.field small { color: #64748b; font-weight: 500; }
.choice { display: flex; align-items: center; gap: 8px; color: #334155; font-weight: 500; }
.error { color: #b91c1c; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.modal-actions button { border-radius: 8px; cursor: pointer; font-weight: 700; padding: 10px 14px; }
.secondary { border: 1px solid #dbe3ea; background: white; color: #334155; }
.primary { border: 0; background: #47bfa9; color: white; }
.primary:disabled { cursor: not-allowed; opacity: .5; }
</style>
