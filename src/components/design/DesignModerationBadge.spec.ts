import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import DesignModerationBadge from "./DesignModerationBadge.vue";

describe("DesignModerationBadge", () => {
  it("renders In review for pending", () => {
    const wrapper = mount(DesignModerationBadge, {
      props: { status: "pending" },
    });
    expect(wrapper.text()).toBe("In review");
  });

  it("renders the rejection reason", () => {
    const wrapper = mount(DesignModerationBadge, {
      props: { status: "rejected", reason: "blurry art" },
    });
    expect(wrapper.text()).toBe("Rejected: blurry art");
  });

  it("renders nothing for approved", () => {
    const wrapper = mount(DesignModerationBadge, {
      props: { status: "approved" },
    });
    expect(wrapper.text()).toBe("");
    expect(wrapper.find("[data-testid='design-moderation-badge']").exists()).toBe(
      false,
    );
  });

  it("renders nothing when status is missing", () => {
    const wrapper = mount(DesignModerationBadge, { props: {} });
    expect(wrapper.find("[data-testid='design-moderation-badge']").exists()).toBe(
      false,
    );
  });
});
