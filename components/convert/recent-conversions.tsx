"use client";

import { useEffect, useState } from "react";
import { FiRepeat } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";

interface ConversionTransaction {
  id: string;
  type: string;
  note: string;
  createdAt: string;
}

export function RecentConversions({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<ConversionTransaction[]>([]);

  useEffect(() => {
    fetch("/api/wallet/transactions?limit=50")
      .then((res) => res.json())
      .then((data) => {
        const transactions: ConversionTransaction[] = Array.isArray(data.transactions) ? data.transactions : [];
        setItems(transactions.filter((t) => t.type === "convert").slice(0, 5));
      })
      .catch(() => {});
  }, [refreshKey]);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Recent Conversions</h3>
        <div className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiRepeat className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.note}</div>
                <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No conversions yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
