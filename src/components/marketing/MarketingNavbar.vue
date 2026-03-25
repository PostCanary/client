<!-- src/components/marketing/MarketingNavbar.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDemoStore } from "@/stores/demo";
import { BRAND } from "@/config/brand";
import landingLogo from "@/assets/postcanary-logo.png";

const auth = useAuthStore();
const demo = useDemoStore();

const scrolled = ref(false);
const mobileMenuOpen = ref(false);
const toolsOpen = ref(false);
let toolsCloseTimer: ReturnType<typeof setTimeout> | null = null;

function onScroll() {
  scrolled.value = window.scrollY > 20;
}

onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));

function openTools() {
  if (toolsCloseTimer) clearTimeout(toolsCloseTimer);
  toolsOpen.value = true;
}

function closeTools() {
  toolsCloseTimer = setTimeout(() => {
    toolsOpen.value = false;
  }, 150);
}

const onAuthClick = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/dashboard", "login");
    return;
  }
  window.location.href = "/dashboard";
};

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

const toolLinks = [
  { label: "Attribution Gap Calculator", href: "/attribution-gap-calculator" },
  { label: "ROI Calculator", href: "/direct-mail-roi-calculator" },
  { label: "Savings Calculator", href: "/savings-calculator" },
];
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-all duration-300"
    :class="
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(12,45,80,0.08)]'
        : 'bg-transparent'
    "
  >
    <nav
      class="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-10 xl:px-16 py-3 sm:py-4"
    >
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 shrink-0">
        <img
          :src="landingLogo"
          :alt="BRAND.name"
          class="h-9 sm:h-11 w-auto"
        />
      </router-link>

      <!-- Desktop nav links -->
      <div class="hidden md:flex items-center gap-8">
        <router-link
          v-for="link in navLinks"
          :key="link.label"
          :to="link.href"
          class="text-[15px] font-medium text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] transition-colors"
        >
          {{ link.label }}
        </router-link>

        <!-- Tools dropdown -->
        <div
          class="relative"
          @mouseenter="openTools"
          @mouseleave="closeTools"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[15px] font-medium text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] transition-colors cursor-pointer"
            @click="toolsOpen = !toolsOpen"
          >
            Tools
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200"
              :class="toolsOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="dropdown">
            <div
              v-if="toolsOpen"
              class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-[var(--mkt-border)] bg-white shadow-[var(--mkt-card-shadow-lg)] py-2"
            >
              <router-link
                v-for="tool in toolLinks"
                :key="tool.label"
                :to="tool.href"
                class="block px-4 py-2.5 text-[14px] font-medium text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] hover:bg-[var(--mkt-bg-alt)] transition-colors"
                @click="toolsOpen = false"
              >
                {{ tool.label }}
              </router-link>
            </div>
          </Transition>
        </div>
      </div>

      <!-- CTAs -->
      <div class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          class="hidden md:inline-flex whitespace-nowrap rounded-lg border border-[var(--mkt-teal)] px-4 md:px-5 py-1.5 md:py-2 text-[14px] md:text-[15px] font-semibold text-[var(--mkt-teal)] hover:bg-[var(--mkt-teal)] hover:text-white transition-all cursor-pointer"
          @click="demo.open()"
        >
          Book a Demo
        </button>

        <button
          type="button"
          class="whitespace-nowrap rounded-lg bg-[var(--mkt-navy)] px-4 md:px-5 py-1.5 md:py-2 text-[14px] md:text-[15px] font-semibold text-white shadow-sm hover:bg-[var(--mkt-navy)]/90 transition-all cursor-pointer"
          @click="onAuthClick"
        >
          {{ auth.isAuthenticated ? "Dashboard" : "Log In / Sign Up" }}
        </button>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--mkt-text-muted)] hover:bg-[var(--mkt-bg-alt)] transition-colors cursor-pointer"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile menu -->
    <Transition name="mobile-menu">
      <div
        v-if="mobileMenuOpen"
        class="md:hidden bg-white border-t border-[var(--mkt-border)] px-4 pb-4"
      >
        <div class="flex flex-col gap-1 pt-2">
          <router-link
            v-for="link in navLinks"
            :key="link.label"
            :to="link.href"
            class="px-3 py-2.5 text-[15px] font-medium text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] hover:bg-[var(--mkt-bg-alt)] rounded-lg transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ link.label }}
          </router-link>

          <!-- Mobile tools section -->
          <div class="px-3 pt-2 pb-1">
            <span class="text-[12px] font-semibold uppercase tracking-wider text-[var(--mkt-text-soft)]">
              Tools
            </span>
          </div>
          <router-link
            v-for="tool in toolLinks"
            :key="tool.label"
            :to="tool.href"
            class="px-3 py-2.5 pl-5 text-[15px] font-medium text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] hover:bg-[var(--mkt-bg-alt)] rounded-lg transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ tool.label }}
          </router-link>

          <button
            type="button"
            class="mt-2 w-full rounded-lg border border-[var(--mkt-teal)] px-4 py-2.5 text-[15px] font-semibold text-[var(--mkt-teal)] hover:bg-[var(--mkt-teal)] hover:text-white transition-all cursor-pointer"
            @click="
              demo.open();
              mobileMenuOpen = false;
            "
          >
            Book a Demo
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.mobile-menu-enter-active {
  transition: all 0.2s ease-out;
}
.mobile-menu-leave-active {
  transition: all 0.15s ease-in;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-enter-active {
  transition: all 0.15s ease-out;
}
.dropdown-leave-active {
  transition: all 0.1s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px) scale(0.97);
}
</style>
