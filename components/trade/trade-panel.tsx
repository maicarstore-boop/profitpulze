"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/market-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ORDER_TYPES = ["Market", "Limit", "Stop-Limit"] as const;
type OrderType = (typeof ORDER_TYPES)[number];
const PERCENTS = [25, 50, 75, 100];

export interface PlacedOrder {
  id: string;
  side: "buy" | "sell";
  type: OrderType;
  symbol: string;
  price: number;
  amount: number;
  status: "Open" | "Filled";
  time: string;
}

export function TradePanel({
  symbol,
  price,
  balance = 12480.32,
  onPlaceOrder,
}: {
  symbol: string;
  price: number;
  balance?: number;
  onPlaceOrder: (order: PlacedOrder) => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("Limit");
  const [limitPrice, setLimitPrice] = useState(price.toFixed(2));
  const [amount, setAmount] = useState("");

  const numericAmount = Number(amount) || 0;
  const effectivePrice = orderType === "Market" ? price : Number(limitPrice) || price;
  const total = numericAmount * effectivePrice;

  const handlePercent = (pct: number) => {
    const maxAmount = balance / effectivePrice;
    setAmount(((maxAmount * pct) / 100).toFixed(6));
  };

  const handleSubmit = () => {
    if (!numericAmount) return;
    onPlaceOrder({
      id: `${Date.now()}`,
      side,
      type: orderType,
      symbol,
      price: effectivePrice,
      amount: numericAmount,
      status: orderType === "Market" ? "Filled" : "Open",
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    });
    setAmount("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setSide("buy")}
          className={cn(
            "rounded-md py-2 text-sm font-semibold transition-colors",
            side === "buy" ? "bg-success text-success-foreground" : "text-muted-foreground"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={cn(
            "rounded-md py-2 text-sm font-semibold transition-colors",
            side === "sell" ? "bg-danger text-danger-foreground" : "text-muted-foreground"
          )}
        >
          Sell
        </button>
      </div>

      <div className="mt-4 flex gap-4 border-b border-border text-xs">
        {ORDER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={cn(
              "border-b-2 pb-2 font-medium transition-colors",
              orderType === type
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {orderType !== "Market" && (
          <div>
            <label className="text-xs text-muted-foreground">Price (USDT)</label>
            <Input
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              type="number"
              className="mt-1"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Amount ({symbol})</label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder="0.00"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PERCENTS.map((pct) => (
            <button
              key={pct}
              onClick={() => handlePercent(pct)}
              className="rounded-md border border-border py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {pct}%
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Available</span>
          <span>${formatPrice(balance)} USDT</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Order Value</span>
          <span>${formatPrice(total)} USDT</span>
        </div>

        <Button
          onClick={handleSubmit}
          variant={side === "buy" ? "success" : "danger"}
          className="w-full"
          size="lg"
        >
          {side === "buy" ? `Buy ${symbol}` : `Sell ${symbol}`}
        </Button>
      </div>
    </div>
  );
}
