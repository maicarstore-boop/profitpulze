"use client";

import { useEffect, useState } from "react";
import { FiCheckCircle, FiLock } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionPasswordForm } from "@/components/wallet/transaction-password-form";

export function SettingsView() {
  const [hasTransactionPassword, setHasTransactionPassword] = useState<boolean | null>(null);
  const [editing, setEditing] = useState(false);

  const refresh = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setHasTransactionPassword(Boolean(data.user?.hasTransactionPassword)));
  };

  useEffect(refresh, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-lg font-semibold">Security</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage the credentials that protect your account and your withdrawals.
      </p>

      <div className="mt-6 space-y-6">
        {hasTransactionPassword !== null && !editing ? (
          <Card className="max-w-md">
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FiLock className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold">Transaction Password</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasTransactionPassword
                      ? "Required to confirm every withdrawal you make."
                      : "Not set yet — you'll need one before you can withdraw."}
                  </p>
                  {hasTransactionPassword && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-success">
                      <FiCheckCircle className="h-3.5 w-3.5" /> Set
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                {hasTransactionPassword ? "Change" : "Set up"}
              </button>
            </CardContent>
          </Card>
        ) : (
          hasTransactionPassword !== null && (
            <TransactionPasswordForm
              isSet={hasTransactionPassword}
              onSaved={() => {
                setEditing(false);
                refresh();
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
