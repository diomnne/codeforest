"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { TimeOfDay } from "@/lib/types";
import Header from "./Header";

const TimeOfDayContext = createContext<TimeOfDay>("day");

export function useTimeOfDay(): TimeOfDay {
  return useContext(TimeOfDayContext);
}

export const THEME_STORAGE_KEY = "gh-forest-theme";

export default function AppShell({ children }: { children: ReactNode }) {
  const timeOfDay = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    getServerTheme,
  );
  useEffect(() => {
    document.documentElement.dataset.theme = timeOfDay;
  }, [timeOfDay]);

  const change = useCallback((next: TimeOfDay) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      memoryTheme = next;
    }
    emitThemeChange();
  }, []);

  return (
    <TimeOfDayContext.Provider value={timeOfDay}>
      <Header timeOfDay={timeOfDay} onTimeOfDayChange={change} />
      {children}
    </TimeOfDayContext.Provider>
  );
}


let memoryTheme: TimeOfDay = "day";

const listeners = new Set<() => void>();

function subscribeTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function emitThemeChange() {
  for (const listener of listeners) listener();
}

function readStoredTheme(): TimeOfDay {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "night" || stored === "day") return stored;
  } catch {
    return memoryTheme;
  }
  return memoryTheme;
}

function getServerTheme(): TimeOfDay {
  return "day";
}
