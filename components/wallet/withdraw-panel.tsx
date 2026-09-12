"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionPasswordForm } from "@/components/wallet/transaction-password-form";
import type { SupportedCurrency } from "@/lib/payments/supported-currencies";

export function WithdrawPanel() {
  const [hasTransactionPassword, setHasTransactionPassword] = useState<boolean | null>(null);
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [ticker, setTicker] = useState("");
  const [address, setAddress] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setHasTransactionPassword(Boolean(data.user?.hasTransactionPassword)));
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
    const amount = Number(amountUsd);
    const timeout = setTimeout(() => {
      if (!ticker || !amount || amount <= 0) {
        setEstimate(null);
        return;
      }
      fetch(`/api/payments/estimate?amount=${amount}&currency=${ticker}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setEstimate(data?.estimatedAmount ?? null));
    }, 400);
    return () => clearTimeout(timeout);
  }, [ticker, amountUsd]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: ticker, address, amountUsd: Number(amountUsd), transactionPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit withdrawal.");
        return;
      }
      setSuccess("Withdrawal submitted for review. You'll be notified once it's approved and sent.");
      setAddress("");
      setAmountUsd("");
      setTransactionPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  if (hasTransactionPassword === null) {
    return null;
  }

  if (!hasTransactionPassword) {
    return (
      <div className="space-y-3">
        <TransactionPasswordForm isSet={false} onSaved={() => setHasTransactionPassword(true)} />
        <p className="text-xs text-muted-foreground">
          You can also set this later from{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          .
        </p>
      </div>
    );
  }

  const selected = currencies.find((c) => c.ticker === ticker);

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
          <label className="text-xs text-muted-foreground">Withdrawal Address</label>
          <Input
            placeholder={selected ? `Enter ${selected.symbol} address` : "Enter address"}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 font-mono text-xs"
          />
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
        <div>
          <label className="text-xs text-muted-foreground">Transaction Password</label>
          <Input
            type="password"
            placeholder="Enter your transaction password"
            value={transactionPassword}
            onChange={(e) => setTransactionPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          {estimate !== null
            ? `You'll receive approximately ${estimate} ${selected?.symbol ?? ""}. `
            : ""}
          Every withdrawal is reviewed and sent by our team — you&apos;ll be notified once it&apos;s on its way.
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {success && <p className="text-xs text-success">{success}</p>}
        <Button
          size="lg"
          className="w-full"
          disabled={submitting || !address || !amountUsd || transactionPassword.length < 6}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Request Withdrawal"}
        </Button>
      </CardContent>
    </Card>
  );
}
