import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { DepositModel, DEPOSIT_STATUSES } from "@/models/Deposit";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  await requirePermission("Payments");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userQuery = searchParams.get("user")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const filter: Record<string, unknown> = {};
  if (status && (DEPOSIT_STATUSES as readonly string[]).includes(status)) {
    filter.status = status;
  }
  if (userQuery) {
    const matchingUsers = await UserModel.find({ email: { $regex: userQuery, $options: "i" } })
      .select("_id")
      .lean();
    const ids = matchingUsers.map((u) => u._id.toString());
    filter.userId = ids.length > 0 ? { $in: ids } : "__none__";
  }

  const deposits = await DepositModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  const userIds = [...new Set(deposits.map((d) => d.userId))];
  const users = await UserModel.find({ _id: { $in: userIds } }).select("email").lean();
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  const totalsByStatus = await DepositModel.aggregate([
    { $group: { _id: "$status", total: { $sum: "$priceAmountUsd" }, count: { $sum: 1 } } },
  ]);
  const totals = Object.fromEntries(totalsByStatus.map((t) => [t._id, { total: t.total, count: t.count }]));

  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      userEmail: emailByUserId.get(d.userId) ?? "unknown",
      paymentId: d.paymentId,
      payCurrency: d.payCurrency,
      payAmount: d.payAmount,
      priceAmountUsd: d.priceAmountUsd,
      status: d.status,
      creditedAt: d.creditedAt,
      createdAt: d.createdAt,
    })),
    totals,
  });
}
