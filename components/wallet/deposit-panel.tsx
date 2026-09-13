"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SupportedCurrency } from "@/lib/payments/supported-currencies";

const TERMINAL_STATUSES = new Set(["finished", "failed", "refunded", "expired"]);

interface DepositResult {
  id: string;
  payCurrency: string;
  payAddress: string;
  payAmount: number;
  priceAmountUsd: number;
  status: string;
  expiresAt: string | null;
  qrCode?: string;
}

export function DepositPanel({ onFinished }: { onFinished?: () => void } = {}) {
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [ticker, setTicker] = useState("");
  const [amountUsd, setAmountUsd] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deposit, setDeposit] = useState<DepositResult | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/payments/currencies")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.currencies)) {
          setCurrencies(data.currencies);
          if (data.currencies[0]) setTicker(data.currencies[0].ticker);
        }
      });
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollStatus = useCallback(
    (depositId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const res = await fetch(`/api/deposits/${depositId}`);
        if (!res.ok) return;
        const data = await res.json();
        setDeposit((prev) => (prev ? { ...prev, status: data.deposit.status } : prev));
        if (data.deposit.status === "finished") {
          onFinished?.();
        }
        if (TERMINAL_STATUSES.has(data.deposit.status) && pollRef.current) {
          clearInterval(pollRef.current);
        }
      }, 5000);
    },
    [onFinished]
  );

  const handleGenerate = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: ticker, amountUsd: Number(amountUsd) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create deposit.");
        return;
      }
      setDeposit(data.deposit);
      pollStatus(data.deposit.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!deposit) return;
    await navigator.clipboard.writeText(deposit.payAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const selected = currencies.find((c) => c.ticker === ticker);

  if (deposit) {
    return (
      <Card className="max-w-md">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Deposit {deposit.payCurrency.toUpperCase()}
            </span>
            <Badge variant={deposit.status === "finished" ? "success" : "outline"} className="capitalize">
              {deposit.status}
            </Badge>
          </div>

          {deposit.qrCode && (
            <div className="flex justify-center rounded-xl border border-border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={deposit.qrCode} alt="Deposit address QR code" className="h-40 w-40" />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Deposit Address</label>
            <div className="mt-1 flex gap-2">
              <Input value={deposit.payAddress} readOnly className="flex-1 font-mono text-xs" />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <FiCheck className="h-4 w-4 text-success" /> : <FiCopy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Amount to Send</div>
              <div className="font-mono">
                {deposit.payAmount} {deposit.payCurrency.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">USD Value</div>
              <div className="font-mono">${deposit.priceAmountUsd.toFixed(2)}</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Send exactly this amount of {deposit.payCurrency.toUpperCase()} to the address above. Your balance updates
            automatically once the network confirms the transaction.
          </p>

          <Button variant="outline" className="w-full" onClick={() => setDeposit(null)}>
            Start a New Deposit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div>
          <label className="text-xs text-muted-foreground">Select Asset</label>
          <Select value={ticker} onChange={(e) => setTicker(e.target.value)} className="mt-1">
            {currencies.map((c) => (
              <option key={c.ticker} value={c.ticker}>
                {c.symbol} ({c.network})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount (USD)</label>
          <Input
            type="number"
            min={20}
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            className="mt-1"
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button size="lg" className="w-full" disabled={submitting || !ticker} onClick={handleGenerate}>
          {submitting ? "Generating…" : "Generate Deposit Address"}
        </Button>
        {selected && (
          <p className="text-xs text-muted-foreground">
            Send only {selected.symbol} on the {selected.network} network to the generated address. Deposits are
            credited after the required number of network confirmations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
