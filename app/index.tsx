import CounterCard, { CardAction } from "@/components/counter.card";
import {
  layout,
  radius,
  spacing,
  surfaceFor,
  textStyles,
} from "@/constants/theme";
import { useCounterContext } from "@/context/counterContext";
import { useThemeContext } from "@/context/ThemeContext";
import { Counter } from "@/types/counter";
import { DAY_MS } from "@/utils/time";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { Icon, Snackbar, useTheme } from "react-native-paper";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type themeModeType = "light" | "dark" | "system";
type Filter = "all" | "upcoming" | "since" | "archive";

const FILTERS: Filter[] = ["all", "upcoming", "since", "archive"];
const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  upcoming: "Upcoming",
  since: "Since",
  archive: "Archive",
};

const EMPTY_STATES: Record<
  Filter,
  { icon: string; title: string; body: string }
> = {
  all: {
    icon: "timer-sand",
    title: "Nothing to count yet",
    body: "Count down to something ahead, or count up from a fresh start.",
  },
  upcoming: {
    icon: "calendar-clock",
    title: "No countdowns",
    body: "Add a trip, a birthday or a deadline.",
  },
  since: {
    icon: "history",
    title: "No count-ups",
    body: "Track a streak or how long since something began.",
  },
  archive: {
    icon: "archive-outline",
    title: "Archive is empty",
    body: "Finished and archived counters end up here.",
  },
};

export default function Index() {
  const { themeMode, toggleTheme, setTheme } = useThemeContext();
  const theme = useTheme(); // Access theme colors
  const s = surfaceFor(theme.dark);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const {
    counters,
    updateCounter,
    deleteCounter,
    markCounterCompleted,
    widgetCounterId,
    setWidgetCounterId,
  } = useCounterContext();

  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState(() => Date.now());
  const [snackbar, setSnackbar] = useState<{
    message: string;
    undo?: () => void;
  } | null>(null);

  const active = counters.filter((c) => !c.isArchived);
  const byFilter: Record<Filter, Counter[]> = {
    all: active,
    upcoming: active.filter((c) => c.type === "countdown"),
    since: active.filter((c) => c.type === "countup"),
    archive: counters.filter((c) => c.isArchived),
  };
  // The soonest countdown gets the large "Up next" card
  const hero =
    filter === "all" || filter === "upcoming"
      ? byFilter.upcoming
          .filter((c) => !c.completed && c.createdAt > now)
          .sort((a, b) => a.createdAt - b.createdAt)[0]
      : undefined;
  const listCounters = byFilter[filter].filter((c) => c.id !== hero?.id);
  const tileWidth = (width - layout.gutter * 2 - layout.gap) / 2;

  // Counters (CounterProvider) are loaded once this screen mounts
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const themesetter = async () => {
      const storedTheme = await AsyncStorage.getItem("theme");
      if (storedTheme) setTheme(storedTheme as themeModeType);
    };
    themesetter();
  }, []);

  // Tick every second while any card shows hours/minutes/seconds, otherwise every minute
  useEffect(() => {
    const needsSeconds = counters.some(
      (c) => !c.isArchived && Math.abs(Date.now() - c.createdAt) < DAY_MS
    );
    const intervalId = setInterval(
      () => setNow(Date.now()),
      needsSeconds ? 1000 : 60_000
    );
    return () => clearInterval(intervalId);
  }, [counters]);

  // --- Complete (or roll forward, if repeating) countdowns whose date has passed ---
  useEffect(() => {
    counters
      .filter(
        (c) =>
          c.type === "countdown" &&
          !c.completed &&
          !c.isArchived &&
          c.createdAt <= now
      )
      .forEach((c) => markCounterCompleted(c.id));
  }, [counters, now, markCounterCompleted]);

  // Swipe to the next/previous filter
  const stepFilter = (direction: 1 | -1) => {
    setFilter((current) => {
      const next = FILTERS.indexOf(current) + direction;
      return FILTERS[Math.min(FILTERS.length - 1, Math.max(0, next))];
    });
  };

  const flingRightGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      runOnJS(stepFilter)(-1);
    });

  const flingLeftGesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      runOnJS(stepFilter)(1);
    });

  const handleAdd = () => {
    router.push("/add.modal");
  };

  const handleDeleteCounter = (counter: Counter) => {
    Alert.alert(
      "Delete counter",
      `Delete "${counter.name}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCounter(counter.id),
        },
      ]
    );
  };

  const handleArchiveToggle = (counter: Counter) => {
    const nextIsArchived = !counter.isArchived;
    // Archived countdowns stop sending reminders; restoring one reschedules them.
    updateCounter(counter.id, { isArchived: nextIsArchived });
    setSnackbar({
      message: `"${counter.name}" ${nextIsArchived ? "archived" : "restored"}`,
      undo: () => updateCounter(counter.id, { isArchived: !nextIsArchived }),
    });
  };

  const actionsFor = (counter: Counter): CardAction[] => {
    const actions: CardAction[] = [];
    if (!counter.completed) {
      if (Platform.OS === "android" && !counter.isArchived) {
        const isOnWidget = widgetCounterId === counter.id;
        actions.push({
          title: isOnWidget ? "Remove from widget" : "Show on widget",
          icon: isOnWidget ? "widgets" : "widgets-outline",
          onPress: () => setWidgetCounterId(isOnWidget ? null : counter.id),
        });
      }
      actions.push({
        title: counter.isArchived ? "Restore" : "Archive",
        icon: counter.isArchived
          ? "archive-arrow-up-outline"
          : "archive-outline",
        onPress: () => handleArchiveToggle(counter),
      });
    }
    actions.push({
      title: "Delete",
      icon: "delete-outline",
      destructive: true,
      onPress: () => handleDeleteCounter(counter),
    });
    return actions;
  };

  const openDetails = (counter: Counter) =>
    // Details reads the rest from context, so edits show up immediately
    router.push({ pathname: "/details", params: { id: counter.id } });

  const empty = EMPTY_STATES[filter];

  const headerButton = (
    icon: string,
    label: string,
    onPress: () => void,
    color: string = s.text
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerButton,
        {
          backgroundColor: pressed ? s.chip : "transparent",
          borderColor: s.border,
        },
      ]}
    >
      <Icon source={icon} size={20} color={color} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: s.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[styles.today, { color: s.muted }]}>
            {format(now, "EEEE, d MMMM")}
          </Text>
          <Text style={[textStyles.title, { color: s.text }]}>TimeKeeper</Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS === "android" &&
            headerButton("widgets-outline", "Widget settings", () =>
              router.push("/widget-settings")
            )}
          {headerButton(
            themeMode === "dark" ? "white-balance-sunny" : "weather-night",
            "Toggle dark mode",
            toggleTheme
          )}
        </View>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((key) => {
            const selected = key === filter;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setFilter(key)}
                style={[
                  styles.filterChip,
                  { backgroundColor: selected ? s.inverse : "transparent" },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selected ? s.onInverse : s.muted },
                  ]}
                >
                  {FILTER_LABELS[key]}
                  {byFilter[key].length > 0 ? `  ${byFilter[key].length}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <GestureDetector
        gesture={Gesture.Simultaneous(flingRightGesture, flingLeftGesture)}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            key={filter} // reset scroll position per filter
            data={listCounters}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width: tileWidth }}>
                <CounterCard
                  counter={item}
                  now={now}
                  variant="tile"
                  isOnWidget={widgetCounterId === item.id}
                  actions={actionsFor(item)}
                  onPress={() => openDetails(item)}
                />
              </View>
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 104 }, // room for the add button
            ]}
            ListHeaderComponent={
              hero || listCounters.length > 0 ? (
                <View style={styles.listHeader}>
                  {hero && (
                    <CounterCard
                      counter={hero}
                      now={now}
                      variant="hero"
                      isOnWidget={widgetCounterId === hero.id}
                      actions={actionsFor(hero)}
                      onPress={() => openDetails(hero)}
                    />
                  )}
                  {listCounters.length > 0 && (
                    <Text
                      style={[
                        textStyles.label,
                        styles.sectionLabel,
                        { color: s.muted },
                      ]}
                    >
                      {filter === "upcoming" ? "Later" : "Your counters"}
                    </Text>
                  )}
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              hero ? undefined : (
                <View style={styles.empty}>
                  <View
                    style={[
                      styles.emptyIcon,
                      { borderColor: s.border, backgroundColor: s.card },
                    ]}
                  >
                    <Icon source={empty.icon} size={32} color={s.muted} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: s.text }]}>
                    {empty.title}
                  </Text>
                  <Text style={[styles.emptyBody, { color: s.muted }]}>
                    {empty.body}
                  </Text>
                </View>
              )
            }
          />
        </View>
      </GestureDetector>

      {filter !== "archive" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add counter"
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: s.inverse,
              bottom: insets.bottom + spacing.lg,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          <Icon source="plus" size={28} color={s.onInverse} />
        </Pressable>
      )}

      <Snackbar
        visible={snackbar !== null}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={
          snackbar?.undo ? { label: "Undo", onPress: snackbar.undo } : undefined
        }
        wrapperStyle={{ bottom: insets.bottom }}
      >
        {snackbar?.message}
      </Snackbar>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.lg,
  },
  today: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2, // optical: tucks the date against the title
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    paddingHorizontal: layout.gutter - spacing.md + spacing.xs, // chip text sits on the gutter
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md - spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  listContent: {
    paddingHorizontal: layout.gutter,
    gap: layout.gap,
    flexGrow: 1,
  },
  gridRow: {
    gap: layout.gap,
  },
  listHeader: {
    gap: layout.gap,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    right: layout.gutter,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
