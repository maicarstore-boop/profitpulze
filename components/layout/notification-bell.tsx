"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.notifications)) setItems(data.notifications);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const unreadCount = items.filter((i) => !i.read).length;

  const handleOpen = async () => {
    setOpen((v) => !v);
  };

  const handleItemClick = async (item: NotificationItem) => {
    await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    if (item.relatedType === "SupportConversation" && item.relatedId) {
      setOpen(false);
      router.push(`/support?c=${item.relatedId}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <FiBell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
              )}
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent",
                    !item.read && "bg-primary/5"
                  )}
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.message}</span>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
