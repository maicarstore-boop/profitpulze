import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { BinaryTradeModel } from "@/models/BinaryTrade";
import { UserModel } from "@/models/User";

const STATUS_FILTERS = ["open", "settled", "cancelled"] as const;

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  await requirePermission("Trading");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const symbol = searchParams.get("symbol")?.trim();
  const flagged = searchParams.get("flagged");
  const userQuery = searchParams.get("user")?.trim();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const format = searchParams.get("format");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const filter: Record<string, unknown> = {};
  if (status && (STATUS_FILTERS as readonly string[]).includes(status)) {
    filter.status = status;
  }
  if (symbol) filter.symbol = symbol.toUpperCase();
  if (flagged === "true") filter.flagged = true;

  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.$gte = new Date(dateFrom);
    if (dateTo) createdAt.$lte = new Date(dateTo);
    filter.createdAt = createdAt;
  }

  if (userQuery) {
    const matchingUsers = await UserModel.find({ email: { $regex: userQuery, $options: "i" } })
      .select("_id")
      .lean();
    const ids = matchingUsers.map((u) => u._id.toString());
    filter.userId = ids.length > 0 ? { $in: ids } : "__none__";
  }

  const trades = await BinaryTradeModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const userIds = [...new Set(trades.map((t) => t.userId))];
  const users = await UserModel.find({ _id: { $in: userIds } }).select("email").lean();
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  const shaped = trades.map((t) => ({
    id: t._id.toString(),
    userId: t.userId,
    userEmail: emailByUserId.get(t.userId) ?? "unknown",
    symbol: t.symbol,
    contractStyle: t.contractStyle,
    direction: t.direction,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    stake: t.stake,
    payoutRate: t.payoutRate,
    potentialPayout: t.potentialPayout,
    durationSeconds: t.durationSeconds,
    openedAt: t.openedAt,
    expiresAt: t.expiresAt,
    status: t.status,
    result: t.result,
    profitLoss: t.profitLoss,
    flagged: t.flagged,
    adminNote: t.adminNote,
    cancelReason: t.cancelReason,
    createdAt: t.createdAt,
  }));

  if (format === "csv") {
    const csv = toCsv(shaped);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="binary-trades-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const counts = await BinaryTradeModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const countsByStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return NextResponse.json({
    trades: shaped,
    counts: {
      open: countsByStatus.open ?? 0,
      settled: countsByStatus.settled ?? 0,
      cancelled: countsByStatus.cancelled ?? 0,
    },
  });
}
