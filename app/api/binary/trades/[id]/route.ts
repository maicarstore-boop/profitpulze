import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { settleDueTrades } from "@/lib/binary-trading";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  await settleDueTrades();
  await connectToDatabase();

  const { id } = await params;
  const trade = await BinaryTradeModel.findOne({ _id: id, userId: session.userId }).lean();

  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  return NextResponse.json({
    trade: {
      id: trade._id.toString(),
      symbol: trade.symbol,
      contractStyle: trade.contractStyle,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      stake: trade.stake,
      payoutRate: trade.payoutRate,
      potentialPayout: trade.potentialPayout,
      durationSeconds: trade.durationSeconds,
      openedAt: trade.openedAt,
      expiresAt: trade.expiresAt,
      status: trade.status,
      result: trade.result,
      profitLoss: trade.profitLoss,
      createdAt: trade.createdAt,
    },
  });
}
