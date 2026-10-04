"use client";

import { useCallback, useEffect, useState } from "react";
import { FiAlertOctagon, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  headline: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

const DISMISSED_KEY = "dismissed-announcements";

const STYLES = {
  info: { className: "border-border bg-muted text-foreground", icon: FiInfo, iconClass: "text-primary" },
  warning: { className: "border-primary/40 bg-primary/15 text-foreground", icon: FiAlertTriangle, iconClass: "text-primary" },
  critical: { className: "border-danger bg-danger text-danger-foreground", icon: FiAlertOctagon, iconClass: "" },
} as const;

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Platform-wide announcement banners published from Admin → Notification Center.
 * Info/warning banners can be dismissed per browser; critical ones stay until unpublished.
 */
export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/announcements");
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (Array.isArray(data?.announcements)) setItems(data.announcements);
  }, []);

  useEffect(() => {
    const first = setTimeout(() => {
      setDismissed(readDismissed());
      load();
    }, 0);
    const t = setInterval(load, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const dismiss = (id: string) => {
    // Only keep ids that are still live so storage doesn't grow forever.
    const next = [...dismissed.filter((d) => items.some((i) => i.id === d)), id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — dismissal lasts for this page view only.
    }
  };

  const visible = items.filter((i) => i.severity === "critical" || !dismissed.includes(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="shrink-0">
      {visible.map((item) => {
        const style = STYLES[item.severity] ?? STYLES.info;
        const Icon = style.icon;
        return (
          <div key={item.id} role={item.severity === "critical" ? "alert" : "status"} className={cn("border-b", style.className)}>
            <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconClass)} />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{item.headline}</span>
                {item.message && <span className="opacity-90"> — {item.message}</span>}
              </p>
              {item.severity !== "critical" && (
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100"
                  aria-label="Dismiss announcement"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
