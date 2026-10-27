import React from "react";
import { StyleSheet, View } from "react-native";

const MAX_DOTS = 365;

// One dot per day of the wait (or streak), filled up to today. Long spans are scaled
// down to at most a year of dots so the grid stays a readable size.
export default function DotGrid({
  totalDays,
  elapsedDays,
  color,
  emptyColor,
}: {
  totalDays: number;
  elapsedDays: number;
  color: string;
  emptyColor: string;
}) {
  const total = Math.max(1, Math.round(totalDays));
  const count = Math.min(total, MAX_DOTS);
  const filled = Math.round((Math.min(elapsedDays, total) / total) * count);

  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < filled ? color : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
