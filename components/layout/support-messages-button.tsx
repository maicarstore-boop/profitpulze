"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiMessageSquare } from "react-icons/fi";

export function SupportMessagesButton({ onNavigate }: { onNavigate?: () => void }) {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/support/conversations");
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (typeof data?.unread === "number") setUnread(data.unread);
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  return (
    <Link
      href="/support"
      onClick={onNavigate}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
      aria-label={unread > 0 ? `Support messages (${unread} unread)` : "Support messages"}
    >
      <FiMessageSquare className="h-4.5 w-4.5" />
      {unread > 0 && <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger" />}
    </Link>
  );
}
