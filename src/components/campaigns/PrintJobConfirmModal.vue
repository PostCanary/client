<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";

export type PrintJobReturnAddress = {
  name: string;
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  zip5: string;
  zip4?: string;
};

export type PrintJobConfirmPayload = {
  cardNumber: number;
  returnAddress: PrintJobReturnAddress;
};

const props = defineProps<{
  open: boolean;
  orgId: string;
  recipientCount: number;
  cardCount: number;
  frontPreviewUrl?: string | null;
  backPreviewUrl?: string | null;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: PrintJobConfirmPayload): void;
}>();

const modalRef = ref<HTMLElement | null>(null);
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(modalRef, {
  immediate: false,
  returnFocusOnDeactivate: true,
  escapeDeactivates: false,
  allowOutsideClick: true,
});

const cardNumber = ref<number>(1);
const name = ref("");
const line1 = ref("");
const line2 = ref("");
const city = ref("");
const state = ref("");
const zip5 = ref("");
const zip4 = ref("");

function localStorageKey() {
  return `postcanary:lastReturnAddress:${props.orgId}`;
}

function clearReturnAddress() {
  name.value = "";
  line1.value = "";
  line2.value = "";
  city.value = "";
  state.value = "";
  zip5.value = "";
  zip4.value = "";
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function loadFromLocalStorage(opts: { isTenantChange?: boolean } = {}) {
  // On tenant (orgId) change, ANY load failure must clear to avoid bleeding
  // a previous org's typed return address into the new org context. On
  // same-org rehydrations (mount + props.open reopen), preserve in-progress
  // typed fields when storage is corrupt / unavailable / non-object so the
  // user does not lose data they entered manually.
  const failureClears = opts.isTenantChange === true;
  let parsed: Record<string, unknown> | null = null;
  try {
    const raw = window.localStorage.getItem(localStorageKey());
    if (!raw) {
      // No stored value for this org → clear any in-memory residue from prior org.
      clearReturnAddress();
      return;
    }
    const decoded = JSON.parse(raw) as unknown;
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
      parsed = decoded as Record<string, unknown>;
    }
  } catch {
    // localStorage unavailable or corrupt JSON.
    if (failureClears) clearReturnAddress();
    return;
  }
  if (!parsed) {
    // Stored value was non-object (array / primitive).
    if (failureClears) clearReturnAddress();
    return;
  }
  // Successful read: replace refs from validated parse.
  name.value = asString(parsed.name);
  line1.value = asString(parsed.line_1);
  line2.value = asString(parsed.line_2);
  city.value = asString(parsed.city);
  state.value = asString(parsed.state);
  zip5.value = asString(parsed.zip5);
  zip4.value = asString(parsed.zip4);
}

function resetCardNumber() {
  cardNumber.value = props.cardCount > 0 ? 1 : 1;
}

onMounted(() => {
  loadFromLocalStorage();
  resetCardNumber();
});

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      loadFromLocalStorage();
      resetCardNumber();
      await nextTick();
      try {
        activateTrap();
      } catch {
        // focus-trap throws if no focusable element is present; treat as no-op.
      }
    } else {
      deactivateTrap();
    }
  },
);

onBeforeUnmount(() => {
  deactivateTrap();
});

watch(
  () => props.orgId,
  () => {
    if (props.open) {
      loadFromLocalStorage({ isTenantChange: true });
    }
  },
);

const zip5Valid = computed(() => /^\d{5}$/.test(zip5.value));
const zip4Valid = computed(() => zip4.value === "" || /^\d{4}$/.test(zip4.value));
const stateValid = computed(() => /^[A-Za-z]{2}$/.test(state.value));

const canSubmit = computed(() => {
  if (props.submitting) return false;
  if (!name.value.trim()) return false;
  if (!line1.value.trim()) return false;
  if (!city.value.trim()) return false;
  if (!stateValid.value) return false;
  if (!zip5Valid.value) return false;
  if (!zip4Valid.value) return false;
  return true;
});

function buildReturnAddress(): PrintJobReturnAddress {
  const ra: PrintJobReturnAddress = {
    name: name.value.trim(),
    line_1: line1.value.trim(),
    city: city.value.trim(),
    state: state.value.trim().toUpperCase(),
    zip5: zip5.value.trim(),
  };
  const trimmedLine2 = line2.value.trim();
  if (trimmedLine2) ra.line_2 = trimmedLine2;
  const trimmedZip4 = zip4.value.trim();
  if (trimmedZip4) ra.zip4 = trimmedZip4;
  return ra;
}

function onSubmit() {
  if (!canSubmit.value) return;
  emit("submit", {
    cardNumber: cardNumber.value,
    returnAddress: buildReturnAddress(),
  });
}

function onClose() {
  if (props.submitting) return;
  emit("close");
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="onClose">
    <div
      ref="modalRef"
      class="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-job-modal-title"
      tabindex="-1"
      @keydown.esc="onClose"
    >
      <header class="modal-header">
        <h3 id="print-job-modal-title">Submit Print Job</h3>
        <button class="close-btn" type="button" :disabled="submitting" @click="onClose">&times;</button>
      </header>

      <div class="modal-body">
        <section class="row">
          <div class="row-label">Recipients</div>
          <div class="row-value">{{ recipientCount }} {{ recipientCount === 1 ? "recipient" : "recipients" }} in this campaign</div>
        </section>

        <section class="row">
          <div class="row-label">Cost</div>
          <div class="row-value cost-value">$0.00 <span class="cost-note">— beta</span></div>
        </section>

        <section class="row">
          <div class="row-label">Design preview</div>
          <div class="design-preview">
            <div class="preview-side">
              <div class="preview-label">Front</div>
              <img v-if="frontPreviewUrl" :src="frontPreviewUrl" alt="Front design preview" class="preview-img" />
              <div v-else class="preview-placeholder">No preview available</div>
            </div>
            <div class="preview-side">
              <div class="preview-label">Back</div>
              <img v-if="backPreviewUrl" :src="backPreviewUrl" alt="Back design preview" class="preview-img" />
              <div v-else class="preview-placeholder">No preview available</div>
            </div>
          </div>
        </section>

        <section v-if="cardCount > 1" class="row">
          <div class="row-label">Card to send</div>
          <div class="card-picker">
            <label v-for="n in cardCount" :key="n" class="card-radio">
              <input type="radio" :value="n" v-model="cardNumber" />
              <span>Card {{ n }}</span>
            </label>
          </div>
        </section>

        <section class="return-address">
          <h4 class="section-title">Return address</h4>
          <div class="form-grid">
            <label class="field field-full">
              <span>Name</span>
              <input v-model="name" type="text" autocomplete="name" required />
            </label>
            <label class="field field-full">
              <span>Address line 1</span>
              <input v-model="line1" type="text" autocomplete="address-line1" required />
            </label>
            <label class="field field-full">
              <span>Address line 2 <em class="optional">(optional)</em></span>
              <input v-model="line2" type="text" autocomplete="address-line2" />
            </label>
            <label class="field field-city">
              <span>City</span>
              <input v-model="city" type="text" autocomplete="address-level2" required />
            </label>
            <label class="field field-state">
              <span>State</span>
              <input
                v-model="state"
                type="text"
                maxlength="2"
                autocomplete="address-level1"
                required
                :aria-invalid="state !== '' && !stateValid"
              />
            </label>
            <label class="field field-zip5">
              <span>ZIP</span>
              <input
                v-model="zip5"
                type="text"
                inputmode="numeric"
                maxlength="5"
                autocomplete="postal-code"
                required
                :aria-invalid="zip5 !== '' && !zip5Valid"
              />
            </label>
            <label class="field field-zip4">
              <span>+4 <em class="optional">(optional)</em></span>
              <input
                v-model="zip4"
                type="text"
                inputmode="numeric"
                maxlength="4"
                :aria-invalid="zip4 !== '' && !zip4Valid"
              />
            </label>
          </div>
        </section>
      </div>

      <footer class="modal-footer">
        <button type="button" class="btn-cancel" :disabled="submitting" @click="onClose">Cancel</button>
        <button type="button" class="btn-submit" :disabled="!canSubmit" @click="onSubmit">
          {{ submitting ? "Submitting..." : "Submit Print Job" }}
        </button>
      </footer>
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
  max-width: 540px;
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

.close-btn:hover:not(:disabled) {
  color: #0c2d50;
}

.close-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.row-value {
  font-size: 14px;
  color: #0c2d50;
}

.cost-value {
  font-weight: 600;
}

.cost-note {
  font-weight: 400;
  color: #64748b;
}

.design-preview {
  display: flex;
  gap: 12px;
}

.preview-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.preview-img {
  width: 100%;
  height: 88px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.preview-placeholder {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #94a3b8;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
}

.card-picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #0c2d50;
  cursor: pointer;
}

.return-address .section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0c2d50;
  margin: 0 0 8px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 8px 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #475569;
}

.field-full {
  grid-column: 1 / -1;
}

.field-city {
  grid-column: 1 / 2;
}

.field-state {
  grid-column: 2 / 3;
}

.field-zip5 {
  grid-column: 3 / 4;
}

.field-zip4 {
  grid-column: 4 / 5;
}

.field input {
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #0c2d50;
  background: #fff;
}

.field input:focus {
  outline: 2px solid #47bfa9;
  outline-offset: 1px;
  border-color: #47bfa9;
}

.field input[aria-invalid="true"] {
  border-color: #dc2626;
}

.optional {
  color: #94a3b8;
  font-style: normal;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel:hover:not(:disabled) {
  background: #f8fafc;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-submit {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  background: #47bfa9;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
  background: #3aa893;
}

.btn-submit:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>
