import { RepeatInterval } from "@/types/counter";
import { addMonths, addWeeks, addYears } from "date-fns";

export const REPEAT_OPTIONS: { value: RepeatInterval; label: string }[] = [
  { value: "none", label: "Never" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

// Returns the first occurrence of `timestamp` (stepped by `repeat`) that is after `now`.
export function nextOccurrence(
  timestamp: number,
  repeat: RepeatInterval,
  now: number = Date.now()
): number {
  if (repeat === "none" || timestamp > now) return timestamp;

  const start = new Date(timestamp);
  // Step from the original date each time so month-end dates don't drift (Jan 31 -> Feb 28 -> Mar 31).
  for (let step = 1; ; step++) {
    const next =
      repeat === "weekly"
        ? addWeeks(start, step)
        : repeat === "monthly"
          ? addMonths(start, step)
          : addYears(start, step);
    if (next.getTime() > now) return next.getTime();
  }
}
