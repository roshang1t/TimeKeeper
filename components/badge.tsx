import { radius, spacing, surfaceFor } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";

// Small neutral pill for repeat, reminders and widget status.
export default function Badge({
  icon,
  label,
}: {
  icon: string;
  label?: string;
}) {
  const s = surfaceFor(useTheme().dark);
  return (
    <View style={[styles.badge, { backgroundColor: s.chip }]}>
      <Icon source={icon} size={13} color={s.muted} />
      {label ? (
        <Text style={[styles.label, { color: s.muted }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4, // optical: 21dp tall pill around 13px icon
    borderRadius: radius.full,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
