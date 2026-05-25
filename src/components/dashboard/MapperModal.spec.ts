import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import MapperModal from "./MapperModal.vue";

function mountAudienceMapper() {
  return mount(MapperModal, {
    props: {
      open: true,
      mailHeaders: [],
      crmHeaders: [],
      audienceHeaders: ["Address", "City", "State", "ZIP"],
      mailHeaderTypes: {},
      crmHeaderTypes: {},
      audienceHeaderTypes: {
        Address: "string",
        City: "string",
        State: "state",
        ZIP: "zip",
      },
      mailSamples: [],
      crmSamples: [],
      audienceSamples: [
        {
          Address: "123 Peachtree St",
          City: "Atlanta",
          State: "GA",
          ZIP: "30309",
        },
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
      initialMapping: {
        audience: {
          address1: "Address",
          city: "City",
          state: "State",
        },
      },
      requiredMail: [],
      requiredCrm: [],
      requiredAudience: ["address1", "city", "state", "zip"],
    },
  });
}

describe("MapperModal audience source", () => {
  it("renders the audience pane and validates required audience fields", () => {
    const wrapper = mountAudienceMapper();

    expect(wrapper.text()).toContain("Audience CSV");
    expect(wrapper.text()).toContain("123 Peachtree St");
    expect(wrapper.text()).toContain("Missing required mappings:");
    expect(wrapper.text()).toContain("ZIP");
    expect(wrapper.get(".btn-primary").attributes("disabled")).toBeDefined();
  });

  it("emits audience mapping without breaking mail/crm payload shape", async () => {
    const wrapper = mountAudienceMapper();
    const selects = wrapper.findAll("select");
    const zipSelect = selects[3];
    expect(zipSelect).toBeDefined();
    await zipSelect!.setValue("zip");

    expect(wrapper.get(".btn-primary").attributes("disabled")).toBeUndefined();
    await wrapper.get(".btn-primary").trigger("click");

    const emitted = wrapper.emitted("confirm");
    expect(emitted).toBeTruthy();
    expect(emitted![0]![0]).toEqual({
      mail: {},
      crm: {},
      audience: {
        address1: "Address",
        city: "City",
        state: "State",
        zip: "ZIP",
      },
    });
  });
});
