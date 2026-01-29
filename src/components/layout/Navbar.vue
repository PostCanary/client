<!-- src/components/layout/Navbar.vue -->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import profileIcon from "@/assets/profile-icon.svg?url";
import LogoUrl from "@/assets/source-logo-02.png";
import { hashUsernameToGradient } from "@/utils/avatar-gradient";

const props = withDefaults(
  defineProps<{
    title?: string;
    userName?: string;
    userRole?: string;
    avatarUrl?: string;
    showSearch?: boolean;
    modelValue?: string;
  }>(),
  {
    title: "Dashboard",
    userName: "",
    userRole: "",
    avatarUrl: "",
    showSearch: true,
    modelValue: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "search", v: string): void;
  (e: "profile-click"): void;
  (e: "settings-click"): void;
}>();

const q = ref(props.modelValue ?? "");

watch(
  () => props.modelValue,
  (v) => {
    if (v !== q.value) q.value = v ?? "";
  }
);

/*
function doSearch() {
  emit("update:modelValue", q.value);
  emit("search", q.value);
}
*/

// initials fallback (still only for avatar circle)
const initials = computed(() => {
  const name = (props.userName ?? "").trim();
  if (!name) return "U";
  const parts = name.split(/\s+/).filter(Boolean);
  const a = parts[0]?.charAt(0) ?? "";
  const b = parts[1]?.charAt(0) ?? "";
  return (a + b || a || "U").toUpperCase();
});

// gradient avatar background
const avatarGradientStyle = computed(() => {
  const [from, to] = hashUsernameToGradient(props.userName ?? "");
  return {
    background: `linear-gradient(135deg, ${from}, ${to})`,
  };
});
</script>

<template>
  <!-- Same pill card as before -->
  <div
    class="mt-nav-root w-full rounded-xl bg-white shadow-[0_1px_3px_rgba(12,45,80,.08),0_10px_24px_rgba(12,45,80,.06)] px-5 py-3 flex items-center gap-4"
  >
    <!-- Left: logo + title -->
    <div class="flex items-center gap-3 whitespace-nowrap">
      <img
        :src="LogoUrl"
        alt="MailTrace"
        class="h-7 w-auto object-contain"
        draggable="false"
      />
      <h1
        class="text-[20px] sm:text-[21px] lg:text-[21px] leading-tight font-medium tracking-[-0.02em] text-[#0c2d50]"
      >
        {{ props.title }}
      </h1>
    </div>

    <!-- Spacer -->
    <div class="grow"></div>

    <!-- 🔒 Inline search: commented out per client request -->
    <!--
    <div
      v-if="props.showSearch"
      class="hidden sm:flex items-center gap-3 rounded-xl bg-[#f4f5f7] h-12 px-4 min-w-[260px] max-w-[520px] shadow-[inset_0_1px_0_rgba(0,0,0,.04)]"
    >
      <input
        v-model="q"
        type="text"
        placeholder="Search"
        class="bg-transparent outline-none w-full text-[16px] placeholder-[#6b6b6b]"
        @keydown.enter.prevent="doSearch"
      />

      <button
        class="rounded-lg p-2 hover:bg-white/70 transition"
        @click="doSearch"
        aria-label="Search"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5">
          <path
            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
            fill="none"
            stroke="#47bfa9"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    -->

    <!-- Right: user area -->
    <div class="mt-nav-user hidden sm:flex items-center gap-3 pl-2">
      <button
        class="w-[42px] h-[42px] rounded-full overflow-hidden ring-1 ring-black/5 flex items-center justify-center cursor-pointer"
        :style="avatarGradientStyle"
        @click="$emit('profile-click')"
        :aria-label="`Profile: ${props.userName || initials}`"
      >
        <img
          v-if="props.avatarUrl"
          :src="props.avatarUrl"
          alt=""
          class="w-full h-full object-cover"
        />
        <img
          v-else
          :src="profileIcon"
          alt=""
          class="w-2/3 h-2/3 object-contain"
        />
      </button>

      <div class="leading-tight" v-if="props.userName || props.userRole">
        <!-- 👇 full name, no truncation / ellipsis rules anymore -->
        <div
          v-if="props.userName"
          class="mt-user-name text-[16px] font-semibold tracking-[0.01em] text-black"
        >
          {{ props.userName }}
        </div>
        <div v-if="props.userRole" class="text-[14px] text-[#47bfa9]">
          {{ props.userRole }}
        </div>
      </div>

      <div class="w-2"></div>

      <button
        class="w-[42px] h-[42px] rounded-full bg-[#f4f5f7] grid place-items-center hover:bg-[#e9ecef] transition"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0"
            fill="none"
            stroke="#47bfa9"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Search-specific sizing left here in case we re-enable it later.
   It's harmless while the block is commented out, but you can delete it if you want. */
.mt-nav-search {
  flex: 0 1 520px;
  max-width: 520px;
}

/* ⛔️ Removed max-width/ellipsis for .mt-user-name so the full name always shows */
/*
.mt-user-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 901px) and (max-width: 1100px) {
  .mt-nav-search {
    flex-basis: 360px;
    max-width: 380px;
  }

  .mt-user-name {
    max-width: 130px;
  }
}
*/
</style>
