"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SupportedCurrency } from "@/lib/payments/supported-currencies";

function TwoFactorEnrollment({ onEnabled }: { onEnabled: () => void }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start 2FA setup.");
        return;
      }
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      onEnabled();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="font-semibold">Two-Factor Authentication Required</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Withdrawals require 2FA to keep your funds safe. Set it up once, then confirm every withdrawal with a code.
          </p>
        </div>

        {!qrCode ? (
          <Button className="w-full" disabled={loading} onClick={startSetup}>
            {loading ? "Starting…" : "Set Up 2FA"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center rounded-xl border border-border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="2FA enrollment QR code" className="h-40 w-40" />
            </div>
            {secret && (
              <p className="break-all text-center text-xs text-muted-foreground">
                Can&apos;t scan? Enter this key manually: <span className="font-mono">{secret}</span>
              </p>
            )}
            <Input
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <Button className="w-full" disabled={loading || code.length !== 6} onClick={confirmSetup}>
              {loading ? "Confirming…" : "Confirm & Enable 2FA"}
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}

export function WithdrawPanel() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [ticker, setTicker] = useState("");
  const [address, setAddress] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setTwoFactorEnabled(Boolean(data.user?.twoFactorEnabled)));
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
        body: JSON.stringify({ currency: ticker, address, amountUsd: Number(amountUsd), totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit withdrawal.");
        return;
      }
      setSuccess(
        data.withdrawal.autoApproved
          ? "Withdrawal approved and is being processed."
          : "Withdrawal submitted for manual review."
      );
      setAddress("");
      setAmountUsd("");
      setTotpCode("");
    } finally {
      setSubmitting(false);
    }
  };

  if (twoFactorEnabled === null) {
    return null;
  }

  if (!twoFactorEnabled) {
    return <TwoFactorEnrollment onEnabled={() => setTwoFactorEnabled(true)} />;
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
          <label className="text-xs text-muted-foreground">2FA Code</label>
          <Input
            placeholder="6-digit code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            maxLength={6}
            className="mt-1"
          />
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          {estimate !== null
            ? `You'll receive approximately ${estimate} ${selected?.symbol ?? ""}. `
            : ""}
          Withdrawals above the auto-approval threshold require manual review.
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {success && <p className="text-xs text-success">{success}</p>}
        <Button
          size="lg"
          className="w-full"
          disabled={submitting || !address || !amountUsd || totpCode.length !== 6}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Request Withdrawal"}
        </Button>
      </CardContent>
    </Card>
  );
}
