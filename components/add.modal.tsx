import { View, Modal, StyleSheet, Text, BackHandler } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Button, TextInput, useTheme } from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface modalprops {
  isModalVisible: boolean;
  handleAddCounter: () => void;
  onClose: () => void;
  setNewCounterName: Dispatch<SetStateAction<string>>;
}

export default function AddModal({
  isModalVisible,
  handleAddCounter,
  onClose,
  setNewCounterName,
}: modalprops) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

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
  return (
    <Modal
      animationType="fade"
      // hardwareAccelerated

      visible={isModalVisible}
      statusBarTranslucent
      transparent
      onRequestClose={onClose}
      style={[
        styles.modalContainer,
        { backgroundColor: theme.colors.elevation.level2 },
      ]}
    >
      <LinearGradient
        colors={["#FEC9CE", "#FF96A3"]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.addgradient}
      >
        <Text
          //   variant="headlineSmall"
          style={[styles.modalTitle, { color: "#000" }]}
        >
          Add New Counter
        </Text>
        <TextInput
          label="Name"
          outlineColor="#000"
          selectionColor="red"
          // cursorColor="#fff"
          activeOutlineColor="#000"
          // value={newCounterName}
          onChangeText={setNewCounterName}
          mode="outlined"
          style={[
            styles.modalInput,
            { backgroundColor: "#FF96A3", borderRadius: 40 },
          ]}
          autoFocus
        />
        <Button
          style={styles.modalButton}
          labelStyle={styles.buttonLabel}
          mode="outlined"
          onPress={showDatepicker}
        >
          Show Date picker
        </Button>
        <Button
          style={[styles.modalButton, { marginTop: 10 }]}
          labelStyle={styles.buttonLabel}
          mode="outlined"
          onPress={showTimepicker}
        >
          Show Time picker
        </Button>
        <Text style={[styles.selectedDateText, { color: "#000" }]}>
          {date ? date.toLocaleString() : "Select new date"}
        </Text>

        {show && (
          <DateTimePicker
            value={date ? date : new Date()}
            mode={mode}
            is24Hour={false}
            display="spinner"
            onChange={onChange}
          />
        )}

        <View style={styles.modalButtonRow}>
          <Button
            mode="elevated"
            onPress={() => {
              onClose();
            }}
            style={[styles.modalButton, { backgroundColor: "#ff96a3" }]}
            labelStyle={styles.buttonLabel}
          >
            Cancel
          </Button>
          <Button
            mode="elevated"
            onPress={handleAddCounter}
            style={[styles.modalButton, { backgroundColor: "#ff96a3" }]}
            // disabled={newCounterName.trim() === ""}
            labelStyle={styles.buttonLabel}
          >
            Add
          </Button>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  selectedDateText: {
    textAlign: "center",
    fontSize: 14,
    // color is set dynamically using theme
    marginVertical: 15, // Add some space around it
  },
  addgradient: {
    flex: 1,
    justifyContent: "center",

    width: "100%",
    // height: "10%",
    borderRadius: 16,
    padding: 30,
  },
  modalContainer: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    // backgroundColor: "white",
  }, // Ensure background
  modalTitle: {
    marginBottom: 25,
    textAlign: "center",
    fontFamily: "Roboto-Bold",
    fontSize: 15,
  },
  modalInput: { marginBottom: 25 },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 15,
  },
  modalButton: {
    minWidth: 110,
    borderRadius: 8,
    backgroundColor: "#ff96a3",
  },
  buttonLabel: {
    color: "#000",
    fontSize: 14,
  },
});
