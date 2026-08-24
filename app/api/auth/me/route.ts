import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";

export async function GET() {
  const session = await getOptionalSession();
  if (!session?.userId) {
    return NextResponse.json({ user: null });
  }

  await connectToDatabase();
  const user = await UserModel.findById(session.userId).select("twoFactorEnabled").lean();

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
    },
  });
}
