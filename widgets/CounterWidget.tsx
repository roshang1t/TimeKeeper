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
  padding,
  paddingAll,
  size,
  width,
} from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type CounterWidgetProps = {
  state: "empty" | "counter";
  id: string; // Counter.id, opened in the app when the widget is tapped
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
// Glance ignores spaceBetween, so the layout stacks full-size layers: the date tag at the top
// left, the emoji badge at the top right, and the number, name and progress at the bottom.
const CounterWidget = (
  props: CounterWidgetProps,
  environment: WidgetEnvironment
) => {
  "widget";
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;
  // Props read by our expo-widgets patch (patches/): `widgetUrl` opens a deep link on tap, and
  // `widgetRefreshAt` on the root view is when the widget redraws next.
  const native = (widgetUrl: string, widgetRefreshAt = 0) =>
    ({ widgetUrl, widgetRefreshAt }) as object;
  const isCountdown = props.type === "countdown";

  // The tile is filled with the counter's color. Text is near-black on the light accents
  // (lemon, peach, mint, sand, teal) and white on the rest, with softer shades mixed from
  // the two (Glance colors have no alpha here, so "translucent" is a solid blend).
  const hex = (color: string) => {
    const n = parseInt(color.replace("#", "").slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mix = (from: string, to: string, amount: number) =>
    "#" +
    hex(from)
      .map((c, i) => Math.round(c + (hex(to)[i] - c) * amount))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("");
  const luminance = (color: string) => {
    const [r, g, b] = hex(color).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // Slightly deeper in dark mode, so the tile doesn't glare on a dark home screen
  const FILL = mix(
    props.color || "#3B9EFF",
    "#000000",
    environment.colorScheme === "dark" ? 0.12 : 0
  );
  const ON = luminance(FILL) > 0.34 ? "#111111" : "#FFFFFF";
  const ON_SOFT = mix(ON, FILL, 0.3); // labels
  const TRACK = mix(FILL, ON, 0.22); // progress track, emoji badge
  const card = [
    fillMaxSize(),
    background(FILL),
    cornerRadius(28),
    paddingAll(16),
  ];

  if (props.state !== "counter") {
    return (
      <Column
        modifiers={card}
        verticalArrangement="center"
        horizontalAlignment="center"
        {...native("timekeeper://add.modal")}
      >
        <Text color={ON} style={{ fontSize: 40, fontWeight: "bold" }}>
          +
        </Text>
        <Text color={ON} style={{ fontSize: 14, fontWeight: "bold" }}>
          New counter
        </Text>
        <Text color={ON_SOFT} style={{ fontSize: 12 }}>
          Tap to add one
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
  const hours = Math.floor(Math.max(0, diff) / HOUR_MS);
  const date = new Date(target);
  const day = `${MONTHS[date.getMonth()].toUpperCase()} ${date.getDate()}`;
  // Big number with its unit beside it; the tag on top carries the date.
  // On the first (count-up) or last (countdown) day it counts hours instead.
  let value = String(days);
  let unit = days === 1 ? "DAY" : "DAYS";
  let tag = isCountdown ? `UNTIL ${day}` : `SINCE ${day}`;
  if (isCountdown && diff <= 0) {
    value = "Done";
    unit = "";
    tag = `ENDED ${day}`;
  } else if (days === 0) {
    value = hours === 0 ? "<1" : String(hours);
    unit = hours <= 1 ? "HOUR" : "HOURS";
    // Under 24h can still be tomorrow (or yesterday): compare calendar days
    const midnight = (t: number) => new Date(t).setHours(0, 0, 0, 0);
    const isSameDay = midnight(target) === midnight(now);
    if (isCountdown) tag = isSameDay ? "ENDS TODAY" : "ENDS TOMORROW";
    else tag = isSameDay ? "STARTED TODAY" : "SINCE YESTERDAY";
  }

  // Next moment the number changes: every hour on that day, every 24h otherwise
  // (+1s so the redraw lands just after the boundary). A finished countdown never changes again.
  const step = days === 0 ? HOUR_MS : DAY_MS;
  const steps = Math.floor(Math.max(0, diff) / step);
  let refreshAt = 0;
  if (!isCountdown) refreshAt = target + (steps + 1) * step + 1000;
  else if (diff > 0) refreshAt = target - steps * step + 1000;

  // Countdowns fill from creation to the target; count-ups fill toward their next milestone
  // (same milestones as utils/time.ts).
  const MILESTONES = [
    7, 14, 30, 50, 100, 150, 200, 365, 500, 730, 1000, 1095, 1461, 1826, 2000,
    2500, 3000, 3650, 5000, 7300, 10000,
  ];
  let progress = -1;
  let caption = "";
  if (isCountdown) {
    if (
      props.repeat === "none" &&
      props.startedAt > 0 &&
      props.startedAt < target
    ) {
      progress = (now - props.startedAt) / (target - props.startedAt);
    }
  } else {
    const elapsed = Math.max(0, diff) / DAY_MS;
    const next = MILESTONES.find((m) => m > elapsed);
    if (next) {
      const previous = [...MILESTONES].reverse().find((m) => m <= elapsed) ?? 0;
      progress = (elapsed - previous) / (next - previous);
      caption = `NEXT: ${next} DAYS`;
    }
  }
  const hasProgress = progress >= 0;
  progress = Math.min(1, Math.max(0, progress));

  // Scale the number to fill the tile: bold digits are about 0.6em wide and a line is about
  // 1.2em tall; the rest of the height goes to the tag, name, progress bar and caption.
  const box = (
    environment as WidgetEnvironment & {
      widgetSize?: { width: number; height: number };
    }
  ).widgetSize;
  const contentWidth = (box?.width || 150) - 32;
  const contentHeight = (box?.height || 150) - 32;
  const reserved =
    15 + 19 + (hasProgress ? 14 : 0) + (caption ? 16 : 0) + 6;
  const byWidth =
    (contentWidth - (unit ? 48 : 0)) / (Math.max(2, value.length) * 0.6);
  const byHeight = (contentHeight - reserved) / 1.2;
  const valueSize = Math.round(Math.max(28, Math.min(84, byWidth, byHeight)));

  return (
    <Box
      modifiers={card}
      contentAlignment="topStart"
      {...native(
        `timekeeper://details?id=${encodeURIComponent(props.id)}`,
        refreshAt
      )}
    >
      <Text
        color={ON_SOFT}
        maxLines={1}
        style={{ fontSize: 11, fontWeight: "bold" }}
      >
        {tag}
      </Text>
      {props.emoji ? (
        <Box modifiers={[fillMaxWidth()]} contentAlignment="topEnd">
          <Box
            modifiers={[size(30, 30), background(TRACK), cornerRadius(15)]}
            contentAlignment="center"
          >
            <Text style={{ fontSize: 15 }}>{props.emoji}</Text>
          </Box>
        </Box>
      ) : null}
      <Box modifiers={[fillMaxSize()]} contentAlignment="bottomStart">
        <Column modifiers={[fillMaxWidth()]}>
          <Row verticalAlignment="bottom">
            <Text
              color={ON}
              maxLines={1}
              style={{ fontSize: valueSize, fontWeight: "bold" }}
            >
              {value}
            </Text>
            {unit ? <Spacer modifiers={[width(6)]} /> : null}
            {unit ? (
              <Column
                modifiers={[padding(0, 0, 0, Math.round(valueSize * 0.16))]}
              >
                <Text color={ON} style={{ fontSize: 13, fontWeight: "bold" }}>
                  {unit}
                </Text>
                <Text
                  color={ON_SOFT}
                  style={{ fontSize: 13, fontWeight: "bold" }}
                >
                  {isCountdown ? "LEFT" : "SO FAR"}
                </Text>
              </Column>
            ) : null}
          </Row>
          <Text
            color={ON}
            maxLines={1}
            style={{ fontSize: 14, fontWeight: "bold" }}
          >
            {props.name}
          </Text>
          {/* Glance has no gap/spacedBy; spacing is explicit */}
          {hasProgress ? <Spacer modifiers={[height(10)]} /> : null}
          {hasProgress ? (
            <LinearProgressIndicator
              progress={progress}
              color={ON}
              trackColor={TRACK}
              modifiers={[fillMaxWidth(), height(4), cornerRadius(2)]}
            />
          ) : null}
          {caption ? <Spacer modifiers={[height(4)]} /> : null}
          {caption ? (
            <Text
              color={ON_SOFT}
              maxLines={1}
              style={{ fontSize: 10, fontWeight: "bold" }}
            >
              {caption}
            </Text>
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
    id: "",
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
