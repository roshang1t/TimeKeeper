import { radius, spacing, surfaceFor } from "@/constants/theme";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { useTheme } from "react-native-paper";

type Variant = "primary" | "option" | "selected";

const sizes = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
} as const;

// Capsule button. `primary` is the main action; `option`/`selected` are toggle choices.
export default function PillButton({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: keyof typeof sizes;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const s = surfaceFor(useTheme().dark);
  const filled = variant !== "option";
  const { fontSize, ...padding } = sizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: variant === "selected" }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        padding,
        { backgroundColor: filled ? s.inverse : s.chip },
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style, // caller overrides merge last
      ]}
    >
      <Text
        style={[
          styles.label,
          { fontSize, color: filled ? s.onInverse : s.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
  },
});
