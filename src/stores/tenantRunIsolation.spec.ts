import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { authMe, authLogout, switchOrg } = vi.hoisted(() => ({
  authMe: vi.fn(),
  authLogout: vi.fn(),
  switchOrg: vi.fn(),
}));

vi.mock("@/api/auth", () => ({
  authMe,
  authLogout,
  authLoginJson: vi.fn(),
  authRegisterJson: vi.fn(),
  authCheckEmailExists: vi.fn(),
  authForgotPassword: vi.fn(),
}));

vi.mock("@/api/users", () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ profile_complete: true }),
}));

vi.mock("@/api/http", () => ({
  api: vi.fn(),
  clearCsrfToken: vi.fn(),
}));

vi.mock("@/api/orgs", () => ({
  getOrgs: vi.fn(),
  getMembers: vi.fn(),
  getInvitations: vi.fn(),
  sendInvite: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
  switchOrg,
}));

vi.mock("@/composables/usePostHog", () => ({
  identifyUser: vi.fn(),
  resetUser: vi.fn(),
  captureEvent: vi.fn(),
}));

import { useAuthStore } from "@/stores/auth";
import { useOrgStore } from "@/stores/org";
import { useRunStore } from "@/stores/useRunStore";

function seedSensitiveRunState() {
  const store = useRunStore();
  store.setResultAndMatches(null, [
    {
      mail_full_address: "REDACTED ACCOUNT A MAIL ADDRESS",
      crm_full_address: "REDACTED ACCOUNT A CRM ADDRESS",
      job_value: 1234,
    },
  ] as any);
  return store;
}

describe("tenant run-state transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setActivePinia(createPinia());
    authLogout.mockResolvedValue(undefined);
    switchOrg.mockResolvedValue(undefined);
  });

  it("clears sensitive run state on logout even when the API request fails", async () => {
    authLogout.mockRejectedValueOnce(new Error("network failure"));
    const runStore = seedSensitiveRunState();

    await useAuthStore().logout();

    expect(runStore.matches).toEqual([]);
    expect(runStore.runResult).toBeNull();
  });

  it("clears sensitive run state when reauthentication becomes anonymous", async () => {
    authMe.mockResolvedValueOnce({ authenticated: false });
    const runStore = seedSensitiveRunState();

    await useAuthStore().fetchMe();

    expect(runStore.matches).toEqual([]);
  });

  it("clears sensitive run state when the authenticated identity changes", async () => {
    const auth = useAuthStore();
    auth.me = {
      authenticated: true,
      email: "account-a@example.com",
      org_id: "org-a",
    } as any;
    authMe.mockResolvedValueOnce({
      authenticated: true,
      email: "account-b@example.com",
      org_id: "org-b",
    });
    const runStore = seedSensitiveRunState();

    await auth.fetchMe();

    expect(runStore.matches).toEqual([]);
  });

  it("preserves in-memory run state when the authenticated tenant is unchanged", async () => {
    const auth = useAuthStore();
    auth.me = {
      authenticated: true,
      user_id: "user-a",
      email: "account-a@example.com",
      org_id: "org-a",
    } as any;
    authMe.mockResolvedValueOnce({
      authenticated: true,
      user_id: "user-a",
      email: "account-a@example.com",
      org_id: "org-a",
    });
    const runStore = seedSensitiveRunState();

    await auth.fetchMe();

    expect(runStore.matches).toHaveLength(1);
  });

  it("clears sensitive run state after the server switches organizations", async () => {
    const auth = useAuthStore();
    auth.me = {
      authenticated: true,
      email: "account-a@example.com",
      org_id: "org-a",
    } as any;
    vi.spyOn(auth, "fetchMe").mockResolvedValue({
      authenticated: true,
      email: "account-a@example.com",
      org_id: "org-b",
    } as any);
    const runStore = seedSensitiveRunState();

    await useOrgStore().switchOrg("org-b");

    expect(runStore.matches).toEqual([]);
  });

  it("preserves the current tenant state when organization switching fails", async () => {
    switchOrg.mockRejectedValueOnce(new Error("switch rejected"));
    const runStore = seedSensitiveRunState();

    await expect(useOrgStore().switchOrg("org-b")).rejects.toThrow("switch rejected");

    expect(runStore.matches).toHaveLength(1);
  });
});
