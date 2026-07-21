import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";

export async function GET(request: Request) {
  await requirePermission("Security");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);

  const entries = await AuditLogModel.find().sort({ createdAt: -1 }).limit(limit).lean();

  return NextResponse.json({
    entries: entries.map((entry) => ({
      id: entry._id.toString(),
      adminEmail: entry.adminEmail,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      reason: entry.reason,
      ip: entry.ip,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt,
    })),
  });
}
