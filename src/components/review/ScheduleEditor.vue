<script setup lang="ts">
import type {
  CardSchedule,
  MailScheduleAvailability,
} from "@/types/campaign";
import { scheduleForDate } from "@/composables/useMailScheduleAvailability";

const props = defineProps<{
  schedules: CardSchedule[];
  availability: MailScheduleAvailability | null;
  loading: boolean;
  error: string | null;
  validityMessage: string | null;
  actionMessage: string | null;
}>();

const emit = defineEmits<{
  (e: "update", schedules: CardSchedule[]): void;
  (e: "retry"): void;
}>();

function updateDate(cardNumber: number, newDate: string) {
  const updated = props.schedules.map((s) => {
    if (s.cardNumber !== cardNumber) return s;
    return {
      ...s,
      ...scheduleForDate(newDate),
    };
  });
  emit("update", updated);
}
</script>

<template>
  <div class="space-y-3">
    <h4 class="text-sm font-semibold text-[#0b2d50]">Send schedule</h4>
    <div
      v-if="loading"
      class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500"
      data-testid="schedule-availability-loading"
    >
      Loading guaranteed mailing dates…
    </div>
    <div
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      data-testid="schedule-availability-error"
    >
      {{ error }}
      <button
        type="button"
        class="ml-1 font-semibold underline"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>
    <div
      v-for="card in schedules"
      :key="card.cardNumber"
      class="flex items-center gap-3"
    >
      <span class="text-sm text-gray-500 w-16 shrink-0">
        Mailing date:
      </span>
      <input
        type="date"
        :value="card.scheduledDate"
        :min="availability?.earliest_mailing_date"
        :disabled="loading || !availability"
        data-testid="mailing-date-input"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        @input="
          updateDate(
            card.cardNumber,
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <span class="text-xs text-gray-400">
        Est. delivery: {{ card.estimatedDeliveryDate }}
      </span>
    </div>
    <p
      v-if="validityMessage"
      class="text-xs text-red-600"
      data-testid="mailing-date-validation"
    >
      {{ validityMessage }}
    </p>
    <p
      v-if="actionMessage"
      class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
      data-testid="mailing-date-action-message"
    >
      {{ actionMessage }}
    </p>
    <p
      v-if="availability"
      class="text-xs leading-relaxed text-gray-500"
      data-testid="mailing-schedule-policy"
    >
      Approvals by 5:00 PM PT, including exactly 5:00 PM, keep that day's
      eligibility. After the cutoff, eligibility shifts one business day.
      We skip the next eligible business day for processing, then mail on the
      following eligible day. Weekends and observed nationwide U.S. federal
      holidays are excluded.
    </p>
  </div>
</template>
