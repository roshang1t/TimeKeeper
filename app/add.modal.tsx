import {
  View,
  StyleSheet,
  Text,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Button, TextInput, useTheme } from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import {
  Gesture,
  Directions,
  GestureDetector,
  GestureHandlerRootView, // This is only needed once in your root layout, remove from here if already in _layout.tsx
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useNavigation } from "expo-router"; // Import useNavigation from expo-router
import { useCounterContext } from "@/context/counterContext";

// Define props for this screen (if you need to pass data)
// For now, let's assume state management for new counter is internal or via context

const BUTTON_WIDTH = 140;
const BUTTON_GAP = 5;
const LEFT_POSITION = 0;
const RIGHT_POSITION = BUTTON_WIDTH;

export default function AddModalScreen() {
  // Renamed to AddModalScreen
  const navigation = useNavigation(); // Use useNavigation hook

  const [newCounterName, setNewCounterName] = useState<string>("");
  const [type, setType] = useState<"countup" | "countdown">("countup"); // Default type
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [mode, setMode] = useState<"date" | "time">("date"); // Specify modes
  const [show, setShow] = useState(false);
  const { addCounter } = useCounterContext();

  // Shared value for the slider's translateX position
  const sliderTranslateX = useSharedValue(LEFT_POSITION);

  useEffect(() => {
    if (type === "countup") {
      sliderTranslateX.value = withTiming(LEFT_POSITION, {
        duration: 200,
        easing: Easing.linear,
      });
    } else {
      sliderTranslateX.value = withTiming(RIGHT_POSITION, {
        duration: 200,
        easing: Easing.linear,
      });
    }
  }, [type]);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(false);
    if (event.type === "set" && selectedDate) {
      const newSelection = selectedDate;
      const previousDate = date || new Date();
      let mergedDate: Date;
      if (mode === "date") {
        mergedDate = new Date(previousDate);
        mergedDate.setFullYear(newSelection.getFullYear());
        mergedDate.setMonth(newSelection.getMonth());
        mergedDate.setDate(newSelection.getDate());
      } else {
        mergedDate = new Date(previousDate);
        mergedDate.setHours(newSelection.getHours());
        mergedDate.setMinutes(newSelection.getMinutes());
        mergedDate.setSeconds(newSelection.getSeconds());
      }
      setDate(mergedDate);
    } else if (event.type === "dismissed") {
      setShow(false);
      setDate(undefined);
    }
  };

  const showMode = (currentMode: "date" | "time") => {
    // Specify modes
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };
  const theme = useTheme();

  const handleFlingDirection = (direction: "left" | "right") => {
    if (direction === "right") {
      setType("countup");
      sliderTranslateX.value = withTiming(LEFT_POSITION, {
        duration: 200,
        easing: Easing.linear,
      });
    } else if (direction === "left") {
      setType("countdown");
      sliderTranslateX.value = withTiming(RIGHT_POSITION, {
        duration: 200,
        easing: Easing.linear,
      });
    }
  };

  const flingRightGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      runOnJS(handleFlingDirection)("right");
    });

  const flingLeftGesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      runOnJS(handleFlingDirection)("left");
    });

  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: sliderTranslateX.value }],
    };
  });

  const handleAddCounter = () => {
    if (!newCounterName.trim()) {
      // This now catches "", " ", "   ", "\t\n", etc.
      alert("Please enter a name for your counter."); // Using alert() as you indicated
      return;
    }
    addCounter({
      name: newCounterName.trim(),
      createdAt: date ? date.getTime() : Date.now(), // Use selected date or current time
      type: type,
    });
    // After adding, dismiss the modal
    navigation.goBack();
  };

  const onClose = () => {
    setDate(undefined);
    navigation.goBack(); // Dismiss the modal using navigation
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose(); // Call your onClose logic
        return true; // Prevent default back button behavior
      }
    );
    return () => backHandler.remove();
  }, [onClose]);

  return (
    <LinearGradient
      colors={
        type === "countdown" ? ["#E0E0E0", "#4285F4"] : ["#FEC9CE", "#FF96A3"]
      }
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      // Apply modal styles here directly to the content wrapper
      style={[styles.addgradient, styles.modalContentWrapper]} // Add modalContentWrapper
    >
      <GestureDetector
        gesture={Gesture.Simultaneous(flingRightGesture, flingLeftGesture)}
      >
        <View collapsable={false} style={styles.innerContentContainer}>
          <Text style={[styles.modalTitle, { color: "#000" }]}>
            Add New Counter
          </Text>

          <View style={styles.topBarContainer}>
            <Animated.View
              style={[
                styles.sliderBackground,
                animatedSliderStyle,
                {
                  backgroundColor: type === "countdown" ? "#E0E0E0" : "#ff96a3",
                },
              ]}
            />

            <Button
              labelStyle={styles.buttonLabel}
              onPress={() => setType("countup")}
              style={[styles.topbtn, styles.transparentButton]}
            >
              Countup
            </Button>

            <Button
              labelStyle={styles.buttonLabel}
              onPress={() => setType("countdown")}
              style={[styles.topbtn, styles.transparentButton]}
            >
              Countdown
            </Button>
          </View>

          <TextInput
            placeholder="Set Name"
            placeholderTextColor="#000"
            textColor="#000"
            onChangeText={setNewCounterName}
            underlineColor="#000"
            activeUnderlineColor="#000"
            mode="flat"
            style={[styles.modalInput, { backgroundColor: "" }]}
          />
          <Button
            style={[
              styles.modalButton,
              {
                backgroundColor: type === "countdown" ? "#E0E0E0" : "#ff96a3",
              },
            ]}
            labelStyle={styles.buttonLabel}
            mode="elevated"
            elevation={5}
            onPress={showDatepicker}
          >
            {date ? date.toLocaleString() : "Select Date"}
          </Button>
          <Button
            style={[
              styles.modalButton,
              {
                marginTop: 10,
                backgroundColor: type === "countdown" ? "#E0E0E0" : "#ff96a3",
              },
            ]}
            labelStyle={styles.buttonLabel}
            mode="elevated"
            elevation={5}
            onPress={showTimepicker}
          >
            Change Time
          </Button>

          {show && (
            <DateTimePicker
              value={date ? date : new Date()}
              mode={mode}
              is24Hour={false}
              display="spinner"
              onChange={onChange}
              minimumDate={type === "countup" ? undefined : new Date()}
              maximumDate={type === "countup" ? new Date() : undefined}
            />
          )}

          <View style={styles.modalButtonRow}>
            <Button
              mode="elevated"
              onPress={onClose} // Use onClose to dismiss
              style={[
                styles.modalButton,
                {
                  backgroundColor: type === "countdown" ? "#E0E0E0" : "#ff96a3",
                },
              ]}
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
            <Button
              mode="elevated"
              onPress={handleAddCounter}
              style={[
                styles.modalButton,
                {
                  backgroundColor: type === "countdown" ? "#E0E0E0" : "#ff96a3",
                },
              ]}
              labelStyle={styles.buttonLabel}
            >
              Add
            </Button>
          </View>
        </View>
      </GestureDetector>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  addgradient: {
    // This style is now applied to the main modal content container
    flex: 1, // Will expand to fill the available space provided by `modalContentWrapper`
    justifyContent: "center",
    width: "100%", // Will take 100% of `modalContentWrapper`'s width
    borderRadius: 16,
    padding: 30,
    gap: 15,
  },
  modalContentWrapper: {
    flex: 1, // This outer wrapper expands to fill the entire screen, allowing for centering
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally

    paddingVertical: 40,
  },
  // Remove modalContainer style as it was for the native Modal, not this screen
  // modalContainer: {
  //   flex: 1,
  //   margin: 20,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   borderRadius: 25,
  //   backgroundColor: "transparent",
  // },
  innerContentContainer: {
    // This is now your actual modal content, without the gradient
    flex: 1, // Ensure it expands within the gradient
    justifyContent: "center",
    width: "100%",
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Roboto-Bold",
    fontSize: 15,
  },
  modalInput: { marginBottom: 25 },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    gap: 60,
  },
  modalButton: {
    minWidth: 110,
    borderRadius: 8,
  },
  buttonLabel: {
    color: "#000",
    fontSize: 15,
  },
  topBarContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
    gap: BUTTON_GAP,
    position: "relative",
    borderRadius: 8,
    padding: 5,
  },
  sliderBackground: {
    position: "absolute",
    height: "100%",
    width: BUTTON_WIDTH + 10,
    backgroundColor: "#FF96A3",
    borderRadius: 15,
    left: 5,
    top: 5,
    elevation: 1,
  },
  topbtn: {
    width: BUTTON_WIDTH,
    padding: 5,
    borderRadius: 30,
    zIndex: 1,
  },
  transparentButton: {
    backgroundColor: "transparent",
  },
  selectedDateText: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Roboto-Bold",
  },
});
