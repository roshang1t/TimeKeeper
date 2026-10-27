import { colorFor, tint } from "@/constants/theme";
import { ListWidgetFilter, useCounterContext } from "@/context/counterContext";
import {
  registerWidgetRefreshTask,
  updateCounterListWidget,
  updateCounterWidget,
} from "@/services/widget";
import { Counter } from "@/types/counter";
import type { CounterListItem } from "@/widgets/CounterListWidget";
import type { CounterWidgetProps } from "@/widgets/CounterWidget";
import { useEffect } from "react";

const MAX_LIST_ITEMS = 10;

// The pinned counter if it's still active, else the soonest countdown, else any active counter.
export function pickWidgetCounter(
  active: Counter[],
  widgetCounterId: string | null
): Counter | undefined {
  const nextCountdown = active
    .filter((c) => c.type === "countdown")
    .sort((a, b) => a.createdAt - b.createdAt)[0];
  return (
    active.find((c) => c.id === widgetCounterId) ?? nextCountdown ?? active[0]
  );
}

// Soonest countdowns first, then count-ups with the longest streak first.
function listItems(
  active: Counter[],
  filter: ListWidgetFilter
): CounterListItem[] {
  const countdowns =
    filter === "since"
      ? []
      : active
          .filter((c) => c.type === "countdown")
          .sort((a, b) => a.createdAt - b.createdAt);
  const countups =
    filter === "upcoming"
      ? []
      : active
          .filter((c) => c.type === "countup")
          .sort((a, b) => a.createdAt - b.createdAt);
  return [...countdowns, ...countups].slice(0, MAX_LIST_ITEMS).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    target: c.createdAt,
    repeat: c.repeat ?? "none",
    color: colorFor(c),
    tintColor: tint(colorFor(c), 0.18),
    emoji: c.emoji ?? "",
  }));
}

// Keeps the home screen widgets in sync with the app's counters. Renders nothing.
export default function WidgetSync() {
  const { counters, widgetCounterId, listWidgetFilter } = useCounterContext();

  useEffect(() => {
    registerWidgetRefreshTask().catch((e) =>
      console.error("Failed to register widget refresh", e)
    );
  }, []);

  useEffect(() => {
    const active = counters.filter((c) => !c.isArchived && !c.completed);
    const counter = pickWidgetCounter(active, widgetCounterId);
    const props: CounterWidgetProps = {
      state: counter ? "counter" : "empty",
      name: counter?.name ?? "",
      type: counter?.type ?? "countup",
      target: counter?.createdAt ?? 0,
      startedAt: counter?.startedAt ?? 0,
      repeat: counter?.repeat ?? "none",
      color: counter ? colorFor(counter) : "",
      tintColor: counter ? tint(colorFor(counter), 0.18) : "",
      emoji: counter?.emoji ?? "",
    };
    updateCounterWidget(props);
    updateCounterListWidget({ items: listItems(active, listWidgetFilter) });
  }, [counters, widgetCounterId, listWidgetFilter]);

  return null;
}
