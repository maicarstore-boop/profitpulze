import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export async function GET(request: Request) {
  await requirePermission("Users");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const adminOnly = searchParams.get("adminOnly") === "true";
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

  const filter: Record<string, unknown> = q ? { email: { $regex: q, $options: "i" } } : {};
  if (adminOnly) filter.role = { $in: ADMIN_ROLES };

  const users = await UserModel.find(filter)
    .select("email role status kycStatus twoFactorEnabled googleId createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      role: u.role,
      status: u.status,
      kycStatus: u.kycStatus,
      twoFactorEnabled: u.twoFactorEnabled,
      authProvider: u.googleId ? "google" : "credentials",
      createdAt: u.createdAt,
    })),
  });
}
