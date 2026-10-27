import { radius } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

// Thin progress line: the counter's accent color on a neutral track.
export default function ProgressBar({
  fraction,
  color,
  trackColor,
  height = 3,
}: {
  fraction: number;
  color: string;
  trackColor: string;
  height?: number;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      {/* Under 3% a rounded fill renders as a stray dot, so show only the track */}
      {percent >= 3 && (
        <View
          style={[
            styles.fill,
            { width: `${percent}%`, backgroundColor: color },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.full,
  },
});
