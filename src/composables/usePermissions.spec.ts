import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { usePermissions } from "./usePermissions";
import { useAuthStore } from "@/stores/auth";

describe("usePermissions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("uses the server permission block", () => {
    const auth = useAuthStore();
    auth.me = {
      authenticated: true,
      user_id: "user-1",
      org_role: "member",
      permissions: {
        can_purchase: true,
        manage_org: false,
        manage_billing: false,
      },
    };

    const permissions = usePermissions();

    expect(permissions.canPurchase.value).toBe(true);
    expect(permissions.manageOrg.value).toBe(false);
    expect(permissions.manageBilling.value).toBe(false);
  });

  it("fails closed for purchasing when permissions are missing", () => {
    const auth = useAuthStore();
    auth.me = {
      authenticated: true,
      user_id: "user-1",
      org_role: "owner",
    };

    const permissions = usePermissions();

    expect(permissions.canPurchase.value).toBe(false);
    expect(permissions.manageOrg.value).toBe(true);
    expect(permissions.manageBilling.value).toBe(true);
  });

  it("does not grant permissions to an unauthenticated session", () => {
    const auth = useAuthStore();
    auth.me = { authenticated: false };

    const permissions = usePermissions();

    expect(permissions.canPurchase.value).toBe(false);
    expect(permissions.manageOrg.value).toBe(false);
    expect(permissions.manageBilling.value).toBe(false);
  });
});
