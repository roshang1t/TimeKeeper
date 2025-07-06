// _layout.tsx (adjust path for ThemeContext if needed)
import React, { useMemo } from "react";
import { Stack } from "expo-router";
import { StatusBar, useColorScheme } from "react-native";
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import your ThemeProvider and the hook
import { ThemeProvider, useThemeContext } from "@/context/ThemeContext"; // Adjust path as needed

// RootLayout definition (renders the actual screen component based on route)
export function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          // animation: "fade",
          contentStyle: { backgroundColor: "#161626" },
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          headerShown: false,
          animation: "flip",
          contentStyle: { backgroundColor: "#161626" },
        }}
      />
    </Stack>
  );
}

// Create an intermediate component to consume the context *inside* the Provider
// This is necessary because PaperProvider needs the theme from the context
function AppContent() {
  // Consume the theme mode from our context
  const { themeMode } = useThemeContext();

  // Define your custom colors for primary/secondary in both modes
  const lightModeColors = {
    primary: "#5DADE2",
    secondary: "lightgrey",
    // Add other light mode overrides if needed
  };
  const darkModeColors = {
    primary: "#85C1E9", // Adjusted blue for dark mode
    secondary: "#424242", // Dark grey for dark mode
    // Add other dark mode overrides if needed
  };

  // Create the React Native Paper theme based on the themeMode from context
  const theme = useMemo(() => {
    // Select the base theme (MD3 Light or Dark)
    const baseTheme = themeMode === "dark" ? MD3DarkTheme : MD3LightTheme;
    // Select the set of custom color overrides
    const customColors =
      themeMode === "dark" ? darkModeColors : lightModeColors;

    // Merge the base theme with your custom color overrides
    return {
      ...baseTheme, // Start with all properties of the base theme
      colors: {
        ...baseTheme.colors, // Include all default colors from the base theme
        ...customColors, // Override with your primary, secondary, etc.
      },
    };
  }, [themeMode]); // Recalculate only when themeMode from context changes

  return (
    // PaperProvider now uses the dynamically generated theme
    <PaperProvider theme={theme}>
      {/* Adjust StatusBar appearance based on the effective theme */}
      <StatusBar
        translucent={true} // Keep your existing status bar settings
        backgroundColor="transparent" // Often needed with translucent
        barStyle={themeMode === "dark" ? "light-content" : "dark-content"}
      />
      {/* Render the actual navigation stack */}
      <RootLayout />
    </PaperProvider>
  );
}

// Default export: The main Layout component for this route segment
export default function Layout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView
        style={{
          flex: 1,
          backgroundColor: "#000",
        }}
      >
        <AppContent />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
