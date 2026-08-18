import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import IndustryPicker from "./IndustryPicker.vue";

function mountPicker(modelValue = "") {
  return mount(IndustryPicker, {
    props: { modelValue },
    attachTo: document.body,
  });
}

describe("IndustryPicker", () => {
  it("hydrates an existing hvac value into the combobox", () => {
    const wrapper = mountPicker("hvac");
    const input = wrapper.get('[data-testid="industry-combobox-input"]')
      .element as HTMLInputElement;
    expect(input.value).toBe("HVAC");
    expect(wrapper.find('[data-testid="industry-other-text"]').exists()).toBe(
      false,
    );
    wrapper.unmount();
  });

  it("shows grouped options and filters plumber to Plumbing", async () => {
    const wrapper = mountPicker();
    const input = wrapper.get('[data-testid="industry-combobox-input"]');

    await input.trigger("focus");
    expect(wrapper.get('[data-testid="industry-group-home_services"]').text()).toBe(
      "Home services",
    );
    expect(wrapper.get('[data-testid="industry-group-health"]').text()).toBe(
      "Health",
    );
    expect(wrapper.get('[data-testid="industry-group-food"]').text()).toBe("Food");
    expect(wrapper.find('[data-testid="industry-option-plumbing"]').exists()).toBe(
      true,
    );

    await input.setValue("plumber");
    expect(wrapper.find('[data-testid="industry-option-plumbing"]').text()).toBe(
      "Plumbing",
    );
    expect(wrapper.find('[data-testid="industry-option-hvac"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="industry-option-other"]').exists()).toBe(
      true,
    );

    await wrapper.get('[data-testid="industry-option-plumbing"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["plumbing"]);
    wrapper.unmount();
  });

  it("requires Other custom text the same way first-run and Settings do", async () => {
    const wrapper = mountPicker();
    await wrapper.get('[data-testid="industry-combobox-input"]').trigger("focus");
    await wrapper.get('[data-testid="industry-option-other"]').trigger("click");

    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["other"]);
    const other = wrapper.get('[data-testid="industry-other-text"]');
    expect(other.exists()).toBe(true);

    await other.setValue("Pool service");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["Pool service"]);
    wrapper.unmount();
  });

  it("supports type / arrow / enter / escape", async () => {
    const wrapper = mountPicker();
    const input = wrapper.get('[data-testid="industry-combobox-input"]');

    await input.trigger("focus");
    await input.setValue("dentist");
    await input.trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["dental"]);

    await input.trigger("focus");
    expect(wrapper.find('[data-testid="industry-combobox-list"]').exists()).toBe(
      true,
    );
    await input.trigger("keydown", { key: "Escape" });
    expect(wrapper.find('[data-testid="industry-combobox-list"]').exists()).toBe(
      false,
    );
    wrapper.unmount();
  });
});
