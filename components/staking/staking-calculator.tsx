"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Pool {
  id: string;
  symbol: string;
  type: "flexible" | "locked";
  lockDays: number;
  apy: number;
  minStake: number;
}

export function StakingCalculator({ pools }: { pools: Pool[] }) {
  const [poolId, setPoolId] = useState<string | null>(null);
  const [amount, setAmount] = useState("1000");

  useEffect(() => {
    if (!poolId && pools.length > 0) setPoolId(pools[0]!.id);
  }, [pools, poolId]);

  const pool = pools.find((p) => p.id === poolId) ?? pools[0];

  const { daily, monthly, yearly } = useMemo(() => {
    if (!pool) return { daily: 0, monthly: 0, yearly: 0 };
    const principal = Number(amount) || 0;
    const yearly = principal * (pool.apy / 100);
    return { daily: yearly / 365, monthly: yearly / 12, yearly };
  }, [amount, pool]);

  if (!pool) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold">Reward Calculator</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Product</label>
            <Select value={pool.id} onChange={(e) => setPoolId(e.target.value)} className="mt-1">
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.symbol} · {p.type === "flexible" ? "Flexible" : `Locked ${p.lockDays}d`} · {p.apy}% APY
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Amount ({pool.symbol})</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Daily</div>
              <div className="mt-1 font-semibold text-success">+{daily.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Monthly</div>
              <div className="mt-1 font-semibold text-success">+{monthly.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Yearly</div>
              <div className="mt-1 font-semibold text-success">+{yearly.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
