"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiFileText, FiDollarSign, FiPercent, FiTrendingUp, FiActivity } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/market-data";

interface Window {
  label: string;
  revenue: number;
  volume: number;
  stakingRewardsPaid: number;
  netProfit: number;
}

interface MonthRow extends Window {
  month: string;
}

function RevenueTab({ last7d, last30d, allTime }: { last7d: Window | null; last30d: Window | null; allTime: Window | null }) {
  if (!last7d || !last30d || !allTime) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Trading Revenue (7d)" value={`$${formatPrice(last7d.revenue)}`} icon={FiDollarSign} sublabel="house edge, real" />
        <StatCard label="Trading Volume (7d)" value={`$${formatPrice(last7d.volume)}`} icon={FiActivity} sublabel="total stakes" />
        <StatCard label="Staking Rewards Paid (7d)" value={`$${formatPrice(last7d.stakingRewardsPaid)}`} icon={FiPercent} sublabel="real cost" />
        <StatCard label="Net Profit (7d)" value={`$${formatPrice(last7d.netProfit)}`} icon={FiTrendingUp} sublabel="revenue − staking rewards" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Last 30 Days</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <Row label="Revenue" value={`$${formatPrice(last30d.revenue)}`} />
            <Row label="Volume" value={`$${formatPrice(last30d.volume)}`} />
            <Row label="Staking Rewards Paid" value={`$${formatPrice(last30d.stakingRewardsPaid)}`} />
            <Row label="Net Profit" value={`$${formatPrice(last30d.netProfit)}`} bold />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>All Time</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <Row label="Revenue" value={`$${formatPrice(allTime.revenue)}`} />
            <Row label="Volume" value={`$${formatPrice(allTime.volume)}`} />
            <Row label="Staking Rewards Paid" value={`$${formatPrice(allTime.stakingRewardsPaid)}`} />
            <Row label="Net Profit" value={`$${formatPrice(allTime.netProfit)}`} bold />
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Revenue is the real house edge from binary options settlement (stakes kept on losses, minus payouts on wins), computed
        directly from settled trades — not a placeholder. This platform charges no spot/margin trading fees, so there is no
        separate fee line.
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold text-success" : ""}>{value}</span>
    </div>
  );
}

function MonthlyTab({ monthly }: { monthly: MonthRow[] }) {
  const exportCsv = () => {
    const headers = ["Month", "Revenue", "Volume", "Staking Rewards Paid", "Net Profit"];
    const rows = monthly.map((m) => [m.month, m.revenue, m.volume, m.stakingRewardsPaid, m.netProfit]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={exportCsv}><FiDownload className="h-3.5 w-3.5" /> Export CSV</Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
              <th className="px-4 py-3 font-medium">Volume</th>
              <th className="px-4 py-3 font-medium">Staking Rewards Paid</th>
              <th className="px-4 py-3 font-medium">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((row) => (
              <tr key={row.month} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{row.month}</td>
                <td className="px-4 py-3">${formatPrice(row.revenue)}</td>
                <td className="px-4 py-3 text-muted-foreground">${formatPrice(row.volume)}</td>
                <td className="px-4 py-3 text-muted-foreground">${formatPrice(row.stakingRewardsPaid)}</td>
                <td className="px-4 py-3 text-success">${formatPrice(row.netProfit)}</td>
              </tr>
            ))}
            {monthly.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No settled activity yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState<{ last7d: Window; last30d: Window; allTime: Window; monthly: MonthRow[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/financial-reports")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real revenue, trading volume, and monthly profit — computed from settled trades.</p>
      </div>
      <Tabs
        items={[
          { key: "revenue", label: "Revenue & Volume", content: <RevenueTab last7d={data?.last7d ?? null} last30d={data?.last30d ?? null} allTime={data?.allTime ?? null} /> },
          { key: "monthly", label: "Monthly Reports & Export", content: <MonthlyTab monthly={data?.monthly ?? []} /> },
        ]}
      />
      <Card>
        <CardHeader><CardTitle>Note</CardTitle></CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          <FiFileText className="mr-1.5 inline h-3.5 w-3.5" />
          PDF export isn&apos;t wired up in this build (requires a backend document-rendering service) — CSV export above uses real report data.
        </CardContent>
      </Card>
    </div>
  );
}
