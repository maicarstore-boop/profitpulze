import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { verifyTotpToken } from "@/lib/auth/totp";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";

const schema = z.object({ code: z.string().min(6).max(6) });

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`2fa-disable:${session.userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A 6-digit code is required." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(session.userId).select("+twoFactorSecret");
  const validCode = user?.twoFactorSecret ? await verifyTotpToken(parsed.data.code, user.twoFactorSecret) : false;
  if (!user?.twoFactorEnabled || !validCode) {
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  await user.save();

  await recordAuditLog({
    adminId: session.userId,
    adminEmail: session.email,
    action: "user.2fa_disabled",
    targetType: "User",
    targetId: session.userId,
    newValue: { twoFactorEnabled: false },
    request,
  });

  return NextResponse.json({ twoFactorEnabled: false });
}
