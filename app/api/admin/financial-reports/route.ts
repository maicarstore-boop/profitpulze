import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { StakingPositionModel } from "@/models/StakingPosition";

interface Window {
  label: string;
  revenue: number;
  volume: number;
  stakingRewardsPaid: number;
  netProfit: number;
}

/**
 * Platform "revenue" is the real house edge from binary trading: BinaryTrade.profitLoss is
 * recorded from the USER's perspective (negative = user lost = house kept the stake), so
 * -sum(profitLoss) over settled trades is genuine platform income, not a placeholder number.
 * Staking rewards paid out are a real cost against that income.
 */
async function computeWindow(label: string, since: Date): Promise<Window> {
  const [tradeAgg] = await BinaryTradeModel.aggregate([
    { $match: { status: "settled", updatedAt: { $gte: since } } },
    { $group: { _id: null, revenue: { $sum: { $multiply: ["$profitLoss", -1] } }, volume: { $sum: "$stake" } } },
  ]);
  const [stakingAgg] = await StakingPositionModel.aggregate([
    { $match: { status: "unstaked", unstakedAt: { $gte: since } } },
    { $group: { _id: null, rewardsPaid: { $sum: "$rewardsPaid" } } },
  ]);

  const revenue = Number((tradeAgg?.revenue ?? 0).toFixed(2));
  const volume = Number((tradeAgg?.volume ?? 0).toFixed(2));
  const stakingRewardsPaid = Number((stakingAgg?.rewardsPaid ?? 0).toFixed(2));

  return { label, revenue, volume, stakingRewardsPaid, netProfit: Number((revenue - stakingRewardsPaid).toFixed(2)) };
}

export async function GET() {
  await requirePermission("Reports");
  await connectToDatabase();

  const now = Date.now();
  const [last7d, last30d, allTime] = await Promise.all([
    computeWindow("7d", new Date(now - 7 * 24 * 60 * 60 * 1000)),
    computeWindow("30d", new Date(now - 30 * 24 * 60 * 60 * 1000)),
    computeWindow("all", new Date(0)),
  ]);

  const [monthlyTrades, monthlyStaking] = await Promise.all([
    BinaryTradeModel.aggregate([
      { $match: { status: "settled" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } },
          revenue: { $sum: { $multiply: ["$profitLoss", -1] } },
          volume: { $sum: "$stake" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),
    StakingPositionModel.aggregate([
      { $match: { status: "unstaked" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$unstakedAt" } },
          rewardsPaid: { $sum: "$rewardsPaid" },
        },
      },
    ]),
  ]);

  const rewardsByMonth = new Map(monthlyStaking.map((m) => [m._id, m.rewardsPaid]));
  const monthly = monthlyTrades.map((m) => {
    const revenue = Number(m.revenue.toFixed(2));
    const stakingRewardsPaid = Number((rewardsByMonth.get(m._id) ?? 0).toFixed(2));
    return {
      month: m._id,
      revenue,
      volume: Number(m.volume.toFixed(2)),
      stakingRewardsPaid,
      netProfit: Number((revenue - stakingRewardsPaid).toFixed(2)),
    };
  });

  return NextResponse.json({ last7d, last30d, allTime, monthly });
}
