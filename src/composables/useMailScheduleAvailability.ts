import { ref } from "vue";
import { getMailScheduleAvailability } from "@/api/mailCampaigns";
import type {
  CardSchedule,
  MailScheduleAvailability,
  MailScheduleInvalidDetails,
} from "@/types/campaign";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isWeekendIsoDate(value: string): boolean {
  if (!isValidIsoDate(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function isSelectedMailingDateValid(
  selectedDate: string,
  availability: MailScheduleAvailability | null,
): boolean {
  return Boolean(
    availability &&
      isValidIsoDate(selectedDate) &&
      selectedDate >= availability.earliest_mailing_date &&
      !isWeekendIsoDate(selectedDate),
  );
}

export function addCalendarDays(value: string, days: number): string {
  if (!isValidIsoDate(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day! + days));
  return parsed.toISOString().slice(0, 10);
}

export function scheduleForDate(scheduledDate: string): CardSchedule {
  return {
    cardNumber: 1,
    scheduledDate,
    // This remains an estimate, not the authoritative mailing-date rule.
    estimatedDeliveryDate: addCalendarDays(scheduledDate, 5),
  };
}

export function availabilityFromInvalidDetails(
  details: MailScheduleInvalidDetails,
): MailScheduleAvailability {
  return {
    ok: true,
    earliest_mailing_date: details.earliest_mailing_date,
    timezone: details.timezone,
    approval_cutoff_local: details.approval_cutoff_local,
    cutoff_inclusive: details.cutoff_inclusive,
    processing_business_days: details.processing_business_days,
    holiday_calendar: details.holiday_calendar,
  };
}

export function useMailScheduleAvailability(
  fetchAvailability = getMailScheduleAvailability,
) {
  const availability = ref<MailScheduleAvailability | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<MailScheduleAvailability | null> {
    loading.value = true;
    error.value = null;
    availability.value = null;
    try {
      const result = await fetchAvailability();
      if (
        !isValidIsoDate(result.earliest_mailing_date) ||
        isWeekendIsoDate(result.earliest_mailing_date)
      ) {
        throw new Error("Invalid schedule availability response");
      }
      availability.value = result;
      return result;
    } catch (loadError) {
      console.warn("[mail schedule] availability failed", loadError);
      error.value =
        "We couldn't load guaranteed mailing dates. Retry before approving.";
      return null;
    } finally {
      loading.value = false;
    }
  }

  function applyInvalidDetails(details: MailScheduleInvalidDetails) {
    availability.value = availabilityFromInvalidDetails(details);
    error.value = null;
  }

  return {
    availability,
    loading,
    error,
    load,
    applyInvalidDetails,
  };
}
