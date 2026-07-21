"use client";

import { useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { supportTickets } from "@/lib/admin-data";
import { FiInbox, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const PRIORITY_VARIANT: Record<string, "success" | "outline" | "danger"> = {
  Low: "success",
  Medium: "outline",
  High: "danger",
  Urgent: "danger",
};

function TicketsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = supportTickets.filter((t) => statusFilter === "all" || t.status === statusFilter);
  const escalated = supportTickets.filter((t) => t.status === "Escalated").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Tickets" value={supportTickets.filter((t) => t.status === "Open").length.toString()} icon={FiInbox} />
        <StatCard label="Escalation Queue" value={escalated.toString()} icon={FiAlertCircle} sublabel="needs attention" />
        <StatCard label="Resolved (7d)" value="214" icon={FiCheckCircle} change={9.4} />
      </div>

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
        <option value="all">All statuses</option>
        <option value="Open">Open</option>
        <option value="Pending">Pending</option>
        <option value="Escalated">Escalated</option>
        <option value="Resolved">Resolved</option>
      </Select>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-muted-foreground">{t.id}</div>
                  <div className="font-medium">{t.subject}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.user}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                <td className="px-4 py-3"><Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{t.assignedTo}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{t.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function LiveChatTab() {
  return (
    <Card>
      <CardHeader><CardTitle>Live Chat Queue</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
        <FiMessageCircle className="h-8 w-8" />
        <p>No live chat sessions waiting. Real-time chat requires a WebSocket support gateway, not wired up in this build.</p>
      </CardContent>
    </Card>
  );
}

export default function AdminSupportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customer Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">Support tickets, live chat, and complaint escalation.</p>
      </div>
      <Tabs
        items={[
          { key: "tickets", label: "Tickets & Escalation", content: <TicketsTab /> },
          { key: "chat", label: "Live Chat", content: <LiveChatTab /> },
        ]}
      />
    </div>
  );
}
