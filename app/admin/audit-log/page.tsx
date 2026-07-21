"use client";

import { useEffect, useState } from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue: unknown;
  newValue: unknown;
  reason?: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/audit-log");
    const data = await res.json();
    setEntries(data.entries ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = entries.filter(
    (e) =>
      !query ||
      e.adminEmail.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase()) ||
      e.targetId.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every administrative action, with who performed it, when, from where, and what changed.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          <FiRefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by admin, action, or target ID..." className="pl-9" />
      </div>

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading audit trail...</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No administrative actions recorded yet. Actions taken from User Management (freeze, suspend, role
            changes, etc.) will appear here automatically.
          </p>
        ) : (
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Administrator</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Previous → New</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-4 py-3">{entry.adminEmail}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.targetType} · <span className="font-mono text-xs">{entry.targetId.slice(0, 10)}...</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {JSON.stringify(entry.previousValue)} → {JSON.stringify(entry.newValue)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.reason ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.ip}</td>
                  <td className="px-4 py-3 truncate text-xs text-muted-foreground" title={entry.userAgent}>
                    {entry.userAgent.slice(0, 24)}...
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
