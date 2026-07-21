import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  await connectToDatabase();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await UserModel.create({ email, passwordHash });

  await createSession(user._id.toString(), user.email, user.role);

  return NextResponse.json({ user: { id: user._id.toString(), email: user.email, role: user.role } }, { status: 201 });
}
