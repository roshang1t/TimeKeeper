import { View, Modal, StyleSheet, Text, BackHandler } from "react-native";
import React, { Dispatch, SetStateAction, useState, useEffect } from "react"; // Added useEffect
import { LinearGradient } from "expo-linear-gradient";
import { Button, TextInput, useTheme } from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import {
  Gesture,
  Directions,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";

interface modalprops {
  isModalVisible: boolean;
  handleAddCounter: () => void;
  onClose: () => void;
  setNewCounterName: Dispatch<SetStateAction<string>>;
  setType: Dispatch<SetStateAction<"countup" | "countdown">>;
  type: string;
  date: Date | undefined;
  setDate: Dispatch<SetStateAction<Date | undefined>>;
}

const BUTTON_WIDTH = 140;
const BUTTON_GAP = 5;
const LEFT_POSITION = 0;
const RIGHT_POSITION = BUTTON_WIDTH;

export default function AddModal({
  isModalVisible,
  handleAddCounter,
  onClose,
  setNewCounterName,
  type,
  setType,
  date,
  setDate,
}: modalprops) {
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

  // Shared value for the slider's translateX position
  const sliderTranslateX = useSharedValue(LEFT_POSITION); // Initialize to left button position

  // Update slider position when 'type' state changes (e.g., from direct button press)
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

  const showMode = (currentMode: string) => {
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

  // Helper function for changing type and animating slider position
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

  // Fling gesture for RIGHT direction
  const flingRightGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      runOnJS(handleFlingDirection)("right");
    });

  // Fling gesture for LEFT direction
  const flingLeftGesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      runOnJS(handleFlingDirection)("left");
    });

  // Animated style for the sliding highlight
  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: sliderTranslateX.value }],
    };
  });

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      visible={isModalVisible}
      statusBarTranslucent
      transparent
      onRequestClose={onClose}
      style={[
        styles.modalContainer,
        { backgroundColor: theme.colors.elevation.level2 },
      ]}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LinearGradient
          colors={
            type === "countdown"
              ? ["#E0E0E0", "#4285F4"]
              : ["#FEC9CE", "#FF96A3"]
          }
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.addgradient}
        >
          <GestureDetector
            gesture={Gesture.Simultaneous(flingRightGesture, flingLeftGesture)}
          >
            <View
              collapsable={false}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Text style={[styles.modalTitle, { color: "#000" }]}>
                Add New Counter
              </Text>

              {/* Container for the buttons and the sliding background */}
              <View style={styles.topBarContainer}>
                <Animated.View
                  style={[
                    styles.sliderBackground,
                    animatedSliderStyle,
                    {
                      backgroundColor:
                        type === "countdown" ? "#E0E0E0" : "#ff96a3",
                    },
                  ]}
                />

                {/* The "Countup" button */}
                <Button
                  labelStyle={styles.buttonLabel}
                  onPress={() => setType("countup")}
                  style={[
                    styles.topbtn,
                    styles.transparentButton, // Make button background transparent
                  ]}
                >
                  Countup
                </Button>

                <Button
                  labelStyle={styles.buttonLabel}
                  onPress={() => setType("countdown")}
                  style={[
                    styles.topbtn,
                    styles.transparentButton, // Make button background transparent
                  ]}
                >
                  Countdown
                </Button>
              </View>

              <TextInput
                label="Name"
                textColor="#000"
                onChangeText={setNewCounterName}
                underlineColor="#000"
                activeUnderlineColor="#000"
                mode="flat"
                style={[styles.modalInput, { backgroundColor: "" }]}
                autoFocus
              />
              <Button
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      type === "countdown" ? "#E0E0E0" : "#ff96a3",
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
                    backgroundColor:
                      type === "countdown" ? "#E0E0E0" : "#ff96a3",
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
                  onPress={() => {
                    setDate(undefined);
                    onClose();
                  }}
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        type === "countdown" ? "#E0E0E0" : "#ff96a3",
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
                      backgroundColor:
                        type === "countdown" ? "#E0E0E0" : "#ff96a3",
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
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    // New container for buttons and slider
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
    gap: BUTTON_GAP,
    position: "relative", // Crucial for absolute positioning of slider
    // You might want a background color for the overall bar, e.g., slightly darker #FEC9CE
    // backgroundColor: "#FED9DC", // Slightly darker pink for the base bar
    borderRadius: 8, // Match button borderRadius
    padding: 5, // Small padding around the buttons inside the bar
  },
  sliderBackground: {
    position: "absolute",
    height: "100%", // Match height of topBarContainer
    width: BUTTON_WIDTH + 10, // Width of one button including its padding (adjust if needed)
    backgroundColor: "#FF96A3", // The active color
    borderRadius: 15,
    // Adjust left/top to fit perfectly within topBarContainer's padding
    left: 5, // Half of button gap + padding of topBarContainer
    top: 5, // Half of button gap + padding of topBarContainer
    elevation: 1,
  },
  topbtn: {
    width: BUTTON_WIDTH,
    padding: 5,
    borderRadius: 30,

    zIndex: 1,
  },
  transparentButton: {
    backgroundColor: "transparent", // Make the actual button transparent
  },
  selectedDateText: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Roboto-Bold",
  },
  addgradient: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    borderRadius: 16,
    padding: 30,
    gap: 15,
  },
  modalContainer: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
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
});
