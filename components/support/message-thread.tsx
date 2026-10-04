"use client";

import { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SupportMessage {
  id: string;
  senderType: "user" | "staff";
  senderEmail: string;
  body: string;
  createdAt: string;
}

export interface SupportConversationSummary {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedToEmail: string | null;
  unreadByUser: number;
  unreadByStaff: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageFrom: "user" | "staff" | null;
  createdAt: string;
}

export interface SupportConversation extends SupportConversationSummary {
  messages: SupportMessage[];
}

export function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * Chat-style message list plus composer. `viewer` decides which side of the
 * thread is "mine" (right-aligned): the client sees their own messages on the
 * right, staff see staff messages on the right.
 */
export function MessageThread({
  messages,
  viewer,
  onSend,
  disabled,
  disabledReason,
  placeholder = "Type your message…",
}: {
  messages: SupportMessage[];
  viewer: "user" | "staff";
  onSend: (body: string) => Promise<string | null>;
  disabled?: boolean;
  disabledReason?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const err = await onSend(body);
    setSending(false);
    if (err) setError(err);
    else setDraft("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.senderType === viewer;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                  mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"
                )}
              >
                {m.body}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {m.senderType === "staff" ? (viewer === "staff" ? m.senderEmail : "Support Team") : viewer === "staff" ? m.senderEmail : "You"}
                {" · "}
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        {disabled ? (
          <p className="py-2 text-center text-xs text-muted-foreground">{disabledReason}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder}
              maxLength={5000}
              className="min-h-11 resize-none"
              rows={2}
            />
            <Button type="submit" disabled={sending || !draft.trim()} aria-label="Send message" className="h-11 shrink-0">
              <FiSend className="h-4 w-4" />
            </Button>
          </form>
        )}
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
