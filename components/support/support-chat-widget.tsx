"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowLeft, FiExternalLink, FiMessageCircle, FiPlus, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import {
  MessageThread,
  formatRelative,
  type SupportConversation,
  type SupportConversationSummary,
} from "@/components/support/message-thread";
import { NewConversationForm } from "@/components/support/support-inbox";
import { isAdminRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

/** Pages where the floating button would be redundant or get in the way. */
const HIDDEN_PATHS = ["/support", "/login", "/register", "/forgot-password"];

type View = { kind: "list" } | { kind: "compose" } | { kind: "thread"; id: string };

function ChatPanel({ onClose, onUnreadChange }: { onClose: () => void; onUnreadChange: (n: number) => void }) {
  const [conversations, setConversations] = useState<SupportConversationSummary[] | null>(null);
  const [view, setView] = useState<View>({ kind: "list" });
  const [active, setActive] = useState<SupportConversation | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/support/conversations");
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (!data) return;
    setConversations(data.conversations);
    onUnreadChange(data.unread ?? 0);
    // First open with no history: go straight to the compose form.
    if (data.conversations.length === 0) setView((v) => (v.kind === "list" ? { kind: "compose" } : v));
  }, [onUnreadChange]);

  const loadActive = useCallback(async (id: string) => {
    const res = await fetch(`/api/support/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActive(data.conversation);
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, unreadByUser: 0 } : c)) ?? prev);
  }, []);

  useEffect(() => {
    const first = setTimeout(loadList, 0);
    const t = setInterval(loadList, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [loadList]);

  const threadId = view.kind === "thread" ? view.id : null;
  useEffect(() => {
    if (!threadId) return;
    const first = setTimeout(() => loadActive(threadId), 0);
    const t = setInterval(() => loadActive(threadId), 5_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [threadId, loadActive]);

  const send = async (body: string) => {
    if (!threadId) return "No conversation selected.";
    const res = await fetch(`/api/support/conversations/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error ?? "Failed to send message.";
    setActive(data.conversation);
    loadList();
    return null;
  };

  const current = active && active.id === threadId ? active : null;
  const hasHistory = !!conversations && conversations.length > 0;

  return (
    <div
      role="dialog"
      aria-label="Support chat"
      className="fixed inset-x-3 top-20 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:inset-x-auto md:right-6 md:top-auto md:bottom-24! md:h-[560px] md:max-h-[calc(100dvh-8rem)] md:w-96"
      style={{ bottom: "calc(9rem + env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-primary px-3 py-3 text-primary-foreground">
        {view.kind !== "list" && hasHistory && (
          <button
            type="button"
            onClick={() => setView({ kind: "list" })}
            className="rounded-md p-1 hover:bg-primary-foreground/10"
            aria-label="Back to conversations"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {current ? current.subject : view.kind === "compose" ? "New conversation" : "Support"}
          </div>
          <div className="truncate text-[11px] opacity-80">
            {current ? current.category : "We typically reply within a few hours"}
          </div>
        </div>
        <Link
          href={threadId ? `/support?c=${threadId}` : "/support"}
          onClick={onClose}
          className="rounded-md p-1 hover:bg-primary-foreground/10"
          aria-label="Open full messages page"
        >
          <FiExternalLink className="h-4 w-4" />
        </Link>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-primary-foreground/10" aria-label="Close chat">
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      {view.kind === "compose" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NewConversationForm
            onCancel={hasHistory ? () => setView({ kind: "list" }) : undefined}
            onCreated={(c) => {
              setActive(c);
              setView({ kind: "thread", id: c.id });
              loadList();
            }}
          />
        </div>
      ) : view.kind === "thread" ? (
        current ? (
          <>
            <div className="flex items-center justify-end border-b border-border px-3 py-1.5">
              <StatusBadge status={current.status} />
            </div>
            <MessageThread
              messages={current.messages}
              viewer="user"
              onSend={send}
              disabled={current.status === "closed"}
              disabledReason="This conversation is closed. Start a new one if you still need help."
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading…</div>
        )
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations === null && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
            {conversations?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setView({ kind: "thread", id: c.id })}
                className="flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", c.unreadByUser > 0 ? "font-semibold" : "font-medium")}>{c.subject}</span>
                  {c.unreadByUser > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {c.unreadByUser}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {c.lastMessageFrom === "staff" ? "Support: " : "You: "}
                  {c.lastMessagePreview}
                </span>
                <div className="flex items-center justify-between">
                  <StatusBadge status={c.status} />
                  <span className="text-[10px] text-muted-foreground">{formatRelative(c.lastMessageAt)}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-3">
            <Button className="w-full" onClick={() => setView({ kind: "compose" })}>
              <FiPlus className="h-4 w-4" /> New conversation
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Floating "chat with support" button for signed-in clients. Staff accounts
 * don't see it — they handle conversations from /admin/support instead.
 */
export function SupportChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const enabled = !!user && !isAdminRole(user.role) && !HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  // While closed, keep the unread badge fresh; the open panel reports its own counts.
  useEffect(() => {
    if (!enabled || open) return;
    const load = async () => {
      const res = await fetch("/api/support/conversations");
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (typeof data?.unread === "number") setUnread(data.unread);
    };
    const first = setTimeout(load, 0);
    const t = setInterval(load, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [enabled, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!enabled) return null;

  return (
    <>
      {open && <ChatPanel onClose={() => setOpen(false)} onUnreadChange={setUnread} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : unread > 0 ? `Chat with support (${unread} unread)` : "Chat with support"}
        aria-expanded={open}
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:right-6 md:bottom-6!"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {open ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
