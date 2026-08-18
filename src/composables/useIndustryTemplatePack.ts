import { computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useBrandKitStore } from "@/stores/useBrandKitStore";
import {
  packIdForIndustrySlug,
  resolveTemplatePack,
  storedIndustrySlug,
} from "@/data/industryTemplatePacks";
import {
  DESIGN_LIBRARY_TEMPLATES,
  getVisibleDesignLibraryTemplates,
  type DesignLibraryTemplate,
} from "@/data/templates";

/** Shared hook: Designs library + send-flow Design step read the same pack. */
export function useIndustryTemplatePack() {
  const brandKitStore = useBrandKitStore();
  const auth = useAuthStore();

  onMounted(() => {
    if (!brandKitStore.hydrated) void brandKitStore.fetch();
  });

  const industrySlug = computed(() =>
    storedIndustrySlug(
      brandKitStore.brandKit?.industry,
      auth.profile?.industry,
    ),
  );

  const mappedPackId = computed(() => packIdForIndustrySlug(industrySlug.value));

  const packId = computed(() =>
    resolveTemplatePack(industrySlug.value, DESIGN_LIBRARY_TEMPLATES),
  );

  const templates = computed<DesignLibraryTemplate[]>(() =>
    getVisibleDesignLibraryTemplates(undefined, industrySlug.value),
  );

  return { industrySlug, mappedPackId, packId, templates };
}
