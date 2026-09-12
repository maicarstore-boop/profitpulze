import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";

const schema = z.object({
  password: z.string().min(1),
  transactionPassword: z.string().min(6).max(64),
});

/** Sets (or changes) the withdrawal transaction password. Requires the account login password to confirm identity. */
export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`transaction-password-set:${session.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Your account password and a transaction password (min 6 characters) are required." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(session.userId).select("+passwordHash");
  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    return NextResponse.json({ error: "Incorrect account password." }, { status: 400 });
  }

  const wasSet = Boolean(user.transactionPasswordHash);
  user.transactionPasswordHash = await hashPassword(parsed.data.transactionPassword);
  await user.save();

  await recordAuditLog({
    adminId: session.userId,
    adminEmail: session.email,
    action: wasSet ? "user.transaction_password_changed" : "user.transaction_password_set",
    targetType: "User",
    targetId: session.userId,
    newValue: { transactionPasswordSet: true },
    request,
  });

  return NextResponse.json({ transactionPasswordSet: true });
}
