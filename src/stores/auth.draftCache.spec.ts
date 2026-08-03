import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { authLogoutMock, authMeMock, fetchUserProfileMock } = vi.hoisted(() => ({
  authLogoutMock: vi.fn(),
  authMeMock: vi.fn(),
  fetchUserProfileMock: vi.fn(),
}));

vi.mock("@/api/auth", () => ({
  authCheckEmailExists: vi.fn(),
  authForgotPassword: vi.fn(),
  authLoginJson: vi.fn(),
  authLogout: authLogoutMock,
  authMe: authMeMock,
  authRegisterJson: vi.fn(),
}));

vi.mock("@/api/campaignDrafts", () => ({
  listDrafts: vi.fn(),
}));

vi.mock("@/api/users", () => ({
  fetchUserProfile: fetchUserProfileMock,
}));

vi.mock("@/composables/usePostHog", () => ({
  captureEvent: vi.fn(),
  identifyUser: vi.fn(),
  resetUser: vi.fn(),
}));

import { useAuthStore } from "./auth";
import { useCampaignDraftListStore } from "./useCampaignDraftListStore";

describe("auth draft-cache isolation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authLogoutMock.mockReset();
    authMeMock.mockReset();
    fetchUserProfileMock.mockReset();
  });

  it("clears org A before the next org B profile request settles", async () => {
    let finishProfile!: () => void;
    authMeMock.mockResolvedValue({
      authenticated: true,
      org_id: "org-b",
    });
    fetchUserProfileMock.mockReturnValue(
      new Promise((resolve) => {
        finishProfile = () =>
          resolve({ profile_complete: true, tour_completed: true });
      }),
    );
    const auth = useAuthStore();
    const drafts = useCampaignDraftListStore();
    auth.me = { authenticated: true, org_id: "org-a" } as any;
    drafts.setActiveOrg("org-a");
    drafts.drafts = [{ id: "org-a-draft" } as any];
    drafts.loadedOrgId = "org-a";
    drafts.hasLoaded = true;

    const fetchMe = auth.fetchMe();
    await vi.waitFor(() => expect(fetchUserProfileMock).toHaveBeenCalled());

    expect(drafts.activeOrgId).toBe("org-b");
    expect(drafts.loadedOrgId).toBeNull();
    expect(drafts.drafts).toEqual([]);
    expect(drafts.hasLoaded).toBe(false);

    finishProfile();
    await fetchMe;
  });

  it("clears tenant drafts immediately when logout starts", async () => {
    let finishLogout!: () => void;
    authLogoutMock.mockReturnValue(
      new Promise<void>((resolve) => {
        finishLogout = resolve;
      }),
    );
    const auth = useAuthStore();
    const drafts = useCampaignDraftListStore();
    auth.me = { authenticated: true, org_id: "org-a" } as any;
    drafts.setActiveOrg("org-a");
    drafts.drafts = [{ id: "org-a-draft" } as any];
    drafts.loadedOrgId = "org-a";
    drafts.hasLoaded = true;

    const logout = auth.logout();

    expect(drafts.activeOrgId).toBeNull();
    expect(drafts.loadedOrgId).toBeNull();
    expect(drafts.drafts).toEqual([]);
    expect(drafts.hasLoaded).toBe(false);
    expect(drafts.count).toBeNull();

    finishLogout();
    await logout;
  });
});
