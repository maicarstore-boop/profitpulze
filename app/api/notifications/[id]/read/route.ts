import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/notifications";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;

  await markNotificationRead(session.userId, id);
  return NextResponse.json({ success: true });
}
