"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "cilbs-theme";
/** Pre-rename key, read once so a saved preference survives the rebrand. */
const LEGACY_STORAGE_KEY = "hypero-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Hydrate from localStorage if a previous choice exists. Otherwise the
  // site stays in its default light theme — we deliberately do **not**
  // mirror the system colour scheme so the marketing surface looks the
  // same for every visitor on first paint. Users who want dark can flip
  // the toggle in the navbar; that choice is persisted.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY)) as Theme | null;
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
      return;
    }
    // The pre-paint script in the root layout may have set the class from a
    // value written by an older build; trust the DOM as a fallback so the
    // toggle icon never disagrees with what's on screen.
    if (document.documentElement.classList.contains("dark")) {
      setThemeState("dark");
    }
  }, []);

  // Sync html class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
