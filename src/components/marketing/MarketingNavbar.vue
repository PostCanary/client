<!-- src/components/marketing/MarketingNavbar.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { BRAND } from "@/config/brand";
import landingLogo from "@/assets/brand/logo-webheader-dark.png";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const scrolled = ref(false);
const mobileMenuOpen = ref(false);
const featuresOpen = ref(false);
const mobileToggle = ref<HTMLElement | null>(null);
let featuresCloseTimer: ReturnType<typeof setTimeout> | null = null;

// When the mobile menu closes and focus is inside it (or lost to the body),
// return focus to the toggle so keyboard users keep their place.
watch(mobileMenuOpen, (open) => {
  if (open) return;
  const active = document.activeElement;
  const panel = document.getElementById("mobile-marketing-menu");
  const focusLost =
    !active || active === document.body || panel?.contains(active);
  if (focusLost) mobileToggle.value?.focus();
});

function onScroll() {
  scrolled.value = window.scrollY > 20;
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest("[data-features-menu]")) featuresOpen.value = false;
  if (!target?.closest("[data-mobile-menu]")) mobileMenuOpen.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  featuresOpen.value = false;
  mobileMenuOpen.value = false;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
  if (featuresCloseTimer) clearTimeout(featuresCloseTimer);
});

function openFeatures() {
  if (featuresCloseTimer) clearTimeout(featuresCloseTimer);
  featuresOpen.value = true;
}

function closeFeatures() {
  featuresCloseTimer = setTimeout(() => {
    featuresOpen.value = false;
  }, 150);
}

const onAuthClick = () => {
  if (!auth.isAuthenticated) {
    auth.openLoginModal("/app/home", "login");
    return;
  }
  window.location.href = "/app/home";
};

const featureLinks = [
  { label: "EDDM", hash: "#eddm" },
  { label: "Targeted Mail", hash: "#targeted-mail" },
  { label: "Analytics", hash: "#analytics" },
];

async function goToHash(hash: string) {
  featuresOpen.value = false;
  mobileMenuOpen.value = false;

  if (route.path === "/" && route.hash === hash) {
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: "smooth" });
    if (el instanceof HTMLElement) el.focus({ preventScroll: true });
    return;
  }

  await router.push({ path: "/", hash }).catch(() => {});
}
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-navy text-white transition-shadow duration-300"
    :class="scrolled ? 'shadow-[0_1px_8px_rgba(0,0,0,0.28)]' : ''"
  >
    <nav
      class="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 md:px-10 xl:px-16 py-3 sm:py-4"
      aria-label="Marketing"
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
        <div
          class="relative"
          data-features-menu
          @mouseenter="openFeatures"
          @mouseleave="closeFeatures"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[15px] font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
            :aria-expanded="featuresOpen"
            aria-haspopup="true"
            aria-controls="features-menu"
            @click="featuresOpen = !featuresOpen"
          >
            Features
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200"
              :class="featuresOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="dropdown">
            <div
              v-if="featuresOpen"
              id="features-menu"
              role="menu"
              class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-[var(--app-card-radius)] border border-[var(--app-border)] bg-[var(--app-card-bg)] py-2"
            >
              <a
                v-for="link in featureLinks"
                :key="link.hash"
                :href="`/${link.hash}`"
                role="menuitem"
                class="block px-4 py-2.5 text-[14px] font-medium text-[var(--mkt-text-muted)] hover:text-[var(--mkt-text)] hover:bg-[var(--mkt-bg-alt)] transition-colors"
                @click.prevent="goToHash(link.hash)"
              >
                {{ link.label }}
              </a>
            </div>
          </Transition>
        </div>

        <a
          href="/#pricing"
          class="text-[15px] font-medium text-white/80 hover:text-white transition-colors"
          @click.prevent="goToHash('#pricing')"
        >
          Pricing
        </a>
      </div>

      <!-- CTAs -->
      <div class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          class="whitespace-nowrap rounded-[var(--app-card-radius)] bg-canary px-4 md:px-5 py-1.5 md:py-2 text-[14px] md:text-[15px] font-semibold text-navy hover:bg-canary/90 transition-colors cursor-pointer"
          @click="onAuthClick"
        >
          {{ auth.isAuthenticated ? "Dashboard" : "Log In" }}
        </button>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          ref="mobileToggle"
          data-mobile-menu
          class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-marketing-menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
            aria-hidden="true"
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
        id="mobile-marketing-menu"
        data-mobile-menu
        class="md:hidden bg-navy border-t border-white/10 px-4 pb-4"
      >
        <div class="flex flex-col gap-1 pt-2">
          <span
            class="px-3 pt-2 pb-1 text-[12px] font-semibold uppercase tracking-wider text-white/50"
          >
            Features
          </span>
          <a
            v-for="link in featureLinks"
            :key="link.hash"
            :href="`/${link.hash}`"
            class="px-3 py-2.5 pl-5 text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            @click.prevent="goToHash(link.hash)"
          >
            {{ link.label }}
          </a>

          <a
            href="/#pricing"
            class="px-3 py-2.5 text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            @click.prevent="goToHash('#pricing')"
          >
            Pricing
          </a>
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

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>
