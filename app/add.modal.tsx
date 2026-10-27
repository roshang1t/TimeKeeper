import CounterForm from "@/components/counter.form";
import { defaultColorFor, surfaceFor } from "@/constants/theme";
import { useCounterContext } from "@/context/counterContext";
import { DEFAULT_REMINDERS } from "@/services/notifications";
import { CounterColor, CounterType, RepeatInterval } from "@/types/counter";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "react-native-paper";

type Type = "countup" | "countdown";

export default function AddModalScreen() {
  const router = useRouter();
  const s = surfaceFor(useTheme().dark);
  const { addCounter } = useCounterContext();

  const [name, setName] = useState<string>("");
  const [type, setType] = useState<Type>("countdown"); // Default type
  const [emoji, setEmoji] = useState<string | undefined>();
  const [pickedColor, setPickedColor] = useState<CounterColor | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<number[]>(DEFAULT_REMINDERS);
  const [repeat, setRepeat] = useState<RepeatInterval>("none");
  const [error, setError] = useState<string>("");
  const [openedAt] = useState(() => new Date());

  // Until the user picks one, the color follows the type
  const color = pickedColor ?? defaultColorFor(type);

  // Switching type keeps the chosen date only if it's valid for the new type
  const applyType = useCallback((nextType: Type) => {
    setDate((prev) => {
      const current = new Date();
      if (
        nextType === CounterType.COUNTUP &&
        prev.getTime() > current.getTime()
      ) {
        return current;
      }
      if (
        nextType === CounterType.COUNTDOWN &&
        prev.getTime() < current.getTime()
      ) {
        return current;
      }
      return prev;
    });
    setType(nextType);
    setError("");
  }, []);

  const handleAddCounter = () => {
    if (!name.trim()) {
      setError("Give your counter a name.");
      return;
    }
    if (type === CounterType.COUNTDOWN && date < new Date()) {
      setError("Pick a date in the future for a countdown.");
      return;
    }
    if (type === CounterType.COUNTUP && date > new Date()) {
      setError("Pick a date in the past for a count up.");
      return;
    }

    addCounter({
      name: name.trim(),
      createdAt: date.getTime(),
      type,
      color,
      emoji,
      ...(type === CounterType.COUNTDOWN && { reminders, repeat }),
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: s.background }}
    >
      <CounterForm
        title="New counter"
        type={type}
        onTypeChange={applyType}
        name={name}
        onNameChange={setName}
        emoji={emoji}
        onEmojiChange={setEmoji}
        color={color}
        onColorChange={setPickedColor}
        date={date}
        onDateChange={setDate}
        minimumDate={type === "countdown" ? openedAt : undefined}
        maximumDate={type === "countup" ? new Date() : undefined}
        reminders={reminders}
        onRemindersChange={setReminders}
        repeat={repeat}
        onRepeatChange={setRepeat}
        error={error}
        submitLabel="Create counter"
        onSubmit={handleAddCounter}
        onClose={() => router.back()}
      />
    </KeyboardAvoidingView>
  );
}
