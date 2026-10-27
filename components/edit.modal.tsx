import CounterForm from "@/components/counter.form";
import { defaultColorFor, surfaceFor } from "@/constants/theme";
import { useCounterContext } from "@/context/counterContext";
import { DEFAULT_REMINDERS } from "@/services/notifications";
import { Counter, CounterColor, RepeatInterval } from "@/types/counter";
import { DEFAULT_REPEAT_DAYS } from "@/utils/repeat";
import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform } from "react-native";
import { useTheme } from "react-native-paper";

interface modalProps {
  isVisible: boolean;
  onClose: () => void;
  counter: Counter;
}

// Mount only while open, so every opening starts from the counter's current values.
export default function EditModal({ isVisible, onClose, counter }: modalProps) {
  const isCountdown = counter.type === "countdown";
  const s = surfaceFor(useTheme().dark);

  const [date, setDate] = useState<Date>(new Date(counter.createdAt));
  const [name, setName] = useState<string>(counter.name);
  const [emoji, setEmoji] = useState<string | undefined>(counter.emoji);
  const [color, setColor] = useState<CounterColor>(
    counter.color ?? defaultColorFor(counter.type)
  );
  const [reminders, setReminders] = useState<number[]>(
    counter.reminders ?? DEFAULT_REMINDERS
  );
  const [repeat, setRepeat] = useState<RepeatInterval>(
    counter.repeat ?? "none"
  );
  const [repeatDays, setRepeatDays] = useState(
    counter.repeatDays ?? DEFAULT_REPEAT_DAYS
  );
  const [error, setError] = useState<string>("");
  const [openedAt] = useState(() => new Date());

  const { updateCounter } = useCounterContext();

  function editCounter() {
    if (!name.trim()) {
      setError("Give your counter a name.");
      return;
    }
    const dateChanged = date.getTime() !== counter.createdAt;
    if (dateChanged && isCountdown && date.getTime() <= Date.now()) {
      setError("Pick a date in the future for a countdown.");
      return;
    }

    const updates: Partial<Counter> = { name: name.trim(), emoji, color };
    if (dateChanged) {
      updates.createdAt = date.getTime();
    }
    if (isCountdown) {
      updates.reminders = reminders;
      updates.repeat = repeat;
      updates.repeatDays = repeat === "custom" ? repeatDays : undefined;
    }

    updateCounter(counter.id, updates);
    onClose();
  }

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: s.background }}
      >
        <CounterForm
          title="Edit counter"
          type={counter.type}
          name={name}
          onNameChange={setName}
          emoji={emoji}
          onEmojiChange={setEmoji}
          color={color}
          onColorChange={setColor}
          date={date}
          onDateChange={setDate}
          minimumDate={isCountdown ? openedAt : undefined}
          maximumDate={isCountdown ? undefined : new Date()}
          reminders={reminders}
          onRemindersChange={setReminders}
          repeat={repeat}
          onRepeatChange={setRepeat}
          repeatDays={repeatDays}
          onRepeatDaysChange={setRepeatDays}
          error={error}
          submitLabel="Save changes"
          onSubmit={editCounter}
          onClose={onClose}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}
