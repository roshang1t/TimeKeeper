import { pickWidgetCounter } from "@/components/widget.sync";
import {
  colorFor,
  layout,
  radius,
  spacing,
  surfaceFor,
  textStyles,
  tint,
} from "@/constants/theme";
import { ListWidgetFilter, useCounterContext } from "@/context/counterContext";
import { Counter } from "@/types/counter";
import { formatCounterValue } from "@/utils/time";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LIST_OPTIONS: { value: ListWidgetFilter; title: string; icon: string }[] =
  [
    { value: "all", title: "All counters", icon: "view-list-outline" },
    { value: "upcoming", title: "Countdowns only", icon: "calendar-clock" },
    { value: "since", title: "Count-ups only", icon: "history" },
  ];

// Opened from the app, or from a widget's "Edit widget" on the home screen
// (timekeeper://widget-settings, see plugins/with-widget-configure.js).
export default function WidgetSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = surfaceFor(useTheme().dark);
  const {
    counters,
    widgetCounterId,
    setWidgetCounterId,
    listWidgetFilter,
    setListWidgetFilter,
  } = useCounterContext();
  const [now] = useState(() => Date.now());

  const active = counters.filter((c) => !c.isArchived && !c.completed);
  const automatic = pickWidgetCounter(active, null);
  const pinnedId = active.some((c) => c.id === widgetCounterId)
    ? widgetCounterId
    : null;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const row = (
    key: string,
    {
      leading,
      title,
      subtitle,
      selected,
      onPress,
      last,
    }: {
      leading: React.ReactNode;
      title: string;
      subtitle?: string;
      selected: boolean;
      onPress: () => void;
      last: boolean;
    }
  ) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth },
        {
          borderColor: s.border,
          backgroundColor: pressed ? s.chip : "transparent",
        },
      ]}
    >
      {leading}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: s.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.rowSubtitle, { color: s.muted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.check}>
        {selected && <Icon source="check" size={20} color={s.text} />}
      </View>
    </Pressable>
  );

  const iconCircle = (icon: string) => (
    <View style={[styles.leading, { backgroundColor: s.chip }]}>
      <Icon source={icon} size={18} color={s.text} />
    </View>
  );

  const counterGlyph = (counter: Counter) => (
    <View
      style={[styles.leading, { backgroundColor: tint(colorFor(counter)) }]}
    >
      {counter.emoji ? (
        <Text style={styles.emoji}>{counter.emoji}</Text>
      ) : (
        <Icon
          source={counter.type === "countdown" ? "calendar-clock" : "history"}
          size={18}
          color={colorFor(counter)}
        />
      )}
    </View>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: s.border,
              backgroundColor: pressed ? s.chip : s.card,
            },
          ]}
        >
          <Icon source="arrow-left" size={20} color={s.text} />
        </Pressable>

        <View style={styles.intro}>
          <Text style={[textStyles.title, { color: s.text }]}>Widgets</Text>
          <Text style={[styles.introBody, { color: s.muted }]}>
            Choose what your home screen widgets show.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.label, { color: s.muted }]}>
            Counter widget
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: s.card, borderColor: s.border },
            ]}
          >
            {row("automatic", {
              leading: iconCircle("auto-fix"),
              title: "Automatic",
              subtitle: automatic
                ? `Now showing ${automatic.name}`
                : "Shows your soonest countdown",
              selected: pinnedId === null,
              onPress: () => setWidgetCounterId(null),
              last: active.length === 0,
            })}
            {active.map((counter, index) => {
              const { value, label } = formatCounterValue(counter, now);
              return row(counter.id, {
                leading: counterGlyph(counter),
                title: counter.name,
                subtitle: `${value} ${label.toLowerCase()}`,
                selected: pinnedId === counter.id,
                onPress: () => setWidgetCounterId(counter.id),
                last: index === active.length - 1,
              });
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.label, { color: s.muted }]}>
            List widget
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: s.card, borderColor: s.border },
            ]}
          >
            {LIST_OPTIONS.map((option, index) =>
              row(option.value, {
                leading: iconCircle(option.icon),
                title: option.title,
                selected: listWidgetFilter === option.value,
                onPress: () => setListWidgetFilter(option.value),
                last: index === LIST_OPTIONS.length - 1,
              })
            )}
          </View>
        </View>

        <View style={styles.help}>
          <Icon source="information-outline" size={18} color={s.muted} />
          <Text style={[styles.helpText, { color: s.muted }]}>
            To add a widget, long-press your home screen and choose Widgets,
            then TimeKeeper. Long-press a widget and tap Edit to come back here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.gutter,
    gap: spacing.lg,
  },
  backButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    gap: spacing.xs,
  },
  introBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  section: {
    gap: spacing.sm + spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 60,
  },
  leading: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
    includeFontPadding: false,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 13,
  },
  check: {
    width: 24,
    alignItems: "center",
  },
  help: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
