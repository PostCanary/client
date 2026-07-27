import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ScheduleEditor from "./ScheduleEditor.vue";
import type { MailScheduleAvailability } from "@/types/campaign";

const availability: MailScheduleAvailability = {
  ok: true,
  earliest_mailing_date: "2026-07-29",
  timezone: "America/Los_Angeles",
  approval_cutoff_local: "17:00:00",
  cutoff_inclusive: true,
  processing_business_days: 1,
  holiday_calendar: "us_federal_observed_nationwide",
};

function mountEditor(overrides: Record<string, unknown> = {}) {
  return mount(ScheduleEditor, {
    props: {
      schedules: [
        {
          cardNumber: 1,
          scheduledDate: "2026-07-29",
          estimatedDeliveryDate: "2026-08-03",
        },
      ],
      availability,
      loading: false,
      error: null,
      validityMessage: null,
      actionMessage: null,
      ...overrides,
    },
  });
}

describe("ScheduleEditor", () => {
  it("uses the server minimum and explains the inclusive PT cutoff/business-day rule", () => {
    const wrapper = mountEditor();

    expect(wrapper.get('[data-testid="mailing-date-input"]').attributes("min"))
      .toBe("2026-07-29");
    expect(wrapper.get('[data-testid="mailing-schedule-policy"]').text())
      .toContain("including exactly 5:00 PM");
    expect(wrapper.get('[data-testid="mailing-schedule-policy"]').text())
      .toContain("observed nationwide U.S. federal holidays");
  });

  it("disables date selection while availability is loading", () => {
    const wrapper = mountEditor({
      availability: null,
      loading: true,
      schedules: [],
    });

    expect(wrapper.get('[data-testid="schedule-availability-loading"]').text())
      .toMatch(/Loading guaranteed mailing dates/i);
  });

  it("shows an availability error and emits retry", async () => {
    const wrapper = mountEditor({
      availability: null,
      error: "We couldn't load guaranteed mailing dates.",
      schedules: [],
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("shows weekend validation supplied by the authoritative review state", () => {
    const wrapper = mountEditor({
      schedules: [
        {
          cardNumber: 1,
          scheduledDate: "2026-08-01",
          estimatedDeliveryDate: "2026-08-06",
        },
      ],
      validityMessage: "Mailing dates must fall on a weekday.",
    });

    expect(wrapper.get('[data-testid="mailing-date-validation"]').text())
      .toContain("must fall on a weekday");
  });
});
