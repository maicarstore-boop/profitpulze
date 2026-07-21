import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { MarketPriceSnapshotModel } from "@/models/MarketPriceSnapshot";
import { UserModel } from "@/models/User";
import { AuditLogModel } from "@/models/AuditLog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("Trading");
  await connectToDatabase();

  const { id } = await params;
  const trade = await BinaryTradeModel.findById(id).lean();
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  const [user, snapshots, auditEntries] = await Promise.all([
    UserModel.findById(trade.userId).select("email role status tradingSuspended").lean(),
    MarketPriceSnapshotModel.find({ tradeId: id }).sort({ recordedAt: 1 }).lean(),
    AuditLogModel.find({ targetType: "BinaryTrade", targetId: id }).sort({ createdAt: -1 }).lean(),
  ]);

  return NextResponse.json({
    trade: {
      id: trade._id.toString(),
      userId: trade.userId,
      userEmail: user?.email ?? "unknown",
      userStatus: user?.status ?? "unknown",
      tradingSuspended: user?.tradingSuspended ?? false,
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
      priceSource: trade.priceSource,
      flagged: trade.flagged,
      adminNote: trade.adminNote,
      cancelReason: trade.cancelReason,
      createdAt: trade.createdAt,
      updatedAt: trade.updatedAt,
    },
    priceSnapshots: snapshots.map((s) => ({
      context: s.context,
      price: s.price,
      recordedAt: s.recordedAt,
    })),
    auditLog: auditEntries.map((entry) => ({
      id: entry._id.toString(),
      adminEmail: entry.adminEmail,
      action: entry.action,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      reason: entry.reason,
      ip: entry.ip,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt,
    })),
  });
}
