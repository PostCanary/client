<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useCampaignStore } from "@/stores/useCampaignStore";

const store = useCampaignStore();

onMounted(() => {
  store.hydrate();
  store.fetchCampaigns();
});

const options = computed(() => {
  return [
    { id: null, label: "All Campaigns" },
    ...store.campaigns.map((c) => ({ id: c.id, label: c.name })),
  ];
});

function onChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  store.setActiveCampaign(val || null);
  // Dispatch a global event so pages can react
  window.dispatchEvent(new CustomEvent("mt:campaign-changed", { detail: { campaignId: val || null } }));
}
</script>

<template>
  <div class="campaign-selector">
    <label class="selector-label">Campaign</label>
    <select
      class="selector-select"
      :value="store.activeCampaignId ?? ''"
      @change="onChange"
    >
      <option
        v-for="opt in options"
        :key="opt.id ?? 'all'"
        :value="opt.id ?? ''"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.campaign-selector {
  padding: 4px 12px 8px;
}

.selector-label {
  display: block;
  font-family: "Instrument Sans", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #47bfa9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.selector-select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-family: "Instrument Sans", system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: border-color 120ms ease;
  appearance: auto;
}

.selector-select:hover {
  border-color: #47bfa9;
}

.selector-select:focus {
  outline: none;
  border-color: #47bfa9;
  box-shadow: 0 0 0 2px rgba(71, 191, 169, 0.15);
}
</style>
