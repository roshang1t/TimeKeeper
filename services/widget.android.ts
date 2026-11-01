import CounterListWidget, {
  CounterListWidgetProps,
} from "@/widgets/CounterListWidget";
import CounterWidget, { CounterWidgetProps } from "@/widgets/CounterWidget";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

const WIDGET_REFRESH_TASK = "counter-widget-refresh";

// Android widgets only re-render when told to. The widgets schedule their own redraw for the moment
// their numbers change (`widgetRefreshAt`, see patches/); this periodic task is a backstop in case that
// alarm is lost (e.g. the app was force-stopped).
TaskManager.defineTask(WIDGET_REFRESH_TASK, async () => {
  try {
    CounterWidget.reload();
    CounterListWidget.reload();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("Widget refresh failed", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export function updateCounterWidget(props: CounterWidgetProps) {
  CounterWidget.updateSnapshot(props);
}

export function updateCounterListWidget(props: CounterListWidgetProps) {
  CounterListWidget.updateSnapshot(props);
}

export async function registerWidgetRefreshTask() {
  if (await TaskManager.isTaskRegisteredAsync(WIDGET_REFRESH_TASK)) return;
  await BackgroundTask.registerTaskAsync(WIDGET_REFRESH_TASK, {
    minimumInterval: 15, // minutes (WorkManager won't go below 15)
  });
}
