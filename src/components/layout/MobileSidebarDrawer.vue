<!-- src/components/layout/MobileSidebarDrawer.vue -->
<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useSidebar } from '@/composables/useSidebar'
import AppSidebar from './AppSidebar.vue'

const { isMobileOpen, closeMobile } = useSidebar()

// Escape key closes drawer
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMobile()
}

// Body scroll lock + keyboard listener
watch(isMobileOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="isMobileOpen"
        class="drawer-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        @click.self="closeMobile"
      >
        <aside class="drawer-panel">
          <AppSidebar />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
}

.drawer-panel {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--app-card-bg, #ffffff);
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
}

/* Drawer renders AppSidebar in expanded state always */
.drawer-panel :deep(.sidebar) {
  width: 100% !important;
  height: 100%;
  border-right: none;
}

.drawer-panel :deep(.sidebar.collapsed) {
  width: 100% !important;
}

.drawer-panel :deep(.sidebar.collapsed .sidebar-label) {
  opacity: 1;
  width: auto;
  pointer-events: auto;
}

/* ── Transition ────────────────────────────────────────── */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease-out;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.2s ease-out;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(-100%);
}
</style>
