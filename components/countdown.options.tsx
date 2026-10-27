import PillButton from "@/components/pill.button";
import { spacing, surfaceFor, textStyles } from "@/constants/theme";
import { REMINDER_OPTIONS } from "@/services/notifications";
import { RepeatInterval } from "@/types/counter";
import { REPEAT_OPTIONS } from "@/utils/repeat";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "react-native-paper";

interface CountdownOptionsProps {
  reminders: number[];
  onRemindersChange: (reminders: number[]) => void;
  repeat: RepeatInterval;
  onRepeatChange: (repeat: RepeatInterval) => void;
}

// Reminder + repeat pickers shared by the add and edit screens (countdowns only).
export default function CountdownOptions({
  reminders,
  onRemindersChange,
  repeat,
  onRepeatChange,
}: CountdownOptionsProps) {
  const s = surfaceFor(useTheme().dark);
  const toggleReminder = (minutes: number) => {
    onRemindersChange(
      reminders.includes(minutes)
        ? reminders.filter((m) => m !== minutes)
        : [...reminders, minutes].sort((a, b) => a - b)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={[textStyles.label, { color: s.muted }]}>Remind me</Text>
        <View style={styles.optionRow}>
          {REMINDER_OPTIONS.map((option) => (
            <PillButton
              key={option.minutes}
              size="sm"
              label={option.label}
              variant={
                reminders.includes(option.minutes) ? "selected" : "option"
              }
              onPress={() => toggleReminder(option.minutes)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[textStyles.label, { color: s.muted }]}>Repeat</Text>
        <View style={styles.optionRow}>
          {REPEAT_OPTIONS.map((option) => (
            <PillButton
              key={option.value}
              size="sm"
              label={option.label}
              variant={repeat === option.value ? "selected" : "option"}
              onPress={() => onRepeatChange(option.value)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm + spacing.xs,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
