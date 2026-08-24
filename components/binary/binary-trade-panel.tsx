"use client";

import { useMemo, useState } from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/market-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONTRACT_STYLES = [
  { key: "higher_lower", label: "Higher / Lower", up: "Higher", down: "Lower" },
  { key: "call_put", label: "Call / Put", up: "Call", down: "Put" },
  { key: "up_down", label: "Up / Down", up: "Up", down: "Down" },
] as const;
type ContractStyleKey = (typeof CONTRACT_STYLES)[number]["key"];

const TURBO_DURATIONS = [
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
];
const STANDARD_DURATIONS = [
  { label: "15m", seconds: 900 },
  { label: "30m", seconds: 1800 },
  { label: "1h", seconds: 3600 },
];

export const PAYOUT_RATE = 0.85;

export function BinaryTradePanel({
  symbol,
  price,
  available,
  disabled,
  disabledReason,
  onPlaced,
}: {
  symbol: string;
  price: number;
  available: number;
  disabled?: boolean;
  disabledReason?: string;
  onPlaced: () => void;
}) {
  const [contractStyle, setContractStyle] = useState<ContractStyleKey>("higher_lower");
  const [durationMode, setDurationMode] = useState<"turbo" | "standard" | "custom">("turbo");
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [customMinutes, setCustomMinutes] = useState("2");
  const [stake, setStake] = useState("25");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const style = CONTRACT_STYLES.find((s) => s.key === contractStyle)!;
  const numericStake = Number(stake) || 0;
  const insufficientBalance = numericStake > available;
  const potentialPayout = useMemo(() => Number((numericStake * (1 + PAYOUT_RATE)).toFixed(2)), [numericStake]);

  const effectiveDuration =
    durationMode === "custom" ? Math.max(1, Math.round(Number(customMinutes) || 0)) * 60 : durationSeconds;

  const placeTrade = async (direction: "up" | "down") => {
    setError(null);
    if (numericStake <= 0) {
      setError("Enter a stake amount.");
      return;
    }
    if (insufficientBalance) {
      setError("Insufficient balance.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/binary/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          symbol,
          contractStyle,
          direction,
          stake: numericStake,
          durationSeconds: effectiveDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to open trade.");
        return;
      }
      onPlaced();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-[11px]">
        {CONTRACT_STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setContractStyle(s.key)}
            className={cn(
              "rounded-md py-1.5 font-semibold transition-colors",
              contractStyle === s.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-xs text-muted-foreground">Duration</label>
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
          {(["turbo", "standard", "custom"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDurationMode(mode)}
              className={cn(
                "flex-1 rounded-md py-1.5 font-medium capitalize transition-colors",
                durationMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {durationMode !== "custom" ? (
          <div className="grid grid-cols-3 gap-2">
            {(durationMode === "turbo" ? TURBO_DURATIONS : STANDARD_DURATIONS).map((d) => (
              <button
                key={d.seconds}
                onClick={() => setDurationSeconds(d.seconds)}
                className={cn(
                  "rounded-md border py-1.5 text-xs font-medium transition-colors",
                  durationSeconds === d.seconds
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={1440}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full"
            />
            <span className="whitespace-nowrap text-xs text-muted-foreground">minutes</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <label className="text-xs text-muted-foreground">Stake (USDT)</label>
        <Input
          type="number"
          min={5}
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Payout rate</span>
          <span className="text-foreground">{Math.round(PAYOUT_RATE * 100)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Potential payout</span>
          <span className="font-mono text-success">${formatPrice(potentialPayout)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Available balance</span>
          <span className={cn("font-mono", insufficientBalance ? "text-danger" : "text-foreground")}>
            ${formatPrice(available)}
          </span>
        </div>
      </div>

      {(error || (disabled && disabledReason) || (!error && insufficientBalance && numericStake > 0)) && (
        <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {error ?? disabledReason ?? "Insufficient balance for this stake."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          onClick={() => placeTrade("up")}
          disabled={disabled || submitting || insufficientBalance || numericStake <= 0}
          variant="success"
          size="lg"
          className="flex items-center justify-center gap-1.5"
        >
          <FiArrowUp className="h-4 w-4" /> {style.up}
        </Button>
        <Button
          onClick={() => placeTrade("down")}
          disabled={disabled || submitting || insufficientBalance || numericStake <= 0}
          variant="danger"
          size="lg"
          className="flex items-center justify-center gap-1.5"
        >
          <FiArrowDown className="h-4 w-4" /> {style.down}
        </Button>
      </div>
    </div>
  );
}
