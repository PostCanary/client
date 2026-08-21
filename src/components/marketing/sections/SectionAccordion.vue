<!-- src/components/marketing/sections/SectionAccordion.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";

export interface SectionAccordionItem {
  title: string;
  body: string;
}

const props = defineProps<{
  items: SectionAccordionItem[];
  idPrefix: string;
}>();

const openIndex = ref(0);

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index;
}
</script>

<template>
  <div class="mkt-acc">
    <div
      v-for="(item, index) in props.items"
      :key="item.title"
      class="mkt-acc__item"
    >
      <h3 class="mkt-acc__heading">
        <button
          type="button"
          class="mkt-acc__trigger"
          :id="`${idPrefix}-acc-${index}`"
          :aria-expanded="openIndex === index"
          :aria-controls="`${idPrefix}-panel-${index}`"
          @click="toggle(index)"
        >
          <span>{{ item.title }}</span>
          <ChevronDown
            class="mkt-acc__chevron"
            :class="{ 'is-open': openIndex === index }"
            aria-hidden="true"
          />
        </button>
      </h3>
      <div
        :id="`${idPrefix}-panel-${index}`"
        role="region"
        class="mkt-acc__panel"
        :class="{ 'is-open': openIndex === index }"
        :aria-labelledby="`${idPrefix}-acc-${index}`"
        :inert="openIndex !== index"
      >
        <div class="mkt-acc__panel-inner">
          <p class="mkt-acc__body">{{ item.body }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mkt-acc {
  display: flex;
  flex-direction: column;
}

.mkt-acc__item {
  border-bottom: 1px solid var(--mkt-border);
}

.mkt-acc__heading {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
}

.mkt-acc__trigger {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 0;
  border: 0;
  background: transparent;
  color: var(--mkt-text);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: 500;
  line-height: 1.35;
}

.mkt-acc__trigger:hover {
  color: var(--pc-navy);
}

.mkt-acc__trigger:focus-visible {
  outline: 2px solid var(--app-focus-ring);
  outline-offset: 4px;
  border-radius: var(--app-card-radius);
}

.mkt-acc__chevron {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--pc-teal-brand);
  transition: transform 0.28s ease;
}

.mkt-acc__chevron.is-open {
  transform: rotate(180deg);
}

.mkt-acc__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease;
}

.mkt-acc__panel.is-open {
  grid-template-rows: 1fr;
}

.mkt-acc__panel-inner {
  overflow: hidden;
}

.mkt-acc__body {
  margin: 0;
  padding: 0 2.5rem 1.15rem 0;
  color: var(--mkt-text-muted);
  font-size: 0.9875rem;
  line-height: 1.7;
}

@media (min-width: 640px) {
  .mkt-acc__trigger {
    font-size: 1.125rem;
  }

  .mkt-acc__body {
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mkt-acc__chevron,
  .mkt-acc__panel {
    transition: none;
  }
}
</style>
