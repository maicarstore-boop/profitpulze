import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getOptionalSession();
  if (!session?.userId) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: { id: session.userId, email: session.email, role: session.role } });
}
