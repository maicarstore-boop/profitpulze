"use client";

import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/market-data";
import { Badge } from "@/components/ui/badge";
import type { BinaryTradeRow } from "@/components/binary/active-trades-panel";

const RESULT_VARIANT = { win: "success", lose: "danger", draw: "default" } as const;

export function RecentSettlements({ trades }: { trades: BinaryTradeRow[] }) {
  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No settled trades yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-medium text-foreground">Recent Results</div>
      <div className="divide-y divide-border">
        {trades.map((trade) => (
          <div key={trade.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  trade.direction === "up" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                )}
              >
                {trade.direction === "up" ? <FiArrowUp className="h-3.5 w-3.5" /> : <FiArrowDown className="h-3.5 w-3.5" />}
              </span>
              <div>
                <div className="font-medium text-foreground">{trade.symbol}/USDT</div>
                <div className="text-xs text-muted-foreground">
                  ${formatPrice(trade.entryPrice)} → ${trade.exitPrice ? formatPrice(trade.exitPrice) : "—"}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className={cn(
                  "font-mono text-xs",
                  (trade.profitLoss ?? 0) > 0 ? "text-success" : (trade.profitLoss ?? 0) < 0 ? "text-danger" : "text-muted-foreground"
                )}
              >
                {(trade.profitLoss ?? 0) >= 0 ? "+" : ""}
                ${formatPrice(trade.profitLoss ?? 0)}
              </div>
            </div>

            {trade.status === "cancelled" ? (
              <Badge variant="outline">Cancelled</Badge>
            ) : (
              <Badge variant={RESULT_VARIANT[trade.result ?? "draw"]} className="capitalize">
                {trade.result}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
