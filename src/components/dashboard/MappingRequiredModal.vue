<!-- client/src/components/dashboard/MappingRequiredModal.vue -->
<script setup lang="ts">
import { reactive, ref, watch, nextTick, onBeforeUnmount } from "vue";

type MissingMap = { mail?: string[]; crm?: string[] };

const props = defineProps<{
  modelValue: boolean;
  missing?: MissingMap;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:missing", value: MissingMap): void;
  (e: "edit-mapping"): void;
}>();

// Local mirror so we can render even if parent mutates object in-place
const missingLocal = reactive<MissingMap>({ mail: [], crm: [] });

watch(
  () => props.missing,
  (v) => {
    missingLocal.mail = (v?.mail ?? []).slice();
    missingLocal.crm = (v?.crm ?? []).slice();
  },
  { immediate: true, deep: true }
);

const dialogEl = ref<HTMLElement | null>(null);
const primaryBtn = ref<HTMLButtonElement | null>(null);

function close() {
  emit("update:modelValue", false);
  document.removeEventListener("keydown", onEsc);
}

function onEsc(e: KeyboardEvent) {
  if (e.key === "Escape") {
    close();
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick();
      dialogEl.value?.focus();
      primaryBtn.value?.focus();
      document.addEventListener("keydown", onEsc);
    } else {
      document.removeEventListener("keydown", onEsc);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onEsc);
});

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close();
  }
}

function onEdit() {
  emit("edit-mapping");
  close();
}
</script>

<template>
  <div
    v-if="modelValue"
    class="mapping-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="mapping-required-title"
    aria-describedby="mapping-required-desc"
    @click="onBackdrop"
  >
    <section class="mapping-modal" role="document" tabindex="-1" ref="dialogEl">
      <header class="mapping-header">
        <span class="dot" aria-hidden="true" />
        <div class="titles">
          <h3 id="mapping-required-title">Mapping required</h3>
          <p class="subtitle">
            We couldn’t start the run because some required columns aren’t
            mapped yet.
          </p>
        </div>
      </header>

      <div class="content">
        <p id="mapping-required-desc" class="hint">
          Please review the fields below and complete your
          <em>Mail</em> and <em>CRM</em> mappings before running matching.
        </p>

        <div class="needs-grid">
          <div v-if="missingLocal.mail?.length" class="needs-card">
            <h4 class="needs-title">
              <span class="pill pill-mail">Mail CSV</span>
              needs these fields:
            </h4>
            <ul class="needs-list">
              <li v-for="m in missingLocal.mail" :key="'mail-' + m">
                {{ m }}
              </li>
            </ul>
          </div>

          <div v-if="missingLocal.crm?.length" class="needs-card">
            <h4 class="needs-title">
              <span class="pill pill-crm">CRM CSV</span>
              needs these fields:
            </h4>
            <ul class="needs-list">
              <li v-for="m in missingLocal.crm" :key="'crm-' + m">
                {{ m }}
              </li>
            </ul>
          </div>

          <p
            v-if="!missingLocal.mail?.length && !missingLocal.crm?.length"
            class="empty-note"
          >
            We didn’t receive a list of missing fields, but this run requires
            column mapping. You can review and save your mapping on the next
            screen.
          </p>
        </div>
      </div>

      <footer class="mapping-footer">
        <button type="button" class="btn btn-ghost" @click="close">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          ref="primaryBtn"
          @click="onEdit"
        >
          Edit mapping
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.mapping-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.mapping-modal {
  width: min(520px, 94vw);
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.16);
  border: 1px solid #dde3ea;
  display: flex;
  flex-direction: column;
  outline: none;
}

.mapping-header {
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

.mapping-header h3 {
  font-size: 16px;
  margin: 0;
  color: #0c2d50;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.content {
  padding: 14px 16px 10px;
}

.hint {
  margin: 0 0 10px;
  font-size: 13px;
  color: #1e293b;
}

.hint em {
  font-style: normal;
  font-weight: 600;
  color: #0c2d50;
}

.needs-grid {
  display: grid;
  gap: 10px;
}

.needs-card {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f9fafb;
  padding: 8px 10px 10px;
}

.needs-title {
  margin: 0 0 4px;
  font-size: 13px;
  color: #0c2d50;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}

.pill-mail {
  background: #e0f2fe;
  color: #0369a1;
}

.pill-crm {
  background: #fef3c7;
  color: #92400e;
}

.needs-list {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 13px;
  color: #4b5563;
}

.needs-list li {
  margin-bottom: 2px;
}

.empty-note {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.mapping-footer {
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

/* Match UploadCard / guard modal buttons */
.btn-primary {
  background: #47bfa9;
  color: #ffffff;
  border-color: #47bfa9;
}

.btn-primary:hover {
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
