"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WebhookEventRow {
  id: string;
  provider: string;
  dedupeKey: string;
  signatureValid: boolean;
  processed: boolean;
  error: string | null;
  rawPayload: Record<string, unknown>;
  createdAt: string;
}

export default function AdminWebhookLogsPage() {
  const [events, setEvents] = useState<WebhookEventRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/payments/webhooks?limit=150`);
    const data = await res.json();
    if (Array.isArray(data.events)) setEvents(data.events);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Webhook Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Raw NOWPayments IPN events — every inbound webhook is logged here regardless of outcome.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Dedupe Key</th>
              <th className="px-4 py-3 font-medium">Signature</th>
              <th className="px-4 py-3 font-medium">Processed</th>
              <th className="px-4 py-3 font-medium">Error</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <Fragment key={e.id}>
                <tr
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-accent"
                  onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{e.dedupeKey}</td>
                  <td className="px-4 py-3">
                    <Badge variant={e.signatureValid ? "success" : "danger"}>{e.signatureValid ? "Valid" : "Invalid"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={e.processed ? "success" : "outline"}>{e.processed ? "Yes" : "No"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-danger">{e.error ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
                {expandedId === e.id && (
                  <tr key={`${e.id}-detail`} className="border-b border-border bg-muted/30 last:border-0">
                    <td colSpan={5} className="px-4 py-3">
                      <pre className="max-h-64 overflow-auto rounded-lg bg-background p-3 text-xs">
                        {JSON.stringify(e.rawPayload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No webhook events received yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
