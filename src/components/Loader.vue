<!-- src/components/Loader.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLoader } from '@/stores/loader'

const loader = useLoader()
const { open, locked, progress, message, etaSeconds } = storeToRefs(loader)
const isDone = computed(() => progress.value >= 100)

// expose a force-close that ignores locked (you wanted "always closable")
function closeNow() { loader.hide(true) }

// body lock for scroll-stop + quick visual check
const BODY_ATTR = '__mt_loader_lock'
watch(locked, (val) => {
  document.body.setAttribute(`data-${BODY_ATTR}`, val ? '1' : '0')
  document.body.style.overflow = val ? 'hidden' : ''
}, { immediate: true })

onMounted(() => {
  if (locked.value) {
    document.body.setAttribute(`data-${BODY_ATTR}`, '1')
    document.body.style.overflow = 'hidden'
  }
})
onBeforeUnmount(() => {
  document.body.removeAttribute(`data-${BODY_ATTR}`)
  document.body.style.overflow = ''
})

const pctStr = computed(() => `${Math.round(progress.value || 0)}%`)
const etaStr = computed(() => {
  const sec = etaSeconds.value
  if (sec == null) return '≈ --:-- left'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `≈ ${m}m ${s}s left` : `≈ ${s}s left`
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 flex items-center justify-center"
        style="z-index: 2147483646;"
        role="dialog"
        aria-label="Analyzing run"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" aria-hidden="true"></div>

        <!-- Card -->
        <div
          class="relative bg-white rounded-2xl shadow-xl w-[min(560px,92vw)] p-6 sm:p-8"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <!-- Close -->
          <button
            type="button"
            class="absolute top-3 right-3 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
            title="Close"
            aria-label="Close"
            @click.stop="closeNow"
          >
            <span class="text-xl leading-none">&times;</span>
          </button>

          <!-- Decorative scene -->
          <div class="scene" aria-hidden="true">
            <!-- envelope -->
            <svg class="env" viewBox="0 0 240 200" width="280" height="230">
              <rect x="20" y="36" rx="14" ry="14" width="200" height="128" fill="#f4f6f9" stroke="#e2e8f0" stroke-width="1.5"/>
              <rect x="24" y="40" rx="12" ry="12" width="192" height="120" fill="#ffffff"/>
              <path d="M20,52 L120,116 L220,52 L220,36 C220,28.268 213.732,22 206,22 L34,22 C26.268,22 20,28.268 20,36 Z" fill="#e2e8f0"/>
              <path d="M20,52 L120,116 L220,52" fill="none" stroke="#cbd5e1" stroke-width="2"/>
            </svg>

            <!-- faint chart grid + sparkline -->
            <svg class="chart" viewBox="0 0 240 200" width="280" height="230">
              <defs>
                <pattern id="gridM" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0 H0 V20" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
                </pattern>
                <linearGradient id="fillM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(71,191,169,0.30)"/>
                  <stop offset="100%" stop-color="rgba(71,191,169,0)"/>
                </linearGradient>
              </defs>
              <g transform="translate(0,-12)">
                <rect x="24" y="40" width="192" height="120" fill="url(#gridM)"/>
                <path d="M32 150 H208" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
                <path d="M32 150 V56" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
                <path d="M32 150 L48 138 C56 132,64 126,72 128 S88 138,96 132 S112 108,120 112 S136 140,144 132 S160 98,168 100 S184 126,192 118 L208 118 L208 150 Z"
                      fill="url(#fillM)"/>
                <path d="M32 150 L48 138 C56 132,64 126,72 128 S88 138,96 132 S112 108,120 112 S136 140,144 132 S160 98,168 100 S184 126,192 118 L208 118"
                      fill="none" stroke="#47bfa9" stroke-width="3" stroke-linecap="round"/>
              </g>
            </svg>

            <!-- magnifying glass: gentle bob -->
            <div class="scope-center" :class="{ paused: isDone }" aria-hidden="true">
              <div class="drift">
                <svg class="scope" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="rimM" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#3aa893"/><stop offset="100%" stop-color="#47bfa9"/>
                    </linearGradient>
                    <linearGradient id="handleM" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#47bfa9"/><stop offset="100%" stop-color="#3aa893"/>
                    </linearGradient>
                  </defs>
                  <circle cx="54" cy="52" r="33" fill="none" stroke="url(#rimM)" stroke-width="6"/>
                  <g transform="translate(54,52) rotate(40)">
                    <rect x="31" y="-9" width="10" height="18" rx="5" fill="#3aa893"/>
                    <rect x="41" y="-7" width="42" height="14" rx="7" fill="url(#handleM)"/>
                    <rect x="43" y="-5" width="24" height="10" rx="5" fill="rgba(255,255,255,0.22)"/>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <!-- Copy -->
          <div class="text-lg font-semibold text-center text-[var(--app-text)]">{{ message || 'Analyzing run' }}</div>
          <div class="mt-1 text-sm text-center text-[var(--app-text-secondary)]">This may take a moment</div>

          <!-- Progress -->
          <div class="mt-4 mx-1.5 h-2 rounded-full bg-[var(--app-border)] overflow-hidden">
            <div class="h-full rounded-full bg-[var(--app-teal)] transition-all duration-300" :style="{ width: (progress || 0) + '%' }" />
          </div>
          <div class="flex justify-between items-center text-xs mt-1 mx-1.5">
            <span class="text-[var(--app-text-secondary)]">Completed</span>
            <span class="font-bold text-[var(--app-text)]">{{ pctStr }}</span>
          </div>
          <div class="text-xs text-[var(--app-text-muted)] text-center mt-1.5">{{ etaStr }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* Transition classes (non-scoped for <Transition>) */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style scoped>
/* Scene layout */
.scene {
  position: relative;
  width: 360px; height: 260px;
  margin: 22px auto 30px auto;
  pointer-events: none; user-select: none;
  opacity: .98;
}
.scene .env {
  position: absolute; left: 50%; top: -6px;
  transform: translate(-50%, 0);
  filter: drop-shadow(0 6px 12px rgba(0,0,0,.08));
}
.scene .chart {
  position: absolute; left: 50%; bottom: 22px;
  transform: translateX(-50%);
  opacity: .50;
}

/* Magnifying glass positioning + animation */
.scope-center {
  position: absolute; left: 50%; top: 56%;
  width: 1px; height: 1px;
  transform: translate(-50%, -50%);
}
.drift {
  animation: bob 2.6s ease-in-out infinite;
}
.scope {
  width: 120px; height: 120px;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,.10));
}

.paused .drift { animation-play-state: paused; }

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
</style>
