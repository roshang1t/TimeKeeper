import { brand } from "@/constants/theme";
import { Anton_400Regular, useFonts } from "@expo-google-fonts/anton";
import { Stack, type StackCardInterpolationProps } from "expo-router/js-stack";
import * as SplashScreen from "expo-splash-screen";
import React, { useMemo } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";

import WidgetSync from "@/components/widget.sync";
import { CounterProvider } from "@/context/counterContext";
import { ThemeProvider, useThemeContext } from "@/context/ThemeContext";

// Keep the splash screen up until the font and saved counters are loaded (hidden by the home screen)
SplashScreen.preventAutoHideAsync();

// Your custom interpolator for a popping effect
const forScale = ({ current }: StackCardInterpolationProps) => ({
  cardStyle: {
    opacity: current.progress, // Fade in the card
    transform: [
      {
        scale: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1], // Start slightly smaller (0.9) and scale to full size (1)
          extrapolate: "clamp",
        }),
      },
    ],
  },
  overlayStyle: {
    // This creates a dimming effect behind the modal
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.4], // Adjust dimming strength (0.4 for moderate dimming)
      extrapolate: "clamp",
    }),
  },
});

// This component directly contains the Stack Navigator
function RootContent() {
  const { themeMode } = useThemeContext();

  const theme = useMemo(() => {
    const baseTheme = themeMode === "dark" ? MD3DarkTheme : MD3LightTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...brand[themeMode],
      },
    };
  }, [themeMode]);

  return (
    <PaperProvider theme={theme}>
      <WidgetSync />
      <StatusBar
        barStyle={themeMode === "dark" ? "light-content" : "dark-content"}
      />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="details"
          options={{
            headerShown: false,
            // Use "transparentModal" to allow the overlayStyle to work
            presentation: "transparentModal",
            cardStyleInterpolator: forScale,
          }}
        />
        <Stack.Screen
          name="add.modal"
          options={{
            headerShown: false,
            cardStyleInterpolator: forScale,

            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="widget-settings"
          options={{
            headerShown: false,
            cardStyleInterpolator: forScale,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}

// Deep links (e.g. a widget's "Edit widget") open on top of the home screen,
// so back always has somewhere to go.
export const unstable_settings = {
  anchor: "index",
};

// Default export is what Expo Router renders for this layout
export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({ Anton_400Regular });

  // On a font error, render anyway with the system font rather than staying on the splash screen
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <CounterProvider>
          <RootContent />
        </CounterProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
