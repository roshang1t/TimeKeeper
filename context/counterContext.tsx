import {
  cancelCounterNotifications,
  ensureNotificationPermission,
  resyncAllNotifications,
  scheduleCounterNotifications,
} from "@/services/notifications";
import { Counter, NewCounter } from "@/types/counter";
import { nextOccurrence } from "@/utils/repeat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Set up notification handler for when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = "@my_countdown_app:counters";
// Older builds also saved a copy from the home screen under this key; read it once as a fallback.
const LEGACY_STORAGE_KEY = "@days_since_app_data_v2";
const WIDGET_COUNTER_KEY = "@timekeeper:widgetCounterId";
const LIST_WIDGET_FILTER_KEY = "@timekeeper:listWidgetFilter";

// Which counters the list widget shows
export type ListWidgetFilter = "all" | "upcoming" | "since";

type CounterContextType = {
  counters: Counter[];
  addCounter: (newCounter: NewCounter) => Promise<void>;
  updateCounter: (id: string, updates: Partial<Counter>) => Promise<void>;
  deleteCounter: (id: string) => Promise<void>;
  markCounterCompleted: (counterId: string) => void;
  widgetCounterId: string | null;
  setWidgetCounterId: (id: string | null) => void;
  listWidgetFilter: ListWidgetFilter;
  setListWidgetFilter: (filter: ListWidgetFilter) => void;
};

const CounterContext = createContext<CounterContextType>({
  counters: [],
  addCounter: async () => console.warn("CounterProvider not used!"),
  updateCounter: async () => console.warn("CounterProvider not used!"),
  deleteCounter: async () => console.warn("CounterProvider not used!"),
  markCounterCompleted: () => console.warn("CounterProvider not used!"),
  widgetCounterId: null,
  setWidgetCounterId: () => console.warn("CounterProvider not used!"),
  listWidgetFilter: "all",
  setListWidgetFilter: () => console.warn("CounterProvider not used!"),
});

function normalizeCounter(raw: Partial<Counter>, index: number): Counter {
  const counter: Counter = {
    ...raw,
    id: raw.id || `${Date.now()}-${index}`,
    name: raw.name || "Unnamed Counter",
    createdAt: raw.createdAt || Date.now(),
    isArchived: raw.isArchived === true,
    type: raw.type || "countup",
    completed: raw.completed || false,
  };
  // A repeating countdown whose date passed while the app was closed moves to its next occurrence.
  if (counter.type === "countdown" && counter.repeat && !counter.completed) {
    counter.createdAt = nextOccurrence(counter.createdAt, counter.repeat);
  }
  return counter;
}

export const CounterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [widgetCounterId, setWidgetCounterIdState] = useState<string | null>(
    null
  );
  const [listWidgetFilter, setListWidgetFilterState] =
    useState<ListWidgetFilter>("all");
  const [isReady, setIsReady] = useState(false);

  // Async actions read the latest counters from here instead of a stale closure.
  const countersRef = useRef<Counter[]>([]);
  useEffect(() => {
    countersRef.current = counters;
  }, [counters]);

  // --- Load counters from AsyncStorage on startup ---
  useEffect(() => {
    const loadCounters = async () => {
      try {
        const [stored, legacy, storedWidgetId, storedListFilter] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(LEGACY_STORAGE_KEY),
            AsyncStorage.getItem(WIDGET_COUNTER_KEY),
            AsyncStorage.getItem(LIST_WIDGET_FILTER_KEY),
          ]);
        const raw = stored ?? legacy;
        const loaded = raw
          ? (JSON.parse(raw) as Partial<Counter>[]).map(normalizeCounter)
          : [];
        countersRef.current = loaded;
        setCounters(loaded);
        setWidgetCounterIdState(storedWidgetId);
        if (storedListFilter) {
          setListWidgetFilterState(storedListFilter as ListWidgetFilter);
        }

        // Rebuild the OS schedule from the saved data so stale or missing reminders get fixed.
        resyncAllNotifications(loaded)
          .then((synced) => {
            const idsByCounter = new Map(
              synced.map((c) => [c.id, c.notificationIds])
            );
            setCounters((prev) =>
              prev.map((c) =>
                idsByCounter.has(c.id)
                  ? {
                      ...c,
                      notificationId: undefined,
                      todayNotificationId: undefined,
                      notificationIds: idsByCounter.get(c.id),
                    }
                  : c
              )
            );
          })
          .catch((e) => console.error("Failed to resync notifications", e));
      } catch (e) {
        console.error("Failed to load counters from storage", e);
      } finally {
        setIsReady(true); // Mark as ready after attempting to load
      }
    };
    loadCounters();
  }, []);

  // --- Save counters to AsyncStorage whenever they change ---
  useEffect(() => {
    if (isReady) {
      // Only save once initial load is complete
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(counters)).catch((e) =>
        console.error("Failed to save counters to storage", e)
      );
    }
  }, [counters, isReady]);

  const replaceCounter = useCallback((next: Counter) => {
    setCounters((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  }, []);

  // Countdowns either complete, or roll to their next occurrence if they repeat.
  const markCounterCompleted = useCallback(
    (counterId: string) => {
      const current = countersRef.current.find((c) => c.id === counterId);
      if (!current || current.completed) return;

      if (current.repeat && current.repeat !== "none") {
        const nextTarget = nextOccurrence(current.createdAt, current.repeat);
        // Repeating notification triggers keep firing on their own, so only the date moves.
        if (nextTarget !== current.createdAt) {
          replaceCounter({ ...current, createdAt: nextTarget });
        }
        return;
      }

      cancelCounterNotifications(current);
      replaceCounter({
        ...current,
        completed: true,
        isArchived: true,
        notificationIds: [],
      });
    },
    [replaceCounter]
  );

  // Handle incoming notifications
  useEffect(() => {
    const handleData = (data: Record<string, unknown> | undefined) => {
      // Only the final 'exact time' notification completes a countdown
      if (data?.counterId && data.notificationType === "exactTime") {
        markCounterCompleted(String(data.counterId));
      }
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => handleData(notification.request.content.data)
    );
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) =>
        handleData(response.notification.request.content.data)
      );
    Notifications.getLastNotificationResponseAsync().then((response) =>
      handleData(response?.notification.request.content.data)
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [markCounterCompleted]);

  const addCounter = useCallback(async (newCounterData: NewCounter) => {
    const counter: Counter = {
      id: String(Date.now()),
      isArchived: false,
      completed: false,
      startedAt: Date.now(),
      ...newCounterData,
    };
    if (counter.type === "countdown") {
      await ensureNotificationPermission();
    }
    counter.notificationIds = await scheduleCounterNotifications(counter);
    setCounters((prev) => [...prev, counter]);
  }, []);

  // Applies the updates and replaces the counter's scheduled reminders to match.
  const updateCounter = useCallback(
    async (id: string, updates: Partial<Counter>) => {
      const current = countersRef.current.find((c) => c.id === id);
      if (!current) return;

      const next: Counter = { ...current, ...updates };
      await cancelCounterNotifications(current);
      if (next.type === "countdown" && !next.isArchived) {
        await ensureNotificationPermission();
      }
      next.notificationIds = await scheduleCounterNotifications(next);
      replaceCounter(next);
    },
    [replaceCounter]
  );

  const deleteCounter = useCallback(async (id: string) => {
    const current = countersRef.current.find((c) => c.id === id);
    if (current) {
      await cancelCounterNotifications(current);
    }
    setCounters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const setWidgetCounterId = useCallback((id: string | null) => {
    setWidgetCounterIdState(id);
    (id
      ? AsyncStorage.setItem(WIDGET_COUNTER_KEY, id)
      : AsyncStorage.removeItem(WIDGET_COUNTER_KEY)
    ).catch((e) => console.error("Failed to save widget counter", e));
  }, []);

  const setListWidgetFilter = useCallback((filter: ListWidgetFilter) => {
    setListWidgetFilterState(filter);
    AsyncStorage.setItem(LIST_WIDGET_FILTER_KEY, filter).catch((e) =>
      console.error("Failed to save list widget filter", e)
    );
  }, []);

  const contextValue = useMemo(
    () => ({
      counters,
      addCounter,
      updateCounter,
      deleteCounter,
      markCounterCompleted,
      widgetCounterId,
      setWidgetCounterId,
      listWidgetFilter,
      setListWidgetFilter,
    }),
    [
      counters,
      addCounter,
      updateCounter,
      deleteCounter,
      markCounterCompleted,
      widgetCounterId,
      setWidgetCounterId,
      listWidgetFilter,
      setListWidgetFilter,
    ]
  );

  // The native splash screen stays visible while loading (hidden by the home screen)
  if (!isReady) {
    return null;
  }

  return (
    <CounterContext.Provider value={contextValue}>
      {children}
    </CounterContext.Provider>
  );
};

export const useCounterContext = () => useContext(CounterContext);
