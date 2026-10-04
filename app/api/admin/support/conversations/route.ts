import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { getStaffConversationCounts, listStaffConversations, serializeConversationSummary } from "@/lib/support";
import { SUPPORT_STATUSES, type SupportStatus } from "@/models/SupportConversation";

export async function GET(request: Request) {
  const admin = await requirePermission("Support");

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const user = searchParams.get("user")?.trim() || undefined;
  const mine = searchParams.get("mine") === "1" ? admin.userId : undefined;

  const [conversations, counts] = await Promise.all([
    listStaffConversations({
      status: status && (SUPPORT_STATUSES as readonly string[]).includes(status) ? (status as SupportStatus) : undefined,
      user,
      mine,
    }),
    getStaffConversationCounts(),
  ]);

  return NextResponse.json({ conversations: conversations.map(serializeConversationSummary), counts });
}
