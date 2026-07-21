"use client";

import { useMemo, useState } from "react";
import { FiRepeat } from "react-icons/fi";
import { formatPrice } from "@/lib/market-data";
import { useCoins } from "@/hooks/use-coins";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STABLE = { symbol: "USDT", price: 1 };

export function ConvertForm() {
  const coins = useCoins(100);
  const ASSETS = useMemo(
    () => [STABLE, ...coins.map((c) => ({ symbol: c.symbol, price: c.price }))],
    [coins]
  );
  const [fromSymbol, setFromSymbol] = useState("USDT");
  const [toSymbol, setToSymbol] = useState("BTC");
  const [amount, setAmount] = useState("1000");

  const from = ASSETS.find((a) => a.symbol === fromSymbol) ?? STABLE;
  const to = ASSETS.find((a) => a.symbol === toSymbol) ?? STABLE;

  const output = useMemo(() => {
    const numeric = Number(amount) || 0;
    return (numeric * from.price) / to.price;
  }, [amount, from, to]);

  const swap = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">From</label>
          <div className="flex gap-2">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              className="flex-1"
            />
            <Select
              value={fromSymbol}
              onChange={(e) => setFromSymbol(e.target.value)}
              className="w-32"
            >
              {ASSETS.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="my-3 flex justify-center">
          <button
            onClick={swap}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent"
            aria-label="Swap direction"
          >
            <FiRepeat className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">To (estimated)</label>
          <div className="flex gap-2">
            <Input value={output ? output.toFixed(8) : "0"} readOnly className="flex-1" />
            <Select value={toSymbol} onChange={(e) => setToSymbol(e.target.value)} className="w-32">
              {ASSETS.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          1 {from.symbol} ≈ {formatPrice(from.price / to.price)} {to.symbol}. Rate is indicative and
          may change at execution.
        </p>

        <Button size="lg" className="mt-5 w-full">
          Convert {from.symbol} to {to.symbol}
        </Button>
      </CardContent>
    </Card>
  );
}
