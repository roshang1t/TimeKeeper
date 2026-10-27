import CounterListWidget, {
  CounterListWidgetProps,
} from "@/widgets/CounterListWidget";
import CounterWidget, { CounterWidgetProps } from "@/widgets/CounterWidget";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

const WIDGET_REFRESH_TASK = "counter-widget-refresh";

// Android widgets only re-render when told to; this keeps the day counts current while the app is closed.
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
    minimumInterval: 60, // minutes
  });
}
