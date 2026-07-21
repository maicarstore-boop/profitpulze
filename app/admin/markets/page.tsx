"use client";

import { useCallback, useEffect, useState } from "react";
import { FiEyeOff, FiEye } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCompact, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface MarketPair {
  id: string;
  symbol: string;
  name: string;
  color: string;
  price: number;
  change24h: number;
  marketCap: number;
  delisted: boolean;
  delistReason: string;
  tradingActivity: {
    openTrades: number;
    settledTrades: number;
    totalStaked: number;
    winRate: number;
  };
}

function usePairs() {
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/market-listings?limit=100");
    const data = await res.json();
    if (Array.isArray(data.pairs)) setPairs(data.pairs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  return { pairs, loading, reload: load };
}

function PairsTab({ pairs, reload }: { pairs: MarketPair[]; reload: () => void }) {
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submitDelist = async (symbol: string) => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/market-listings/${symbol}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delist", reason: reason.trim() }),
      });
      setPendingSymbol(null);
      setReason("");
      reload();
    } finally {
      setBusy(false);
    }
  };

  const relist = async (symbol: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/market-listings/${symbol}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "relist" }),
      });
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h Change</th>
              <th className="px-4 py-3 font-medium">Market Cap</th>
              <th className="px-4 py-3 font-medium">Listing Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <tr key={pair.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: pair.color }}>
                      {pair.symbol.slice(0, 2)}
                    </span>
                    <div>
                      <div className="font-medium">{pair.symbol}</div>
                      <div className="text-xs text-muted-foreground">{pair.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">${formatPrice(pair.price)}</td>
                <td className={cn("px-4 py-3", pair.change24h >= 0 ? "text-success" : "text-danger")}>
                  {pair.change24h >= 0 ? "+" : ""}{pair.change24h.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-muted-foreground">${formatCompact(pair.marketCap)}</td>
                <td className="px-4 py-3">
                  <Badge variant={pair.delisted ? "danger" : "success"}>{pair.delisted ? "Delisted" : "Listed"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => (pair.delisted ? relist(pair.symbol) : setPendingSymbol(pair.symbol))}
                  >
                    {pair.delisted ? <FiEye className="h-3.5 w-3.5" /> : <FiEyeOff className="h-3.5 w-3.5" />}
                    {pair.delisted ? "Relist" : "Delist"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {pendingSymbol && (
        <Card className="p-4">
          <p className="text-sm font-medium">Delist {pendingSymbol} — reason required</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This hides the pair from market discovery and blocks new binary trades on it immediately. Existing open trades still settle normally.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              autoFocus
              placeholder="Reason for delisting…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex-1"
            />
            <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => submitDelist(pendingSymbol)}>
              Confirm Delist
            </Button>
            <Button variant="ghost" onClick={() => { setPendingSymbol(null); setReason(""); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ActivityTab({ pairs }: { pairs: MarketPair[] }) {
  const traded = pairs.filter((p) => p.tradingActivity.openTrades > 0 || p.tradingActivity.settledTrades > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Binary Trading Activity by Pair</CardTitle>
        <CardDescription>Live counts from real trades placed on this platform, grouped by symbol.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {traded.length === 0 && <p className="text-sm text-muted-foreground">No binary trades have been placed yet.</p>}
        {traded
          .sort((a, b) => b.tradingActivity.totalStaked - a.tradingActivity.totalStaked)
          .map((pair) => (
            <div key={pair.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className="font-medium">{pair.symbol}/USDT</span>
              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>Open: <span className="text-foreground">{pair.tradingActivity.openTrades}</span></span>
                <span>Settled: <span className="text-foreground">{pair.tradingActivity.settledTrades}</span></span>
                <span>Total staked: <span className="text-foreground">${formatPrice(pair.tradingActivity.totalStaked)}</span></span>
                <span>Win rate: <span className="text-foreground">{pair.tradingActivity.winRate}%</span></span>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

export default function AdminMarketsPage() {
  const { pairs, loading, reload } = usePairs();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Market Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage trading pair listings and monitor real trading activity.</p>
      </div>

      {!loading && (
        <Tabs
          items={[
            { key: "pairs", label: "Trading Pairs & Listings", content: <PairsTab pairs={pairs} reload={reload} /> },
            { key: "activity", label: "Trading Activity", content: <ActivityTab pairs={pairs} /> },
          ]}
        />
      )}
    </div>
  );
}
