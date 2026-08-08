import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

// Keep in sync with the pre-paint script in index.html.
const query = window.matchMedia("(prefers-color-scheme: dark)");
const stored = () => localStorage.getItem("theme") as Theme | null;

export const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

/** Owns the theme state. Call once, in App. */
export function useThemeState() {
  const [theme, setTheme] = useState<Theme>(
    () => stored() ?? (query.matches ? "dark" : "light")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Follow the OS until the user picks a side.
  useEffect(() => {
    const onChange = (e: MediaQueryListEvent) => {
      if (!stored()) setTheme(e.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return { theme, toggle };
}
