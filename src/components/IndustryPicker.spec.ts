import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import IndustryPicker from "./IndustryPicker.vue";

const Host = defineComponent({
  components: { IndustryPicker },
  props: {
    initial: { type: String, default: "" },
  },
  setup(props) {
    const industry = ref(props.initial);
    return { industry };
  },
  template: `<IndustryPicker v-model="industry" />`,
});

function mountPicker(initial = "") {
  return mount(Host, {
    props: { initial },
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
    expect((wrapper.vm as { industry: string }).industry).toBe("plumbing");
    wrapper.unmount();
  });

  it("requires Other custom text the same way first-run and Settings do", async () => {
    const wrapper = mountPicker();
    await wrapper.get('[data-testid="industry-combobox-input"]').trigger("focus");
    await wrapper.get('[data-testid="industry-option-other"]').trigger("click");

    expect((wrapper.vm as { industry: string }).industry).toBe("other");
    expect(wrapper.find('[data-testid="industry-other-text"]').exists()).toBe(
      true,
    );

    await wrapper
      .get('[data-testid="industry-other-text"]')
      .setValue("Pool service");
    expect((wrapper.vm as { industry: string }).industry).toBe("Pool service");
    wrapper.unmount();
  });

  it("does not append keystrokes onto the committed label when the list opens", async () => {
    const wrapper = mountPicker("roofing");
    const input = wrapper.get('[data-testid="industry-combobox-input"]');
    const el = input.element as HTMLInputElement;
    expect(el.value).toBe("Roofing");

    await input.trigger("focus");
    expect(el.value).toBe("");
    expect(wrapper.find('[data-testid="industry-combobox-list"]').exists()).toBe(
      true,
    );

    el.value = "Roofingplumber";
    await input.trigger("input");
    expect(el.value).toBe("plumber");
    expect(wrapper.find('[data-testid="industry-option-plumbing"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="industry-option-roofing"]').exists()).toBe(
      false,
    );

    await input.trigger("keydown", { key: "Escape" });
    expect(el.value).toBe("Roofing");
    expect((wrapper.vm as { industry: string }).industry).toBe("roofing");
    wrapper.unmount();
  });

  it("supports type / arrow / enter / escape", async () => {
    const wrapper = mountPicker();
    const input = wrapper.get('[data-testid="industry-combobox-input"]');

    await input.trigger("focus");
    await input.setValue("dentist");
    await input.trigger("keydown", { key: "Enter" });
    expect((wrapper.vm as { industry: string }).industry).toBe("dental");
    expect((input.element as HTMLInputElement).value).toBe("Dental");

    await wrapper.get('[data-testid="industry-combobox-toggle"]').trigger("click");
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
