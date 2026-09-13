import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { recordAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";

const schema = z
  .object({
    password: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional(),
    reason: z.string().optional(),
  })
  .refine((data) => Boolean(data.password || data.newPassword), {
    message: "A password is required.",
    path: ["password"],
  });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Users");
  const { id } = await params;

  if (id === admin.userId) {
    return NextResponse.json({ error: "You cannot reset your own password from the admin console." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }

  const nextPassword = parsed.data.newPassword ?? parsed.data.password;
  if (!nextPassword) {
    return NextResponse.json({ error: "A password is required." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const previousValue = { passwordHash: user.passwordHash ? "[redacted]" : null };
  user.passwordHash = await hashPassword(nextPassword);
  await user.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "user.password.reset",
    targetType: "User",
    targetId: id,
    previousValue,
    newValue: { passwordHash: "[redacted]" },
    reason: parsed.data.reason,
    request,
  });

  return NextResponse.json({ success: true, user: { id: user._id.toString() } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return POST(request, { params });
}
