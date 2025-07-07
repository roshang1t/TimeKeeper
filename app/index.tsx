import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  // Added for loading state
} from "react-native";
import {
  useTheme,
  Text,
  IconButton,
  Appbar,
  SegmentedButtons,
} from "react-native-paper";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns"; // For formatting the creation date
import { useThemeContext } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import AddModal from "@/components/add.modal";

// Keep splash screen visible while fonts load or data loads
SplashScreen.preventAutoHideAsync();

// --- Counter Interface (Revised) ---
export interface Counter {
  id: string;
  name: string;
  createdAt: number; // Timestamp (milliseconds since epoch) when created
  isArchived: boolean; // For Current/Past tabs
  hasNotification?: boolean; // Optional: for the bell icon
  type: "countdown" | "countup";
  completed: boolean;
}

// --- AsyncStorage Key ---
const STORAGE_KEY = "@days_since_app_data_v2"; // Use versioned key

// --- Main App Component ---

type theme = "light" | "dark" | "system";

export default function Index() {
  const { toggleTheme, setTheme } = useThemeContext();
  const theme = useTheme(); // Access theme colors
  const [counters, setCounters] = useState<Counter[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCounterName, setNewCounterName] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Track initial data load
  const [currentView, setCurrentView] = useState<"current" | "past">("current"); // State for tabs
  const [tick, setTick] = useState(0); // State to force updates for elapsed time
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedCounter, setSelectedCounter] = useState<Counter>(counters[0]);
  const [type, setType] = useState<"countdown" | "countup">("countup");

  useEffect(() => {
    const themesetter = async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (theme) setTheme(theme as theme);
    };
    themesetter();
    setDate(undefined);
  }, []);

  // --- Font Loading ---
  const [loaded, error] = useFonts({
    "Roboto-Regular": require("@/assets/fonts/roboto.ttf"),
    "Roboto-Bold": require("@/assets/fonts/boldonse.ttf"), // Ensure this path is correct
    "my-font": require("@/assets/fonts/myfont.ttf"),
    "bung-ee": require("@/assets/fonts/bungee.ttf"), // Ensure this path is correct
  });

  // --- Load Counters from Storage ---
  useEffect(() => {
    const loadCounters = async () => {
      try {
        const storedCounters = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedCounters !== null) {
          const parsedCounters: Partial<Counter>[] = JSON.parse(storedCounters);
          const correctedCounters: Counter[] = parsedCounters.map(
            (c, index) => ({
              id: c.id || `${Date.now()}-${index}`,
              name: c.name || "Unnamed Counter",
              createdAt: c.createdAt || Date.now(),
              isArchived: c.isArchived === true, // Ensure boolean
              hasNotification: c.hasNotification === true, // Ensure boolean
              type: c.type || "countup",
              completed: c.completed || false,
            })
          );
          setCounters(correctedCounters);
        }
      } catch (e) {
        console.error("Failed to load counters.", e);
        Alert.alert("Error", "Could not load saved counters.");
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadCounters();
  }, []);

  // --- Hide Splash Screen ---
  useEffect(() => {
    if ((loaded || error) && isDataLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isDataLoaded]);

  // --- Save Counters to Storage ---
  useEffect(() => {
    if (!isDataLoaded) {
      return;
    }
    const saveCounters = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
      } catch (e) {
        console.error("Failed to save counters.", e);
      }
    };
    saveCounters();
  }, [counters, isDataLoaded]);

  // --- Global Timer for Live Elapsed Time Updates ---
  useEffect(() => {
    // Only run the timer if there are non-archived counters that are less than a day old
    const activeTimeCounters = counters.filter(
      (c) => !c.isArchived && Date.now() - c.createdAt < 24 * 60 * 60 * 1000
    );
    if (activeTimeCounters.length === 0) {
      // console.log("No active time counters, stopping timer.");
      return; // No need for a timer if only days are shown or only archived items exist
    }
    // console.log("Active time counters found, starting timer.");

    const intervalId = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000); // Update every second

    // Cleanup function
    return () => {
      // console.log("Cleaning up timer.");
      clearInterval(intervalId);
    };
    // Rerun when counters change, or when view changes (to potentially stop/start timer if view switches to/from 'Past')
  }, [counters, currentView]);

  // --- Filtered Counters for Display ---
  const displayedCounters = useMemo(() => {
    // console.log(`Filtering counters for view: ${currentView}`);
    // console.log(tick);
    return counters.filter((c) =>
      currentView === "current" ? !c.isArchived : c.isArchived
    );
  }, [counters, currentView]);

  // --- Action Handlers ---
  const handleAddCounter = () => {
    if (newCounterName.trim() === "") {
      Alert.alert("Missing Name", "Please enter a name for the counter.");
      return;
    }

    // This line now correctly uses the picked date/time if 'date' has a value,
    // otherwise it falls back to the current time.
    const creationTime = date ? date.getTime() : Date.now();
    console.log(date?.toDateString());

    const newCounter: Counter = {
      id: Date.now().toString(), // Consider a more robust ID like UUID
      name: newCounterName.trim(),
      createdAt: creationTime, // Use the determined time
      isArchived: false,
      hasNotification: false, // Default value
      type: type,
      completed: false,
    };
    setCounters((prevCounters) => [newCounter, ...prevCounters]);
    setNewCounterName("");
    setDate(undefined); // <-- Reset date state back to undefined after adding
    setIsModalVisible(false);
    setType("countup");
  };

  const handleDeleteCounter = (id: string) => {
    const counterToDelete = counters.find((c) => c.id === id);
    Alert.alert(
      "Delete Counter",
      `Are you sure you want to delete "${
        counterToDelete?.name || "this counter"
      }"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCounters((prevCounters) =>
              prevCounters.filter((counter) => counter.id !== id)
            );
          },
        },
      ]
    );
  };

  const handleArchiveToggle = (id: string) => {
    const targetCounter = counters.find((c) => c.id === id);
    if (!targetCounter || targetCounter.completed === true) return;

    const nextIsArchived = !targetCounter.isArchived;
    setCounters((prevCounters) =>
      prevCounters.map((counter) =>
        counter.id === id ? { ...counter, isArchived: nextIsArchived } : counter
      )
    );
    Alert.alert(
      nextIsArchived ? "Archived" : "Unarchived",
      `"${targetCounter.name}" moved to ${nextIsArchived ? "Past" : "Current"}.`
    );
  };

  const handleComplete = (id: string) => {
    const targetCounter = counters.find((c) => c.id === id);
    if (!targetCounter) return;
    setCounters((prevCounters) =>
      prevCounters.map((counter) =>
        counter.id === id && counter.completed === false
          ? { ...counter, isArchived: true, completed: true }
          : counter
      )
    );
    Alert.alert(`"${targetCounter.name}" moved to ${"Past"}.`);
  };

  const router = useRouter();

  const onClose = () => {
    setDate(undefined);
    setIsModalVisible(false);
  };

  const calculateCountup = (elapsedMs: number, baseStyle: any) => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    let displayValue: string | number;
    let displayLabel: string;
    let isDaysView = false;

    if (totalDays > 0) {
      displayValue = totalDays;
      displayLabel = totalDays === 1 ? "DAY SINCE" : "DAYS SINCE";
      isDaysView = true;
      baseStyle = styles.daysNumber; // Switch to Days style
    } else if (totalHours >= 1) {
      displayValue = totalHours;
      displayLabel = "HOURS SINCE";
    } else if (totalMinutes >= 1) {
      displayValue = totalMinutes;
      displayLabel = "MINUTES SINCE";
    } else {
      displayValue = totalSeconds;
      displayLabel = "SECONDS SINCE";
    }

    return {
      displayLabel,
      displayValue,
      isDaysView,
      remainingSeconds: 1,
    };
  };

  const calculateCountdown = (forthcommingMs: number, baseStyle: any) => {
    const remainingSeconds = Math.floor(forthcommingMs / 1000);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingDays = Math.floor(remainingHours / 24);

    let displayValue: string | number;
    let displayLabel: string;
    let isDaysView = false;

    if (remainingDays > 0) {
      displayValue = remainingDays;
      displayLabel = remainingDays === 1 ? "DAY TO" : "DAYS TO";
      isDaysView = true;
      baseStyle = styles.daysNumber; // Switch to Days style
    } else if (remainingHours >= 1) {
      displayValue = remainingHours;
      displayLabel = "HOURS TO";
    } else if (remainingMinutes >= 1) {
      displayValue = remainingMinutes;
      displayLabel = "MINUTES TO";
    } else {
      displayValue = remainingSeconds;
      displayLabel = "SECONDS TO";
    }

    return {
      displayLabel,
      displayValue,
      isDaysView,
      remainingSeconds,
    };
  };

  // --- Render Item for FlatList ---
  const renderCounterItem = useCallback(
    ({ item }: { item: Counter }) => {
      const now = Date.now();
      const elapsedMs = Math.max(0, now - item.createdAt);
      const forthcommingMs = Math.max(0, item.createdAt - now);

      let baseStyle = styles.hoursMinutesSecondsNumber; // Default to H/M/S style

      const { displayLabel, displayValue, isDaysView, remainingSeconds } =
        item.type === "countdown"
          ? calculateCountdown(forthcommingMs, baseStyle)
          : calculateCountup(elapsedMs, baseStyle);

      const formattedDate = format(new Date(item.createdAt), "MMM dd, yyyy"); // Corrected format string

      // Get font size and line height from the determined base style

      if (
        item.type === "countdown" &&
        remainingSeconds <= 0 &&
        !item.completed
      ) {
        setTimeout(() => {
          handleComplete(item.id);
        }, 0);
        // Use runOnJS if this is inside a reanimated worklet, otherwise just handleComplete(item.id);
      }

      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedCounter(item);
            router.push({
              pathname: "/details",
              params: {
                creation: item.createdAt,
                name: item.name,
                id: item.id.toString(),
                type: item.type.toString(),
                completed: item.completed.toString(),
              },
            });
          }} // Example press
          onLongPress={() => handleArchiveToggle(item.id)} // Long press to archive/unarchive
          delayLongPress={1000}
        >
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={
                item.type === "countdown"
                  ? ["#E0E0E0", "#4285F4"]
                  : ["#FEC9CE", "#FF96A1"]
              }
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.gradient}
            >
              {!item.completed ? (
                <View style={styles.cardContent}>
                  {/* Left Side */}
                  <View style={styles.leftColumn}>
                    <Text
                      style={[
                        // Apply the base style first (contains fontFamily)
                        baseStyle,
                        // Override only specific properties if needed, but fontSize/lineHeight are already in baseStyle
                        // { fontSize: valueFontSize, lineHeight: valueLineHeight },
                      ]}
                      // Use tick in key ONLY if it's H/M/S view and ONLY if item is not archived
                      key={
                        !isDaysView && !item.isArchived
                          ? `time-${tick}`
                          : `static-${item.id}`
                      }
                    >
                      {displayValue}
                    </Text>
                    <Text style={styles.daysLabel}>{displayLabel}</Text>
                  </View>

                  {/* Right Side */}
                  <View style={styles.rightColumn}>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                    <Text
                      style={styles.nameText}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                  </View>

                  {/* Optional: Notification Bell Icon */}
                  {item.hasNotification && (
                    <IconButton
                      icon="bell-outline"
                      size={18}
                      style={styles.notificationIcon}
                      iconColor={"rgba(0, 0, 0, 0.6)"}
                    />
                  )}

                  {/* Trash Icon */}
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    onPress={() => handleDeleteCounter(item.id)}
                    iconColor={theme.colors.onPrimary}
                    style={styles.deleteIcon}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.cardContent,
                    {
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      maxHeight: 120,
                      paddingVertical: 0,
                      // paddingHorizontal: 0,
                      // padding: 5,
                      // position: "static",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hoursMinutesSecondsNumber,
                      {
                        fontSize: 40,
                        lineHeight: 50,
                        textDecorationLine: "line-through",
                      },
                    ]}
                  >
                    {item.name.substring(0, 10)}
                  </Text>
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    onPress={() => handleDeleteCounter(item.id)}
                    iconColor={theme.colors.onPrimary}
                    style={styles.deleteIcon}
                  />
                  <Text
                    style={[styles.hoursMinutesSecondsNumber, { fontSize: 30 }]}
                  >
                    completed
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      );
    },
    [theme.colors.error, tick] // Include tick to update H/M/S views
  );

  // --- Main Render ---
  if (!loaded || !isDataLoaded) {
    // Keep returning null or a minimal loading indicator while splash screen is visible
    // Avoid rendering the main layout until ready to prevent flashes
    return null;
  }
  if (error) {
    console.error("Font loading error:", error);
    // Handle font error more gracefully if needed
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme?.colors?.background || "#fff" },
        ]}
      >
        <View style={styles.centeredError}>
          <Text
            style={{ color: theme?.colors?.error || "red", marginBottom: 10 }}
          >
            Error loading application assets.
          </Text>
          <Text style={{ color: theme?.colors?.onSurface || "#000" }}>
            Please restart the app. Font: {error.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Custom Header */}
      <Appbar.Header
        mode="center-aligned"
        elevated={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Appbar.Action icon="theme-light-dark" onPress={() => toggleTheme()} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="plus"
          size={28}
          onPress={() => {
            // setDate(undefined); // Reset date when opening modal
            setIsModalVisible(true);
          }}
        />
      </Appbar.Header>

      {/* Current/Past Tabs */}
      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={currentView}
          onValueChange={(value) => setCurrentView(value as "current" | "past")}
          style={styles.segmentButtons}
          density="medium"
          buttons={[
            {
              value: "current",
              label: "Current",
              style:
                currentView === "current"
                  ? styles.segmentSelected
                  : styles.segmentUnselected,
              labelStyle:
                currentView === "current"
                  ? styles.segmentSelectedLabel
                  : styles.segmentUnselectedLabel,
            },
            {
              value: "past",
              label: "Past",
              style:
                currentView === "past"
                  ? styles.segmentSelected
                  : styles.segmentUnselected,
              labelStyle:
                currentView === "past"
                  ? styles.segmentSelectedLabel
                  : styles.segmentUnselectedLabel,
            },
          ]}
        />
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={displayedCounters}
          renderItem={
            isModalVisible
              ? () => {
                  return <></>;
                }
              : renderCounterItem
          }
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No counters {currentView === "past" ? "archived" : "yet"}.
              </Text>
              {/* Show loading indicator only during initial load on 'Current' tab */}
              {currentView === "current" && !isDataLoaded && (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" />
              )}
              {/* Show add prompt only after load and if empty on 'Current' tab */}
              {currentView === "current" &&
                isDataLoaded &&
                displayedCounters.length === 0 && (
                  <Text style={styles.emptyText}>Press '+' to add one!</Text>
                )}
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Add New Counter Modal */}

      <AddModal
        isModalVisible={isModalVisible}
        onClose={onClose}
        handleAddCounter={handleAddCounter}
        setNewCounterName={setNewCounterName}
        setType={setType}
        type={type}
        date={date}
        setDate={setDate}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flexGrow: 1, // Use flexGrow instead of flex: 1
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 50, // Add some padding at the bottom
    // marginTop: 60, // Remove fixed marginTop if using flexGrow
  },
  centeredError: {
    // Style for error display
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  segmentContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: "15%",
  },
  segmentButtons: {
    borderRadius: 10,
  },
  segmentSelected: {
    backgroundColor: "#FEC9CE",
    // borderColor: "#FEC9CE",
    // borderWidth: 1.5, // Make border slightly thicker
  },
  segmentUnselected: {
    backgroundColor: "transparent",
    // borderColor: "#cccccc",
    // borderWidth: 1.5, // Make border slightly thicker
  },
  segmentSelectedLabel: {
    fontFamily: "Roboto-Regular", // Use bold font
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    // textTransform: "uppercase",
  },
  segmentUnselectedLabel: {
    fontFamily: "Roboto-Regular", // Use regular font
    fontSize: 14,
    color: "#555",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 30,
    paddingTop: 10,
    flexGrow: 1,
  },
  cardContainer: {
    marginVertical: 7,
    borderRadius: 18,
    // backgroundColor: "white",
    // elevation: 1,
  },
  gradient: {
    borderRadius: 18,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    position: "relative",
  },
  leftColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // width: 100,
    maxWidth: 145,
    // flexGrow: 1,
  },
  rightColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "baseline",

    marginBottom: 30,
  },
  // Style for the main number display (Days)
  daysNumber: {
    fontSize: 55,
    fontFamily: "bung-ee", // <<< Uses your custom font
    // fontWeight: "bold", // Fallback if font doesn't load/support weight
    color: "#000",
    lineHeight: 70, // Adjust if font requires different line height
    textAlign: "center",
  },
  // Style for the main number display (Hours, Minutes, Seconds)
  hoursMinutesSecondsNumber: {
    fontSize: 55, // Keep consistent or adjust as needed
    fontFamily: "bung-ee", // <<< Uses your custom font
    // fontWeight: "bold", // Fallback
    color: "#111",
    lineHeight: 70, // Adjust if font requires different line height
    textAlign: "center",
  },
  daysLabel: {
    fontSize: 10,
    fontFamily: "my-font", // Consider a specific font for labels if needed
    color: "#333",
    letterSpacing: 1.2,
    fontWeight: "900",

    marginTop: 4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  dateText: {
    fontSize: 15,
    fontFamily: "Roboto-Regular",
    color: "#555",
    marginBottom: 4,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 20,
    fontFamily: "Roboto-Regular",
    fontWeight: "bold",
    color: "#000",
    lineHeight: 20,
  },
  notificationIcon: {
    position: "absolute",
    top: 5,
    right: 35, // Make space for delete icon
    zIndex: 1,
  },
  deleteIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 1,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 30,
    fontFamily: "my-font", // Use a standard font
    color: "#777",
    marginTop: 15,
    lineHeight: 35,
    fontWeight: "condensedBold",
  },
});
