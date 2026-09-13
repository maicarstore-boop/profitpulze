"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TransactionPasswordFormProps {
  isSet: boolean;
  title?: string;
  description?: string;
  onSaved?: () => void;
}

/** Sets or changes the withdrawal transaction password. Reused on the withdraw gate and the account settings page. */
export function TransactionPasswordForm({ isSet, title, description, onSaved }: TransactionPasswordFormProps) {
  const [accountPassword, setAccountPassword] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (transactionPassword !== confirmPassword) {
      setError("Transaction passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transaction-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: accountPassword, transactionPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save transaction password.");
        return;
      }
      setAccountPassword("");
      setTransactionPassword("");
      setConfirmPassword("");
      setSuccess(isSet ? "Transaction password updated." : "Transaction password set.");
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="font-semibold">{title ?? (isSet ? "Change Transaction Password" : "Transaction Password Required")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ??
              "Withdrawals require a transaction password to keep your funds safe. Set it up once, then confirm every withdrawal with it."}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Account Password</label>
            <Input
              type="password"
              placeholder="Confirm your account password"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{isSet ? "New Transaction Password" : "Transaction Password"}</label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={transactionPassword}
              onChange={(e) => setTransactionPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Confirm Transaction Password</label>
            <Input
              type="password"
              placeholder="Re-enter transaction password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            className="w-full"
            disabled={loading || !accountPassword || transactionPassword.length < 6 || !confirmPassword}
            onClick={submit}
          >
            {loading ? "Saving…" : isSet ? "Update Transaction Password" : "Set Transaction Password"}
          </Button>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {success && <p className="text-xs text-success">{success}</p>}
      </CardContent>
    </Card>
  );
}
