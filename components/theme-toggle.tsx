"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FiSun, FiMoon } from "react-icons/fi";
import { BsCircleFill } from "react-icons/bs";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: FiSun },
  { value: "dark", label: "Dark", icon: FiMoon },
  { value: "amoled", label: "AMOLED", icon: BsCircleFill },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[108px] rounded-full bg-muted" />;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/60 p-1">
      {THEMES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            theme === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className={value === "amoled" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} />
        </button>
      ))}
    </div>
  );
}
