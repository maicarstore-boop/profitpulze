"use client";

import Link from "next/link";
import { FiChevronDown, FiArrowUp, FiArrowDown, FiSearch } from "react-icons/fi";
import { useState } from "react";
import { useCoins } from "@/hooks/use-coins";
import { formatPrice, formatCompact } from "@/lib/market-data";
import type { Coin } from "@/lib/market-data";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function BinaryStatsBar({ coin }: { coin: Coin }) {
  const coins = useCoins(100);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const positive = coin.change24h >= 0;
  const high = coin.price * 1.03;
  const low = coin.price * 0.96;

  const filtered = coins.filter(
    (c) =>
      c.symbol.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border px-4 py-4 sm:px-6">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-lg font-bold"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: coin.color }}
          >
            {coin.symbol.slice(0, 2)}
          </span>
          {coin.symbol}/USDT
          <FiChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-1 shadow-lg">
            <div className="relative p-1.5">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search coins..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/binary/${c.symbol}-USDT`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{c.symbol}/USDT</span>
                  <span className="text-muted-foreground">${formatPrice(c.price)}</span>
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className={cn("text-lg font-bold", positive ? "text-success" : "text-danger")}>
          ${formatPrice(coin.price)}
        </div>
      </div>

      <Stat label="24h Change">
        <span className={cn("flex items-center gap-0.5 font-medium", positive ? "text-success" : "text-danger")}>
          {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
          {Math.abs(coin.change24h).toFixed(2)}%
        </span>
      </Stat>
      <Stat label="24h High">${formatPrice(high)}</Stat>
      <Stat label="24h Low">${formatPrice(low)}</Stat>
      <Stat label="24h Volume">${formatCompact(coin.volume24h)}</Stat>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}
