export type RepeatInterval = "none" | "weekly" | "monthly" | "yearly";

// Keys of `palette` in constants/theme.ts
export type CounterColor =
  | "coral"
  | "peach"
  | "lemon"
  | "mint"
  | "teal"
  | "sky"
  | "periwinkle"
  | "lilac"
  | "pink"
  | "sand";

// --- Counter Interface ---
export interface Counter {
  id: string;
  name: string;
  createdAt: number; // Timestamp (ms): start date for countups, target date for countdowns
  isArchived: boolean; // For Current/Past tabs
  hasNotification?: boolean; // Optional: for the bell icon
  type: "countdown" | "countup";
  completed: boolean;
  color?: CounterColor; // Tile color; defaults by type (see colorFor)
  emoji?: string;
  startedAt?: number; // When the counter was created; drives the countdown progress bar
  reminders?: number[]; // Countdowns only: minutes before the target (0 = at the target time)
  repeat?: RepeatInterval; // Countdowns only: roll the target forward instead of completing
  notificationIds?: string[]; // Scheduled notification IDs, replaced on every reschedule
  notificationId?: string; // Legacy (pre-reminders) exact-time notification ID
  todayNotificationId?: string; // Legacy (pre-reminders) "ends today" notification ID
}

export type NewCounter = Pick<Counter, "name" | "createdAt" | "type"> &
  Partial<Pick<Counter, "reminders" | "repeat" | "color" | "emoji">>;

export enum CounterType {
  COUNTDOWN = "countdown",
  COUNTUP = "countup",
}
