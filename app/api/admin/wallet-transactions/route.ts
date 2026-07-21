import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { TransactionModel, type TransactionType } from "@/models/Transaction";
import { UserModel } from "@/models/User";

const TRANSACTION_TYPES: TransactionType[] = ["deposit", "withdrawal", "trade_stake", "trade_payout", "trade_refund"];

export async function GET(request: Request) {
  await requirePermission("Wallets");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const userQuery = searchParams.get("user")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const filter: Record<string, unknown> = {};
  if (type && (TRANSACTION_TYPES as string[]).includes(type)) {
    filter.type = type;
  }

  if (userQuery) {
    const matchingUsers = await UserModel.find({ email: { $regex: userQuery, $options: "i" } })
      .select("_id")
      .lean();
    const ids = matchingUsers.map((u) => u._id.toString());
    filter.userId = ids.length > 0 ? { $in: ids } : "__none__";
  }

  const transactions = await TransactionModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const userIds = [...new Set(transactions.map((t) => t.userId))];
  const users = await UserModel.find({ _id: { $in: userIds } }).select("email").lean();
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  const totalsByType = await TransactionModel.aggregate([
    { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const totals = Object.fromEntries(totalsByType.map((t) => [t._id, { total: t.total, count: t.count }]));

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      userId: t.userId,
      userEmail: emailByUserId.get(t.userId) ?? "unknown",
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      note: t.note,
      createdAt: t.createdAt,
    })),
    totals,
  });
}
