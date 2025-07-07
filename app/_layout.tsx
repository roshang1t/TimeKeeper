import React, { useMemo } from "react";
import { Stack, Slot } from "expo-router"; // Import Slot
import { StatusBar, useColorScheme } from "react-native"; // useColorScheme is not used, can remove if not needed
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemeProvider, useThemeContext } from "@/context/ThemeContext";

// This component will now directly contain the Stack Navigator
function RootContent() {
  const { themeMode } = useThemeContext();

  const lightModeColors = {
    primary: "#5DADE2",
    secondary: "lightgrey",
  };
  const darkModeColors = {
    primary: "#85C1E9",
    secondary: "#424242",
  };

  const theme = useMemo(() => {
    const baseTheme = themeMode === "dark" ? MD3DarkTheme : MD3LightTheme;
    const customColors =
      themeMode === "dark" ? darkModeColors : lightModeColors;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...customColors,
      },
    };
  }, [themeMode]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle={themeMode === "dark" ? "light-content" : "dark-content"}
      />
      {/* The Stack Navigator now lives here directly */}
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            // animation: "slide_from_left",
            contentStyle: { backgroundColor: "#161626" },
          }}
        />
        <Stack.Screen
          name="details"
          options={{
            headerShown: false,
            animation: "none",
            contentStyle: {
              backgroundColor: "#161626",
              // animationDirection: "left",
            },
          }}
        />
      </Stack>
    </PaperProvider>
  );
}

// Default export is what Expo Router renders for this layout
export default function Layout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider>
      <GestureHandlerRootView
        style={{
          flex: 1,
          // You can set a default background here if you like,
          // but Stack.Screen contentStyle is often more specific
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        }}
      >
        <RootContent />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
