import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserNotifications } from "@/lib/notifications";

export async function GET() {
  const session = await verifySession();
  const notifications = await getUserNotifications(session.userId);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    })),
  });
}
