"use client";

import { useEffect, useState } from "react";
import { FiArrowUp, FiArrowDown, FiClock } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/market-data";
import { Badge } from "@/components/ui/badge";

export interface BinaryTradeRow {
  id: string;
  symbol: string;
  contractStyle: string;
  direction: "up" | "down";
  entryPrice: number;
  exitPrice: number | null;
  stake: number;
  potentialPayout: number;
  openedAt: string;
  expiresAt: string;
  status: "open" | "settled" | "cancelled";
  result: "win" | "lose" | "draw" | null;
  profitLoss: number | null;
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Settling…";
  const totalSeconds = Math.ceil(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ActiveTradesPanel({ trades }: { trades: BinaryTradeRow[] }) {
  const now = useNow();

  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No active trades. Place a trade above to get started.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-medium text-foreground">
        Active Trades ({trades.length})
      </div>
      <div className="divide-y divide-border">
        {trades.map((trade) => {
          const msRemaining = new Date(trade.expiresAt).getTime() - now;
          return (
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
                    Entry ${formatPrice(trade.entryPrice)} · Stake ${formatPrice(trade.stake)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-mono text-xs text-muted-foreground">
                  <FiClock className="h-3 w-3" />
                  {formatCountdown(msRemaining)}
                </div>
                <div className="text-xs text-success">Payout ${formatPrice(trade.potentialPayout)}</div>
              </div>

              <Badge variant="primary">Open</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
