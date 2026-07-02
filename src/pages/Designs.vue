<!-- src/pages/Designs.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { captureEvent } from '@/composables/usePostHog'
import { visibleDesignLibraryTemplates, type DesignLibraryTemplate } from '@/data/templates'

const router = useRouter()

onMounted(() => {
  captureEvent('designs_page_viewed')
})

function startFromTemplate(template: DesignLibraryTemplate) {
  captureEvent('designs_template_started', {
    template_id: template.id,
    render_template_id: template.renderTemplateId,
  })
  router.push({
    path: '/app/send',
    query: {
      templateId: template.id,
      goal: template.goalTypes[0],
    },
  })
}
</script>

<template>
  <div class="designs-page">
    <div class="designs-header">
      <h1 class="designs-title">Designs</h1>
      <p class="designs-subtitle">Approved launch templates for customer-visible postcards.</p>
    </div>

    <div class="designs-grid">
      <!-- "Create New" card (always first) -->
      <button class="design-card design-card--new" @click="() => { captureEvent('designs_create_new_clicked', {}); router.push('/app/send') }" type="button">
        <div class="design-card__icon">+</div>
        <span class="design-card__label">Create New Design</span>
      </button>

      <article
        v-for="template in visibleDesignLibraryTemplates"
        :key="template.id"
        class="design-card design-card--template"
        data-testid="design-library-template"
      >
        <div class="design-card__preview">
          <span class="design-card__badge">{{ template.cardPosition.replace('_', ' ') }}</span>
          <strong>{{ template.name }}</strong>
        </div>
        <div class="design-card__meta">
          <span class="design-card__name">{{ template.name }}</span>
          <span class="design-card__date">{{ template.renderTemplateId }}</span>
          <div class="design-card__tags" aria-label="Template tags">
            <span v-for="tag in template.tags" :key="tag">{{ tag }}</span>
          </div>
          <button
            class="design-card__action"
            type="button"
            @click="startFromTemplate(template)"
          >
            Start from template
          </button>
        </div>
      </article>
    </div>

    <div class="designs-empty">
      <p>User-saved designs will appear here after saved-template storage is approved.</p>
    </div>
  </div>
</template>

<style scoped>
.designs-page {
  max-width: 960px;
}

.designs-header {
  margin-bottom: 24px;
}

.designs-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text, #0c2d50);
  margin: 0;
}

.designs-subtitle {
  font-size: 14px;
  color: var(--app-text-secondary, #64748b);
  margin: 4px 0 0;
}

.designs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.design-card {
  min-height: 240px;
  border-radius: 8px;
  border: 1px solid var(--app-border, #e2e8f0);
  background: var(--app-card-bg, #ffffff);
  overflow: hidden;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.design-card:hover {
  box-shadow: 0 4px 12px rgba(12, 45, 80, 0.08);
  transform: translateY(-2px);
}

.design-card--new {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-style: dashed;
  border-width: 2px;
  border-color: var(--app-border-medium, #dde3ea);
  cursor: pointer;
  background: transparent;
}

.design-card--new:hover {
  border-color: var(--app-teal, #47bfa9);
  background: rgba(71, 191, 169, 0.04);
}

.design-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(71, 191, 169, 0.1);
  color: var(--app-teal, #47bfa9);
  font-size: 28px;
  font-weight: 300;
}

.design-card__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-teal, #47bfa9);
}

.design-card--placeholder {
  opacity: 0.5;
  pointer-events: none;
}

.design-card__preview {
  aspect-ratio: 4 / 3;
  background:
    linear-gradient(135deg, rgba(71, 191, 169, 0.16), rgba(12, 45, 80, 0.08)),
    var(--app-bg, #f0f2f5);
  color: var(--app-text, #0c2d50);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px;
}

.design-card__preview strong {
  font-size: 16px;
  line-height: 1.2;
}

.design-card__badge {
  align-self: flex-start;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--app-text-secondary, #64748b);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  text-transform: capitalize;
}

.design-card__meta {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.design-card__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text, #0c2d50);
}

.design-card__date {
  font-size: 12px;
  color: var(--app-text-muted, #94a3b8);
}

.design-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.design-card__tags span {
  border-radius: 999px;
  background: var(--app-bg, #f0f2f5);
  color: var(--app-text-secondary, #64748b);
  font-size: 11px;
  padding: 3px 7px;
}

.design-card__action {
  align-self: flex-start;
  border: 0;
  border-radius: 6px;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  margin-top: 8px;
  padding: 8px 10px;
}

.design-card__action:hover {
  background: #329f8e;
}

.designs-empty {
  text-align: center;
}

.designs-empty p {
  font-size: 14px;
  color: var(--app-text-muted, #94a3b8);
}
</style>
