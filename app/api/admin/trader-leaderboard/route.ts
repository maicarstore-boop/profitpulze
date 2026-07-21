import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { UserModel } from "@/models/User";
import { UserBalanceModel } from "@/models/UserBalance";

/** Real max drawdown: largest peak-to-trough decline in a user's cumulative P/L curve, walked chronologically. */
function computeMaxDrawdown(profitLossSequence: number[]): number {
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const pl of profitLossSequence) {
    cumulative += pl;
    peak = Math.max(peak, cumulative);
    maxDrawdown = Math.max(maxDrawdown, peak - cumulative);
  }
  return maxDrawdown;
}

export async function GET() {
  await requirePermission("Trading");
  await connectToDatabase();

  const ranked = await BinaryTradeModel.aggregate([
    { $match: { status: "settled" } },
    {
      $group: {
        _id: "$userId",
        totalTrades: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
        netProfitLoss: { $sum: "$profitLoss" },
        totalStaked: { $sum: "$stake" },
      },
    },
    { $match: { totalTrades: { $gte: 3 } } },
    { $sort: { netProfitLoss: -1 } },
    { $limit: 20 },
  ]);

  const userIds = ranked.map((r) => r._id);
  const [users, balances, tradeSequences] = await Promise.all([
    UserModel.find({ _id: { $in: userIds } }).select("email").lean(),
    UserBalanceModel.find({ userId: { $in: userIds } }).lean(),
    BinaryTradeModel.find({ userId: { $in: userIds }, status: "settled" })
      .sort({ createdAt: 1 })
      .select("userId profitLoss")
      .lean(),
  ]);

  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));
  const balanceByUserId = new Map(balances.map((b) => [b.userId, b.available]));
  const sequenceByUserId = new Map<string, number[]>();
  for (const t of tradeSequences) {
    const seq = sequenceByUserId.get(t.userId) ?? [];
    seq.push(t.profitLoss ?? 0);
    sequenceByUserId.set(t.userId, seq);
  }

  const traders = ranked.map((r) => {
    const winRate = Number(((r.wins / r.totalTrades) * 100).toFixed(1));
    const roi = r.totalStaked > 0 ? Number(((r.netProfitLoss / r.totalStaked) * 100).toFixed(1)) : 0;
    const drawdown = computeMaxDrawdown(sequenceByUserId.get(r._id) ?? []);
    const drawdownPct = r.totalStaked > 0 ? Number(((drawdown / r.totalStaked) * 100).toFixed(1)) : 0;

    return {
      userId: r._id,
      email: emailByUserId.get(r._id) ?? "unknown",
      totalTrades: r.totalTrades,
      winRate,
      netProfitLoss: Number(r.netProfitLoss.toFixed(2)),
      roi,
      aum: Number((balanceByUserId.get(r._id) ?? 0).toFixed(2)),
      maxDrawdownPct: drawdownPct,
    };
  });

  return NextResponse.json({ traders });
}
