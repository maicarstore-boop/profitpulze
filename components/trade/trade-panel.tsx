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
  balance,
  holdingQty,
  onPlaceOrder,
  onFilled,
}: {
  symbol: string;
  price: number;
  /** Available USDT balance, used to validate/size Buy orders. */
  balance: number;
  /** Quantity of `symbol` currently held, used to validate/size Sell orders. */
  holdingQty: number;
  onPlaceOrder: (order: PlacedOrder) => void;
  /** Called after a Market order is actually executed against the backend, so the parent can refresh balance/holdings. */
  onFilled: () => void;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("Limit");
  const [limitPrice, setLimitPrice] = useState(price.toFixed(2));
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const numericAmount = Number(amount) || 0;
  const effectivePrice = orderType === "Market" ? price : Number(limitPrice) || price;
  const total = numericAmount * effectivePrice;

  const insufficientBalance = side === "buy" ? total > balance : numericAmount > holdingQty;

  const handlePercent = (pct: number) => {
    if (side === "sell") {
      setAmount(((holdingQty * pct) / 100).toFixed(6));
    } else {
      const maxAmount = balance / effectivePrice;
      setAmount(((maxAmount * pct) / 100).toFixed(6));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!numericAmount) {
      setError("Enter an amount.");
      return;
    }
    if (side === "buy" && total > balance) {
      setError("Insufficient USDT balance.");
      return;
    }
    if (side === "sell" && numericAmount > holdingQty) {
      setError(`Insufficient ${symbol} balance.`);
      return;
    }

    // Only Market orders execute for real — there's no order book/matching engine, so
    // Limit/Stop-Limit just sit in the local "Open Orders" list without touching the backend.
    if (orderType === "Market") {
      setSubmitting(true);
      try {
        const res = await fetch("/api/trade/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol, side, amount: numericAmount }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to place order.");
          return;
        }
        onPlaceOrder({
          id: `${Date.now()}`,
          side,
          type: orderType,
          symbol,
          price: data.order.price,
          amount: numericAmount,
          status: "Filled",
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        });
        onFilled();
      } catch {
        setError("Network error. Please try again.");
        return;
      } finally {
        setSubmitting(false);
      }
    } else {
      onPlaceOrder({
        id: `${Date.now()}`,
        side,
        type: orderType,
        symbol,
        price: effectivePrice,
        amount: numericAmount,
        status: "Open",
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      });
    }
    setAmount("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => {
            setSide("buy");
            setError(null);
          }}
          className={cn(
            "rounded-md py-2 text-sm font-semibold transition-colors",
            side === "buy" ? "bg-success text-success-foreground" : "text-muted-foreground"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => {
            setSide("sell");
            setError(null);
          }}
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
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
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
          <span className={cn("font-mono", insufficientBalance && "text-danger")}>
            {side === "buy" ? `$${formatPrice(balance)} USDT` : `${holdingQty} ${symbol}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Order Value</span>
          <span>${formatPrice(total)} USDT</span>
        </div>

        {(error || (insufficientBalance && numericAmount > 0)) && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            {error ?? (side === "buy" ? "Insufficient USDT balance." : `Insufficient ${symbol} balance.`)}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!numericAmount || insufficientBalance || submitting}
          variant={side === "buy" ? "success" : "danger"}
          className="w-full"
          size="lg"
        >
          {submitting ? "Placing…" : side === "buy" ? `Buy ${symbol}` : `Sell ${symbol}`}
        </Button>
      </div>
    </div>
  );
}
