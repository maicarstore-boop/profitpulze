import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { StakingPositionModel } from "@/models/StakingPosition";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  await requirePermission("Staking");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const filter: Record<string, unknown> = {};
  if (status === "active" || status === "unstaked") filter.status = status;

  const positions = await StakingPositionModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const userIds = [...new Set(positions.map((p) => p.userId))];
  const users = await UserModel.find({ _id: { $in: userIds } }).select("email").lean();
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  const [activeAgg] = await StakingPositionModel.aggregate([
    { $match: { status: "active" } },
    {
      $group: {
        _id: null,
        tvl: { $sum: "$principal" },
        weightedApy: { $sum: { $multiply: ["$principal", "$apy"] } },
        stakerIds: { $addToSet: "$userId" },
      },
    },
  ]);

  const [rewardsAgg] = await StakingPositionModel.aggregate([
    { $match: { status: "unstaked" } },
    { $group: { _id: null, totalRewardsPaid: { $sum: "$rewardsPaid" } } },
  ]);

  const tvl = activeAgg?.tvl ?? 0;
  const blendedApy = tvl > 0 ? Number((activeAgg.weightedApy / tvl).toFixed(2)) : 0;
  const activeStakers = activeAgg?.stakerIds?.length ?? 0;

  return NextResponse.json({
    positions: positions.map((p) => ({
      id: p._id.toString(),
      userEmail: emailByUserId.get(p.userId) ?? "unknown",
      symbol: p.symbol,
      type: p.type,
      lockDays: p.lockDays,
      apy: p.apy,
      principal: p.principal,
      startedAt: p.startedAt,
      unlocksAt: p.unlocksAt,
      status: p.status,
      unstakedAt: p.unstakedAt,
      rewardsPaid: p.rewardsPaid,
    })),
    stats: {
      tvl,
      activeStakers,
      blendedApy,
      totalRewardsPaid: rewardsAgg?.totalRewardsPaid ?? 0,
    },
  });
}
