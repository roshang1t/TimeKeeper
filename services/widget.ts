import type { CounterListWidgetProps } from "@/widgets/CounterListWidget";
import type { CounterWidgetProps } from "@/widgets/CounterWidget";

// Home screen widgets are Android-only for now; see widget.android.ts.
export function updateCounterWidget(_props: CounterWidgetProps) {}

export function updateCounterListWidget(_props: CounterListWidgetProps) {}

export async function registerWidgetRefreshTask() {}
