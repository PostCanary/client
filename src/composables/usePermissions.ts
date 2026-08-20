import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

export function usePermissions() {
  const auth = useAuthStore();

  const canPurchase = computed(
    () =>
      auth.me?.authenticated === true &&
      auth.me.permissions?.can_purchase === true,
  );
  const manageOrg = computed(() => {
    if (auth.me?.authenticated !== true) return false;
    if (auth.me.permissions) return auth.me.permissions.manage_org === true;
    return auth.orgRole === "owner" || auth.orgRole === "admin";
  });
  const manageBilling = computed(() => {
    if (auth.me?.authenticated !== true) return false;
    if (auth.me.permissions) return auth.me.permissions.manage_billing === true;
    return auth.orgRole === "owner" || auth.orgRole === "admin";
  });

  return {
    canPurchase,
    manageOrg,
    manageBilling,
  };
}
