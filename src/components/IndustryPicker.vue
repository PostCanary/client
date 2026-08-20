<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ChevronDown } from "lucide-vue-next";
import {
  filterIndustryCatalog,
  INDUSTRY_LABELS,
  type Industry,
} from "@/data/industryCatalog";
import {
  parseIndustrySelection,
  persistIndustryProfileValue,
} from "@/types/campaign";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
    id?: string;
  }>(),
  {
    disabled: false,
    id: "industry-picker",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const query = ref("");
const highlightIndex = ref(0);
const suppressOpenOnFocus = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

const selection = computed(() => parseIndustrySelection(props.modelValue));
const selectedLabel = computed(() =>
  selection.value.key ? INDUSTRY_LABELS[selection.value.key] : "",
);

const filterQuery = computed(() => {
  const typed = query.value.trim();
  if (!typed) return "";
  if (
    selectedLabel.value &&
    typed.toLowerCase() === selectedLabel.value.toLowerCase()
  ) {
    return "";
  }
  return typed;
});

const groups = computed(() => filterIndustryCatalog(filterQuery.value));
const flatOptions = computed(() =>
  groups.value.flatMap((group) =>
    group.options.map((option) => ({
      ...option,
      groupLabel: group.label,
    })),
  ),
);

const listboxId = computed(() => `${props.id}-listbox`);
const activeOptionId = computed(() => {
  const option = flatOptions.value[highlightIndex.value];
  return option ? `${props.id}-option-${option.slug}` : undefined;
});

function setKey(key: Industry | "") {
  emit(
    "update:modelValue",
    persistIndustryProfileValue(key, selection.value.otherText),
  );
}

function setOtherText(text: string) {
  emit("update:modelValue", persistIndustryProfileValue("other", text));
}

function syncQueryToSelection() {
  query.value = selectedLabel.value;
}

function searchTextFromInput(raw: string): string {
  const label = selectedLabel.value;
  if (label && raw.startsWith(label) && raw !== label) {
    return raw.slice(label.length);
  }
  return raw;
}

function close() {
  open.value = false;
  highlightIndex.value = 0;
  syncQueryToSelection();
}

function openList() {
  if (props.disabled) return;
  const wasClosed = !open.value;
  open.value = true;
  // Opened list is a search field. Keep the committed label only as the
  // placeholder — do not leave it in the input for keystrokes to append to.
  if (wasClosed && (query.value === "" || query.value === selectedLabel.value)) {
    query.value = "";
  }
  const current = selection.value.key;
  const index = flatOptions.value.findIndex((option) => option.slug === current);
  highlightIndex.value = index >= 0 ? index : 0;
  void nextTick(() => {
    inputRef.value?.focus();
    scrollHighlightedIntoView();
  });
}

function onFocus() {
  if (suppressOpenOnFocus.value) {
    suppressOpenOnFocus.value = false;
    return;
  }
  openList();
}

function toggle() {
  if (open.value) close();
  else openList();
}

function selectOption(slug: Industry) {
  setKey(slug);
  query.value = INDUSTRY_LABELS[slug];
  open.value = false;
  highlightIndex.value = 0;
  if (slug === "other") {
    void nextTick(() => {
      document.getElementById(`${props.id}-other`)?.focus();
    });
  } else {
    suppressOpenOnFocus.value = true;
    inputRef.value?.focus();
  }
}

function scrollHighlightedIntoView() {
  const option = flatOptions.value[highlightIndex.value];
  if (!option || !listRef.value) return;
  const el = document.getElementById(`${props.id}-option-${option.slug}`);
  el?.scrollIntoView({ block: "nearest" });
}

function moveHighlight(delta: number) {
  if (!flatOptions.value.length) return;
  const next = highlightIndex.value + delta;
  highlightIndex.value =
    (next + flatOptions.value.length) % flatOptions.value.length;
  void nextTick(() => scrollHighlightedIntoView());
}

function onInput(event: Event) {
  query.value = searchTextFromInput(
    (event.target as HTMLInputElement).value,
  );
  if (!open.value) openList();
  highlightIndex.value = 0;
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!open.value) openList();
    else moveHighlight(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!open.value) openList();
    else moveHighlight(-1);
    return;
  }
  if (event.key === "Home" && open.value) {
    event.preventDefault();
    highlightIndex.value = 0;
    void nextTick(() => scrollHighlightedIntoView());
    return;
  }
  if (event.key === "End" && open.value) {
    event.preventDefault();
    highlightIndex.value = Math.max(0, flatOptions.value.length - 1);
    void nextTick(() => scrollHighlightedIntoView());
    return;
  }
  if (event.key === "Enter") {
    if (open.value) {
      event.preventDefault();
      const option = flatOptions.value[highlightIndex.value];
      if (option) selectOption(option.slug);
    }
    return;
  }
  if (event.key === "Escape") {
    if (open.value) {
      event.preventDefault();
      close();
    }
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (target && rootRef.value && !rootRef.value.contains(target)) {
    if (open.value) close();
  }
}

watch(
  () => props.modelValue,
  () => {
    if (!open.value) syncQueryToSelection();
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <div ref="rootRef" class="industry-picker" data-testid="industry-picker">
    <div class="industry-combobox">
      <input
        :id="id"
        ref="inputRef"
        :value="query"
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        :disabled="disabled"
        :placeholder="selectedLabel ? selectedLabel : 'Search industries'"
        :aria-expanded="open"
        aria-autocomplete="list"
        :aria-controls="listboxId"
        :aria-activedescendant="open ? activeOptionId : undefined"
        data-testid="industry-combobox-input"
        class="industry-combobox__input"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
      />
      <button
        type="button"
        class="industry-combobox__toggle"
        tabindex="-1"
        :disabled="disabled"
        :aria-label="open ? 'Close industry list' : 'Open industry list'"
        data-testid="industry-combobox-toggle"
        @click="toggle"
      >
        <ChevronDown class="industry-combobox__chevron" :class="{ open }" />
      </button>
    </div>

    <div
      v-if="open"
      :id="listboxId"
      ref="listRef"
      role="listbox"
      class="industry-combobox__list"
      data-testid="industry-combobox-list"
    >
      <p
        v-if="flatOptions.length === 0"
        class="industry-combobox__empty"
        data-testid="industry-combobox-empty"
      >
        No industries match. Choose Other below, or try a different search.
      </p>
      <template v-for="group in groups" :key="group.id">
        <p
          class="industry-combobox__group"
          :data-testid="`industry-group-${group.id}`"
        >
          {{ group.label }}
        </p>
        <button
          v-for="option in group.options"
          :id="`${id}-option-${option.slug}`"
          :key="option.slug"
          type="button"
          role="option"
          class="industry-combobox__option"
          :class="{
            'is-active':
              flatOptions[highlightIndex]?.slug === option.slug,
            'is-selected': selection.key === option.slug,
          }"
          :aria-selected="selection.key === option.slug"
          :data-testid="`industry-option-${option.slug}`"
          @mousedown.prevent
          @click="selectOption(option.slug)"
        >
          {{ option.label }}
        </button>
      </template>
    </div>

    <div v-if="selection.key === 'other'" class="mt-2">
      <label :for="`${id}-other`" class="block text-sm font-medium text-slate-700">
        Tell us your industry
      </label>
      <input
        :id="`${id}-other`"
        :value="selection.otherText"
        type="text"
        maxlength="80"
        :disabled="disabled"
        placeholder="e.g. Pool service"
        data-testid="industry-other-text"
        class="mt-1 block w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50"
        @input="setOtherText(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.industry-picker {
  position: relative;
}

.industry-combobox {
  position: relative;
}

.industry-combobox__input {
  display: block;
  width: 100%;
  min-height: 44px;
  border-radius: 0.375rem;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  background: #fff;
}

.industry-combobox__input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 1px #10b981;
}

.industry-combobox__input:disabled {
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #64748b;
}

.industry-combobox__toggle {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: transparent;
  border: 0;
}

.industry-combobox__toggle:disabled {
  opacity: 0.5;
}

.industry-combobox__chevron {
  width: 1rem;
  height: 1rem;
  transition: transform 0.15s ease;
}

.industry-combobox__chevron.open {
  transform: rotate(180deg);
}

.industry-combobox__list {
  position: absolute;
  z-index: 30;
  margin-top: 0.25rem;
  width: 100%;
  max-height: min(20rem, 60vh);
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.12);
  padding: 0.35rem 0;
  -webkit-overflow-scrolling: touch;
}

.industry-combobox__group {
  margin: 0;
  padding: 0.5rem 0.75rem 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.industry-combobox__option {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 0.55rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: #334155;
  background: transparent;
  border: 0;
}

.industry-combobox__option.is-active,
.industry-combobox__option:hover {
  background: #f1f5f9;
}

.industry-combobox__option.is-selected {
  color: #0b2d50;
  font-weight: 600;
  background: rgb(71 191 169 / 0.12);
}

.industry-combobox__empty {
  margin: 0;
  padding: 0.75rem;
  font-size: 0.8rem;
  color: #64748b;
}
</style>
