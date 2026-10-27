import { Counter } from "@/types/counter";
import { DEFAULT_REPEAT_DAYS } from "@/utils/repeat";
import { addDays } from "date-fns";
import * as Notifications from "expo-notifications";

export const REMINDER_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 0, label: "At time" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 24 * 60, label: "1 day before" },
  { minutes: 7 * 24 * 60, label: "1 week before" },
];

export const DEFAULT_REMINDERS = [0];

// Custom intervals have no repeating OS trigger, so this many upcoming occurrences are scheduled
// one-shot, and topped up whenever the counter rolls forward or the app starts.
const CUSTOM_OCCURRENCES_AHEAD = 4;

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const request = await Notifications.requestPermissionsAsync();
  return request.status === "granted";
}

function reminderBody(counter: Counter, minutes: number): string {
  if (minutes === 0) {
    return counter.repeat && counter.repeat !== "none"
      ? "It's today!"
      : "Countdown finished!";
  }
  const label = REMINDER_OPTIONS.find((o) => o.minutes === minutes)?.label;
  return `Coming up ${label ?? `in ${minutes} minutes`}.`;
}

function buildTrigger(
  counter: Counter,
  triggerTime: number
): Notifications.SchedulableNotificationTriggerInput | null {
  const date = new Date(triggerTime);
  const time = { hour: date.getHours(), minute: date.getMinutes() };

  switch (counter.repeat ?? "none") {
    case "daily":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        ...time,
      };
    case "weekly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: date.getDay() + 1, // 1 = Sunday
        ...time,
      };
    case "monthly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: date.getDate(),
        ...time,
      };
    case "yearly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        month: date.getMonth(),
        day: date.getDate(),
        ...time,
      };
    default:
      if (triggerTime <= Date.now()) return null;
      return { type: Notifications.SchedulableTriggerInputTypes.DATE, date };
  }
}

// Schedules every reminder for an active countdown and returns the new notification IDs.
export async function scheduleCounterNotifications(
  counter: Counter
): Promise<string[]> {
  if (counter.type !== "countdown" || counter.completed || counter.isArchived) {
    return [];
  }

  const targets =
    counter.repeat === "custom"
      ? Array.from({ length: CUSTOM_OCCURRENCES_AHEAD }, (_, i) =>
          addDays(
            counter.createdAt,
            i * Math.max(1, counter.repeatDays ?? DEFAULT_REPEAT_DAYS)
          ).getTime()
        )
      : [counter.createdAt];

  const ids: string[] = [];
  for (const minutes of counter.reminders ?? DEFAULT_REMINDERS) {
    for (const target of targets) {
      const trigger = buildTrigger(counter, target - minutes * 60_000);
      if (!trigger) continue;
      try {
        ids.push(
          await Notifications.scheduleNotificationAsync({
            content: {
              title: counter.name,
              body: reminderBody(counter, minutes),
              data: {
                counterId: counter.id,
                notificationType: minutes === 0 ? "exactTime" : "reminder",
              },
            },
            trigger,
          })
        );
      } catch (error) {
        console.error(`Failed to schedule reminder for ${counter.name}`, error);
      }
    }
  }
  return ids;
}

export async function cancelCounterNotifications(counter: Counter) {
  const ids = [
    ...(counter.notificationIds ?? []),
    counter.notificationId,
    counter.todayNotificationId,
  ].filter((id): id is string => Boolean(id));

  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}

// Clears everything scheduled and reschedules from the counters, so the OS state always matches the app data.
export async function resyncAllNotifications(
  counters: Counter[]
): Promise<Counter[]> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  return Promise.all(
    counters.map(async (counter) => ({
      ...counter,
      notificationId: undefined,
      todayNotificationId: undefined,
      notificationIds: await scheduleCounterNotifications(counter),
    }))
  );
}
