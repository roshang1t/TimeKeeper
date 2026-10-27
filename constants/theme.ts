// Design tokens for TimeKeeper: a clean, minimal look. Neutral surfaces, the system
// font, thin large numbers, and each counter's color used only as a small accent.
// The react-native-paper theme in app/_layout.tsx is built from `brand`.

import { Counter, CounterColor } from "@/types/counter";
import { TextStyle } from "react-native";

// Counter accent colors (dot, progress line). Saturated enough to read on both the
// light and the dark surfaces.
export const palette: Record<CounterColor, string> = {
  coral: "#FF6B57",
  peach: "#FF9F43",
  lemon: "#F2C200",
  mint: "#34C77B",
  teal: "#1FB5B0",
  sky: "#3B9EFF",
  periwinkle: "#6E7BFF",
  lilac: "#A970FF",
  pink: "#FF5FA2",
  sand: "#C2A072",
};

export const PALETTE_KEYS = Object.keys(palette) as CounterColor[];

const COMPLETED_COLOR = "#A1A1A6";

export const defaultColorFor = (type: Counter["type"]): CounterColor =>
  type === "countdown" ? "sky" : "coral";

export const colorFor = (
  counter: Pick<Counter, "type" | "completed" | "color">
) =>
  counter.completed
    ? COMPLETED_COLOR
    : palette[counter.color ?? defaultColorFor(counter.type)];

// A soft tint of an accent hex (#RRGGBB), e.g. behind a counter's emoji.
export const tint = (hex: string, alpha = 0.16) =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;

// Neutral surfaces and text for each color scheme.
export const surfaces = {
  light: {
    background: "#F6F6F4",
    card: "#FFFFFF",
    border: "rgba(0, 0, 0, 0.06)",
    chip: "#ECECE9",
    text: "#111111",
    muted: "#86868B",
    track: "rgba(0, 0, 0, 0.07)",
    inverse: "#111111",
    onInverse: "#FFFFFF",
    danger: "#D70015",
  },
  dark: {
    background: "#0B0B0D",
    card: "#161619",
    border: "rgba(255, 255, 255, 0.07)",
    chip: "#202024",
    text: "#F2F2F3",
    muted: "#8E8E93",
    track: "rgba(255, 255, 255, 0.09)",
    inverse: "#F2F2F3",
    onInverse: "#0B0B0D",
    danger: "#FF453A",
  },
} as const;

export type Surface = (typeof surfaces)["light"] | (typeof surfaces)["dark"];

export const surfaceFor = (dark: boolean): Surface =>
  dark ? surfaces.dark : surfaces.light;

// Paper theme colors for each scheme.
export const brand = {
  light: {
    primary: surfaces.light.text,
    secondary: palette.sky,
    background: surfaces.light.background,
    surface: surfaces.light.card,
  },
  dark: {
    primary: surfaces.dark.text,
    secondary: palette.sky,
    background: surfaces.dark.background,
    surface: surfaces.dark.card,
  },
} as const;

// Every screen-level element (header, filters, section labels, cards) starts and ends
// on the same gutter so left and right edges line up.
export const layout = {
  gutter: 20,
  gap: 12,
  iconButton: 40, // round header/card buttons
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

// Anton (loaded in app/_layout.tsx): heavy condensed type for numbers and their
// unit word, stacked editorial-style ("41" over "DAYS"). Everything else is system.
export const fonts = {
  display: "Anton_400Regular",
} as const;

export const textStyles = {
  // Big counter numbers and the unit word under them; set lineHeight ≈ 1.1 × fontSize
  number: {
    fontFamily: fonts.display,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  // Small uppercase section and unit labels
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
} as const satisfies Record<string, TextStyle>;
