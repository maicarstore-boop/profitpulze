"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiKey, FiAlertTriangle, FiShield, FiArrowRight, FiInfo } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";

interface LoginLog {
  id: string;
  email: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed";
  reason: string;
  provider: string;
  createdAt: string;
}

function LoginLogsTab() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState({ failedCount24h: 0, uniqueIps24h: 0 });

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/login-logs?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.logs)) setLogs(data.logs);
          if (data.stats) setStats(data.stats);
        });
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Failed Login Attempts (24h)" value={stats.failedCount24h.toString()} icon={FiAlertTriangle} />
        <StatCard label="Unique IPs (24h)" value={stats.uniqueIps24h.toString()} icon={FiShield} />
        <StatCard label="Total Logged Attempts" value={logs.length.toString()} icon={FiKey} sublabel="most recent 100" />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3">{log.email}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{log.provider}</td>
                <td className="px-4 py-3"><StatusBadge status={log.status === "success" ? "active" : "Rejected"} /></td>
                <td className="px-4 py-3 text-muted-foreground">{log.reason || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No login attempts recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <FiInfo className="h-8 w-8 text-muted-foreground" />
        <p className="max-w-md text-sm text-muted-foreground">
          This build doesn&apos;t include a public trading API, so there&apos;s no real API key product to manage yet.
          Key issuance/revocation would be a separate feature (key generation, scoped permissions, request signing) built
          on top of a public API surface that doesn&apos;t exist in this app.
        </p>
      </CardContent>
    </Card>
  );
}

function AuditTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <FiKey className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">
          Full administrator audit trail — every action, previous/new values, IP, and device — lives on its own page.
        </p>
        <Link href="/admin/audit-log">
          <Button size="sm">
            Open Audit Trail <FiArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function AdminSecurityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Security Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real login activity and IP monitoring, recorded on every sign-in attempt.</p>
      </div>
      <Tabs
        items={[
          { key: "logins", label: "Login & IP Monitoring", content: <LoginLogsTab /> },
          { key: "keys", label: "API Keys", content: <ApiKeysTab /> },
          { key: "audit", label: "Audit Trail", content: <AuditTab /> },
        ]}
      />
    </div>
  );
}
