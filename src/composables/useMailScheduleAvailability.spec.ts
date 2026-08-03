import { describe, expect, it, vi } from "vitest";
import type {
  MailScheduleAvailability,
  MailScheduleInvalidDetails,
} from "@/types/campaign";
import {
  isSelectedMailingDateValid,
  scheduleForDate,
  useMailScheduleAvailability,
} from "./useMailScheduleAvailability";

const availability: MailScheduleAvailability = {
  ok: true,
  earliest_mailing_date: "2026-07-29",
  timezone: "America/Los_Angeles",
  approval_cutoff_local: "17:00:00",
  cutoff_inclusive: true,
  processing_business_days: 1,
  holiday_calendar: "us_federal_observed_nationwide",
};

describe("useMailScheduleAvailability", () => {
  it("tracks loading and resolves the server's exact minimum", async () => {
    let resolve!: (value: MailScheduleAvailability) => void;
    const fetchAvailability = vi.fn(
      () =>
        new Promise<MailScheduleAvailability>((done) => {
          resolve = done;
        }),
    );
    const state = useMailScheduleAvailability(fetchAvailability);

    const pending = state.load();
    expect(state.loading.value).toBe(true);
    expect(state.availability.value).toBeNull();

    resolve(availability);
    await expect(pending).resolves.toEqual(availability);
    expect(state.loading.value).toBe(false);
    expect(state.availability.value?.earliest_mailing_date).toBe("2026-07-29");
  });

  it("keeps approval data unavailable and exposes a retryable error on failure", async () => {
    const state = useMailScheduleAvailability(
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    await expect(state.load()).resolves.toBeNull();

    expect(state.loading.value).toBe(false);
    expect(state.availability.value).toBeNull();
    expect(state.error.value).toMatch(/Retry before approving/i);
  });

  it("accepts the exact minimum and later weekdays but rejects weekends", () => {
    expect(isSelectedMailingDateValid("2026-07-29", availability)).toBe(true);
    expect(isSelectedMailingDateValid("2026-07-30", availability)).toBe(true);
    expect(isSelectedMailingDateValid("2026-08-01", availability)).toBe(false);
    expect(isSelectedMailingDateValid("2026-07-28", availability)).toBe(false);
  });

  it("refreshes availability from a stale approval error without local date math", () => {
    const state = useMailScheduleAvailability();
    const details: MailScheduleInvalidDetails = {
      code: "mail_schedule_invalid",
      reason: "scheduled_date_before_earliest",
      earliest_mailing_date: "2026-07-30",
      timezone: "America/Los_Angeles",
      approval_cutoff_local: "17:00:00",
      cutoff_inclusive: true,
      processing_business_days: 1,
      holiday_calendar: "us_federal_observed_nationwide",
      selected_mailing_date: "2026-07-29",
    };

    state.applyInvalidDetails(details);

    expect(state.availability.value?.earliest_mailing_date).toBe("2026-07-30");
    expect(scheduleForDate(details.earliest_mailing_date)).toEqual({
      cardNumber: 1,
      scheduledDate: "2026-07-30",
      estimatedDeliveryDate: "2026-08-04",
    });
  });
});
