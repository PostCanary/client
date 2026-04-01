// src/composables/useSidebar.ts
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const LS_KEY = 'pc:sidebar:collapsed'

// Module-level state (shared across all component instances)
const isCollapsed = ref(false)
const isAutoCollapsed = ref(false)
const isMobileOpen = ref(false)

// Reactive window width so isMobile recomputes on resize
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

// Routes that auto-collapse the sidebar for maximum canvas space
const AUTO_COLLAPSE_ROUTES = ['/app/map', '/map']

// Breakpoints
const MOBILE_BREAKPOINT = 640
const TABLET_BREAKPOINT = 1024

// Initialization guard — composable is called from 4+ components, but
// resize listener and localStorage hydration should only run once.
let initialized = false

export function useSidebar() {
  const route = useRoute()

  // ── Initialization ──
  function hydrateFromStorage() {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored !== null) {
        isCollapsed.value = stored === 'true'
      } else {
        // Default based on screen width
        isCollapsed.value = window.innerWidth < TABLET_BREAKPOINT
      }
    } catch {
      isCollapsed.value = false
    }
  }

  function persistState() {
    try {
      // Only persist manual collapse, not auto-collapse
      if (!isAutoCollapsed.value) {
        localStorage.setItem(LS_KEY, String(isCollapsed.value))
      }
    } catch {
      // localStorage unavailable
    }
  }

  // ── Actions ──
  function toggle() {
    if (isAutoCollapsed.value) return // don't toggle when auto-collapsed
    isCollapsed.value = !isCollapsed.value
    persistState()
  }

  function collapse() {
    isCollapsed.value = true
    persistState()
  }

  function expand() {
    isCollapsed.value = false
    persistState()
  }

  function toggleMobile() {
    isMobileOpen.value = !isMobileOpen.value
  }

  function closeMobile() {
    isMobileOpen.value = false
  }

  // ── Responsive handler ──
  function onResize() {
    windowWidth.value = window.innerWidth
    const width = windowWidth.value
    if (width < MOBILE_BREAKPOINT) {
      // Mobile: sidebar is always a drawer, never inline
      isCollapsed.value = true
    } else if (width < TABLET_BREAKPOINT && !isAutoCollapsed.value) {
      // Tablet: default to collapsed
      isCollapsed.value = true
    }
  }

  // ── Computed ──
  // Derives from reactive windowWidth ref so it recomputes on resize
  const isMobile = computed(() => windowWidth.value < MOBILE_BREAKPOINT)

  const sidebarWidth = computed(() => {
    if (isMobile.value) return 0 // sidebar is drawer on mobile
    return isCollapsed.value ? 64 : 240
  })

  // ── Initialization (runs once, no matter how many components call useSidebar) ──
  if (!initialized) {
    initialized = true
    hydrateFromStorage()
    window.addEventListener('resize', onResize)

    // Route watcher registered once to avoid duplicate watchers from 4+ consumers
    watch(
      () => route.path,
      (newPath) => {
        const shouldAutoCollapse = AUTO_COLLAPSE_ROUTES.some(
          r => newPath === r || newPath.startsWith(r + '/')
        )

        if (shouldAutoCollapse) {
          isAutoCollapsed.value = true
          isCollapsed.value = true
        } else if (isAutoCollapsed.value) {
          isAutoCollapsed.value = false
          hydrateFromStorage()
        }

        closeMobile()
      }
    )
    // Only auto-collapse on init if no localStorage preference exists.
    // If user manually set collapsed=false on tablet, respect that.
    if (localStorage.getItem(LS_KEY) === null) {
      onResize() // set initial state based on screen width
    }
  }
  // No onMounted/onUnmounted — singleton pattern, listener lives for app lifetime.

  return {
    // State
    isCollapsed,
    isAutoCollapsed,
    isMobileOpen,
    isMobile,
    sidebarWidth,

    // Actions
    toggle,
    collapse,
    expand,
    toggleMobile,
    closeMobile,
  }
}
