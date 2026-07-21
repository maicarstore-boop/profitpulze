import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordLoginAttempt } from "@/lib/login-log";

const schema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

const INVALID_CREDENTIALS = { error: "Invalid email or password." } as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  await connectToDatabase();

  const user = await UserModel.findOne({ email });
  if (!user || !user.passwordHash) {
    await recordLoginAttempt({ email, status: "failed", reason: "No account with this email", request });
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    await recordLoginAttempt({ email, userId: user._id.toString(), status: "failed", reason: "Incorrect password", request });
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  if (user.status !== "active") {
    await recordLoginAttempt({ email, userId: user._id.toString(), status: "failed", reason: `Account ${user.status}`, request });
    return NextResponse.json(
      { error: `This account is ${user.status}. Contact support for assistance.` },
      { status: 403 }
    );
  }

  await createSession(user._id.toString(), user.email, user.role);
  await recordLoginAttempt({ email, userId: user._id.toString(), status: "success", request });

  return NextResponse.json({ user: { id: user._id.toString(), email: user.email, role: user.role } });
}
