"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FiRepeat,
  FiClock,
  FiChevronDown,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiZap,
} from "react-icons/fi";
import { formatPrice, formatCompact } from "@/lib/market-data";
import { useCoins } from "@/hooks/use-coins";
import { useAuth } from "@/components/auth/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RecentConversions } from "@/components/convert/recent-conversions";

interface AssetOption {
  symbol: string;
  name: string;
  price: number;
  color: string;
}

const STABLE: AssetOption = { symbol: "USDT", name: "Tether", price: 1, color: "#26A17B" };
const PERCENTS = [25, 50, 75, 100];

function CoinBadge({ asset }: { asset: AssetOption }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: asset.color }}
    >
      {asset.symbol.slice(0, 2)}
    </span>
  );
}

function AssetPicker({
  assets,
  value,
  onChange,
  balanceFor,
}: {
  assets: AssetOption[];
  value: string;
  onChange: (symbol: string) => void;
  balanceFor: (symbol: string) => number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = assets.find((a) => a.symbol === value) ?? STABLE;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = assets.filter(
    (a) =>
      a.symbol.toLowerCase().includes(query.toLowerCase()) || a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-muted/60 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-accent"
      >
        <CoinBadge asset={selected} />
        <span className="font-semibold">{selected.symbol}</span>
        <FiChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-popover shadow-lg">
          <div className="relative p-2">
            <FiSearch className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="max-h-72 overflow-y-auto pb-1">
            {filtered.map((a) => {
              const bal = balanceFor(a.symbol);
              return (
                <button
                  key={a.symbol}
                  type="button"
                  onClick={() => {
                    onChange(a.symbol);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent",
                    a.symbol === value && "bg-accent"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <CoinBadge asset={a} />
                    <span>
                      <span className="block text-sm font-medium">{a.symbol}</span>
                      <span className="block text-xs text-muted-foreground">{a.name}</span>
                    </span>
                  </span>
                  {bal > 0 && <span className="text-xs text-muted-foreground">{formatPrice(bal)}</span>}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ConvertForm() {
  const { user } = useAuth();
  const coins = useCoins(100);
  const ASSETS: AssetOption[] = useMemo(
    () => [
      STABLE,
      ...coins
        .filter((c) => c.symbol !== STABLE.symbol)
        .map((c) => ({ symbol: c.symbol, name: c.name, price: c.price, color: c.color })),
    ],
    [coins]
  );
  const searchParams = useSearchParams();
  const requestedFrom = searchParams.get("from")?.toUpperCase();
  const requestedTo = searchParams.get("to")?.toUpperCase();
  const [fromSymbol, setFromSymbol] = useState(requestedFrom && requestedFrom !== requestedTo ? requestedFrom : "USDT");
  const [toSymbol, setToSymbol] = useState(
    requestedTo && requestedTo !== requestedFrom ? requestedTo : requestedFrom === "BTC" ? "ETH" : "BTC"
  );
  const [amount, setAmount] = useState("1000");
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAccount = useCallback(() => {
    if (!user) return;
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setUsdtBalance(data.available ?? 0))
      .catch(() => {});
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => setHoldings(Array.isArray(data.holdings) ? data.holdings : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refreshAccount();
  }, [refreshAccount]);

  const balanceFor = useCallback(
    (symbol: string) => (symbol === "USDT" ? usdtBalance : holdings.find((h) => h.symbol === symbol)?.quantity ?? 0),
    [usdtBalance, holdings]
  );

  const from = ASSETS.find((a) => a.symbol === fromSymbol) ?? STABLE;
  const to = ASSETS.find((a) => a.symbol === toSymbol) ?? STABLE;
  const fromAvailable = balanceFor(fromSymbol);

  const output = useMemo(() => {
    const numeric = Number(amount) || 0;
    return (numeric * from.price) / to.price;
  }, [amount, from, to]);

  const numericAmount = Number(amount) || 0;
  const insufficientBalance = numericAmount > fromAvailable;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const swap = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    clearMessages();
  };

  const applyPercent = (pct: number) => {
    setAmount(fromAvailable > 0 ? String(Number(((fromAvailable * pct) / 100).toFixed(8))) : "0");
    clearMessages();
  };

  const handleConvert = async () => {
    clearMessages();
    setSubmitting(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: fromSymbol, to: toSymbol, amount: numericAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to convert.");
        return;
      }
      setSuccess(`Converted ${data.result.fromAmount} ${data.result.from} to ${data.result.toAmount} ${data.result.to}.`);
      setAmount("");
      refreshAccount();
      setRefreshKey((k) => k + 1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <FiClock className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Sign in to convert</h2>
          <p className="text-sm text-muted-foreground">
            Converting assets requires an account so we can validate your balance.
          </p>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="primary">Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="overflow-visible">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Convert</h2>
            <Badge variant="success" className="flex items-center gap-1">
              <FiZap className="h-3 w-3" /> Instant · Zero Fees
            </Badge>
          </div>

          <div className="mt-5 space-y-1">
            {/* You Pay */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>You Pay</span>
                <span>
                  Available{" "}
                  <span className={cn("font-mono", insufficientBalance && "text-danger")}>
                    {formatPrice(fromAvailable)} {fromSymbol}
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    clearMessages();
                  }}
                  type="number"
                  placeholder="0.00"
                  className="w-full min-w-0 bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
                />
                <AssetPicker assets={ASSETS} value={fromSymbol} onChange={setFromSymbol} balanceFor={balanceFor} />
              </div>
              <div className="mt-3 flex gap-1.5">
                {PERCENTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyPercent(pct)}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground"
                  >
                    {pct === 100 ? "Max" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap button, overlapping both panels */}
            <div className="relative z-10 -my-4 flex justify-center">
              <button
                type="button"
                onClick={swap}
                aria-label="Swap direction"
                className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-muted text-foreground shadow-sm transition-transform hover:rotate-180 hover:bg-accent"
              >
                <FiRepeat className="h-4 w-4" />
              </button>
            </div>

            {/* You Receive */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>You Receive (estimated)</span>
                <span>{formatPrice(balanceFor(toSymbol))} {toSymbol} available</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-full min-w-0 truncate text-3xl font-semibold tracking-tight text-foreground/90">
                  {output ? formatPrice(output) : "0.00"}
                </div>
                <AssetPicker assets={ASSETS} value={toSymbol} onChange={setToSymbol} balanceFor={balanceFor} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>
              1 {from.symbol} ≈ {formatPrice(from.price / to.price)} {to.symbol}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live rate
            </span>
          </div>

          {(error || (insufficientBalance && numericAmount > 0)) && (
            <p className="mt-3 flex items-center gap-1.5 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error ?? `Insufficient ${fromSymbol} balance.`}
            </p>
          )}

          {success && (
            <p className="mt-3 flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
              <FiCheckCircle className="h-3.5 w-3.5 shrink-0" />
              {success}
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={handleConvert}
            disabled={!numericAmount || insufficientBalance || submitting}
          >
            {submitting ? "Converting…" : `Convert ${from.symbol} to ${to.symbol}`}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {formatCompact(ASSETS.length)} assets supported · rates refresh continuously
          </p>
        </CardContent>
      </Card>

      <RecentConversions refreshKey={refreshKey} />
    </div>
  );
}
