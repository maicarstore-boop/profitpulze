"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface HistoryItem {
  id: string;
  kind: "Deposit" | "Withdrawal";
  currency: string;
  amountUsd: number;
  status: string;
  createdAt: string;
}

export function HistoryTable() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/deposits?limit=25").then((res) => res.json()),
      fetch("/api/withdrawals?limit=25").then((res) => res.json()),
    ]).then(([deposits, withdrawals]) => {
      const depositItems: HistoryItem[] = (deposits.deposits ?? []).map((d: Record<string, unknown>) => ({
        id: `deposit-${d.id}`,
        kind: "Deposit" as const,
        currency: String(d.payCurrency).toUpperCase(),
        amountUsd: d.priceAmountUsd as number,
        status: d.status as string,
        createdAt: d.createdAt as string,
      }));
      const withdrawalItems: HistoryItem[] = (withdrawals.withdrawals ?? []).map((w: Record<string, unknown>) => ({
        id: `withdrawal-${w.id}`,
        kind: "Withdrawal" as const,
        currency: String(w.currency).toUpperCase(),
        amountUsd: w.amountUsd as number,
        status: w.status as string,
        createdAt: w.createdAt as string,
      }));
      const merged = [...depositItems, ...withdrawalItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(merged);
    });
  }, []);

  const isPositiveStatus = (status: string) => ["finished", "completed"].includes(status);

  return (
    <div className="divide-y divide-border rounded-2xl border border-border">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-medium">
              {item.kind} {item.currency}
            </div>
            <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">${item.amountUsd.toFixed(2)}</span>
            <Badge variant={isPositiveStatus(item.status) ? "success" : "outline"} className="capitalize">
              {item.status}
            </Badge>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No deposit or withdrawal activity yet.</div>
      )}
    </div>
  );
}
