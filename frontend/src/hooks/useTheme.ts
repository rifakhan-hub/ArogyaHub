import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "ah-theme"; // also read by the script in index.html, so the page never flashes

function savedTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

/** Light, dark or "system" (follows the computer's setting). The choice is remembered. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(savedTheme);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && !!media?.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // private windows may block storage; the theme still works for this visit
    }
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [theme]);

  return { theme, setTheme };
}
