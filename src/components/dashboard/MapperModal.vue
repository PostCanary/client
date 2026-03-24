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
          <h3 id="mapper-title">Map Your Columns</h3>
        </div>
      </header>

      <div class="mapper-body">
        <p id="mapper-desc" class="mapper-desc">
          This tool helps us match the correct columns in the event they have
          different column headers. Match up the correct column header names
          that are in your CSV files here. Do this once and if your files stay
          the same we will remember and you won't have to do this again!
        </p>

        <!-- Campaign assignment -->
        <div class="campaign-row">
          <label class="campaign-label">Campaign</label>
          <template v-if="showNewCampaignInput">
            <input
              ref="newCampaignInputEl"
              v-model="newCampaignName"
              type="text"
              placeholder="Campaign name…"
              class="campaign-input"
              @keydown.enter.prevent="createNewCampaign"
              @keydown.escape.prevent="cancelNewCampaign"
              @blur="createNewCampaign"
            />
          </template>
          <template v-else>
            <select
              class="campaign-select"
              :value="campaignStore.activeCampaignId ?? ''"
              @change="onCampaignChange"
            >
              <option value="">All Campaigns</option>
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

        <!-- MAIL CSV -->
        <section v-if="mailHeaders.length" class="csv-section">
          <h4 class="csv-title">Mail CSV</h4>

          <div class="spreadsheet-wrapper">
            <table class="spreadsheet">
              <thead>
                <tr class="col-letters-row">
                  <th class="corner-cell"></th>
                  <th
                    v-for="(_h, i) in mailHeaders"
                    :key="'ml-' + i"
                    class="col-letter"
                  >
                    {{ columnLetter(i) }}
                  </th>
                </tr>
                <tr class="dropdown-row">
                  <th class="row-label">Map to</th>
                  <th
                    v-for="h in mailHeaders"
                    :key="'md-' + h"
                    class="dropdown-cell"
                  >
                    <select
                      class="col-select"
                      :class="{
                        'is-mapped': !!mailColumnMap[h],
                        'is-error': !!columnError('mail', h),
                      }"
                      :value="mailColumnMap[h] || ''"
                      @change="onColumnSelect('mail', h, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="">-- Skip --</option>
                      <option
                        v-for="opt in fieldsForHeader('mail', h)"
                        :key="opt.value"
                        :value="opt.value"
                        :disabled="opt.disabled"
                      >
                        {{ opt.label }}{{ opt.disabled ? ' (mapped)' : '' }}{{ opt.required ? ' *' : '' }}
                      </option>
                    </select>
                    <p v-if="columnError('mail', h)" class="cell-error">
                      {{ columnError('mail', h) }}
                    </p>
                  </th>
                </tr>
                <tr class="header-row">
                  <th class="row-num">1</th>
                  <th
                    v-for="h in mailHeaders"
                    :key="'mh-' + h"
                    class="header-cell"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in displayedMailSamples"
                  :key="'mr-' + ri"
                  class="data-row"
                >
                  <td class="row-num">{{ ri + 2 }}</td>
                  <td
                    v-for="h in mailHeaders"
                    :key="'mc-' + h + ri"
                    class="data-cell"
                  >
                    {{ row[h] ?? '' }}
                  </td>
                </tr>
                <tr v-if="!displayedMailSamples.length" class="empty-row">
                  <td :colspan="mailHeaders.length + 1" class="empty-cell">
                    No sample data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="unmappedRequiredMail.length" class="missing-banner">
            Missing required mappings:
            <strong>{{ unmappedRequiredMail.map(f => labelFor('mail', f)).join(', ') }}</strong>
          </div>
        </section>

        <!-- CRM CSV -->
        <section v-if="crmHeaders.length" class="csv-section">
          <h4 class="csv-title">CRM CSV</h4>

          <div class="spreadsheet-wrapper">
            <table class="spreadsheet">
              <thead>
                <tr class="col-letters-row">
                  <th class="corner-cell"></th>
                  <th
                    v-for="(_h, i) in crmHeaders"
                    :key="'cl-' + i"
                    class="col-letter"
                  >
                    {{ columnLetter(i) }}
                  </th>
                </tr>
                <tr class="dropdown-row">
                  <th class="row-label">Map to</th>
                  <th
                    v-for="h in crmHeaders"
                    :key="'cd-' + h"
                    class="dropdown-cell"
                  >
                    <select
                      class="col-select"
                      :class="{
                        'is-mapped': !!crmColumnMap[h],
                        'is-error': !!columnError('crm', h),
                      }"
                      :value="crmColumnMap[h] || ''"
                      @change="onColumnSelect('crm', h, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="">-- Skip --</option>
                      <option
                        v-for="opt in fieldsForHeader('crm', h)"
                        :key="opt.value"
                        :value="opt.value"
                        :disabled="opt.disabled"
                      >
                        {{ opt.label }}{{ opt.disabled ? ' (mapped)' : '' }}{{ opt.required ? ' *' : '' }}
                      </option>
                    </select>
                    <p v-if="columnError('crm', h)" class="cell-error">
                      {{ columnError('crm', h) }}
                    </p>
                  </th>
                </tr>
                <tr class="header-row">
                  <th class="row-num">1</th>
                  <th
                    v-for="h in crmHeaders"
                    :key="'ch-' + h"
                    class="header-cell"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in displayedCrmSamples"
                  :key="'cr-' + ri"
                  class="data-row"
                >
                  <td class="row-num">{{ ri + 2 }}</td>
                  <td
                    v-for="h in crmHeaders"
                    :key="'cc-' + h + ri"
                    class="data-cell"
                  >
                    {{ row[h] ?? '' }}
                  </td>
                </tr>
                <tr v-if="!displayedCrmSamples.length" class="empty-row">
                  <td :colspan="crmHeaders.length + 1" class="empty-cell">
                    No sample data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="unmappedRequiredCrm.length" class="missing-banner">
            Missing required mappings:
            <strong>{{ unmappedRequiredCrm.map(f => labelFor('crm', f)).join(', ') }}</strong>
          </div>
        </section>
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
          <span v-else>{{ confirmLabel || 'Save mapping' }}</span>
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, toRaw, computed, nextTick } from "vue";
import type { Mapping as MapperMapping } from "@/api/mapper";
import { useCampaignStore } from "@/stores/useCampaignStore";

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
  mailSamples: Record<string, any>[];
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
  confirmLabel?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", mapping: MapperMapping): void;
}>();

const dialogEl = ref<HTMLElement | null>(null);

/* ---------- campaign selector ---------- */
const campaignStore = useCampaignStore();
campaignStore.hydrate();
campaignStore.fetchCampaigns();

const showNewCampaignInput = ref(false);
const newCampaignName = ref("");
const newCampaignInputEl = ref<HTMLInputElement | null>(null);
const campaignCreating = ref(false);
let campaignCreationPromise: Promise<void> | null = null;

function onCampaignChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  if (val === "__new__") {
    showNewCampaignInput.value = true;
    nextTick(() => newCampaignInputEl.value?.focus());
    (event.target as HTMLSelectElement).value = campaignStore.activeCampaignId ?? "";
    return;
  }
  campaignStore.setActiveCampaign(val || null);
  window.dispatchEvent(new CustomEvent("mt:campaign-changed", { detail: { campaignId: val || null } }));
}

async function createNewCampaign() {
  if (campaignCreationPromise) return campaignCreationPromise;

  const name = newCampaignName.value.trim();
  if (!name) {
    showNewCampaignInput.value = false;
    return;
  }

  campaignCreating.value = true;
  campaignCreationPromise = (async () => {
    try {
      const campaign = await campaignStore.createCampaign(name);
      campaignStore.setActiveCampaign(campaign.id);
      window.dispatchEvent(new CustomEvent("mt:campaign-changed", { detail: { campaignId: campaign.id } }));
    } catch (e) {
      console.error("Failed to create campaign", e);
    } finally {
      newCampaignName.value = "";
      showNewCampaignInput.value = false;
      campaignCreating.value = false;
      campaignCreationPromise = null;
    }
  })();

  return campaignCreationPromise;
}

function cancelNewCampaign() {
  newCampaignName.value = "";
  showNewCampaignInput.value = false;
}

const DISPLAY_ROW_COUNT = 5;

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
  if (field === "address2") {
    return new Set<HeaderType>(["string", "number", "unknown"]);
  }

  const t = expectedCanonicalType(source, field);
  switch (t) {
    case "date":
      return new Set<HeaderType>(["date", "string", "unknown"]);
    case "state":
      return new Set<HeaderType>(["state", "string", "unknown"]);
    case "zip":
      return new Set<HeaderType>(["zip", "number", "string", "unknown"]);
    case "currency":
      return new Set<HeaderType>(["currency", "number", "string", "unknown"]);
    default:
      return new Set<HeaderType>(["string", "unknown"]);
  }
}

/* ---------- labels / helpers ---------- */

const titleCase = (s: string): string =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function labelFor(source: "mail" | "crm", field: string): string {
  const labels = source === "mail" ? props.mailLabels : props.crmLabels;
  return labels?.[field] ?? titleCase(field);
}

function isRequired(source: "mail" | "crm", field: string): boolean {
  if (!field) return false;
  return source === "mail"
    ? props.requiredMail.includes(field)
    : props.requiredCrm.includes(field);
}

function columnLetter(index: number): string {
  let result = "";
  let n = index;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

/* ---------- inverted mapping state (header → field) ---------- */

const mailColumnMap = ref<Record<string, string>>({});
const crmColumnMap = ref<Record<string, string>>({});

function invertFieldToHeader(
  fieldMap: Record<string, string> | undefined,
  headers: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers) {
    result[h] = "";
  }
  if (fieldMap) {
    for (const [field, header] of Object.entries(fieldMap)) {
      if (header && headers.includes(header)) {
        result[header] = field;
      }
    }
  }
  return result;
}

function invertToFieldMap(
  columnMap: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [header, field] of Object.entries(columnMap)) {
    if (field) result[field] = header;
  }
  return result;
}

function seedFromProps() {
  mailColumnMap.value = invertFieldToHeader(
    props.initialMapping?.mail,
    props.mailHeaders
  );
  crmColumnMap.value = invertFieldToHeader(
    props.initialMapping?.crm,
    props.crmHeaders
  );
}

/* ---------- sample data ---------- */

const displayedMailSamples = computed(() =>
  props.mailSamples.slice(0, DISPLAY_ROW_COUNT)
);
const displayedCrmSamples = computed(() =>
  props.crmSamples.slice(0, DISPLAY_ROW_COUNT)
);

/* ---------- dropdown options per column ---------- */

type FieldOption = {
  value: string;
  label: string;
  disabled: boolean;
  required: boolean;
};

function fieldsForHeader(
  source: "mail" | "crm",
  header: string
): FieldOption[] {
  const fields = source === "mail" ? props.mailFields : props.crmFields;
  const columnMap =
    source === "mail" ? mailColumnMap.value : crmColumnMap.value;
  const typesMap =
    source === "mail"
      ? props.mailHeaderTypes || {}
      : props.crmHeaderTypes || {};
  const headerType: HeaderType =
    (typesMap[header] as HeaderType) || "string";

  const usedFields = new Set(
    Object.values(columnMap).filter((v) => v && v !== columnMap[header])
  );

  return fields
    .filter((f) => {
      const allowed = allowedHeaderTypeSet(source, f);
      return allowed.has(headerType);
    })
    .map((f) => ({
      value: f,
      label: labelFor(source, f),
      disabled: usedFields.has(f),
      required: isRequired(source, f),
    }));
}

/* ---------- column selection handler ---------- */

function onColumnSelect(
  source: "mail" | "crm",
  header: string,
  field: string
) {
  const columnMap =
    source === "mail" ? mailColumnMap : crmColumnMap;
  columnMap.value = { ...columnMap.value, [header]: field };
}

/* ---------- error helpers ---------- */

const localErrors = ref<{
  mail: Record<string, string>;
  crm: Record<string, string>;
}>({
  mail: {},
  crm: {},
});

const backendErrors = computed(() => props.errors ?? { mail: {}, crm: {} });

function columnError(
  source: "mail" | "crm",
  header: string
): string | null {
  const columnMap =
    source === "mail" ? mailColumnMap.value : crmColumnMap.value;
  const field = columnMap[header];
  if (!field) return null;

  const bucket =
    source === "mail" ? backendErrors.value.mail : backendErrors.value.crm;
  return bucket?.[field] || null;
}

/* ---------- required field validation ---------- */

const unmappedRequiredMail = computed(() => {
  const mapped = new Set(Object.values(mailColumnMap.value).filter(Boolean));
  return props.requiredMail.filter((f) => !mapped.has(f));
});

const unmappedRequiredCrm = computed(() => {
  const mapped = new Set(Object.values(crmColumnMap.value).filter(Boolean));
  return props.requiredCrm.filter((f) => !mapped.has(f));
});

const saveDisabled = computed(
  () =>
    !!props.saving ||
    campaignCreating.value ||
    unmappedRequiredMail.value.length > 0 ||
    unmappedRequiredCrm.value.length > 0
);

/* ---------- lifecycle / focus ---------- */

watch(
  () => props.open,
  (open) => {
    if (open) {
      seedFromProps();
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

async function confirm() {
  if (showNewCampaignInput.value || newCampaignName.value.trim()) {
    await createNewCampaign();
  } else if (campaignCreationPromise) {
    await campaignCreationPromise;
  }

  const payload: MapperMapping = {
    mail: invertToFieldMap(toRaw(mailColumnMap.value)),
    crm: invertToFieldMap(toRaw(crmColumnMap.value)),
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
  width: min(1100px, 96vw);
  max-height: 90vh;
  background: var(--app-card-bg);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.16);
  border: 1px solid var(--app-border-medium);
  display: flex;
  flex-direction: column;
  outline: none;
}

.mapper-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 14px 20px 10px;
  border-bottom: 1px solid var(--app-border);
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
  color: var(--app-text);
}

.mapper-body {
  padding: 16px 20px 12px;
  overflow: auto;
}

.mapper-desc {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--app-text-body);
  background: #f0fdfa;
  border: 1px solid rgba(71, 191, 169, 0.25);
  border-radius: 8px;
  padding: 10px 14px;
}

.campaign-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.campaign-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
  white-space: nowrap;
}

.campaign-select {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: #f8fafc;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text);
  cursor: pointer;
  min-width: 180px;
  transition: border-color 0.15s ease;
}

.campaign-select:hover {
  border-color: var(--app-teal);
}

.campaign-select:focus {
  outline: none;
  border-color: var(--app-teal);
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.campaign-input {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--app-teal);
  background: var(--app-card-bg);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text);
  min-width: 180px;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}

.campaign-input:focus {
  outline: none;
}

/* ---------- CSV section ---------- */

.csv-section {
  margin-bottom: 20px;
}

.csv-section:last-of-type {
  margin-bottom: 0;
}

.csv-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}

/* ---------- spreadsheet ---------- */

.spreadsheet-wrapper {
  overflow-x: auto;
  border: 1px solid var(--app-border-medium);
  border-radius: 8px;
}

.spreadsheet {
  width: 100%;
  border-collapse: collapse;
  font-family: inherit;
  font-size: 13px;
  table-layout: fixed;
  min-width: max-content;
}

.spreadsheet th,
.spreadsheet td {
  border: 1px solid var(--app-border);
  padding: 4px 8px;
  text-align: left;
  min-width: 120px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* corner cell & row number column */

.corner-cell,
.row-num,
.row-label {
  min-width: 48px;
  max-width: 48px;
  width: 48px;
  text-align: center;
  background: var(--app-bg);
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 500;
}

.row-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--app-text-muted);
}

/* column letter row */

.col-letters-row {
  background: var(--app-bg);
}

.col-letter {
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-muted);
  padding: 2px 8px;
}

/* dropdown row */

.dropdown-row {
  background: var(--app-card-bg);
}

.dropdown-cell {
  padding: 6px 6px;
  vertical-align: top;
}

.col-select {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--app-border);
  padding: 4px 6px;
  font-family: inherit;
  font-size: 12px;
  color: var(--app-text);
  background: var(--app-card-bg);
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
}

.col-select:focus {
  outline: 2px solid var(--app-teal);
  outline-offset: 1px;
  border-color: var(--app-teal);
}

.col-select.is-mapped {
  border-color: var(--app-teal);
  background: #f0fdfa;
}

.col-select.is-error {
  border-color: #f97373;
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.4);
}

.cell-error {
  margin: 2px 0 0;
  font-size: 10px;
  color: #b91c1c;
  white-space: normal;
}

/* header row (actual CSV headers) */

.header-row {
  background: var(--app-bg);
}

.header-cell {
  font-weight: 600;
  color: var(--app-text);
  font-size: 13px;
}

/* data rows */

.data-row:nth-child(even) {
  background: var(--app-bg);
}

.data-cell {
  color: var(--app-text-body);
  font-size: 13px;
}

.empty-row .empty-cell {
  text-align: center;
  color: var(--app-text-muted);
  font-style: italic;
  padding: 12px;
}

/* ---------- missing required banner ---------- */

.missing-banner {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.missing-banner strong {
  font-weight: 600;
}

/* ---------- footer ---------- */

.mapper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 10px 20px 14px;
  border-top: 1px solid var(--app-border);
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
  background: var(--app-teal);
  color: var(--app-card-bg);
  border-color: var(--app-teal);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: default;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.98);
}

.btn-ghost {
  background: var(--app-card-bg);
  color: var(--app-text);
  border-color: var(--app-border-medium);
}

.btn-ghost:hover {
  background: #f8fafb;
}
</style>
