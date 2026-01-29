<template>
  <div
    v-if="open"
    class="mapper-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="mapper-title"
    aria-describedby="mapper-desc"
    @click="onBackdrop"
  >
    <section class="mapper-modal" role="document" tabindex="-1" ref="dialogEl">
      <header class="mapper-header">
        <span class="dot" aria-hidden="true" />
        <div class="titles">
          <h3 id="mapper-title">Map Columns</h3>
          <p class="subtitle">
            Map your CSV headers to MailTrace fields used for matching.
          </p>
        </div>
      </header>

      <div class="mapper-body">
        <p id="mapper-desc" class="mapper-hint">
          Choose which <strong>file headers</strong> correspond to each field.
          Leave blank if a field doesn’t exist in your data.
        </p>

        <div class="header-type-legend">
          <span class="legend-label">Header types:</span>
          <span class="legend-pill">Text</span>
          <span class="legend-pill">Number</span>
          <span class="legend-pill">Date</span>
        </div>

        <div class="mapper-grid">
          <!-- MAIL SIDE -->
          <article class="side-card">
            <div class="side-header">
              <h4>Mail CSV</h4>
              <span class="side-sub">Outbound mailers</span>
            </div>
            <div class="field-list">
              <div
                v-for="f in mailFields"
                :key="'mail-' + f"
                class="field-row"
                :class="{ 'has-error': !!fieldError('mail', f) }"
              >
                <div class="field-meta">
                  <label :for="'mail-' + f" class="field-label">
                    {{ labelForMail(f) }}
                  </label>
                  <span v-if="isRequired('mail', f)" class="pill pill-required">
                    Required
                  </span>
                  <span v-else class="pill pill-optional"> Optional </span>
                </div>

                <div class="field-control">
                  <select
                    class="field-select"
                    :class="{
                      'is-missing': isRequired('mail', f) && !draft.mail[f],
                      'is-error': !!fieldError('mail', f),
                    }"
                    :id="'mail-' + f"
                    v-model="draft.mail[f]"
                    @change="onFieldChange('mail', f)"
                  >
                    <option value=""></option>
                    <option
                      v-for="h in headersForField('mail', f)"
                      :key="'mh-' + h"
                      :value="h"
                    >
                      {{ headerLabel("mail", h) }}
                    </option>
                  </select>

                  <p v-if="fieldError('mail', f)" class="error-msg">
                    {{ fieldError("mail", f) }}
                  </p>
                  <p v-else-if="exampleText('mail', f)" class="sample">
                    e.g. {{ exampleText("mail", f) }}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <!-- CRM SIDE -->
          <article class="side-card">
            <div class="side-header">
              <h4>CRM CSV</h4>
              <span class="side-sub">Jobs / conversions</span>
            </div>
            <div class="field-list">
              <div
                v-for="f in crmFields"
                :key="'crm-' + f"
                class="field-row"
                :class="{ 'has-error': !!fieldError('crm', f) }"
              >
                <div class="field-meta">
                  <label :for="'crm-' + f" class="field-label">
                    {{ labelForCrm(f) }}
                  </label>
                  <span v-if="isRequired('crm', f)" class="pill pill-required">
                    Required
                  </span>
                  <span v-else class="pill pill-optional"> Optional </span>
                </div>

                <div class="field-control">
                  <select
                    class="field-select"
                    :class="{
                      'is-missing': isRequired('crm', f) && !draft.crm[f],
                      'is-error': !!fieldError('crm', f),
                    }"
                    :id="'crm-' + f"
                    v-model="draft.crm[f]"
                    @change="onFieldChange('crm', f)"
                  >
                    <option value=""></option>
                    <option
                      v-for="h in headersForField('crm', f)"
                      :key="'ch-' + h"
                      :value="h"
                    >
                      {{ headerLabel("crm", h) }}
                    </option>
                  </select>

                  <p v-if="fieldError('crm', f)" class="error-msg">
                    {{ fieldError("crm", f) }}
                  </p>
                  <p v-else-if="exampleText('crm', f)" class="sample">
                    e.g. {{ exampleText("crm", f) }}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <footer class="mapper-footer">
        <button type="button" class="btn btn-ghost" @click="$emit('close')">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="saveDisabled"
          @click="confirm"
        >
          <span v-if="saving">Saving…</span>
          <span v-else>Save mapping</span>
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, toRaw, computed } from "vue";
import type { Mapping as MapperMapping } from "@/api/mapper";

type MappingSide = Record<string, string>;
type HeaderType =
  | "string"
  | "number"
  | "date"
  | "state"
  | "zip"
  | "currency"
  | "unknown";

type CanonicalType = "string" | "state" | "zip" | "date" | "currency";

const props = defineProps<{
  open: boolean;
  mailHeaders: string[];
  crmHeaders: string[];
  mailHeaderTypes: Record<string, HeaderType>;
  crmHeaderTypes: Record<string, HeaderType>;
  mailSamples: Record<string, any>[]; // currently unused but kept for future
  crmSamples: Record<string, any>[];
  mailFields: string[];
  crmFields: string[];
  mailLabels?: Record<string, string>;
  crmLabels?: Record<string, string>;
  initialMapping?: Partial<MapperMapping>;
  requiredMail: string[];
  requiredCrm: string[];
  errors?: {
    mail: Record<string, string>;
    crm: Record<string, string>;
  } | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", mapping: MapperMapping): void;
}>();

const dialogEl = ref<HTMLElement | null>(null);

/* ---------- canonical field types (mirror of backend FIELD_TYPES_*) ---------- */

const MAIL_FIELD_TYPES: Record<string, CanonicalType> = {
  source_id: "string",
  address1: "string",
  address2: "string",
  city: "string",
  state: "state",
  zip: "zip",
  sent_date: "date",
};

const CRM_FIELD_TYPES: Record<string, CanonicalType> = {
  source_id: "string",
  address1: "string",
  address2: "string",
  city: "string",
  state: "state",
  zip: "zip",
  job_date: "date",
  job_value: "currency",
};

function expectedCanonicalType(
  source: "mail" | "crm",
  field: string
): CanonicalType {
  const tbl = source === "mail" ? MAIL_FIELD_TYPES : CRM_FIELD_TYPES;
  return tbl[field] || "string";
}

function allowedHeaderTypeSet(
  source: "mail" | "crm",
  field: string
): Set<HeaderType> {
  // Special-case address2: unit/apt numbers often come through as numeric
  if (field === "address2") {
    return new Set<HeaderType>(["string", "number", "unknown"]);
  }

  const t = expectedCanonicalType(source, field);
  switch (t) {
    case "date":
      // true dates + "text-ish" when we couldn't classify
      return new Set<HeaderType>(["date", "string", "unknown"]);
    case "state":
      // state-like and generic text; not zips, numbers, etc.
      return new Set<HeaderType>(["state", "string", "unknown"]);
    case "zip":
      // allow numeric ZIP columns as well as text
      return new Set<HeaderType>(["zip", "number", "string", "unknown"]);
    case "currency":
      return new Set<HeaderType>(["currency", "number", "string", "unknown"]);
    default:
      // generic text fields: don't allow clearly structured codes
      return new Set<HeaderType>(["string", "unknown"]);
  }
}

/* ---------- labels / helpers ---------- */

const titleCase = (s: string): string =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const labelForMail = (f: string): string =>
  props.mailLabels?.[f] ?? titleCase(f);

const labelForCrm = (f: string): string => props.crmLabels?.[f] ?? titleCase(f);

function isRequired(source: "mail" | "crm", field: string): boolean {
  if (!field) return false;
  return source === "mail"
    ? props.requiredMail.includes(field)
    : props.requiredCrm.includes(field);
}

function emptyMapping(
  mailFields: string[],
  crmFields: string[]
): MapperMapping {
  const mailBlank: MappingSide = {};
  mailFields.forEach((f) => (mailBlank[f] = ""));
  const crmBlank: MappingSide = {};
  crmFields.forEach((f) => (crmBlank[f] = ""));
  return { mail: mailBlank, crm: crmBlank };
}

function mergeMapping(
  base: MapperMapping,
  over?: Partial<MapperMapping>
): MapperMapping {
  if (!over) return base;

  const m: MapperMapping = {
    mail: { ...base.mail },
    crm: { ...base.crm },
  };

  if (over.mail) {
    for (const [k, v] of Object.entries(over.mail)) {
      if (typeof v === "string") m.mail[k] = v;
    }
  }

  if (over.crm) {
    for (const [k, v] of Object.entries(over.crm)) {
      if (typeof v === "string") m.crm[k] = v;
    }
  }

  return m;
}

const draft = ref<MapperMapping>(
  emptyMapping(props.mailFields, props.crmFields)
);

function seedFromProps() {
  draft.value = mergeMapping(
    emptyMapping(props.mailFields, props.crmFields),
    props.initialMapping
  );
}

/* ---------- static examples (don’t move with dropdowns) ---------- */

const MAIL_EXAMPLES: Record<string, string> = {
  source_id: "",
  address1:
    "4215 14th Avenue South, 1290 Trailwood South, 600 5th Avenue South",
  address2: "Apt 3, Suite 201, Unit B",
  city: "Minneapolis, Hopkins, Golden Valley",
  state: "MN, WI, IA",
  zip: "55407, 55343, 55415",
  sent_date: "01/01/2024, 02/14/2024, 12/31/2024",
};

const CRM_EXAMPLES: Record<string, string> = {
  source_id: "",
  address1: "3350 Quail Avenue North, 2940 Orchard Avenue North",
  address2: "Unit 2, Suite 4B",
  city: "Golden Valley, Plymouth, Eden Prairie",
  state: "MN, WI, IA",
  zip: "55422, 55369, 55416",
  job_date: "01/01/2024, 03/15/2024, 10/01/2024",
  job_value: "200, 1500, 2750",
};

function exampleText(source: "mail" | "crm", field: string): string | null {
  const map = source === "mail" ? MAIL_EXAMPLES : CRM_EXAMPLES;
  return map[field] ?? null;
}

/* ---------- header label with type tag + field-specific filtering ---------- */

function headerTypeLabel(source: "mail" | "crm", header: string): string {
  const typesMap =
    source === "mail"
      ? props.mailHeaderTypes || {}
      : props.crmHeaderTypes || {};
  const t: HeaderType = (typesMap[header] as HeaderType) || "string";

  const tag =
    t === "date"
      ? "Date"
      : t === "number" || t === "currency"
      ? "Number"
      : "Text";

  return `${header} (${tag})`;
}

function headerLabel(source: "mail" | "crm", header: string): string {
  return headerTypeLabel(source, header);
}

function headersForField(source: "mail" | "crm", field: string): string[] {
  const all = source === "mail" ? props.mailHeaders : props.crmHeaders;
  const typesMap =
    source === "mail"
      ? props.mailHeaderTypes || {}
      : props.crmHeaderTypes || {};
  const allowed = allowedHeaderTypeSet(source, field);

  const selected =
    source === "mail" ? draft.value.mail[field] : draft.value.crm[field];

  const list: string[] = [];
  for (const h of all) {
    const ht: HeaderType = (typesMap[h] as HeaderType) || "string";
    if (allowed.has(ht)) list.push(h);
  }

  // Always include current selection so user can see/fix it
  if (selected && !list.includes(selected) && all.includes(selected)) {
    list.push(selected);
  }

  return list;
}

/* ---------- error helpers (backend + local) ---------- */

const localErrors = ref<{
  mail: Record<string, string>;
  crm: Record<string, string>;
}>({
  mail: {},
  crm: {},
});

const backendErrors = computed(() => props.errors ?? { mail: {}, crm: {} });

const combinedErrors = computed(() => ({
  mail: { ...backendErrors.value.mail, ...localErrors.value.mail },
  crm: { ...backendErrors.value.crm, ...localErrors.value.crm },
}));

function fieldError(source: "mail" | "crm", field: string): string | null {
  const bucket =
    source === "mail" ? combinedErrors.value.mail : combinedErrors.value.crm;
  return bucket?.[field] || null;
}

const hasLocalErrors = computed(
  () =>
    Object.keys(localErrors.value.mail).length > 0 ||
    Object.keys(localErrors.value.crm).length > 0
);

const saveDisabled = computed(() => !!props.saving || hasLocalErrors.value);

function humanCanonicalType(t: CanonicalType): string {
  switch (t) {
    case "date":
      return "date column";
    case "state":
      return "state code column";
    case "zip":
      return "ZIP / Postal column";
    case "currency":
      return "amount/number column";
    default:
      return "text column";
  }
}

function humanHeaderType(t: HeaderType): string {
  switch (t) {
    case "date":
      return "date column";
    case "number":
      return "number column";
    case "state":
      return "state code column";
    case "zip":
      return "ZIP / Postal column";
    case "currency":
      return "amount/number column";
    default:
      return "text column";
  }
}

function onFieldChange(source: "mail" | "crm", field: string) {
  const current =
    source === "mail" ? draft.value.mail[field] : draft.value.crm[field];

  const bucket =
    source === "mail" ? localErrors.value.mail : localErrors.value.crm;

  if (!current) {
    delete bucket[field];
    return;
  }

  const typesMap =
    source === "mail"
      ? props.mailHeaderTypes || {}
      : props.crmHeaderTypes || {};
  const ht: HeaderType = (typesMap[current] as HeaderType) || "string";
  const allowed = allowedHeaderTypeSet(source, field);

  if (!allowed.has(ht)) {
    const canonType = expectedCanonicalType(source, field);
    const fieldLabel =
      source === "mail" ? labelForMail(field) : labelForCrm(field);
    bucket[field] = `“${fieldLabel}” expects a ${humanCanonicalType(
      canonType
    )}, but “${current}” looks like a ${humanHeaderType(ht)}.`;
  } else {
    delete bucket[field];
  }
}

/* ---------- lifecycle / focus ---------- */

// focus + seed on open
watch(
  () => props.open,
  (open) => {
    if (open) {
      seedFromProps();
      // clear any stale local errors when reopening
      localErrors.value = { mail: {}, crm: {} };
      setTimeout(() => {
        dialogEl.value?.focus();
      }, 0);
    }
  }
);

onMounted(() => {
  if (props.open) {
    seedFromProps();
    dialogEl.value?.focus();
  }
});

// re-seed when backend inputs change
watch(
  () => [props.initialMapping, props.mailFields, props.crmFields],
  seedFromProps,
  { deep: true }
);

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit("close");
  }
}

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) {
    emit("close");
  }
}

onMounted(() => {
  window.addEventListener("keydown", onEsc);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onEsc);
});

function confirm() {
  const raw = toRaw(draft.value) as MapperMapping;

  const payload: MapperMapping = {
    mail: { ...(raw.mail || {}) },
    crm: { ...(raw.crm || {}) },
  };

  emit("confirm", payload);
}
</script>

<style scoped>
.mapper-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.mapper-modal {
  width: min(820px, 96vw);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.16);
  border: 1px solid #dde3ea;
  display: flex;
  flex-direction: column;
  outline: none;
}

.mapper-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 14px 16px 10px;
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

.titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mapper-header h3 {
  font-size: 16px;
  margin: 0;
  color: #0c2d50;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.mapper-body {
  padding: 14px 16px 10px;
  overflow: auto;
}

.mapper-hint {
  margin: 0 0 10px;
  font-size: 13px;
  color: #4b5563;
}

.mapper-hint strong {
  font-weight: 600;
  color: #0c2d50;
}

.header-type-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #6b7280;
}

.legend-label {
  font-weight: 500;
}

.legend-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e5e7eb;
  font-size: 10px;
}

.mapper-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.side-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f9fafb;
  padding: 10px 12px 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.side-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.side-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0c2d50;
}

.side-sub {
  font-size: 11px;
  color: #6b7280;
}

.field-list {
  display: grid;
  gap: 8px;
}

.field-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  align-items: flex-start;
  gap: 8px;
}

.field-row.has-error {
  animation: shake 0.18s ease-in-out;
}

@keyframes shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  50% {
    transform: translateX(2px);
  }
  75% {
    transform: translateX(-1px);
  }
  100% {
    transform: translateX(0);
  }
}

.field-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 12px;
  color: #6b7280;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}

.pill-required {
  background: #fee2e2;
  color: #b91c1c;
}

.pill-optional {
  background: #e0f2fe;
  color: #0369a1;
}

.field-control {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-select {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 6px 8px;
  font-size: 13px;
  color: #0f172a;
  background: #ffffff;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.field-select:focus {
  outline: 2px solid #47bfa9;
  outline-offset: 1px;
  border-color: #47bfa9;
}

.field-select.is-missing {
  border-color: #f97373;
}

.field-select.is-error {
  border-color: #f97373;
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.4);
}

.sample {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
}

.error-msg {
  margin: 0;
  font-size: 11px;
  color: #b91c1c;
}

.mapper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 10px 16px 14px;
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

@media (max-width: 900px) {
  .mapper-grid {
    grid-template-columns: 1fr;
  }

  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
