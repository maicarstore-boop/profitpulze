"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiLock, FiUnlock, FiClock } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StakingCalculator } from "@/components/staking/staking-calculator";
import { useAuth } from "@/components/auth/auth-provider";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface Pool {
  id: string;
  symbol: string;
  type: "flexible" | "locked";
  lockDays: number;
  apy: number;
  minStake: number;
}

interface Position {
  id: string;
  symbol: string;
  type: "flexible" | "locked";
  lockDays: number;
  apy: number;
  principal: number;
  startedAt: string;
  unlocksAt: string | null;
  status: "active" | "unstaked";
  accruedRewards: number;
}

function StakeForm({ pool, available, onStaked }: { pool: Pool; available: number; onStaked: () => void }) {
  const [amount, setAmount] = useState(String(pool.minStake));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/staking/positions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ poolId: pool.id, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to stake.");
        return;
      }
      setOpen(false);
      onStaked();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setOpen(true)}>
        Stake Now
      </Button>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Input
        type="number"
        min={pool.minStake}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-9"
      />
      <p className="text-xs text-muted-foreground">Available: {formatPrice(available)} USDT</p>
      {error && <p className="rounded-md bg-danger/10 px-2 py-1.5 text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" disabled={busy} onClick={submit}>
          Confirm Stake
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function MyPositions({ positions, onChanged }: { positions: Position[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unstake = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/staking/positions/${id}/unstake`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to unstake.");
        return;
      }
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  if (positions.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold">My Staking Positions</h2>
      {error && <p className="mt-2 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
      <div className="mt-4 space-y-2">
        {positions.map((p) => {
          const locked = p.type === "locked" && p.status === "active" && p.unlocksAt && new Date(p.unlocksAt) > new Date();
          return (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {p.symbol} · {p.type === "flexible" ? "Flexible" : `Locked ${p.lockDays}d`}
                  <Badge variant={p.status === "active" ? "success" : "outline"} className="capitalize">
                    {p.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Staked {formatPrice(p.principal)} {p.symbol} at {p.apy}% APY
                  {locked && p.unlocksAt && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <FiClock className="h-3 w-3" /> unlocks {new Date(p.unlocksAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{p.status === "active" ? "Accrued" : "Rewards Paid"}</div>
                  <div className="font-semibold text-success">+{formatPrice(p.accruedRewards)} {p.symbol}</div>
                </div>
                {p.status === "active" && (
                  <Button
                    size="sm"
                    variant={locked ? "outline" : "primary"}
                    disabled={!!locked || busyId === p.id}
                    onClick={() => unstake(p.id)}
                  >
                    {locked ? "Locked" : "Unstake"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function StakingView() {
  const { user } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [available, setAvailable] = useState(0);

  const loadPools = useCallback(async () => {
    const res = await fetch("/api/staking/pools");
    const data = await res.json();
    if (Array.isArray(data.pools)) setPools(data.pools);
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    const [posRes, balRes] = await Promise.all([fetch("/api/staking/positions"), fetch("/api/binary/balance")]);
    const [posData, balData] = await Promise.all([posRes.json(), balRes.json()]);
    if (Array.isArray(posData.positions)) setPositions(posData.positions);
    if (balData.balance) setAvailable(balData.balance.available);
  }, [user]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  useEffect(() => {
    loadUserData();
    const id = setInterval(loadUserData, 10000);
    return () => clearInterval(id);
  }, [loadUserData]);

  const refreshAll = () => {
    loadUserData();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-lg font-semibold">Staking Products</h2>
          {!user && (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Log in</Link> to stake your USDT balance and earn real rewards.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {pools.map((pool) => {
              const Icon = pool.type === "flexible" ? FiUnlock : FiLock;
              return (
                <Card key={pool.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <Badge variant={pool.type === "flexible" ? "success" : "outline"}>
                        {pool.type === "flexible" ? "No lock-up" : `${pool.lockDays} days`}
                      </Badge>
                    </div>
                    <div className="mt-4 text-lg font-bold">{pool.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      Min. stake {pool.minStake} {pool.symbol}
                    </div>
                    <div className="mt-3 text-2xl font-bold text-success">{pool.apy}%</div>
                    <div className="text-xs text-muted-foreground">Real APY, paid from your USDT wallet balance</div>
                    {user ? (
                      <StakeForm pool={pool} available={available} onStaked={refreshAll} />
                    ) : (
                      <Link href="/login">
                        <Button variant="outline" size="sm" className="mt-4 w-full">Log In to Stake</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {pools.length === 0 && (
              <p className="text-sm text-muted-foreground">No staking pools are currently available.</p>
            )}
          </div>

          {user && <MyPositions positions={positions} onChanged={refreshAll} />}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <StakingCalculator pools={pools} />
        </div>
      </div>
    </div>
  );
}
