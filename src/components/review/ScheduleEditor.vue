<script setup lang="ts">
import { computed } from "vue";
import type { CardSchedule } from "@/types/campaign";

const props = defineProps<{
  schedules: CardSchedule[];
  sequenceSpacingDays: number;
}>();

const emit = defineEmits<{
  (e: "update", schedules: CardSchedule[]): void;
}>();

// Holiday dates to warn about
const HOLIDAYS = [
  { name: "Thanksgiving", month: 11, weekOf: 4 }, // 4th Thursday of November
  { name: "Christmas", month: 12, dayStart: 20, dayEnd: 31 },
  { name: "New Year", month: 1, dayStart: 1, dayEnd: 3 },
  { name: "July 4th", month: 7, dayStart: 1, dayEnd: 7 },
];

function isNearHoliday(dateStr: string): string | null {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();

  for (const h of HOLIDAYS) {
    if (h.month === month) {
      if ("dayStart" in h && h.dayStart && h.dayEnd) {
        if (day >= h.dayStart && day <= h.dayEnd) return h.name;
      }
      if ("weekOf" in h && h.weekOf) {
        // Approximate: 4th week of November
        if (day >= 22 && day <= 28) return h.name;
      }
    }
  }
  return null;
}

function minDate(cardNumber: number): string {
  if (cardNumber === 1) {
    const d = new Date();
    d.setDate(d.getDate() + 5); // 5 business days production
    return d.toISOString().split("T")[0] ?? "";
  }
  const prev = props.schedules.find((s) => s.cardNumber === cardNumber - 1);
  if (prev) {
    const d = new Date(prev.scheduledDate + "T00:00:00");
    d.setDate(d.getDate() + 5); // min 5 days between cards
    return d.toISOString().split("T")[0] ?? "";
  }
  return "";
}

const hasGapWarning = computed(() => {
  for (let i = 1; i < props.schedules.length; i++) {
    const prevSched = props.schedules[i - 1];
    const currSched = props.schedules[i];
    if (!prevSched || !currSched) continue;
    const prev = new Date(prevSched.scheduledDate + "T00:00:00");
    const curr = new Date(currSched.scheduledDate + "T00:00:00");
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 42) return true; // > 6 weeks
  }
  return false;
});

function updateDate(cardNumber: number, newDate: string) {
  const updated = props.schedules.map((s) => {
    if (s.cardNumber !== cardNumber) return s;
    const send = new Date(newDate + "T00:00:00");
    const deliver = new Date(send);
    deliver.setDate(deliver.getDate() + 5);
    return {
      ...s,
      scheduledDate: newDate,
      estimatedDeliveryDate: deliver.toISOString().split("T")[0] ?? "",
    };
  });
  emit("update", updated);
}
</script>

<template>
  <div class="space-y-3">
    <h4 class="text-sm font-semibold text-[#0b2d50]">Send schedule</h4>
    <div
      v-for="card in schedules"
      :key="card.cardNumber"
      class="flex items-center gap-3"
    >
      <span class="text-sm text-gray-500 w-16 shrink-0">
        Card {{ card.cardNumber }}:
      </span>
      <input
        type="date"
        :value="card.scheduledDate"
        :min="minDate(card.cardNumber)"
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
      <span
        v-if="isNearHoliday(card.scheduledDate)"
        class="text-xs text-amber-500"
      >
        Near {{ isNearHoliday(card.scheduledDate) }}
      </span>
    </div>
    <p v-if="hasGapWarning" class="text-xs text-amber-600">
      There's an unusual gap between cards. Cards typically work best with
      consistent spacing.
    </p>
  </div>
</template>
