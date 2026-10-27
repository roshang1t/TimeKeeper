import {
  Box,
  Column,
  LinearProgressIndicator,
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
  paddingAll,
  size,
  width,
} from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type CounterWidgetProps = {
  state: "empty" | "counter";
  name: string;
  type: "countdown" | "countup";
  target: number; // Counter.createdAt
  startedAt: number; // Counter.startedAt, 0 when unknown (no progress line)
  repeat: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  repeatDays: number; // Days between occurrences when repeat is "custom"
  color: string; // Accent hex (see colorFor)
  tintColor: string; // Soft accent behind the emoji (see tint)
  emoji: string; // "" for none
};

// Runs in the isolated widget runtime: everything it uses must be declared inside this function.
// Glance ignores spaceBetween, so the layout stacks two full-size Boxes: one aligned to the
// top (emoji) and one aligned to the bottom (number, label, name, progress).
const CounterWidget = (
  props: CounterWidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const isDark = environment.colorScheme === "dark";
  const CARD = isDark ? "#161619" : "#FFFFFF";
  const TEXT = isDark ? "#F2F2F3" : "#111111";
  const MUTED = isDark ? "#8E8E93" : "#86868B";
  const TRACK = isDark ? "#2A2A2E" : "#EDEDED";
  const isCountdown = props.type === "countdown";
  const card = [
    fillMaxSize(),
    background(CARD),
    cornerRadius(28),
    paddingAll(14),
  ];

  if (props.state !== "counter") {
    return (
      <Column
        modifiers={card}
        verticalArrangement="center"
        horizontalAlignment="center"
      >
        <Text color={TEXT} style={{ fontSize: 15, fontWeight: "bold" }}>
          No counters yet
        </Text>
        <Text color={MUTED} style={{ fontSize: 12, textAlign: "center" }}>
          Open TimeKeeper to add one
        </Text>
      </Column>
    );
  }

  // The widget re-renders without the app (hourly refresh, reboot), so compute from the clock here.
  const now = Date.now();
  let target = props.target;
  if (isCountdown && props.repeat !== "none") {
    while (target <= now) {
      const next = new Date(target);
      if (props.repeat === "daily") next.setDate(next.getDate() + 1);
      else if (props.repeat === "custom")
        next.setDate(next.getDate() + Math.max(1, props.repeatDays));
      else if (props.repeat === "weekly") next.setDate(next.getDate() + 7);
      else if (props.repeat === "monthly") next.setMonth(next.getMonth() + 1);
      else next.setFullYear(next.getFullYear() + 1);
      target = next.getTime();
    }
  }

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
  const diff = isCountdown ? target - now : now - target;
  const days = Math.floor(Math.max(0, diff) / DAY_MS);
  // Editorial stack, like the app: big number, unit word, then name and date range
  let value = String(days);
  let unit = days === 1 ? "DAY" : "DAYS";
  let tag = isCountdown ? "TO GO" : "SINCE";
  if (isCountdown && diff <= 0) {
    value = "Done";
    unit = "";
    tag = "COMPLETED";
  } else if (days === 0) {
    value = "Today";
    unit = "";
    tag = isCountdown ? "IT'S THE DAY" : "STARTED TODAY";
  }
  const date = new Date(target);
  const day = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  const range = isCountdown ? `Today → ${day}` : `${day} → Today`;

  const hasProgress =
    isCountdown &&
    props.repeat === "none" &&
    props.startedAt > 0 &&
    props.startedAt < target;
  const progress = hasProgress
    ? Math.min(
        1,
        Math.max(0, (now - props.startedAt) / (target - props.startedAt))
      )
    : 0;

  return (
    <Box modifiers={card} contentAlignment="topStart">
      <Row verticalAlignment="center">
        <Box
          modifiers={[size(8, 8), background(props.color), cornerRadius(4)]}
        />
        <Spacer modifiers={[width(6)]} />
        <Text
          color={MUTED}
          style={{ fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}
        >
          {tag}
        </Text>
      </Row>
      <Box modifiers={[fillMaxSize()]} contentAlignment="bottomStart">
        <Column modifiers={[fillMaxWidth()]}>
          <Text
            color={TEXT}
            maxLines={1}
            style={{
              fontSize: value.length > 4 ? 28 : 40,
              fontWeight: "bold",
            }}
          >
            {value}
          </Text>
          {unit ? (
            <Text color={TEXT} style={{ fontSize: 13, fontWeight: "bold" }}>
              {unit}
            </Text>
          ) : null}
          {/* Glance has no gap/spacedBy; spacing is explicit */}
          <Spacer modifiers={[height(8)]} />
          <Text
            color={TEXT}
            maxLines={1}
            overflow="ellipsis"
            style={{ fontSize: 13, fontWeight: "bold" }}
          >
            {props.emoji ? `${props.name} ${props.emoji}` : props.name}
          </Text>
          <Text color={MUTED} maxLines={1} style={{ fontSize: 11 }}>
            {range}
          </Text>
          {hasProgress ? <Spacer modifiers={[height(10)]} /> : null}
          {hasProgress ? (
            <LinearProgressIndicator
              progress={progress}
              color={props.color}
              trackColor={TRACK}
              modifiers={[fillMaxWidth(), height(3)]}
            />
          ) : null}
        </Column>
      </Box>
    </Box>
  );
};

export default createWidget<CounterWidgetProps>(
  "CounterWidget",
  CounterWidget,
  {
    state: "empty",
    name: "",
    type: "countup",
    target: 0,
    startedAt: 0,
    repeat: "none",
    repeatDays: 1,
    color: "#3B9EFF",
    tintColor: "#3B9EFF29",
    emoji: "",
  }
);
