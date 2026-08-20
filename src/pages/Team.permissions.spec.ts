import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getInvitationsMock,
  getMembersMock,
  updateMemberCapabilitiesMock,
} = vi.hoisted(() => ({
  getInvitationsMock: vi.fn(),
  getMembersMock: vi.fn(),
  updateMemberCapabilitiesMock: vi.fn(),
}));

vi.mock("naive-ui", () => ({
  useMessage: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

vi.mock("@/api/orgs", () => ({
  getOrgs: vi.fn(),
  getMembers: getMembersMock,
  getInvitations: getInvitationsMock,
  sendInvite: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
  updateMemberCapabilities: updateMemberCapabilitiesMock,
  switchOrg: vi.fn(),
}));

import Team from "./Team.vue";
import { useAuthStore } from "@/stores/auth";

describe("Team purchasing permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useAuthStore().me = {
      authenticated: true,
      user_id: "owner-1",
      org_id: "org-1",
      org_role: "owner",
      permissions: {
        can_purchase: true,
        manage_org: true,
        manage_billing: true,
      },
    };
    getMembersMock.mockResolvedValue([
      {
        user_id: "owner-1",
        email: "owner@example.com",
        full_name: "Owner",
        role: "owner",
        can_purchase: false,
        status: "active",
        accepted_at: null,
      },
      {
        user_id: "member-1",
        email: "member@example.com",
        full_name: "Member",
        role: "member",
        can_purchase: false,
        status: "active",
        accepted_at: null,
      },
    ]);
    getInvitationsMock.mockResolvedValue([]);
    updateMemberCapabilitiesMock.mockResolvedValue({ can_purchase: true });
  });

  it("grants purchasing permission and offers the viewer role", async () => {
    const wrapper = mount(Team);
    await flushPromises();

    const memberRow = wrapper.get('[data-testid="team-member-member-1"]');
    const roleOptions = memberRow
      .get("select")
      .findAll("option")
      .map((option) => option.attributes("value"));
    expect(roleOptions).toContain("viewer");

    await memberRow
      .get('input[aria-label="Purchasing permission for Member"]')
      .setValue(true);
    await flushPromises();

    expect(updateMemberCapabilitiesMock).toHaveBeenCalledWith(
      "org-1",
      "member-1",
      true,
    );
    expect(
      (memberRow.get('input[type="checkbox"]').element as HTMLInputElement)
        .checked,
    ).toBe(true);
  });
});
