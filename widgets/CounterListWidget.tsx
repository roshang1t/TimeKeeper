import {
  Box,
  Column,
  LazyColumn,
  Row,
  Spacer,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  size,
  width,
} from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type CounterListItem = {
  id: string;
  name: string;
  type: "countdown" | "countup";
  target: number; // Counter.createdAt
  repeat: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  repeatDays: number; // Days between occurrences when repeat is "custom"
  color: string; // Accent hex (see colorFor)
  tintColor: string; // Soft accent behind the emoji (see tint)
  emoji: string; // "" for none
};

export type CounterListWidgetProps = {
  items: CounterListItem[];
};

// Runs in the isolated widget runtime: everything it uses must be declared inside this function.
// Each row: tinted emoji, the number with its unit, then the name.
const CounterListWidget = (
  props: CounterListWidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Props read by our expo-widgets patch (patches/): `widgetUrl` opens a deep link on tap, and
  // `widgetRefreshAt` on the root view is when the widget redraws next.
  const native = (widgetUrl: string, widgetRefreshAt = 0) =>
    ({ widgetUrl, widgetRefreshAt }) as object;
  const isDark = environment.colorScheme === "dark";
  const CARD = isDark ? "#161619" : "#FFFFFF";
  const ROW = isDark ? "#202024" : "#F6F6F4";
  const TEXT = isDark ? "#F2F2F3" : "#111111";
  const MUTED = isDark ? "#8E8E93" : "#86868B";
  const now = Date.now();
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Same math as the single counter widget, recomputed on every render
  const describe = (item: CounterListItem) => {
    const isCountdown = item.type === "countdown";
    let target = item.target;
    if (isCountdown && item.repeat !== "none") {
      while (target <= now) {
        const next = new Date(target);
        if (item.repeat === "daily") next.setDate(next.getDate() + 1);
        else if (item.repeat === "custom")
          next.setDate(next.getDate() + Math.max(1, item.repeatDays));
        else if (item.repeat === "weekly") next.setDate(next.getDate() + 7);
        else if (item.repeat === "monthly") next.setMonth(next.getMonth() + 1);
        else next.setFullYear(next.getFullYear() + 1);
        target = next.getTime();
      }
    }
    const date = new Date(target);
    const day = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
    const range = isCountdown ? `Today → ${day}` : `${day} → Today`;
    const diff = isCountdown ? target - now : now - target;
    const days = Math.floor(Math.max(0, diff) / DAY_MS);
    // Same boundaries as the single counter widget: every 24h from the target, +1s
    const refreshAt = !isCountdown
      ? target + (days + 1) * DAY_MS + 1000
      : diff > 0
        ? target - days * DAY_MS + 1000
        : 0;
    if (isCountdown && diff <= 0) {
      return { value: "Done", unit: "", range, refreshAt };
    }
    if (days === 0) return { value: "Today", unit: "", range, refreshAt };
    const unit = days === 1 ? "DAY" : "DAYS";
    return { value: String(days), unit, range, refreshAt };
  };

  const rows = props.items.map((item) => ({ item, ...describe(item) }));
  const upcoming = rows.map((r) => r.refreshAt).filter((t) => t > 0);
  const refreshAt = upcoming.length > 0 ? Math.min(...upcoming) : 0;

  // Glance ignores `spacedBy`, so every gap below is an explicit Spacer or padding.
  return (
    <Column
      modifiers={[
        fillMaxSize(),
        background(CARD),
        cornerRadius(28),
        paddingAll(12),
      ]}
      {...native(
        props.items.length === 0
          ? "timekeeper://add.modal"
          : "timekeeper:///",
        refreshAt
      )}
    >
      {/* Inset to line up with the row content (row padding) */}
      <Text
        color={TEXT}
        modifiers={[padding(12, 4, 0, 0)]}
        style={{ fontSize: 14, fontWeight: "bold" }}
      >
        TimeKeeper
      </Text>
      <Spacer modifiers={[height(10)]} />
      {props.items.length === 0 ? (
        <Text
          color={MUTED}
          modifiers={[padding(12, 0, 12, 0)]}
          style={{ fontSize: 13 }}
        >
          No active counters. Tap to add one.
        </Text>
      ) : (
        <LazyColumn>
          {rows.map(({ item, value, unit, range }) => {
            return (
              <Box
                key={item.id}
                modifiers={[fillMaxWidth(), padding(0, 0, 0, 8)]}
              >
                <Row
                  modifiers={[
                    fillMaxWidth(),
                    background(ROW),
                    cornerRadius(18),
                    paddingAll(12),
                  ]}
                  verticalAlignment="center"
                  {...native(
                    `timekeeper://details?id=${encodeURIComponent(item.id)}`
                  )}
                >
                  <Box
                    modifiers={[
                      size(4, 32),
                      background(item.color),
                      cornerRadius(2),
                    ]}
                  />
                  <Spacer modifiers={[width(12)]} />
                  <Column modifiers={[width(60)]}>
                    <Text
                      color={TEXT}
                      maxLines={1}
                      style={{
                        fontSize: value.length > 4 ? 16 : 22,
                        fontWeight: "bold",
                      }}
                    >
                      {value}
                    </Text>
                    {unit ? (
                      <Text
                        color={MUTED}
                        maxLines={1}
                        style={{ fontSize: 9, fontWeight: "bold" }}
                      >
                        {unit}
                      </Text>
                    ) : null}
                  </Column>
                  <Spacer modifiers={[width(8)]} />
                  <Column>
                    <Text
                      color={TEXT}
                      maxLines={1}
                      overflow="ellipsis"
                      style={{ fontSize: 14, fontWeight: "bold" }}
                    >
                      {item.emoji ? `${item.name} ${item.emoji}` : item.name}
                    </Text>
                    <Text color={MUTED} maxLines={1} style={{ fontSize: 11 }}>
                      {range}
                    </Text>
                  </Column>
                </Row>
              </Box>
            );
          })}
        </LazyColumn>
      )}
    </Column>
  );
};

export default createWidget<CounterListWidgetProps>(
  "CounterListWidget",
  CounterListWidget,
  { items: [] }
);
