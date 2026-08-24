"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCoins } from "@/hooks/use-coins";
import { formatCompact } from "@/lib/market-data";
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

interface WalletBalance {
  available: number;
  locked: number;
  total: number;
}

function useWalletBalance() {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setWallet({ available: data.available, locked: data.locked, total: data.total }));
  }, []);

  return wallet;
}

interface UserHolding {
  symbol: string;
  quantity: number;
}

function useUserHoldings() {
  const [holdings, setHoldings] = useState<UserHolding[]>([]);

  useEffect(() => {
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => setHoldings(Array.isArray(data.holdings) ? data.holdings : []))
      .catch(() => {});
  }, []);

  return holdings;
}

function TotalBalanceCard({
  cashTotal,
  holdingsValue,
  currency,
  onCurrencyChange,
}: {
  cashTotal: number | null;
  holdingsValue: number;
  currency: DisplayCurrency;
  onCurrencyChange: (c: DisplayCurrency) => void;
}) {
  const combinedTotal = cashTotal === null ? null : cashTotal + holdingsValue;

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div>
          <div className="text-xs text-muted-foreground">Total Balance</div>
          <div className="mt-1 text-3xl font-bold">
            {combinedTotal === null ? "—" : formatAmount(combinedTotal, currency)}
          </div>
          {cashTotal !== null && (
            <div className="mt-1 text-sm text-muted-foreground">
              {formatAmount(cashTotal, currency)} cash · {formatAmount(holdingsValue, currency)} in crypto holdings
            </div>
          )}
        </div>
        <CurrencyToggle value={currency} onChange={onCurrencyChange} />
      </CardContent>
    </Card>
  );
}

function BalancesTable({
  liveCoins,
  holdings,
  cashAvailable,
  currency,
}: {
  liveCoins: ReturnType<typeof useCoins>;
  holdings: UserHolding[];
  cashAvailable: number;
  currency: DisplayCurrency;
}) {
  const router = useRouter();
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
          <tr className="border-b border-border last:border-0 hover:bg-accent">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-[10px] font-bold text-success">
                  $
                </span>
                <div>
                  <div className="font-medium">USDT</div>
                  <div className="text-xs text-muted-foreground">Cash (wallet balance)</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">{cashAvailable.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</td>
            <td className="px-4 py-3 text-muted-foreground">
              {currency === "USD" ? `$${formatCompact(cashAvailable)}` : `${formatCompact(cashAvailable)} USDT`}
            </td>
            <td className="px-4 py-3" />
          </tr>
          {rows.map((row) => (
            <tr
              key={row.coin.id}
              onClick={() => router.push(`/convert?from=${row.coin.symbol}`)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-accent"
            >
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
                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  Trade
                </Button>
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
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const defaultKey = ["balances", "deposit", "withdraw", "history"].includes(requestedTab ?? "")
    ? requestedTab!
    : undefined;

  const wallet = useWalletBalance();
  const holdings = useUserHoldings();
  const liveCoins = useCoins(100);
  const holdingsValue = liveCoins.reduce((sum, coin) => {
    const holding = holdings.find((h) => h.symbol === coin.symbol);
    return sum + (holding?.quantity ?? 0) * coin.price;
  }, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TotalBalanceCard
        cashTotal={wallet ? wallet.total : null}
        holdingsValue={holdingsValue}
        currency={currency}
        onCurrencyChange={setCurrency}
      />
      <Tabs
        defaultKey={defaultKey}
        items={[
          {
            key: "balances",
            label: "Balances",
            content: (
              <BalancesTable
                liveCoins={liveCoins}
                holdings={holdings}
                cashAvailable={wallet?.available ?? 0}
                currency={currency}
              />
            ),
          },
          { key: "deposit", label: "Deposit", content: <DepositPanel /> },
          { key: "withdraw", label: "Withdraw", content: <WithdrawPanel /> },
          { key: "history", label: "History", content: <HistoryTable /> },
        ]}
      />
    </div>
  );
}
