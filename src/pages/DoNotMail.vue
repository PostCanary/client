<!-- src/pages/DoNotMail.vue — Sprint 1.5 #4 — DNM management page. -->
<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NPagination,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag,
  NUpload,
  type DataTableColumns,
  type FormInst,
  type FormRules,
  type UploadCustomRequestOptions,
} from "naive-ui";
import { useMessage } from "naive-ui";
import { TrashOutline, AddOutline, CloudUploadOutline } from "@vicons/ionicons5";
import {
  listDnm,
  createDnm,
  deleteDnm,
  uploadDnmCsv,
  type DnmEntry,
  type DnmCreatePayload,
} from "@/api/dnm";

const message = useMessage();

// ── State ──────────────────────────────────────────────────────────────
const items = ref<DnmEntry[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(50);
const loading = ref(false);
const initialLoad = ref(true);

const addOpen = ref(false);
const addBusy = ref(false);
const formRef = ref<FormInst | null>(null);

const csvBusy = ref(false);

const form = reactive<DnmCreatePayload>({
  address1: "",
  city: "",
  state: "",
  zip5: "",
  full_name: "",
  reason: "",
});

const rules: FormRules = {
  address1: [{ required: true, message: "Address is required", trigger: "blur" }],
  city: [{ required: true, message: "City is required", trigger: "blur" }],
  state: [
    { required: true, message: "State is required", trigger: "blur" },
    {
      validator: (_r, v: string) =>
        /^[A-Za-z]{2}$/.test(v || "") ||
        new Error("Use the 2-letter postal code (e.g. AZ)"),
      trigger: "blur",
    },
  ],
  zip5: [
    { required: true, message: "ZIP is required", trigger: "blur" },
    {
      validator: (_r, v: string) =>
        /^\d{5}$/.test(v || "") || new Error("ZIP must be 5 digits"),
      trigger: "blur",
    },
  ],
};

// ── Data load ──────────────────────────────────────────────────────────
async function refresh() {
  loading.value = true;
  try {
    const res = await listDnm({ page: page.value, per_page: perPage.value });
    total.value = res.total;
    perPage.value = res.per_page;
    // Clamp page to the actual last page in case a concurrent delete shrank
    // total below the current page's offset (Codex LOW finding). One extra
    // refetch on overshoot is cheaper than rendering an empty page.
    const lastPage = Math.max(1, Math.ceil(res.total / res.per_page));
    if (res.page > lastPage) {
      page.value = lastPage;
      const reclamp = await listDnm({ page: lastPage, per_page: res.per_page });
      items.value = reclamp.items;
      total.value = reclamp.total;
    } else {
      items.value = res.items;
      page.value = res.page;
    }
  } catch (e: any) {
    message.error(`Could not load suppression list — ${e?.message || e}`);
  } finally {
    loading.value = false;
    initialLoad.value = false;
  }
}

onMounted(refresh);

// ── Add ────────────────────────────────────────────────────────────────
function resetForm() {
  form.address1 = "";
  form.city = "";
  form.state = "";
  form.zip5 = "";
  form.full_name = "";
  form.reason = "";
}

function openAdd() {
  resetForm();
  addOpen.value = true;
}

async function submitAdd() {
  if (addBusy.value) return; // Guard against rapid double-clicks pre-validation.
  addBusy.value = true;
  try {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    const payload: DnmCreatePayload = {
      address1: form.address1.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zip5: form.zip5.trim(),
      full_name: (form.full_name || "").trim() || null,
      reason: (form.reason || "").trim() || null,
    };
    const res = await createDnm(payload);
    if (res.deduped) {
      message.info("That address is already on your suppression list.");
    } else {
      message.success("Added to suppression list.");
    }
    addOpen.value = false;
    page.value = 1;
    await refresh();
  } catch (e: any) {
    // Backend returns {error:"validation_failed", details:{field:msg}} for 400.
    const details = e?.data?.details as Record<string, string> | undefined;
    if (details && typeof details === "object") {
      const fields = Object.entries(details)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      message.error(`Could not add entry —\n${fields}`);
    } else {
      message.error(`Could not add entry — ${e?.message || e}`);
    }
  } finally {
    addBusy.value = false;
  }
}

// ── Delete ─────────────────────────────────────────────────────────────
async function handleDelete(row: DnmEntry) {
  try {
    await deleteDnm(row.id);
    message.success("Removed from suppression list.");
    // Optimistic local removal so the row disappears even if total/page drift.
    items.value = items.value.filter((r) => r.id !== row.id);
    total.value = Math.max(0, total.value - 1);
    // If we just emptied a page and there's still a previous page, step back.
    if (items.value.length === 0 && page.value > 1) page.value -= 1;
    await refresh();
  } catch (e: any) {
    if (e?.status === 404) {
      message.warning("That entry was already removed.");
      await refresh();
    } else {
      message.error(`Could not remove entry — ${e?.message || e}`);
    }
  }
}

// ── CSV upload ─────────────────────────────────────────────────────────
async function customCsvUpload({
  file,
  onFinish,
  onError,
}: UploadCustomRequestOptions) {
  const f = (file?.file as File | undefined) ?? null;
  if (!f) {
    onError();
    return;
  }
  csvBusy.value = true;
  try {
    const res = await uploadDnmCsv(f);
    if (res.inserted === 0 && res.skipped > 0) {
      // 0 imported + N skipped — every row was malformed. Don't dress up
      // a no-op as success; users would believe their list was updated.
      message.warning(
        `Skipped ${res.skipped} invalid row${res.skipped === 1 ? "" : "s"} — ` +
          `no addresses were added. Check that columns are address, city, state, zip5.`,
      );
    } else {
      message.success(
        `Imported ${res.inserted} address${res.inserted === 1 ? "" : "es"}` +
          (res.skipped > 0 ? ` (skipped ${res.skipped} invalid).` : "."),
      );
    }
    page.value = 1;
    await refresh();
    onFinish();
  } catch (e: any) {
    message.error(`CSV import failed — ${e?.message || e}`);
    onError();
  } finally {
    csvBusy.value = false;
  }
}

// ── Table columns ──────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function sourceTag(source: string) {
  const isManual = source === "manual";
  return h(
    NTag,
    { size: "small", type: isManual ? "info" : "default", round: true },
    { default: () => (isManual ? "Manual" : "CSV") },
  );
}

const columns = computed<DataTableColumns<DnmEntry>>(() => [
  {
    title: "Address",
    key: "address1",
    render: (row) =>
      h("div", null, [
        h("div", { class: "font-medium" }, row.address1),
        row.full_name
          ? h("div", { class: "text-xs text-gray-500" }, row.full_name)
          : null,
      ]),
  },
  { title: "City", key: "city" },
  { title: "State", key: "state", width: 80 },
  { title: "ZIP", key: "zip5", width: 80 },
  {
    title: "Source",
    key: "source",
    width: 120,
    render: (row) => sourceTag(row.source),
  },
  {
    title: "Added",
    key: "created_at",
    width: 120,
    render: (row) => formatDate(row.created_at),
  },
  {
    title: "",
    key: "actions",
    width: 80,
    align: "right",
    render: (row) =>
      h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDelete(row),
          positiveText: "Remove",
          negativeText: "Cancel",
        },
        {
          trigger: () =>
            h(
              NButton,
              { size: "small", quaternary: true, type: "error" },
              {
                icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
              },
            ),
          default: () =>
            `Remove ${row.address1}, ${row.city} ${row.state} ${row.zip5} from your suppression list?`,
        },
      ),
  },
]);
</script>

<template>
  <div class="dnm-page p-4 md:p-6 max-w-6xl mx-auto">
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Do Not Mail</h1>
        <p class="text-sm text-gray-500 mt-1">
          Addresses on this list are excluded from your campaigns and from print
          submissions. Updates apply to all future mailings.
        </p>
      </div>
      <NSpace>
        <NUpload
          :show-file-list="false"
          accept=".csv,text/csv"
          :custom-request="customCsvUpload"
          :disabled="csvBusy"
        >
          <NButton :loading="csvBusy">
            <template #icon>
              <NIcon><CloudUploadOutline /></NIcon>
            </template>
            Import CSV
          </NButton>
        </NUpload>
        <NButton type="primary" @click="openAdd">
          <template #icon>
            <NIcon><AddOutline /></NIcon>
          </template>
          Add address
        </NButton>
      </NSpace>
    </header>

    <NCard :bordered="true" content-style="padding: 0">
      <NSpin :show="loading && initialLoad">
        <div v-if="!loading && total === 0" class="py-12">
          <NEmpty description="No suppressed addresses yet">
            <template #extra>
              <div class="text-sm text-gray-500 max-w-md mx-auto text-left">
                <p class="mb-2">Two ways to add addresses:</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Add address</strong> — fill in one address at a time.
                  </li>
                  <li>
                    <strong>Import CSV</strong> — columns:
                    <code>address, city, state, zip5</code>. Optional:
                    <code>name</code>. Header row required.
                  </li>
                </ul>
              </div>
            </template>
          </NEmpty>
        </div>

        <NDataTable
          v-else
          :columns="columns"
          :data="items"
          :loading="loading"
          :row-key="(row: DnmEntry) => row.id"
          :bordered="false"
          :single-line="false"
          size="small"
          striped
        />
      </NSpin>
    </NCard>

    <div v-if="total > perPage" class="mt-4 flex justify-end">
      <NPagination
        v-model:page="page"
        :page-size="perPage"
        :item-count="total"
        :on-update-page="refresh"
      />
    </div>

    <!-- Add modal -->
    <NModal
      v-model:show="addOpen"
      preset="card"
      title="Add address to Do Not Mail"
      style="max-width: 520px"
      :mask-closable="!addBusy"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
        size="medium"
      >
        <NFormItem label="Street address" path="address1">
          <NInput v-model:value="form.address1" placeholder="123 Main St" />
        </NFormItem>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NFormItem label="City" path="city">
            <NInput v-model:value="form.city" placeholder="Phoenix" />
          </NFormItem>
          <NFormItem label="State" path="state">
            <NInput
              v-model:value="form.state"
              placeholder="AZ"
            />
          </NFormItem>
          <NFormItem label="ZIP" path="zip5">
            <NInput
              v-model:value="form.zip5"
              placeholder="85001"
            />
          </NFormItem>
        </div>
        <NFormItem label="Name (optional)" path="full_name">
          <NInput v-model:value="form.full_name" placeholder="Jane Doe" />
        </NFormItem>
        <NFormItem label="Reason (optional)" path="reason">
          <NInput
            v-model:value="form.reason"
            placeholder="Customer request"
            :maxlength="64"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton :disabled="addBusy" @click="addOpen = false">Cancel</NButton>
          <NButton type="primary" :loading="addBusy" @click="submitAdd">
            Add to list
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
