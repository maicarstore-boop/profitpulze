"use client";

import { useEffect, useState } from "react";
import { useCoins } from "@/hooks/use-coins";
import { formatCompact } from "@/lib/market-data";
import { holdings } from "@/lib/portfolio-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { DepositPanel } from "@/components/wallet/deposit-panel";
import { WithdrawPanel } from "@/components/wallet/withdraw-panel";
import { HistoryTable } from "@/components/wallet/history-table";
import { cn } from "@/lib/utils";

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
  const [wallet, setWallet] = useState<{ available: number; locked: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setWallet({ available: data.available, locked: data.locked, total: data.total }));
  }, []);

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div>
          <div className="text-xs text-muted-foreground">Total Balance</div>
          <div className="mt-1 text-3xl font-bold">{wallet ? formatAmount(wallet.total, currency) : "—"}</div>
          {wallet && wallet.locked > 0 && (
            <div className="mt-1 text-sm text-muted-foreground">
              {formatAmount(wallet.available, currency)} available · {formatAmount(wallet.locked, currency)} locked
              in pending withdrawals
            </div>
          )}
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
