import type { ListWidgetFilter } from "@/context/counterContext";
import { Counter } from "@/types/counter";
import { format } from "date-fns";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// Backups are plain JSON files. Saving goes through the share sheet ("Save to Drive"), and restoring
// through the system file picker, where Google Drive shows up as a source. No Google sign-in needed.
const BACKUP_FORMAT = "timekeeper-backup";
const BACKUP_VERSION = 1;

export type Backup = {
  counters: Partial<Counter>[];
  widgetCounterId: string | null;
  listWidgetFilter: ListWidgetFilter;
};

const LIST_WIDGET_FILTERS: ListWidgetFilter[] = ["all", "upcoming", "since"];

// Writes the backup to a dated JSON file and opens the share sheet for it.
export async function shareBackup(backup: Backup): Promise<void> {
  // Scheduled notification IDs only mean something on this device; restoring reschedules them.
  const counters = backup.counters.map(
    ({ notificationIds, notificationId, todayNotificationId, ...counter }) =>
      counter
  );
  const file = new File(
    Paths.cache,
    `timekeeper-backup-${format(new Date(), "yyyy-MM-dd")}.json`
  );
  await file.write(
    JSON.stringify(
      {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        ...backup,
        counters,
      },
      null,
      2
    )
  );
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Save backup to Google Drive",
  });
}

// Lets the user pick a backup file and reads it. Resolves to null if the picker is closed,
// and throws if the file isn't a TimeKeeper backup.
export async function pickBackup(): Promise<Backup | null> {
  const picked = await File.pickFileAsync({
    // Drive can label a .json file as any of these
    mimeTypes: ["application/json", "text/plain", "application/octet-stream"],
  });
  if (picked.canceled) return null;

  let data: any;
  try {
    data = JSON.parse(await picked.result.text());
  } catch {
    throw new Error("That file isn't a TimeKeeper backup.");
  }
  if (data?.format !== BACKUP_FORMAT || !Array.isArray(data.counters)) {
    throw new Error("That file isn't a TimeKeeper backup.");
  }
  if (data.version > BACKUP_VERSION) {
    throw new Error(
      "This backup was made by a newer version of TimeKeeper. Update the app and try again."
    );
  }
  return {
    counters: data.counters.filter(
      (c: unknown) => typeof c === "object" && c !== null
    ),
    widgetCounterId:
      typeof data.widgetCounterId === "string" ? data.widgetCounterId : null,
    listWidgetFilter: LIST_WIDGET_FILTERS.includes(data.listWidgetFilter)
      ? data.listWidgetFilter
      : "all",
  };
}
