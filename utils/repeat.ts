import { RepeatInterval } from "@/types/counter";
import { addDays, addMonths, addWeeks, addYears } from "date-fns";

export const REPEAT_OPTIONS: { value: RepeatInterval; label: string }[] = [
  { value: "none", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

export const DEFAULT_REPEAT_DAYS = 2;
export const MAX_REPEAT_DAYS = 999;

const DAY_MS = 24 * 60 * 60 * 1000;

// "Every 10 days" for custom intervals, the option label otherwise, "" for none.
export function repeatLabel(
  repeat: RepeatInterval | undefined,
  repeatDays: number = DEFAULT_REPEAT_DAYS
): string {
  if (!repeat || repeat === "none") return "";
  if (repeat === "custom") {
    return repeatDays === 1 ? "Every day" : `Every ${repeatDays} days`;
  }
  return REPEAT_OPTIONS.find((o) => o.value === repeat)?.label ?? "";
}

// Returns the first occurrence of `timestamp` (stepped by `repeat`) that is after `now`.
export function nextOccurrence(
  timestamp: number,
  repeat: RepeatInterval,
  repeatDays: number = DEFAULT_REPEAT_DAYS,
  now: number = Date.now()
): number {
  if (repeat === "none" || timestamp > now) return timestamp;

  const start = new Date(timestamp);
  const everyDays = repeat === "daily" ? 1 : Math.max(1, repeatDays);
  // Day-based intervals skip straight to roughly now, so a daily counter from years ago doesn't loop per day.
  const firstStep =
    repeat === "daily" || repeat === "custom"
      ? Math.max(1, Math.floor((now - timestamp) / (everyDays * DAY_MS)))
      : 1;
  // Step from the original date each time so month-end dates don't drift (Jan 31 -> Feb 28 -> Mar 31).
  for (let step = firstStep; ; step++) {
    const next =
      repeat === "daily" || repeat === "custom"
        ? addDays(start, step * everyDays)
        : repeat === "weekly"
          ? addWeeks(start, step)
          : repeat === "monthly"
            ? addMonths(start, step)
            : addYears(start, step);
    if (next.getTime() > now) return next.getTime();
  }
}
