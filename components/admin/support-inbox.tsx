"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiInbox, FiAlertCircle, FiClock, FiCheckCircle, FiMessageCircle } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  MessageThread,
  formatRelative,
  type SupportConversation,
  type SupportConversationSummary,
} from "@/components/support/message-thread";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT: Record<string, "success" | "outline" | "danger" | "default"> = {
  low: "default",
  medium: "outline",
  high: "danger",
  urgent: "danger",
};

interface Counts {
  byStatus: Record<string, number>;
  unread: number;
}

export function AdminSupportInbox() {
  const [conversations, setConversations] = useState<SupportConversationSummary[] | null>(null);
  const [counts, setCounts] = useState<Counts>({ byStatus: {}, unread: 0 });
  const [statusFilter, setStatusFilter] = useState("open");
  const [userQuery, setUserQuery] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<SupportConversation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (userQuery.trim()) params.set("user", userQuery.trim());
    if (mineOnly) params.set("mine", "1");
    const res = await fetch(`/api/admin/support/conversations?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
    setCounts(data.counts);
  }, [statusFilter, userQuery, mineOnly]);

  const loadActive = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/support/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActive(data.conversation);
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, unreadByStaff: 0 } : c)) ?? prev);
  }, []);

  useEffect(() => {
    const t = setTimeout(loadList, 250);
    const i = setInterval(loadList, 15_000);
    return () => {
      clearTimeout(t);
      clearInterval(i);
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

  const selectConversation = (id: string | null) => {
    setActionError(null);
    setActiveId(id);
  };

  const postAction = async (payload: Record<string, unknown>) => {
    if (!activeId) return "No conversation selected.";
    const res = await fetch(`/api/admin/support/conversations/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return (data.error as string) ?? "Action failed.";
    setActive(data.conversation);
    loadList();
    return null;
  };

  const update = async (changes: Record<string, unknown>) => {
    setActionError(await postAction({ action: "update", ...changes }));
  };

  const current = active && active.id === activeId ? active : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open" value={(counts.byStatus.open ?? 0).toString()} icon={FiInbox} />
        <StatCard label="Awaiting Reply" value={counts.unread.toString()} icon={FiAlertCircle} sublabel="unread client messages" />
        <StatCard label="Pending Client" value={(counts.byStatus.pending ?? 0).toString()} icon={FiClock} />
        <StatCard label="Resolved" value={(counts.byStatus.resolved ?? 0).toString()} icon={FiCheckCircle} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
        <Input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search by user email" className="sm:w-64" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Assigned to me
        </label>
      </div>

      <Card className="flex h-[calc(100dvh-22rem)] min-h-[520px] overflow-hidden p-0">
        <div className={cn("flex w-full flex-col border-r border-border md:w-96 md:shrink-0", activeId && "hidden md:flex")}>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations === null && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
            {conversations?.length === 0 && <div className="p-4 text-sm text-muted-foreground">No conversations match these filters.</div>}
            {conversations?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-accent",
                  activeId === c.id && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", c.unreadByStaff > 0 ? "font-semibold" : "font-medium")}>{c.subject}</span>
                  {c.unreadByStaff > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {c.unreadByStaff}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">{c.userEmail} · {c.category}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {c.lastMessageFrom === "staff" ? "Staff: " : "Client: "}
                  {c.lastMessagePreview}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <StatusBadge status={c.status} />
                    <Badge variant={PRIORITY_VARIANT[c.priority]} className="capitalize">{c.priority}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(c.lastMessageAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={cn("min-w-0 flex-1 flex-col", activeId ? "flex" : "hidden md:flex")}>
          {current ? (
            <>
              <div className="space-y-3 border-b border-border p-3">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => selectConversation(null)} className="mt-0.5 text-muted-foreground hover:text-foreground md:hidden" aria-label="Back to conversations">
                    <FiArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{current.subject}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      <Link href={`/admin/users/${current.userId}`} className="hover:underline">{current.userEmail}</Link>
                      {" · "}{current.category}
                      {" · "}{current.assignedToEmail ? `Assigned to ${current.assignedToEmail}` : "Unassigned"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={current.status} onChange={(e) => update({ status: e.target.value })} className="h-8 w-32 text-xs">
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                  <Select value={current.priority} onChange={(e) => update({ priority: e.target.value })} className="h-8 w-28 text-xs">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                  {current.assignedToEmail ? (
                    <Button size="sm" variant="ghost" onClick={() => update({ unassign: true })}>Unassign</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => update({ assignToMe: true })}>Assign to me</Button>
                  )}
                </div>
                {actionError && <p className="text-xs text-danger">{actionError}</p>}
              </div>
              <MessageThread
                messages={current.messages}
                viewer="staff"
                onSend={(body) => postAction({ action: "reply", body })}
                placeholder="Reply to the client…"
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <FiMessageCircle className="h-8 w-8" />
              <p>Select a conversation to view and reply.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
