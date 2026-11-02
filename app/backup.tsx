import {
  layout,
  radius,
  spacing,
  surfaceFor,
  textStyles,
} from "@/constants/theme";
import { useCounterContext } from "@/context/counterContext";
import { Backup, pickBackup, shareBackup } from "@/services/backup";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const plural = (n: number) => `${n} counter${n === 1 ? "" : "s"}`;

export default function BackupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = surfaceFor(useTheme().dark);
  const { counters, widgetCounterId, listWidgetFilter, restoreBackup } =
    useCounterContext();
  // Which action is running, so its row shows a spinner and both rows ignore taps
  const [busy, setBusy] = useState<"backup" | "restore" | null>(null);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const handleBackup = async () => {
    setBusy("backup");
    try {
      await shareBackup({ counters, widgetCounterId, listWidgetFilter });
    } catch (e) {
      console.error("Failed to create backup", e);
      Alert.alert("Backup failed", "The backup file couldn't be created.");
    } finally {
      setBusy(null);
    }
  };

  const applyRestore = async (backup: Backup) => {
    setBusy("restore");
    try {
      await restoreBackup(backup);
      Alert.alert("Backup restored", `Restored ${plural(backup.counters.length)}.`);
    } catch (e) {
      console.error("Failed to restore backup", e);
      Alert.alert("Restore failed", "Your counters weren't changed.");
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setBusy("restore");
    let backup: Backup | null;
    try {
      backup = await pickBackup();
    } catch (e) {
      Alert.alert(
        "Can't restore this file",
        e instanceof Error ? e.message : "The file couldn't be read."
      );
      return;
    } finally {
      setBusy(null);
    }
    if (!backup) return;

    Alert.alert(
      "Restore backup?",
      `This replaces the ${plural(counters.length)} on this phone with the ${plural(
        backup.counters.length
      )} in the backup.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: () => applyRestore(backup),
        },
      ]
    );
  };

  const row = (
    key: "backup" | "restore",
    {
      icon,
      title,
      subtitle,
      onPress,
      last,
    }: {
      icon: string;
      title: string;
      subtitle: string;
      onPress: () => void;
      last: boolean;
    }
  ) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy !== null, busy: busy === key }}
      disabled={busy !== null}
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
      <View style={[styles.leading, { backgroundColor: s.chip }]}>
        <Icon source={icon} size={18} color={s.text} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: s.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: s.muted }]}>{subtitle}</Text>
      </View>
      <View style={styles.trailing}>
        {busy === key ? (
          <ActivityIndicator size="small" color={s.muted} />
        ) : (
          <Icon source="chevron-right" size={20} color={s.muted} />
        )}
      </View>
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
          <Text style={[textStyles.title, { color: s.text }]}>Backup</Text>
          <Text style={[styles.introBody, { color: s.muted }]}>
            Save your counters to Google Drive, and bring them back on a new
            phone or after reinstalling.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: s.card, borderColor: s.border },
          ]}
        >
          {row("backup", {
            icon: "cloud-upload-outline",
            title: "Back up to Google Drive",
            subtitle: `${plural(counters.length)} · choose Drive in the share menu`,
            onPress: handleBackup,
            last: false,
          })}
          {row("restore", {
            icon: "cloud-download-outline",
            title: "Restore from backup",
            subtitle: "Pick a TimeKeeper backup file from Drive",
            onPress: handleRestore,
            last: true,
          })}
        </View>

        <View style={styles.help}>
          <Icon source="information-outline" size={18} color={s.muted} />
          <Text style={[styles.helpText, { color: s.muted }]}>
            Restoring replaces the counters on this phone. Backups don&apos;t
            update by themselves, so back up again after big changes.
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
  trailing: {
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
