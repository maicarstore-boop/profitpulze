import type { Metadata } from "next";
import {
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiBarChart2,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiClock,
  FiBookOpen,
  FiLock,
  FiCheckCircle,
  FiXCircle,
  FiServer,
  FiDatabase,
  FiWifi,
  FiCpu,
} from "react-icons/fi";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { formatCompact } from "@/lib/market-data";
import { fetchMarketCoins } from "@/lib/coingecko";
import { StakingPositionModel } from "@/models/StakingPosition";
import { adminOrders } from "@/lib/admin-data";
import { StatCard } from "@/components/admin/stat-card";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revenueTrend } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Overview — Admin — ProfitPulze",
};

async function getOverviewData() {
  let totalUsers = 0;
  let newToday = 0;
  let newThisWeek = 0;
  let mongoHealthy = false;

  try {
    await connectToDatabase();
    mongoHealthy = true;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let stakingTvlAgg: { tvl: number }[] = [];
    [totalUsers, newToday, newThisWeek, stakingTvlAgg] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      UserModel.countDocuments({ createdAt: { $gte: weekAgo } }),
      StakingPositionModel.aggregate([{ $match: { status: "active" } }, { $group: { _id: null, tvl: { $sum: "$principal" } } }]),
    ]);

    return { totalUsers, newToday, newThisWeek, mongoHealthy, totalStaked: stakingTvlAgg[0]?.tvl ?? 0 };
  } catch {
    mongoHealthy = false;
  }

  return { totalUsers, newToday, newThisWeek, mongoHealthy, totalStaked: 0 };
}

const SYSTEM_SERVICES = (mongoHealthy: boolean) => [
  { label: "MongoDB", healthy: mongoHealthy, icon: FiDatabase, detail: mongoHealthy ? "Connected" : "Connection failed" },
  { label: "WebSocket Gateway", healthy: true, icon: FiWifi, detail: "12,480 active connections" },
  { label: "API Server", healthy: true, icon: FiServer, detail: "p99 latency 84ms" },
  { label: "Redis Cache", healthy: true, icon: FiCpu, detail: "Hit rate 96.2%" },
];

export default async function AdminOverviewPage() {
  const [{ totalUsers, newToday, newThisWeek, mongoHealthy, totalStaked }, coins] = await Promise.all([
    getOverviewData(),
    fetchMarketCoins(50),
  ]);

  const dailyVolume = coins.reduce((sum, c) => sum + c.volume24h, 0);
  const openOrders = adminOrders.filter((o) => o.status === "Open" || o.status === "Partially Filled").length;
  const filledOrders = adminOrders.filter((o) => o.status === "Filled").length;
  const topPairs = [...coins].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time snapshot of platform health and activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} icon={FiUsers} sublabel="registered accounts" />
        <StatCard label="New Registrations (24h)" value={newToday.toLocaleString()} icon={FiUserPlus} sublabel="today" />
        <StatCard label="New Registrations (7d)" value={newThisWeek.toLocaleString()} icon={FiUserCheck} sublabel="this week" />
        <StatCard label="Online Users" value="8,214" icon={FiUsers} change={4.2} sublabel="vs last hour" />
        <StatCard label="Daily Trading Volume" value={`$${formatCompact(dailyVolume)}`} icon={FiBarChart2} change={6.8} />
        <StatCard label="Weekly Trading Volume" value={`$${formatCompact(dailyVolume * 6.4)}`} icon={FiBarChart2} change={3.1} />
        <StatCard label="Total Deposits (24h)" value="$18.4M" icon={FiArrowDownCircle} change={2.4} />
        <StatCard label="Total Withdrawals (24h)" value="$12.9M" icon={FiArrowUpCircle} change={-1.1} />
        <StatCard label="Pending Withdrawals" value="47" icon={FiClock} sublabel="awaiting review" />
        <StatCard label="Open Orders" value={openOrders.toLocaleString()} icon={FiBookOpen} sublabel="across all pairs" />
        <StatCard label="Filled Orders (24h)" value={filledOrders.toLocaleString()} icon={FiCheckCircle} />
        <StatCard label="Staking Assets (TVL)" value={`$${formatCompact(totalStaked)}`} icon={FiLock} sublabel="active staking positions" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart title="Revenue (7d)" description="Trading fees, withdrawal fees, and conversion spread" data={revenueTrend} color="var(--success)" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Top Trading Pairs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {topPairs.map((coin) => (
              <div key={coin.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: coin.color }}>
                    {coin.symbol.slice(0, 2)}
                  </span>
                  {coin.symbol}/USDT
                </div>
                <span className="text-muted-foreground">${formatCompact(coin.volume24h)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEM_SERVICES(mongoHealthy).map((service) => (
            <div key={service.label} className="flex items-center gap-3 rounded-xl border border-border p-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${service.healthy ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                <service.icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {service.label}
                  {service.healthy ? (
                    <FiCheckCircle className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <FiXCircle className="h-3.5 w-3.5 text-danger" />
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{service.detail}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
