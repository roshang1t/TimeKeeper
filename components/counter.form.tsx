import CountdownOptions from "@/components/countdown.options";
import PillButton from "@/components/pill.button";
import {
  layout,
  palette,
  PALETTE_KEYS,
  radius,
  spacing,
  surfaceFor,
  textStyles,
  tint,
} from "@/constants/theme";
import { REMINDER_OPTIONS } from "@/services/notifications";
import { CounterColor, RepeatInterval } from "@/types/counter";
import { repeatLabel } from "@/utils/repeat";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { Icon, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CounterType = "countup" | "countdown";

const EMOJIS = [
  "🎂",
  "🎉",
  "✈️",
  "🏖️",
  "🎄",
  "🎃",
  "💍",
  "❤️",
  "🎓",
  "💼",
  "🏠",
  "👶",
  "🐶",
  "🏃",
  "💪",
  "🚭",
  "🍷",
  "🍬",
  "📚",
  "🎮",
  "🎵",
  "⚽",
  "🌱",
  "💰",
  "🧘",
  "☕",
  "🚗",
  "🏔️",
  "⭐",
  "🔥",
];

interface CounterFormProps {
  title: string;
  type: CounterType;
  onTypeChange?: (type: CounterType) => void; // Omit to hide the type toggle (editing)
  name: string;
  onNameChange: (name: string) => void;
  emoji: string | undefined;
  onEmojiChange: (emoji: string | undefined) => void;
  color: CounterColor;
  onColorChange: (color: CounterColor) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  reminders: number[];
  onRemindersChange: (reminders: number[]) => void;
  repeat: RepeatInterval;
  onRepeatChange: (repeat: RepeatInterval) => void;
  repeatDays: number;
  onRepeatDaysChange: (days: number) => void;
  error: string;
  submitLabel: string;
  onSubmit: () => void;
  onClose: () => void;
}

// The add screen and edit modal. Only the essentials (type, name, date) are open;
// icon/color and reminders/repeat sit in collapsed rows, and the submit button is
// pinned to the bottom so it's always visible.
export default function CounterForm(props: CounterFormProps) {
  const theme = useTheme();
  const s = surfaceFor(theme.dark);
  const insets = useSafeAreaInsets();
  const isCountdown = props.type === "countdown";
  const accent = palette[props.color];
  const field = { backgroundColor: s.card, borderColor: s.border };

  const [open, setOpen] = useState<"style" | "reminders" | null>(null);
  const toggle = (section: "style" | "reminders") =>
    setOpen((current) => (current === section ? null : section));

  // Type toggle: the selected pill slides, and horizontal swipes switch the type
  const [segmentWidth, setSegmentWidth] = useState(0);
  const sliderPosition = useSharedValue(isCountdown ? 0 : 1);
  useEffect(() => {
    sliderPosition.value = withTiming(isCountdown ? 0 : 1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [isCountdown, sliderPosition]);
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderPosition.value * segmentWidth }],
  }));

  const selectType = (type: CounterType) => props.onTypeChange?.(type);
  const swipeType = Gesture.Simultaneous(
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .onStart(() => {
        runOnJS(selectType)("countup");
      }),
    Gesture.Fling()
      .direction(Directions.LEFT)
      .onStart(() => {
        runOnJS(selectType)("countdown");
      })
  );

  const reminderSummary =
    props.reminders.length === 0
      ? "No reminders"
      : props.reminders
          .map((m) => REMINDER_OPTIONS.find((o) => o.minutes === m)?.label)
          .join(", ");
  const repeatSummary =
    props.repeat === "none"
      ? ""
      : ` · ${repeatLabel(props.repeat, props.repeatDays)}`;

  const glyph = (size: number) =>
    props.emoji ? (
      <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.7 }}>
        {props.emoji}
      </Text>
    ) : (
      <Icon
        source={isCountdown ? "calendar-clock" : "history"}
        size={size * 0.5}
        color={accent}
      />
    );

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.md, borderColor: s.border },
        ]}
      >
        <Text style={[styles.title, { color: s.text }]}>{props.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={props.onClose}
          style={({ pressed }) => [
            styles.closeButton,
            {
              borderColor: s.border,
              backgroundColor: pressed ? s.chip : s.card,
            },
          ]}
        >
          <Icon source="close" size={20} color={s.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Swipe right for count up, left for count down (the emoji row below scrolls
            sideways, so it stays outside this area) */}
        <GestureDetector gesture={swipeType}>
          <View collapsable={false} style={styles.swipeArea}>
            {props.onTypeChange && (
              <View
                style={[styles.segmented, { backgroundColor: s.chip }]}
                onLayout={(e) =>
                  setSegmentWidth(
                    (e.nativeEvent.layout.width - spacing.xs * 2) / 2
                  )
                }
              >
                <Animated.View
                  style={[
                    styles.slider,
                    { width: segmentWidth, backgroundColor: s.inverse },
                    sliderStyle,
                  ]}
                />
                {(["countdown", "countup"] as const).map((option) => {
                  const selected = props.type === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="tab"
                      accessibilityLabel={
                        option === "countup" ? "Count up" : "Count down"
                      }
                      accessibilityState={{ selected }}
                      onPress={() => props.onTypeChange?.(option)}
                      style={styles.segment}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: selected ? s.onInverse : s.text },
                        ]}
                      >
                        {option === "countup" ? "Count up" : "Count down"}
                      </Text>
                      <Text
                        style={[
                          styles.segmentHint,
                          { color: selected ? s.onInverse : s.muted },
                        ]}
                      >
                        {option === "countup" ? "since a date" : "to a date"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <Text style={[textStyles.label, { color: s.muted }]}>Name</Text>
              <TextInput
                value={props.name}
                onChangeText={props.onNameChange}
                placeholder={
                  isCountdown ? "e.g. Summer trip" : "e.g. Quit sugar"
                }
                placeholderTextColor={s.muted}
                cursorColor={s.text}
                selectionColor={tint(accent, 0.4)}
                maxLength={60}
                style={[styles.input, field, { color: s.text }]}
              />
            </View>

            <View style={styles.section}>
              <Text style={[textStyles.label, { color: s.muted }]}>
                {isCountdown ? "Count down to" : "Counting since"}
              </Text>
              <View style={[styles.dateCard, field]}>
                {/* Keyed by type: on Android, react-native-date-picker crashes ("Dynamic value
                from Object is not a string") if minimumDate/maximumDate change from a date
                to undefined on the same view, which switching count down/up would do.
                Wide fallback dates aren't an option either: the datetime wheel builds one
                row per day, and decades of rows freeze the UI thread. */}
                <DatePicker
                  key={props.type}
                  mode="datetime"
                  date={props.date}
                  onDateChange={props.onDateChange}
                  minimumDate={props.minimumDate}
                  maximumDate={props.maximumDate}
                  is24hourSource="locale"
                  theme={theme.dark ? "dark" : "light"}
                  dividerColor={s.border}
                />
              </View>
            </View>
          </View>
        </GestureDetector>

        <View style={[styles.group, field]}>
          <DisclosureRow
            title="Icon & color"
            summary={props.emoji ? "Custom" : "Default"}
            leading={
              <View
                style={[styles.rowGlyph, { backgroundColor: tint(accent) }]}
              >
                {glyph(32)}
              </View>
            }
            open={open === "style"}
            onPress={() => toggle("style")}
            borderColor={s.border}
            textColor={s.text}
            mutedColor={s.muted}
          />
          {open === "style" && (
            <View style={styles.panel}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.emojiRow}
              >
                <Pressable
                  accessibilityLabel="No emoji"
                  accessibilityState={{ selected: !props.emoji }}
                  onPress={() => props.onEmojiChange(undefined)}
                  style={[
                    styles.emojiOption,
                    { backgroundColor: s.chip },
                    !props.emoji && { borderColor: s.text },
                  ]}
                >
                  <Icon source="cancel" size={18} color={s.muted} />
                </Pressable>
                {EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    accessibilityLabel={emoji}
                    accessibilityState={{ selected: props.emoji === emoji }}
                    onPress={() => props.onEmojiChange(emoji)}
                    style={[
                      styles.emojiOption,
                      { backgroundColor: s.chip },
                      props.emoji === emoji && { borderColor: s.text },
                    ]}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.colorRow}>
                {PALETTE_KEYS.map((key) => (
                  <Pressable
                    key={key}
                    accessibilityLabel={`${key} color`}
                    accessibilityState={{ selected: props.color === key }}
                    onPress={() => props.onColorChange(key)}
                    style={[
                      styles.colorOption,
                      {
                        borderColor:
                          props.color === key ? s.text : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: palette[key] },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {isCountdown && (
            <>
              <View style={[styles.divider, { backgroundColor: s.border }]} />
              <DisclosureRow
                title="Reminders & repeat"
                summary={`${reminderSummary}${repeatSummary}`}
                leading={
                  <View style={[styles.rowGlyph, { backgroundColor: s.chip }]}>
                    <Icon source="bell-outline" size={16} color={s.text} />
                  </View>
                }
                open={open === "reminders"}
                onPress={() => toggle("reminders")}
                borderColor={s.border}
                textColor={s.text}
                mutedColor={s.muted}
              />
              {open === "reminders" && (
                <View style={styles.panel}>
                  <CountdownOptions
                    reminders={props.reminders}
                    onRemindersChange={props.onRemindersChange}
                    repeat={props.repeat}
                    onRepeatChange={props.onRepeatChange}
                    repeatDays={props.repeatDays}
                    onRepeatDaysChange={props.onRepeatDaysChange}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: s.background,
            borderColor: s.border,
          },
        ]}
      >
        {props.error.length > 0 && (
          <Text style={[styles.error, { color: s.danger }]}>{props.error}</Text>
        )}
        <PillButton label={props.submitLabel} onPress={props.onSubmit} />
      </View>
    </View>
  );
}

// A tappable row that opens or closes a section, with a one-line summary of its value.
function DisclosureRow({
  title,
  summary,
  leading,
  open,
  onPress,
  borderColor,
  textColor,
  mutedColor,
}: {
  title: string;
  summary: string;
  leading: React.ReactNode;
  open: boolean;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {leading}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: textColor }]}>{title}</Text>
        <Text
          style={[styles.rowSummary, { color: mutedColor }]}
          numberOfLines={1}
        >
          {summary}
        </Text>
      </View>
      <Icon
        source={open ? "chevron-up" : "chevron-down"}
        size={22}
        color={mutedColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.md,
  },
  title: {
    ...textStyles.title,
  },
  closeButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  swipeArea: {
    gap: spacing.lg,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  // The selected pill, sliding between the two segments
  slider: {
    position: "absolute",
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    borderRadius: radius.full,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "700",
  },
  segmentHint: {
    fontSize: 11,
  },
  section: {
    gap: spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  dateCard: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  group: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 64,
  },
  rowGlyph: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSummary: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 32 + spacing.md, // line up with the row text
  },
  panel: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  emojiRow: {
    gap: spacing.sm,
  },
  emojiOption: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOptionText: {
    fontSize: 20,
    lineHeight: 26,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  colorOption: {
    padding: 3, // ring gap around the swatch
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
  },
  footer: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  error: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
