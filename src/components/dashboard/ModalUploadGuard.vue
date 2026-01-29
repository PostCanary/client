<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from "vue";

type Props = {
  modelValue: boolean;
  title?: string;
  message?: string;
  /** Short line under the title */
  subtitle?: string;
  /** CSS selector to focus/trigger when user clicks "Pick files" */
  focusSelector?: string;
  /** If true, click() the target element (opens file dialog) */
  triggerFileDialog?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  title: "Action needed",
  message: "Please pick both CSV files first.",
  subtitle: "Complete your uploads to continue.",
  focusSelector: "#mailCsv",
  triggerFileDialog: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

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
    onCancel();
  }
}

function onCancel() {
  emit("cancel");
  close();
}

function onConfirm() {
  emit("confirm");
  close();

  // Nudge the user toward the next step
  if (!props.focusSelector) return;

  const el = document.querySelector(props.focusSelector) as
    | HTMLInputElement
    | HTMLElement
    | null;
  if (!el) return;

  try {
    if (
      props.triggerFileDialog &&
      "click" in el &&
      typeof (el as HTMLInputElement).click === "function"
    ) {
      (el as HTMLInputElement).click(); // Opens file picker
    } else {
      (el as HTMLElement).focus();
      el.scrollIntoView?.({ block: "center", behavior: "smooth" });
    }
  } catch {
    // ignore focus errors
  }
}
</script>

<template>
  <div
    v-if="modelValue"
    class="guard-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="upload-guard-title"
    aria-describedby="upload-guard-desc"
    @click="onBackdrop"
  >
    <section class="guard-modal" role="document" tabindex="-1" ref="dialogEl">
      <header class="guard-header">
        <span class="dot" aria-hidden="true" />
        <div class="titles">
          <h3 id="upload-guard-title">{{ title }}</h3>
          <p v-if="subtitle" class="subtitle">
            {{ subtitle }}
          </p>
        </div>
      </header>

      <div class="content">
        <p id="upload-guard-desc" class="message" v-html="message" />
      </div>

      <footer class="guard-footer">
        <button type="button" class="btn btn-ghost" @click="onCancel">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          ref="primaryBtn"
          @click="onConfirm"
        >
          Pick files
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.guard-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.guard-modal {
  width: min(440px, 94vw);
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(12, 45, 80, 0.08),
    0 10px 24px rgba(12, 45, 80, 0.16);
  border: 1px solid #dde3ea;
  display: flex;
  flex-direction: column;
  outline: none;
}

.guard-header {
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

.guard-header h3 {
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

.message {
  margin: 0 0 6px;
  font-size: 14px;
  color: #1e293b;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.hint em {
  font-style: normal;
  font-weight: 600;
  color: #0c2d50;
}

.hint strong {
  font-weight: 700;
  color: #0f766e;
}

.guard-footer {
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

/* Harmonize with UploadCard buttons */
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
