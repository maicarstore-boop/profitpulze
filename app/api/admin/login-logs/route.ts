import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { LoginLogModel } from "@/models/LoginLog";

export async function GET(request: Request) {
  await requirePermission("Security");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const filter = email ? { email } : {};

  const [logs, failedCount24h, uniqueIps24h] = await Promise.all([
    LoginLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    LoginLogModel.countDocuments({ status: "failed", createdAt: { $gte: dayAgo } }),
    LoginLogModel.distinct("ip", { createdAt: { $gte: dayAgo } }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l._id.toString(),
      email: l.email,
      ip: l.ip,
      userAgent: l.userAgent,
      status: l.status,
      reason: l.reason,
      provider: l.provider,
      createdAt: l.createdAt,
    })),
    stats: {
      failedCount24h,
      uniqueIps24h: uniqueIps24h.length,
    },
  });
}
