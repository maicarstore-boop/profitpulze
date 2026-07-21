"use client";

import { useState } from "react";
import { FiCopy, FiCheck, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { useCoins } from "@/hooks/use-coins";
import { coins as FALLBACK_COINS, formatCompact } from "@/lib/market-data";
import { holdings, recentActivity } from "@/lib/portfolio-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOCK_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

type DisplayCurrency = "USD" | "USDT";

// USDT is a USD-pegged stablecoin, so the underlying number doesn't change
// between the two — only the symbol/suffix shown to the user does.
function formatAmount(value: number, currency: DisplayCurrency): string {
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return currency === "USD" ? `$${formatted}` : `${formatted} USDT`;
}

function CurrencyToggle({ value, onChange }: { value: DisplayCurrency; onChange: (c: DisplayCurrency) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1 text-xs">
      {(["USD", "USDT"] as const).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "rounded-md px-3 py-1.5 font-semibold transition-colors",
            value === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function TotalBalanceCard({ currency, onCurrencyChange }: { currency: DisplayCurrency; onCurrencyChange: (c: DisplayCurrency) => void }) {
  const liveCoins = useCoins(100);

  const rows = holdings.map((h) => {
    const coin = liveCoins.find((c) => c.symbol === h.symbol) ?? FALLBACK_COINS.find((c) => c.symbol === h.symbol)!;
    return { ...h, coin, value: h.quantity * coin.price };
  });

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const dayChange = rows.reduce((sum, r) => sum + r.value * (r.coin.change24h / 100), 0);
  const dayChangePct = totalValue ? (dayChange / (totalValue - dayChange)) * 100 : 0;
  const positive = dayChange >= 0;

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div>
          <div className="text-xs text-muted-foreground">Total Balance</div>
          <div className="mt-1 text-3xl font-bold">{formatAmount(totalValue, currency)}</div>
          <div className={cn("mt-1 flex items-center gap-1 text-sm font-medium", positive ? "text-success" : "text-danger")}>
            {positive ? <FiArrowUp className="h-3.5 w-3.5" /> : <FiArrowDown className="h-3.5 w-3.5" />}
            {formatAmount(Math.abs(dayChange), currency)} ({Math.abs(dayChangePct).toFixed(2)}%) today
          </div>
        </div>
        <CurrencyToggle value={currency} onChange={onCurrencyChange} />
      </CardContent>
    </Card>
  );
}

function BalancesTable({ currency }: { currency: DisplayCurrency }) {
  const liveCoins = useCoins(100);
  const rows = liveCoins.map((coin) => {
    const holding = holdings.find((h) => h.symbol === coin.symbol);
    const quantity = holding?.quantity ?? 0;
    return { coin, quantity, value: quantity * coin.price };
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Total Balance</th>
            <th className="px-4 py-3 font-medium">Value ({currency})</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.coin.id} className="border-b border-border last:border-0 hover:bg-accent">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: row.coin.color }}
                  >
                    {row.coin.symbol.slice(0, 2)}
                  </span>
                  <div>
                    <div className="font-medium">{row.coin.symbol}</div>
                    <div className="text-xs text-muted-foreground">{row.coin.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{row.quantity || "0"} {row.coin.symbol}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {currency === "USD" ? `$${formatCompact(row.value)}` : `${formatCompact(row.value)} USDT`}
              </td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="outline">Trade</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepositPanel() {
  const coins = useCoins(100);
  const [symbol, setSymbol] = useState("BTC");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MOCK_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div>
          <label className="text-xs text-muted-foreground">Select Asset</label>
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1">
            {coins.map((c) => (
              <option key={c.id} value={c.symbol}>{c.symbol} — {c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Network</label>
          <Select className="mt-1" defaultValue="native">
            <option value="native">{symbol} Native Network</option>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Deposit Address</label>
          <div className="mt-1 flex gap-2">
            <Input value={MOCK_ADDRESS} readOnly className="flex-1 font-mono text-xs" />
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <FiCheck className="h-4 w-4 text-success" /> : <FiCopy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Send only {symbol} to this address. Deposits are credited after the required number of
          network confirmations.
        </p>
      </CardContent>
    </Card>
  );
}

function WithdrawPanel() {
  const coins = useCoins(100);
  const [symbol, setSymbol] = useState("BTC");

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div>
          <label className="text-xs text-muted-foreground">Select Asset</label>
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1">
            {coins.map((c) => (
              <option key={c.id} value={c.symbol}>{c.symbol} — {c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Withdrawal Address</label>
          <Input placeholder={`Enter ${symbol} address`} className="mt-1 font-mono text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount</label>
          <Input type="number" placeholder="0.00" className="mt-1" />
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          Network fee: 0.0002 {symbol} · Withdrawals above your daily limit require manual review.
        </div>
        <Button size="lg" className="w-full">Request Withdrawal</Button>
      </CardContent>
    </Card>
  );
}

function HistoryTable() {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border">
      {recentActivity.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-medium">{item.type} {item.asset}</div>
            <div className="text-xs text-muted-foreground">{item.time}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{item.amount}</span>
            <Badge variant={item.status === "Completed" ? "success" : "outline"}>{item.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WalletView() {
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TotalBalanceCard currency={currency} onCurrencyChange={setCurrency} />
      <Tabs
        items={[
          { key: "balances", label: "Balances", content: <BalancesTable currency={currency} /> },
          { key: "deposit", label: "Deposit", content: <DepositPanel /> },
          { key: "withdraw", label: "Withdraw", content: <WithdrawPanel /> },
          { key: "history", label: "History", content: <HistoryTable /> },
        ]}
      />
    </div>
  );
}
