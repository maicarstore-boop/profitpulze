import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { AuditLogModel } from "@/models/AuditLog";
import { TransactionModel } from "@/models/Transaction";
import { getOrCreateBalance } from "@/lib/wallet";
import { getUserHoldings } from "@/lib/holdings";
import { recordAuditLog } from "@/lib/audit";

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

const editSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  reason: z.string().optional(),
});

/**
 * Editing account identity (email) is more sensitive than the status/KYC
 * toggles in [id]/actions, so — like role assignment in [id]/role — it's
 * restricted to Super Admin even though other roles may have "Users".
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Users");
  if (admin.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admins can edit users." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { email, reason } = parsed.data;
  if (email !== user.email) {
    const existing = await UserModel.findOne({ email, _id: { $ne: id } }).lean();
    if (existing) {
      return NextResponse.json({ error: "Another user already uses that email." }, { status: 409 });
    }
  }

  const previousValue = { email: user.email };
  user.email = email;
  await user.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "user.edit",
    targetType: "User",
    targetId: id,
    previousValue,
    newValue: { email: user.email },
    reason,
    request,
  });

  return NextResponse.json({ user: { id: user._id.toString(), email: user.email } });
}

/**
 * Deleting an account is irreversible, so — like role assignment and edits —
 * it's restricted to Super Admin even though other roles may have "Users".
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Users");
  if (admin.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admins can delete users." }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.userId) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const previousValue = { email: user.email, role: user.role, status: user.status };
  await UserModel.deleteOne({ _id: id });

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "user.delete",
    targetType: "User",
    targetId: id,
    previousValue,
    newValue: null,
    request,
  });

  return NextResponse.json({ success: true });
}
