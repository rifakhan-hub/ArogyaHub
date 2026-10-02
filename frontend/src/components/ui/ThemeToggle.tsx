import { Monitor, Moon, Sun } from "lucide-react";
import { type Theme, useTheme } from "@/hooks/useTheme";
import { Button } from "./Button";

const next: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const labels: Record<Theme, string> = { light: "Light", dark: "Dark", system: "Match system" };

/** One button that switches light → dark → match system. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next[theme])}
      aria-label={`Theme: ${labels[theme]}. Switch to ${labels[next[theme]]}`}
      title={`Theme: ${labels[theme]}`}
    >
      <Icon className="size-5" aria-hidden />
    </Button>
  );
}
