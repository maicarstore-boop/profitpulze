import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { recordAuditLog } from "@/lib/audit";
import { ALL_ROLES } from "@/lib/auth/roles";

const schema = z.object({
  role: z.enum(ALL_ROLES as [string, ...string[]]),
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Users");

  // Role assignment is more sensitive than general user management, so it's
  // restricted to Super Admin even though other roles may have "Users".
  if (admin.role !== "super_admin") {
    return NextResponse.json({ error: "Only Super Admins can assign roles." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (id === admin.userId) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const previousValue = { role: user.role };
  user.role = parsed.data.role as typeof user.role;
  await user.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "user.role.assign",
    targetType: "User",
    targetId: id,
    previousValue,
    newValue: { role: user.role },
    reason: parsed.data.reason,
    request,
  });

  return NextResponse.json({ user: { id: user._id.toString(), role: user.role } });
}
