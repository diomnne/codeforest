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

/** Read the current day/night setting from any client component below AppShell. */
export function useTimeOfDay(): TimeOfDay {
  return useContext(TimeOfDayContext);
}

export const THEME_STORAGE_KEY = "gh-forest-theme";

/**
 * Owns the day/night setting for the whole page: the header toggles it, the
 * scene reads it through context, and `data-theme` on <html> drives the UI
 * tokens so the chrome changes with the sky rather than following the OS
 * preference.
 *
 * The choice is persisted, because navigating home remounts this component and
 * would otherwise snap a night-mode visitor back to day. `ThemeScript` in the
 * root layout applies the stored value before first paint, so there is no
 * flash of the wrong theme on load.
 *
 * Context rather than props because the children are composed on the server —
 * a server component can render `<AppShell>` with server-rendered children and
 * still have the client subtree pick the value up.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  // Read through useSyncExternalStore so the server snapshot ("day") matches
  // the prerendered markup while the client picks up the stored value — the
  // supported way to read an external source without a hydration mismatch.
  // The pre-paint script means the *visual* theme is correct either way.
  const timeOfDay = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    getServerTheme,
  );

  // The DOM attribute is already correct on first load (the script sets it);
  // this keeps it in step with later toggles.
  useEffect(() => {
    document.documentElement.dataset.theme = timeOfDay;
  }, [timeOfDay]);

  const change = useCallback((next: TimeOfDay) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). Fall back
      // to the in-memory value so the toggle still works for this page.
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

/* ---- theme store ------------------------------------------------------- */

/** Fallback when localStorage is unavailable, so the toggle still functions. */
let memoryTheme: TimeOfDay = "day";

const listeners = new Set<() => void>();

function subscribeTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keep other tabs in step.
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

/** Matches what the markup is prerendered with. */
function getServerTheme(): TimeOfDay {
  return "day";
}
