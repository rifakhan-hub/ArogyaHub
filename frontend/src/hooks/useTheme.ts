import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "ah-theme";

function savedTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    return;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(savedTheme);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && !!media?.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    saveTheme(theme);
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [theme]);

  return { theme, setTheme };
}
