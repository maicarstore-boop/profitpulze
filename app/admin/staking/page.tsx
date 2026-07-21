"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/market-data";
import { FiLock, FiUsers, FiPercent, FiGift, FiPlus } from "react-icons/fi";

interface AdminPool {
  id: string;
  symbol: string;
  type: "flexible" | "locked";
  lockDays: number;
  apy: number;
  minStake: number;
  active: boolean;
}

interface AdminPosition {
  id: string;
  userEmail: string;
  symbol: string;
  type: string;
  lockDays: number;
  principal: number;
  status: string;
  unstakedAt: string | null;
  rewardsPaid: number;
}

function usePools() {
  const [pools, setPools] = useState<AdminPool[]>([]);
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/staking-pools");
    const data = await res.json();
    if (Array.isArray(data.pools)) setPools(data.pools);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { pools, reload: load };
}

function NewPoolForm({ onCreated }: { onCreated: () => void }) {
  const [symbol, setSymbol] = useState("USDT");
  const [type, setType] = useState<"flexible" | "locked">("flexible");
  const [lockDays, setLockDays] = useState("30");
  const [apy, setApy] = useState("");
  const [minStake, setMinStake] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/staking-pools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol, type, lockDays: Number(lockDays), apy: Number(apy), minStake: Number(minStake) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create pool.");
        return;
      }
      setApy("");
      setMinStake("");
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>New Pool</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3 pt-0">
        <div>
          <label className="text-xs text-muted-foreground">Symbol</label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="mt-1 w-24" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Type</label>
          <Select value={type} onChange={(e) => setType(e.target.value as "flexible" | "locked")} className="mt-1 w-32">
            <option value="flexible">Flexible</option>
            <option value="locked">Locked</option>
          </Select>
        </div>
        {type === "locked" && (
          <div>
            <label className="text-xs text-muted-foreground">Lock Days</label>
            <Input type="number" value={lockDays} onChange={(e) => setLockDays(e.target.value)} className="mt-1 w-24" />
          </div>
        )}
        <div>
          <label className="text-xs text-muted-foreground">APY %</label>
          <Input type="number" value={apy} onChange={(e) => setApy(e.target.value)} className="mt-1 w-24" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Min Stake</label>
          <Input type="number" value={minStake} onChange={(e) => setMinStake(e.target.value)} className="mt-1 w-28" />
        </div>
        <Button disabled={busy || !apy || !minStake} onClick={submit} className="gap-1.5">
          <FiPlus className="h-3.5 w-3.5" /> Create Pool
        </Button>
        {error && <p className="w-full text-xs text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}

function PoolsTab({ pools, reload }: { pools: AdminPool[]; reload: () => void }) {
  const [edits, setEdits] = useState<Record<string, { apy?: string; minStake?: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const save = async (pool: AdminPool) => {
    const edit = edits[pool.id];
    if (!edit) return;
    setBusyId(pool.id);
    try {
      const body: Record<string, number> = {};
      if (edit.apy !== undefined && edit.apy !== "") body.apy = Number(edit.apy);
      if (edit.minStake !== undefined && edit.minStake !== "") body.minStake = Number(edit.minStake);
      await fetch(`/api/admin/staking-pools/${pool.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setEdits((prev) => ({ ...prev, [pool.id]: {} }));
      reload();
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (pool: AdminPool) => {
    setBusyId(pool.id);
    try {
      await fetch(`/api/admin/staking-pools/${pool.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !pool.active }),
      });
      reload();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <NewPoolForm onCreated={reload} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Min Stake</th>
              <th className="px-4 py-3 font-medium">Current APY</th>
              <th className="px-4 py-3 font-medium">Edit APY</th>
              <th className="px-4 py-3 font-medium">Edit Min Stake</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pools.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-medium">{p.symbol}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.type === "flexible" ? "Flexible" : `Locked ${p.lockDays}d`}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.minStake}</td>
                <td className="px-4 py-3 text-success">{p.apy}%</td>
                <td className="px-4 py-3">
                  <Input
                    value={edits[p.id]?.apy ?? ""}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], apy: e.target.value } }))}
                    placeholder={`${p.apy}`}
                    className="h-8 w-24"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={edits[p.id]?.minStake ?? ""}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], minStake: e.target.value } }))}
                    placeholder={`${p.minStake}`}
                    className="h-8 w-24"
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.active ? "success" : "outline"}>{p.active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => save(p)}>Update</Button>
                    <Button size="sm" variant="ghost" disabled={busyId === p.id} onClick={() => toggleActive(p)}>
                      {p.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {pools.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No pools yet — create one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function RewardsTab() {
  const [positions, setPositions] = useState<AdminPosition[]>([]);
  const [stats, setStats] = useState({ tvl: 0, activeStakers: 0, blendedApy: 0, totalRewardsPaid: 0 });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/staking-positions?limit=100");
    const data = await res.json();
    if (Array.isArray(data.positions)) setPositions(data.positions);
    if (data.stats) setStats(data.stats);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const distributions = positions.filter((p) => p.status === "unstaked" && p.rewardsPaid > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Locked (TVL)" value={`$${formatPrice(stats.tvl)}`} icon={FiLock} sublabel="active positions" />
        <StatCard label="Active Stakers" value={String(stats.activeStakers)} icon={FiUsers} sublabel="distinct users" />
        <StatCard label="Blended APY" value={`${stats.blendedApy}%`} icon={FiPercent} sublabel="principal-weighted" />
        <StatCard label="Total Rewards Paid" value={`$${formatPrice(stats.totalRewardsPaid)}`} icon={FiGift} sublabel="all-time" />
      </div>
      <Card>
        <CardHeader><CardTitle>Reward Distribution Log</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm">
          {distributions.length === 0 && <p className="text-muted-foreground">No rewards have been paid out yet.</p>}
          {distributions.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
              <span>{p.userEmail} · {p.symbol} {p.type === "flexible" ? "Flexible" : `Locked ${p.lockDays}d`}</span>
              <span className="text-success">+{formatPrice(p.rewardsPaid)} {p.symbol}</span>
              <Badge variant="outline">{p.unstakedAt ? new Date(p.unstakedAt).toLocaleDateString() : "—"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminStakingPage() {
  const { pools, reload } = usePools();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Staking Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage staking pools, APY settings, and real reward distribution.</p>
      </div>
      <Tabs
        items={[
          { key: "pools", label: "Pools & APY Settings", content: <PoolsTab pools={pools} reload={reload} /> },
          { key: "rewards", label: "Rewards & Locked Assets", content: <RewardsTab /> },
        ]}
      />
    </div>
  );
}
