import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { AuditLogModel } from "@/models/AuditLog";
import { TransactionModel } from "@/models/Transaction";
import { getOrCreateBalance } from "@/lib/wallet";
import { getUserHoldings } from "@/lib/holdings";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("Users");
  await connectToDatabase();

  const { id } = await params;
  const user = await UserModel.findById(id)
    .select("email role status kycStatus twoFactorEnabled googleId createdAt updatedAt")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const [auditEntries, balance, holdings, transactions] = await Promise.all([
    AuditLogModel.find({ targetType: "User", targetId: id }).sort({ createdAt: -1 }).limit(50).lean(),
    getOrCreateBalance(id),
    getUserHoldings(id),
    TransactionModel.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
      twoFactorEnabled: user.twoFactorEnabled,
      authProvider: user.googleId ? "google" : "credentials",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    wallet: { available: balance.available, locked: balance.locked, currency: balance.currency },
    holdings,
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      note: t.note,
      createdAt: t.createdAt,
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
