import ProgressBar from "@/components/progress.bar";
import {
  colorFor,
  layout,
  radius,
  spacing,
  surfaceFor,
  textStyles,
} from "@/constants/theme";
import { Counter } from "@/types/counter";
import { counterProgress, dateRange, formatCounterValue } from "@/utils/time";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, Menu, useTheme } from "react-native-paper";

export type CardAction = {
  title: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
};

interface CounterCardProps {
  counter: Counter;
  now: number;
  variant: "hero" | "tile";
  isOnWidget: boolean;
  actions: CardAction[];
  onPress: () => void;
}

// A counter on the home screen, editorial-style: the number stacked over its unit in
// heavy condensed type, then the name and the date range. The large "Up next" card or a
// grid tile; the counter's color appears only as its dot and progress line.
export default function CounterCard({
  counter,
  now,
  variant,
  isOnWidget,
  actions,
  onPress,
}: CounterCardProps) {
  const theme = useTheme();
  const s = surfaceFor(theme.dark);
  const accent = colorFor(counter);
  const [menuVisible, setMenuVisible] = useState(false);
  const isHero = variant === "hero";

  const { value, unit, label } = formatCounterValue(counter, now);
  const progress = counterProgress(counter, now);
  const isCountdown = counter.type === "countdown";

  const tag = counter.completed
    ? "Done"
    : isHero
      ? "Up next"
      : isCountdown
        ? "To go"
        : "Since";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => setMenuVisible(true)}
      accessibilityRole="button"
      accessibilityLabel={`${counter.name}, ${value} ${label.toLowerCase()}`}
      style={({ pressed }) => [
        styles.card,
        isHero ? styles.heroCard : styles.tileCard,
        {
          backgroundColor: s.card,
          borderColor: s.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.tagRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[textStyles.label, { color: s.muted }]}>{tag}</Text>
          {isOnWidget && (
            <Icon source="widgets-outline" size={13} color={s.muted} />
          )}
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Counter actions"
              hitSlop={4}
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && { backgroundColor: s.chip },
              ]}
            >
              <Icon source="dots-horizontal" size={20} color={s.muted} />
            </Pressable>
          }
        >
          {actions.map((action) => (
            <Menu.Item
              key={action.title}
              leadingIcon={action.icon}
              title={action.title}
              titleStyle={
                action.destructive ? { color: theme.colors.error } : undefined
              }
              onPress={() => {
                setMenuVisible(false);
                action.onPress();
              }}
            />
          ))}
        </Menu>
      </View>

      <View>
        {counter.completed ? (
          <Icon
            source="check-circle-outline"
            size={isHero ? 72 : 48}
            color={s.muted}
          />
        ) : (
          <>
            <Text
              style={[
                textStyles.number,
                isHero ? styles.heroValue : styles.tileValue,
                { color: s.text },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {value}
            </Text>
            <Text
              style={[
                textStyles.number,
                isHero ? styles.heroUnit : styles.tileUnit,
                { color: s.text },
              ]}
              numberOfLines={1}
            >
              {unit}
            </Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text
          style={[
            isHero ? styles.heroName : styles.tileName,
            { color: counter.completed ? s.muted : s.text },
          ]}
          numberOfLines={isHero ? 2 : 1}
        >
          {counter.name}
          {counter.emoji ? ` ${counter.emoji}` : ""}
        </Text>
        <Text style={[styles.range, { color: s.muted }]} numberOfLines={1}>
          {dateRange(counter, now)}
        </Text>
        <View style={isHero ? styles.heroProgress : styles.tileProgress}>
          {progress && (
            <>
              <View style={{ flex: 1 }}>
                <ProgressBar
                  fraction={progress.fraction}
                  color={accent}
                  trackColor={s.track}
                  height={3}
                />
              </View>
              {isHero && (
                <Text style={[styles.percent, { color: s.muted }]}>
                  {progress.caption ??
                    `${Math.round(progress.fraction * 100)}%`}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileCard: {
    width: "100%",
    aspectRatio: 0.78,
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingRight: spacing.sm,
    justifyContent: "space-between",
  },
  heroCard: {
    padding: layout.gutter,
    paddingTop: spacing.sm + spacing.xs,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  menuButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: {
    fontSize: 56,
    lineHeight: 62,
  },
  tileUnit: {
    fontSize: 24,
    lineHeight: 28,
  },
  heroValue: {
    fontSize: 92,
    lineHeight: 100,
  },
  heroUnit: {
    fontSize: 36,
    lineHeight: 40,
  },
  footer: {
    gap: 2,
    paddingRight: spacing.sm,
  },
  tileName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  heroName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  range: {
    fontSize: 12,
    lineHeight: 16,
  },
  tileProgress: {
    height: 3,
    marginTop: spacing.sm + spacing.xs,
    flexDirection: "row",
  },
  heroProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  percent: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
