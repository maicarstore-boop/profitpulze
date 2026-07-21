"use client";

import { useMemo, useState } from "react";
import { coins as FALLBACK_COINS, formatPrice } from "@/lib/market-data";
import { useCoins } from "@/hooks/use-coins";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const QUICK_AMOUNTS = [100, 250, 500, 1000];
const PAYMENT_METHODS = ["Debit / Credit Card", "Bank Transfer", "Apple Pay", "Google Pay"];

export function BuyCryptoForm() {
  const coins = useCoins(100);
  const [amount, setAmount] = useState("250");
  const [symbol, setSymbol] = useState("BTC");
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);

  const coin = coins.find((c) => c.symbol === symbol) ?? FALLBACK_COINS.find((c) => c.symbol === symbol)!;
  const fee = useMemo(() => (Number(amount) || 0) * 0.015, [amount]);
  const receiveUsd = (Number(amount) || 0) - fee;
  const receiveCrypto = receiveUsd / coin.price;

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="pt-6">
        <label className="text-xs text-muted-foreground">You pay</label>
        <div className="mt-1 flex gap-2">
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="flex-1" />
          <span className="flex h-10 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground">
            USD
          </span>
        </div>

        <div className="mt-2 flex gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              ${a}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs text-muted-foreground">You receive (estimated)</label>
        <div className="mt-1 flex gap-2">
          <Input value={receiveCrypto ? receiveCrypto.toFixed(8) : "0"} readOnly className="flex-1" />
          <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-28">
            {coins.map((c) => (
              <option key={c.id} value={c.symbol}>
                {c.symbol}
              </option>
            ))}
          </Select>
        </div>

        <label className="mt-4 block text-xs text-muted-foreground">Payment method</label>
        <Select value={payment} onChange={(e) => setPayment(e.target.value)} className="mt-1">
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <div className="mt-4 space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Exchange rate</span>
            <span>1 {coin.symbol} = ${formatPrice(coin.price)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fee (1.5%)</span>
            <span>${fee.toFixed(2)}</span>
          </div>
        </div>

        <Button size="lg" className="mt-5 w-full">
          Buy {coin.symbol}
        </Button>
      </CardContent>
    </Card>
  );
}
