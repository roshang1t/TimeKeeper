import { Counter } from "@/types/counter";
import { format, isSameYear } from "date-fns";

export const DAY_MS = 24 * 60 * 60 * 1000;

const plural = (n: number, unit: string) => (n === 1 ? unit : `${unit}S`);

// The biggest whole unit for a tile: "42" + "DAYS" ("DAYS TO GO" as a phrase),
// or "5" + "HOURS" ("HOURS SINCE") under a day.
export function formatCounterValue(
  counter: Pick<Counter, "type" | "createdAt">,
  now: number
): { value: string; unit: string; label: string } {
  const isCountdown = counter.type === "countdown";
  const ms = Math.max(
    0,
    isCountdown ? counter.createdAt - now : now - counter.createdAt
  );
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const [value, unit] =
    days > 0
      ? [days, plural(days, "DAY")]
      : hours > 0
        ? [hours, plural(hours, "HOUR")]
        : minutes > 0
          ? [minutes, plural(minutes, "MINUTE")]
          : [seconds, plural(seconds, "SECOND")];

  return {
    value: String(value),
    unit,
    label: `${unit} ${isCountdown ? "TO GO" : "SINCE"}`,
  };
}

// "Today → Sat, Dec 5" for countdowns, "Jun 27 → Today" for count-ups, "Ended Oct 22" once done.
export function dateRange(
  counter: Pick<Counter, "type" | "createdAt"> &
    Partial<Pick<Counter, "completed">>,
  now: number
): string {
  const date = new Date(counter.createdAt);
  const day = format(
    date,
    isSameYear(date, now) ? "EEE, MMM d" : "MMM d, yyyy"
  );
  if (counter.completed) return `Ended ${day}`;
  return counter.type === "countdown" ? `Today → ${day}` : `${day} → Today`;
}

// Count-up streak milestones, in days.
const MILESTONES = [
  7, 14, 30, 50, 100, 150, 200, 365, 500, 730, 1000, 1095, 1461, 1826, 2000,
  2500, 3000, 3650, 5000, 7300, 10000,
];

// Progress bar for a tile: countdowns fill from creation to the target date,
// count-ups fill toward their next milestone. Null when there's nothing to show.
export function counterProgress(
  counter: Pick<Counter, "type" | "createdAt" | "startedAt" | "completed">,
  now: number
): { fraction: number; caption?: string } | null {
  if (counter.completed) return null;

  if (counter.type === "countdown") {
    const start = counter.startedAt;
    if (!start || start >= counter.createdAt) return null;
    const fraction = (now - start) / (counter.createdAt - start);
    return { fraction: Math.min(1, Math.max(0, fraction)) };
  }

  const elapsedDays = Math.max(0, now - counter.createdAt) / DAY_MS;
  const next = MILESTONES.find((m) => m > elapsedDays);
  if (!next) return null;
  const previous = [...MILESTONES].reverse().find((m) => m <= elapsedDays) ?? 0;
  return {
    fraction: (elapsedDays - previous) / (next - previous),
    caption: `Next: ${next} days`,
  };
}

export type DurationParts = {
  days: number;
  hours: string;
  minutes: string;
  seconds: string;
};

export function splitDuration(durationMs: number): DurationParts {
  const totalSeconds = Math.floor(Math.max(0, durationMs) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  return {
    days: Math.floor(totalHours / 24),
    hours: String(totalHours % 24).padStart(2, "0"),
    minutes: String(totalMinutes % 60).padStart(2, "0"),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
  };
}
