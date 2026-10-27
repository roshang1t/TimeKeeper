import PillButton from "@/components/pill.button";
import { radius, spacing, surfaceFor, textStyles } from "@/constants/theme";
import { REMINDER_OPTIONS } from "@/services/notifications";
import { RepeatInterval } from "@/types/counter";
import { MAX_REPEAT_DAYS, REPEAT_OPTIONS } from "@/utils/repeat";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "react-native-paper";

interface CountdownOptionsProps {
  reminders: number[];
  onRemindersChange: (reminders: number[]) => void;
  repeat: RepeatInterval;
  onRepeatChange: (repeat: RepeatInterval) => void;
  repeatDays: number;
  onRepeatDaysChange: (days: number) => void;
}

// Reminder + repeat pickers shared by the add and edit screens (countdowns only).
export default function CountdownOptions({
  reminders,
  onRemindersChange,
  repeat,
  onRepeatChange,
  repeatDays,
  onRepeatDaysChange,
}: CountdownOptionsProps) {
  const s = surfaceFor(useTheme().dark);
  // Kept as text so the field can be cleared while typing; only whole numbers >= 1 are applied.
  const [daysText, setDaysText] = useState(String(repeatDays));
  const changeDays = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    setDaysText(digits);
    const days = Number(digits);
    if (days >= 1) onRepeatDaysChange(Math.min(days, MAX_REPEAT_DAYS));
  };
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
        {repeat === "custom" && (
          <View style={styles.daysRow}>
            <Text style={[styles.daysLabel, { color: s.text }]}>Every</Text>
            <TextInput
              value={daysText}
              onChangeText={changeDays}
              onBlur={() => setDaysText(String(repeatDays))}
              keyboardType="number-pad"
              maxLength={String(MAX_REPEAT_DAYS).length}
              selectTextOnFocus
              cursorColor={s.text}
              style={[
                styles.daysInput,
                {
                  color: s.text,
                  backgroundColor: s.card,
                  borderColor: s.border,
                },
              ]}
            />
            <Text style={[styles.daysLabel, { color: s.text }]}>
              {repeatDays === 1 ? "day" : "days"}
            </Text>
          </View>
        )}
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
  daysRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  daysLabel: {
    fontSize: 15,
  },
  daysInput: {
    minWidth: 64,
    height: 40,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
});
