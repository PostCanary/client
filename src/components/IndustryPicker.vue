<script setup lang="ts">
import { computed } from "vue";
import {
  INDUSTRY_LABELS,
  parseIndustrySelection,
  persistIndustryProfileValue,
  type Industry,
} from "@/types/campaign";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    variant?: "pills" | "select";
    disabled?: boolean;
    id?: string;
  }>(),
  {
    variant: "pills",
    disabled: false,
    id: "industry-picker",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const industries = Object.entries(INDUSTRY_LABELS) as [Industry, string][];

const selection = computed(() => parseIndustrySelection(props.modelValue));

function setKey(key: Industry | "") {
  emit(
    "update:modelValue",
    persistIndustryProfileValue(key, selection.value.otherText),
  );
}

function setOtherText(text: string) {
  emit("update:modelValue", persistIndustryProfileValue("other", text));
}

function onSelectChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as Industry | "";
  setKey(value);
}
</script>

<template>
  <div class="industry-picker">
    <div v-if="variant === 'pills'" class="flex flex-wrap gap-2">
      <button
        v-for="[key, label] in industries"
        :key="key"
        type="button"
        :disabled="disabled"
        class="px-3 py-1.5 rounded-lg border text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
        :class="
          selection.key === key
            ? 'border-[#47bfa9] bg-[#47bfa9]/10 text-[#0b2d50]'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'
        "
        :data-testid="`industry-pill-${key}`"
        @click="setKey(key)"
      >
        {{ label }}
      </button>
    </div>

    <select
      v-else
      :id="id"
      :value="selection.key"
      :disabled="disabled"
      data-testid="industry-select"
      class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
      @change="onSelectChange"
    >
      <option value="" disabled>Select an industry</option>
      <option v-for="[key, label] in industries" :key="key" :value="key">
        {{ label }}
      </option>
    </select>

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
        class="mt-1 block w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:border-slate-200 disabled:bg-slate-50"
        @input="setOtherText(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
