<!-- src/components/home/visualize/VisualizeGeoMockup.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";

const props = defineProps<{ active: boolean }>();

/* ── Hotspot data ───────────────────────────────────────── */
interface Hotspot {
  label: string;
  x: number;
  y: number;
  r: number;
}

/** Positions mapped to a 500x310 SVG viewBox of the continental US */
const hotspots: Hotspot[] = [
  { label: "Houston", x: 270, y: 240, r: 9 },
  { label: "Dallas", x: 265, y: 200, r: 7 },
  { label: "Phoenix", x: 120, y: 210, r: 7 },
  { label: "Atlanta", x: 375, y: 195, r: 6 },
  { label: "Denver", x: 195, y: 150, r: 5 },
  { label: "Chicago", x: 325, y: 120, r: 5 },
  { label: "Miami", x: 410, y: 260, r: 7 },
  { label: "Minneapolis", x: 290, y: 90, r: 4 },
  { label: "Seattle", x: 90, y: 50, r: 4 },
  { label: "LA", x: 75, y: 195, r: 5 },
  { label: "Nashville", x: 350, y: 180, r: 4 },
  { label: "Charlotte", x: 395, y: 175, r: 3 },
  { label: "Kansas City", x: 280, y: 155, r: 3 },
  { label: "Sacramento", x: 60, y: 140, r: 3 },
];

/* ── Table data ─────────────────────────────────────────── */
const topCities = [
  { city: "Houston, TX", matches: 312, rate: "9.4%" },
  { city: "Dallas, TX", matches: 248, rate: "8.7%" },
  { city: "Phoenix, AZ", matches: 189, rate: "7.9%" },
  { city: "Atlanta, GA", matches: 164, rate: "7.2%" },
  { city: "Denver, CO", matches: 141, rate: "6.8%" },
];

const topZips = [
  { zip: "77001", matches: 87, rate: "11.2%" },
  { zip: "75201", matches: 64, rate: "10.1%" },
  { zip: "85001", matches: 52, rate: "9.3%" },
];

/* ── Animation state ────────────────────────────────────── */
const hasAnimated = ref(false);
const mapVisible = ref(false);
const dotsVisible = ref(false);
const tableRowsVisible = ref<boolean[]>(new Array(5).fill(false));
const zipRowsVisible = ref<boolean[]>(new Array(3).fill(false));

let timeouts: ReturnType<typeof setTimeout>[] = [];
let unmounted = false;

function clearTimers() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => {
    const id = setTimeout(r, ms);
    timeouts.push(id);
  });
}

async function runEntrance() {
  if (unmounted || hasAnimated.value) return;
  hasAnimated.value = true;

  await delay(200);
  if (unmounted) return;
  mapVisible.value = true;

  await delay(400);
  if (unmounted) return;
  dotsVisible.value = true;

  // Table rows stagger
  await delay(300);
  for (let i = 0; i < 5; i++) {
    if (unmounted) return;
    await delay(120);
    tableRowsVisible.value[i] = true;
  }

  await delay(200);
  for (let i = 0; i < 3; i++) {
    if (unmounted) return;
    await delay(120);
    zipRowsVisible.value[i] = true;
  }
}

watch(
  () => props.active,
  (val) => {
    if (val && !hasAnimated.value) runEntrance();
  },
  { immediate: true },
);

onUnmounted(() => {
  unmounted = true;
  clearTimers();
});
</script>

<template>
  <div class="flex flex-col md:flex-row gap-4 sm:gap-6 w-full">
    <!-- LEFT: SVG Map -->
    <div
      class="flex-[55] min-w-0 transition-all duration-700"
      :class="mapVisible ? 'opacity-100' : 'opacity-0'"
    >
      <div
        class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-navy)] p-3 sm:p-4"
      >
        <svg
          viewBox="0 0 500 310"
          class="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="dotGlow">
              <stop offset="0%" stop-color="var(--pc-cyan)" stop-opacity="0.6" />
              <stop offset="100%" stop-color="var(--pc-cyan)" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- Simplified continental US outline -->
          <path
            d="M60,45 L90,40 L100,35 L130,50 L160,45 L180,50 L200,45 L220,42 L250,45 L280,42 L310,48 L340,50 L360,42 L380,48 L400,50 L420,55 L435,60 L440,75 L435,90 L430,100 L435,110 L440,120 L438,135 L430,150 L425,165 L420,175 L415,185 L410,195 L415,210 L420,225 L425,240 L420,250 L410,255 L405,260 L400,265 L390,260 L380,255 L370,260 L360,255 L350,250 L340,245 L320,240 L300,238 L280,240 L270,250 L260,260 L250,265 L240,260 L230,250 L220,240 L200,235 L180,230 L160,225 L140,220 L120,215 L100,210 L80,200 L65,190 L55,175 L50,160 L48,140 L50,120 L55,100 L58,80 L60,60 Z"
            fill="none"
            stroke="var(--pc-border)"
            stroke-width="1.5"
            opacity="0.6"
          />

          <!-- State-like interior divisions (subtle) -->
          <line x1="200" y1="45" x2="200" y2="235" stroke="var(--pc-border)" stroke-width="0.3" opacity="0.3" />
          <line x1="320" y1="48" x2="320" y2="240" stroke="var(--pc-border)" stroke-width="0.3" opacity="0.3" />
          <line x1="50" y1="140" x2="440" y2="140" stroke="var(--pc-border)" stroke-width="0.3" opacity="0.3" />

          <!-- Hotspot dots with glow -->
          <template v-for="(spot, i) in hotspots" :key="spot.label">
            <!-- Outer glow -->
            <circle
              :cx="spot.x"
              :cy="spot.y"
              :r="spot.r * 2.5"
              fill="url(#dotGlow)"
              class="dot-glow"
              :class="{ visible: dotsVisible }"
              :style="{ animationDelay: i * 0.1 + 's' }"
            />
            <!-- Inner dot -->
            <circle
              :cx="spot.x"
              :cy="spot.y"
              :r="spot.r"
              fill="var(--pc-cyan)"
              class="dot-inner"
              :class="{ visible: dotsVisible }"
              :style="{ transitionDelay: i * 0.08 + 's' }"
            />
          </template>
        </svg>
      </div>
    </div>

    <!-- RIGHT: Tables -->
    <div class="flex-[45] min-w-0 flex flex-col gap-3 sm:gap-4">
      <!-- Top Converting Cities -->
      <div
        class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4"
      >
        <h4
          class="text-xs sm:text-sm font-semibold text-[var(--pc-text)] mb-3"
        >
          Top Converting Cities
        </h4>
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="text-left text-[10px] sm:text-xs font-semibold text-[var(--pc-cyan)] uppercase tracking-wide pb-2"
              >
                City
              </th>
              <th
                class="text-right text-[10px] sm:text-xs font-semibold text-[var(--pc-cyan)] uppercase tracking-wide pb-2"
              >
                Matches
              </th>
              <th
                class="text-right text-[10px] sm:text-xs font-semibold text-[var(--pc-cyan)] uppercase tracking-wide pb-2"
              >
                Match Rate
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in topCities"
              :key="row.city"
              class="border-t border-[var(--pc-border)] transition-all duration-400"
              :class="
                tableRowsVisible[i]
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-4'
              "
            >
              <td class="py-2 text-xs sm:text-sm text-[var(--pc-text-muted)]">
                {{ row.city }}
              </td>
              <td
                class="py-2 text-xs sm:text-sm text-[var(--pc-text-muted)] text-right"
              >
                {{ row.matches }}
              </td>
              <td
                class="py-2 text-xs sm:text-sm text-right"
              >
                <span class="inline-flex items-center gap-1">
                  <span
                    class="inline-block h-1.5 w-6 rounded-full bg-[var(--pc-cyan)]"
                    :style="{
                      width: (parseFloat(row.rate) / 12) * 100 + '%',
                      maxWidth: '24px',
                    }"
                  />
                  <span class="text-[var(--pc-text)]  font-medium">{{
                    row.rate
                  }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top ZIP Codes -->
      <div
        class="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-card)] p-3 sm:p-4"
      >
        <h4
          class="text-xs sm:text-sm font-semibold text-[var(--pc-text)] mb-3"
        >
          Top ZIP Codes
        </h4>
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="text-left text-[10px] sm:text-xs font-semibold text-[var(--pc-cyan)] uppercase tracking-wide pb-2"
              >
                ZIP
              </th>
              <th
                class="text-right text-[10px] sm:text-xs font-semibold text-[var(--pc-cyan)] uppercase tracking-wide pb-2"
              >
                Matches
              </th>
              <th
                class="text-right text-[10px] sm:text-xs font-semibold text-[var(--pc-cyan)] uppercase tracking-wide pb-2"
              >
                Match Rate
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in topZips"
              :key="row.zip"
              class="border-t border-[var(--pc-border)] transition-all duration-400"
              :class="
                zipRowsVisible[i]
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-4'
              "
            >
              <td class="py-2 text-xs sm:text-sm text-[var(--pc-text-muted)]">
                {{ row.zip }}
              </td>
              <td
                class="py-2 text-xs sm:text-sm text-[var(--pc-text-muted)] text-right"
              >
                {{ row.matches }}
              </td>
              <td
                class="py-2 text-xs sm:text-sm text-right"
              >
                <span class="inline-flex items-center gap-1">
                  <span
                    class="inline-block h-1.5 w-6 rounded-full bg-[var(--pc-yellow)]"
                    :style="{
                      width: (parseFloat(row.rate) / 12) * 100 + '%',
                      maxWidth: '24px',
                    }"
                  />
                  <span class="text-[var(--pc-text)] font-medium">{{
                    row.rate
                  }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dot entrance */
.dot-inner {
  opacity: 0;
  transform-origin: center;
  transition: opacity 0.4s ease;
}
.dot-inner.visible {
  opacity: 1;
}

/* Glow pulse */
.dot-glow {
  opacity: 0;
}
.dot-glow.visible {
  animation: pulseGlow 2.5s ease-in-out infinite;
}
@keyframes pulseGlow {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.15);
  }
}
</style>
