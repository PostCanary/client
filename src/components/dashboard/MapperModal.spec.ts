import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import MapperModal from "./MapperModal.vue";

function mountAudienceMapper() {
  return mount(MapperModal, {
    props: {
      open: true,
      mailHeaders: [],
      crmHeaders: [],
      audienceHeaders: ["Street", "City", "State", "Zip"],
      mailHeaderTypes: {},
      crmHeaderTypes: {},
      audienceHeaderTypes: {
        Street: "string",
        City: "string",
        State: "state",
        Zip: "zip",
      },
      mailSamples: [],
      crmSamples: [],
      audienceSamples: [
        { Street: "1 Main St", City: "Austin", State: "TX", Zip: "78701" },
      ],
      mailFields: [],
      crmFields: [],
      audienceFields: ["address1", "city", "state", "zip"],
      audienceLabels: {
        address1: "Address",
        city: "City",
        state: "State",
        zip: "ZIP",
      },
      initialMapping: {},
      requiredMail: [],
      requiredCrm: [],
      requiredAudience: ["address1", "city", "state", "zip"],
    },
  });
}

describe("MapperModal audience source", () => {
  it("renders an audience mapping pane without mail or CRM panes", () => {
    const wrapper = mountAudienceMapper();

    expect(wrapper.get('[data-testid="audience-mapper-section"]').text()).toContain(
      "Audience CSV",
    );
    expect(wrapper.text()).not.toContain("Mail CSV");
    expect(wrapper.text()).not.toContain("CRM CSV");
    expect(wrapper.get("button.btn-primary").attributes("disabled")).toBeDefined();
  });

  it("emits audience mapping after required audience fields are mapped", async () => {
    const wrapper = mountAudienceMapper();
    const selects = wrapper.findAll("select");

    await selects[0]!.setValue("address1");
    await selects[1]!.setValue("city");
    await selects[2]!.setValue("state");
    await selects[3]!.setValue("zip");

    expect(wrapper.get("button.btn-primary").attributes("disabled")).toBeUndefined();

    await wrapper.get("button.btn-primary").trigger("click");

    expect(wrapper.emitted("confirm")?.[0]?.[0]).toEqual({
      mail: {},
      crm: {},
      audience: {
        address1: "Street",
        city: "City",
        state: "State",
        zip: "Zip",
      },
    });
  });
});
