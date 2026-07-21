import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { getOrCreateBalance, getUserTradeStats, settleDueTrades } from "@/lib/binary-trading";

export async function GET() {
  const session = await verifySession();
  await settleDueTrades();

  const [balance, stats, openTradesCount] = await Promise.all([
    getOrCreateBalance(session.userId),
    getUserTradeStats(session.userId),
    BinaryTradeModel.countDocuments({ userId: session.userId, status: "open" }),
  ]);

  const lockedInTrades = await BinaryTradeModel.aggregate([
    { $match: { userId: session.userId, status: "open" } },
    { $group: { _id: null, total: { $sum: "$stake" } } },
  ]);

  return NextResponse.json({
    balance: {
      available: balance.available,
      currency: balance.currency,
      locked: lockedInTrades[0]?.total ?? 0,
      openTradesCount,
    },
    stats,
  });
}
