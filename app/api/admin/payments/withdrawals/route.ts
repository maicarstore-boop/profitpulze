import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { WithdrawalModel, WITHDRAWAL_STATUSES } from "@/models/Withdrawal";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  await requirePermission("Payments");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userQuery = searchParams.get("user")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const filter: Record<string, unknown> = {};
  if (status && (WITHDRAWAL_STATUSES as readonly string[]).includes(status)) {
    filter.status = status;
  }
  if (userQuery) {
    const matchingUsers = await UserModel.find({ email: { $regex: userQuery, $options: "i" } })
      .select("_id")
      .lean();
    const ids = matchingUsers.map((u) => u._id.toString());
    filter.userId = ids.length > 0 ? { $in: ids } : "__none__";
  }

  const withdrawals = await WithdrawalModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const userIds = [...new Set(withdrawals.map((w) => w.userId))];
  const users = await UserModel.find({ _id: { $in: userIds } }).select("email").lean();
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  const totalsByStatus = await WithdrawalModel.aggregate([
    { $group: { _id: "$status", total: { $sum: "$amountUsd" }, count: { $sum: 1 } } },
  ]);
  const totals = Object.fromEntries(totalsByStatus.map((t) => [t._id, { total: t.total, count: t.count }]));

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w._id.toString(),
      userId: w.userId,
      userEmail: emailByUserId.get(w.userId) ?? "unknown",
      currency: w.currency,
      network: w.network,
      address: w.address,
      amountUsd: w.amountUsd,
      status: w.status,
      autoApproved: w.autoApproved,
      failureReason: w.failureReason,
      createdAt: w.createdAt,
    })),
    totals,
  });
}
