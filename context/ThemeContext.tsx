// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the shape of the context data
type ThemeContextType = {
  themeMode: "light" | "dark";
  isSystemTheme: boolean; // Track if we are using system theme or manual override
  toggleTheme: () => void; // Function to manually toggle
  setTheme: (mode: "light" | "dark" | "system") => void; // Function to set specific mode or back to system
};

// Create the context with default values (these will be replaced by the Provider)
const ThemeContext = createContext<ThemeContextType>({
  themeMode: "light",
  isSystemTheme: true,
  toggleTheme: () => console.warn("ThemeProvider not used!"),
  setTheme: () => console.warn("ThemeProvider not used!"),
});

// Create the Provider component
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); // 'light', 'dark', or null
  // State to hold the manually selected theme ('light', 'dark') or null if following system
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);

  // Determine the effective theme mode based on manual override or system setting
  const themeMode = useMemo(() => {
    if (manualTheme) {
      return manualTheme; // Use manual override if set
    }
    return systemScheme || "light"; // Otherwise, use system theme (defaulting to light if system is null)
  }, [manualTheme, systemScheme]);

  // Flag to easily check if the current theme is system-driven
  const isSystemTheme = !manualTheme; // True if manualTheme is null

  // Function to toggle manually between light and dark
  // It calculates the *next* manual state based on the *current effective* state
  const toggleTheme = () => {
    setManualTheme((prevManualState) => {
      // Determine current effective mode to decide the *next* manual mode
      const currentEffectiveMode = prevManualState || systemScheme || "light";
      const theme = currentEffectiveMode === "light" ? "dark" : "light";
      AsyncStorage.setItem("theme", theme);
      return theme;
    });
  };

  // Function to explicitly set the theme or reset to system default
  const setTheme = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      setManualTheme(null); // Clear manual override, start following system again
    } else {
      setManualTheme(mode); // Set specific manual theme
    }
  };

  // Memoize the context value to prevent unnecessary re-renders of consumers
  // when the provider itself re-renders but the values haven't changed
  const contextValue = useMemo(
    () => ({
      themeMode,
      isSystemTheme,
      toggleTheme,
      setTheme,
    }),
    [themeMode, isSystemTheme]
  ); // Dependencies: update context value if these change

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy consumption in components, avoids importing useContext and ThemeContext everywhere
export const useThemeContext = () => useContext(ThemeContext);
