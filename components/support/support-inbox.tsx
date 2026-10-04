"use client";

import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiMessageCircle, FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  MessageThread,
  formatRelative,
  type SupportConversation,
  type SupportConversationSummary,
} from "@/components/support/message-thread";
import { cn } from "@/lib/utils";

export const SUPPORT_CATEGORY_OPTIONS = [
  "Account & Verification",
  "Deposits & Withdrawals",
  "Trading",
  "Security",
  "Other",
];

export function NewConversationForm({
  onCreated,
  onCancel,
}: {
  onCreated: (c: SupportConversation) => void;
  onCancel?: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(SUPPORT_CATEGORY_OPTIONS[0]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/support/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, category, body }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to send message.");
      return;
    }
    onCreated(data.conversation);
  };

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <div>
        <h3 className="font-semibold">Message Support</h3>
        <p className="text-xs text-muted-foreground">Our team typically replies within a few hours. You&apos;ll get a notification when they do.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="support-category">Category</Label>
        <Select id="support-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {SUPPORT_CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="support-subject">Subject</Label>
        <Input id="support-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Brief summary of your issue" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="support-body">Message</Label>
        <Textarea id="support-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} placeholder="Describe what you need help with" />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || subject.trim().length < 3 || !body.trim()}>
          {submitting ? "Sending…" : "Send Message"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}

export function SupportInbox({ initialConversationId }: { initialConversationId?: string }) {
  const [conversations, setConversations] = useState<SupportConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [active, setActive] = useState<SupportConversation | null>(null);
  const [composing, setComposing] = useState(false);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/support/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
  }, []);

  const loadActive = useCallback(async (id: string) => {
    const res = await fetch(`/api/support/conversations/${id}`);
    if (!res.ok) {
      setActiveId(null);
      return;
    }
    const data = await res.json();
    setActive(data.conversation);
    // Opening the thread clears its unread badge server-side; mirror that locally.
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

  useEffect(() => {
    if (!activeId) return;
    const first = setTimeout(() => loadActive(activeId), 0);
    const t = setInterval(() => loadActive(activeId), 5_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [activeId, loadActive]);

  const send = async (body: string) => {
    if (!activeId) return "No conversation selected.";
    const res = await fetch(`/api/support/conversations/${activeId}`, {
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

  const showCompose = composing || (conversations !== null && conversations.length === 0 && !activeId);
  const showDetail = showCompose || !!activeId;

  return (
    <Card className="flex h-[calc(100dvh-16rem)] min-h-[480px] overflow-hidden p-0">
      {/* Conversation list */}
      <div className={cn("flex w-full flex-col border-r border-border md:w-80 md:shrink-0", showDetail && "hidden md:flex")}>
        <div className="flex items-center justify-between border-b border-border p-3">
          <span className="text-sm font-semibold">Conversations</span>
          <Button size="sm" onClick={() => { setComposing(true); setActiveId(null); }}>
            <FiPlus className="h-3.5 w-3.5" /> New
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations === null && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {conversations?.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>
          )}
          {conversations?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setComposing(false); setActiveId(c.id); }}
              className={cn(
                "flex w-full flex-col gap-1 border-b border-border px-3 py-3 text-left hover:bg-accent",
                activeId === c.id && "bg-accent"
              )}
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
      </div>

      {/* Detail pane */}
      <div className={cn("min-w-0 flex-1 flex-col", showDetail ? "flex" : "hidden md:flex")}>
        {showCompose ? (
          <div className="overflow-y-auto">
            {conversations && conversations.length > 0 && (
              <button type="button" onClick={() => setComposing(false)} className="flex items-center gap-1 px-4 pt-4 text-xs text-muted-foreground hover:text-foreground md:hidden">
                <FiArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <NewConversationForm
              onCancel={conversations && conversations.length > 0 ? () => setComposing(false) : undefined}
              onCreated={(c) => {
                setComposing(false);
                setActive(c);
                setActiveId(c.id);
                loadList();
              }}
            />
          </div>
        ) : active && active.id === activeId ? (
          <>
            <div className="flex items-center gap-3 border-b border-border p-3">
              <button type="button" onClick={() => setActiveId(null)} className="text-muted-foreground hover:text-foreground md:hidden" aria-label="Back to conversations">
                <FiArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{active.subject}</div>
                <div className="text-xs text-muted-foreground">{active.category}</div>
              </div>
              <StatusBadge status={active.status} />
            </div>
            <MessageThread
              messages={active.messages}
              viewer="user"
              onSend={send}
              disabled={active.status === "closed"}
              disabledReason="This conversation is closed. Start a new one if you still need help."
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <FiMessageCircle className="h-8 w-8" />
            <p>Select a conversation or start a new one.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
