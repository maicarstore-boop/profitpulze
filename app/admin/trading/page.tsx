"use client";

import { useState } from "react";
import { FiAlertTriangle, FiCpu, FiEye } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { BinaryTradesTab } from "@/components/admin/binary-trades-tab";
import { adminOrders, type OrderStatus } from "@/lib/admin-data";
import { useCoins } from "@/hooks/use-coins";
import { formatCompact, formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["Pending", "Open", "Partially Filled", "Filled", "Cancelled", "Rejected", "Expired"];

function OrdersTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = adminOrders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <FiEye className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This view is for monitoring and compliance review only. Realized PnL is calculated from execution
          prices and market data — administrators cannot edit order outcomes here.
        </p>
      </div>

      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-52">
        <option value="all">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Pair</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Realized PnL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.user}</td>
                <td className="px-4 py-3 font-medium">{order.symbol}</td>
                <td className={cn("px-4 py-3 font-medium", order.side === "buy" ? "text-success" : "text-danger")}>
                  {order.side === "buy" ? "Buy" : "Sell"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.type}</td>
                <td className="px-4 py-3">${formatPrice(order.price)}</td>
                <td className="px-4 py-3">{order.amount}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className={cn("px-4 py-3 font-medium", order.pnl >= 0 ? "text-success" : "text-danger")}>
                  {order.pnl >= 0 ? "+" : ""}${order.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MarketActivityTab() {
  const coins = useCoins(30);
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Pair</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">24h Change</th>
            <th className="px-4 py-3 font-medium">24h Volume</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{coin.symbol}/USDT</td>
              <td className="px-4 py-3">${formatPrice(coin.price)}</td>
              <td className={cn("px-4 py-3", coin.change24h >= 0 ? "text-success" : "text-danger")}>
                {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-muted-foreground">${formatCompact(coin.volume24h)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function RiskTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Matching Engine Status" value="Operational" icon={FiCpu} sublabel="p99 8.2ms" />
        <StatCard label="Flagged Orders (24h)" value="6" icon={FiAlertTriangle} sublabel="pending review" />
        <StatCard label="Auto-Halted Pairs" value="0" icon={FiEye} sublabel="none currently" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suspicious Activity Detection</CardTitle>
          <CardDescription>Pattern-based flags — wash trading, layering, and abnormal velocity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {[
            { user: "diego.f@example.com", pattern: "Rapid order placement/cancellation (layering)", severity: "High" },
            { user: "sana.i@example.com", pattern: "Self-trade across linked accounts", severity: "Medium" },
            { user: "marco.b@example.com", pattern: "Unusual order size vs. account history", severity: "Low" },
          ].map((flag) => (
            <div key={flag.user + flag.pattern} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <div>
                <div className="font-medium">{flag.user}</div>
                <div className="text-xs text-muted-foreground">{flag.pattern}</div>
              </div>
              <StatusBadge status={flag.severity === "High" ? "Escalated" : flag.severity === "Medium" ? "Pending" : "Open"} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminTradingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Trading Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor orders, market activity, and trading risk across the platform.</p>
      </div>

      <Tabs
        items={[
          { key: "binary", label: "Binary Options", content: <BinaryTradesTab /> },
          { key: "orders", label: "Orders & Trade History", content: <OrdersTab /> },
          { key: "market", label: "Market Activity", content: <MarketActivityTab /> },
          { key: "risk", label: "Risk & Matching Engine", content: <RiskTab /> },
        ]}
      />
    </div>
  );
}
