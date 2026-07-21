import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserBalanceModel } from "@/models/UserBalance";
import { UserModel } from "@/models/User";

export async function GET(request: Request) {
  await requirePermission("Wallets");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const userQuery = searchParams.get("user")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

  const filter: Record<string, unknown> = {};
  if (userQuery) {
    const matchingUsers = await UserModel.find({ email: { $regex: userQuery, $options: "i" } })
      .select("_id")
      .lean();
    const ids = matchingUsers.map((u) => u._id.toString());
    filter.userId = ids.length > 0 ? { $in: ids } : "__none__";
  }

  const balances = await UserBalanceModel.find(filter).sort({ available: -1 }).limit(limit).lean();

  const userIds = balances.map((b) => b.userId);
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("email status tradingSuspended")
    .lean();
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  const [summary] = await UserBalanceModel.aggregate([
    { $group: { _id: null, totalBalance: { $sum: "$available" }, walletCount: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    balances: balances.map((b) => ({
      userId: b.userId,
      userEmail: userById.get(b.userId)?.email ?? "unknown",
      userStatus: userById.get(b.userId)?.status ?? "unknown",
      tradingSuspended: userById.get(b.userId)?.tradingSuspended ?? false,
      available: b.available,
      currency: b.currency,
      updatedAt: b.updatedAt,
    })),
    summary: {
      totalBalance: summary?.totalBalance ?? 0,
      walletCount: summary?.walletCount ?? 0,
    },
  });
}
