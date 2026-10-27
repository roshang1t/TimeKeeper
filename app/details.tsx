import Badge from "@/components/badge";
import DotGrid from "@/components/dot.grid";
import EditModal from "@/components/edit.modal";
import {
  colorFor,
  layout,
  radius,
  spacing,
  surfaceFor,
  textStyles,
} from "@/constants/theme";
import { useCounterContext } from "@/context/counterContext";
import { REMINDER_OPTIONS } from "@/services/notifications";
import { repeatLabel as labelForRepeat } from "@/utils/repeat";
import {
  counterProgress,
  dateRange,
  DAY_MS,
  formatCounterValue,
  splitDuration,
} from "@/utils/time";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Details() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = surfaceFor(useTheme().dark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { counters, widgetCounterId, setWidgetCounterId } = useCounterContext();
  // Read from context (not route params) so edits show up immediately
  const counter = counters.find((c) => c.id === id);

  const [now, setNow] = useState(() => Date.now());
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!counter) {
    return null;
  }

  const accent = colorFor(counter);
  const isCountdown = counter.type === "countdown";
  const { value, unit } = formatCounterValue(counter, now);
  const { hours, minutes, seconds } = splitDuration(
    isCountdown ? counter.createdAt - now : now - counter.createdAt
  );
  const progress = counterProgress(counter, now);
  const isOnWidget = widgetCounterId === counter.id;
  const repeatLabel = labelForRepeat(counter.repeat, counter.repeatDays);
  const reminderLabels = isCountdown
    ? (counter.reminders ?? [0]).map(
        (m) => REMINDER_OPTIONS.find((o) => o.minutes === m)?.label ?? `${m}m`
      )
    : [];

  // Dot timeline: the whole wait for a countdown, or the run up to the next milestone
  const elapsedDays = isCountdown
    ? (now - (counter.startedAt ?? now)) / DAY_MS
    : (now - counter.createdAt) / DAY_MS;
  const totalDays =
    isCountdown && counter.startedAt
      ? (counter.createdAt - counter.startedAt) / DAY_MS
      : !isCountdown && progress?.caption
        ? Number(progress.caption.replace(/\D/g, ""))
        : 0;
  const showTimeline = !counter.completed && totalDays >= 2;

  const roundButton = (
    icon: string,
    label: string,
    onPress: () => void,
    active = false
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundButton,
        {
          borderColor: s.border,
          backgroundColor: active ? s.inverse : pressed ? s.chip : s.card,
        },
      ]}
    >
      <Icon source={icon} size={20} color={active ? s.onInverse : s.text} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: s.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <View style={styles.topBar}>
          {roundButton("arrow-left", "Back", () => router.back())}
          {!counter.completed && (
            <View style={styles.topActions}>
              {Platform.OS === "android" &&
                !counter.isArchived &&
                roundButton(
                  isOnWidget ? "widgets" : "widgets-outline",
                  isOnWidget ? "Remove from widget" : "Show on widget",
                  () => setWidgetCounterId(isOnWidget ? null : counter.id),
                  isOnWidget
                )}
              {roundButton("pencil-outline", "Edit counter", () =>
                setIsVisible(true)
              )}
            </View>
          )}
        </View>

        <View style={styles.hero}>
          <View style={styles.tagRow}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text style={[textStyles.label, { color: s.muted }]}>
              {counter.completed
                ? "Completed"
                : isCountdown
                  ? "Counting down"
                  : "Counting up"}
            </Text>
          </View>

          {counter.completed ? (
            <Icon source="check-circle-outline" size={120} color={s.muted} />
          ) : (
            <View>
              <Text
                style={[textStyles.number, styles.value, { color: s.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value}
              </Text>
              <Text style={[textStyles.number, styles.unit, { color: s.text }]}>
                {unit}
              </Text>
            </View>
          )}

          <View style={styles.titleBlock}>
            <Text style={[styles.name, { color: s.text }]} numberOfLines={3}>
              {counter.name}
              {counter.emoji ? ` ${counter.emoji}` : ""}
            </Text>
            <Text style={[styles.meta, { color: s.muted }]}>
              {dateRange(counter, now)} ·{" "}
              {format(new Date(counter.createdAt), "h:mm a")}
            </Text>
            {!counter.completed && (
              <Text style={[styles.clock, { color: s.muted }]}>
                {hours}h {minutes}m {seconds}s{" "}
                {isCountdown ? "on top" : "and counting"}
              </Text>
            )}
          </View>
        </View>

        {showTimeline && (
          <View
            style={[
              styles.card,
              { backgroundColor: s.card, borderColor: s.border },
            ]}
          >
            <Text style={[textStyles.label, { color: s.muted }]}>
              {isCountdown ? "The wait" : "Toward the next milestone"}
            </Text>
            <DotGrid
              totalDays={totalDays}
              elapsedDays={elapsedDays}
              color={accent}
              emptyColor={s.track}
            />
            {progress && (
              <Text style={[styles.caption, { color: s.text }]}>
                {isCountdown
                  ? `${Math.round(progress.fraction * 100)}% of the wait done`
                  : progress.caption}
              </Text>
            )}
          </View>
        )}

        {!counter.completed &&
          (repeatLabel || reminderLabels.length > 0 || isOnWidget) && (
            <View style={styles.badges}>
              {repeatLabel && <Badge icon="repeat" label={repeatLabel} />}
              {reminderLabels.map((label) => (
                <Badge key={label} icon="bell-outline" label={label} />
              ))}
              {isOnWidget && <Badge icon="widgets-outline" label="On widget" />}
            </View>
          )}
      </ScrollView>

      {isVisible && (
        <EditModal
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
          counter={counter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.gutter,
    gap: spacing.xl,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  roundButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    gap: spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: 168,
    lineHeight: 180,
  },
  unit: {
    fontSize: 64,
    lineHeight: 70,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
  },
  clock: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  card: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + spacing.xs,
    gap: spacing.md,
  },
  caption: {
    fontSize: 14,
    fontWeight: "600",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
