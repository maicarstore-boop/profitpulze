import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import {
  getStaffConversation,
  postStaffMessage,
  serializeConversation,
  updateConversationMeta,
  SupportError,
} from "@/lib/support";
import { SUPPORT_PRIORITIES, SUPPORT_STATUSES } from "@/models/SupportConversation";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), body: z.string().trim().min(1, "Message cannot be empty").max(5000) }),
  z.object({
    action: z.literal("update"),
    status: z.enum(SUPPORT_STATUSES).optional(),
    priority: z.enum(SUPPORT_PRIORITIES).optional(),
    assignToMe: z.boolean().optional(),
    unassign: z.boolean().optional(),
  }),
]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("Support");
  const { id } = await params;

  const conversation = await getStaffConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ conversation: serializeConversation(conversation) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Support");
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid action." }, { status: 400 });
  }

  const staff = { userId: admin.userId, email: admin.email };

  try {
    if (parsed.data.action === "reply") {
      const conversation = await postStaffMessage(staff, id, parsed.data.body);
      return NextResponse.json({ conversation: serializeConversation(conversation) });
    }

    const { status, priority, assignToMe, unassign } = parsed.data;
    const { updated, previous } = await updateConversationMeta(staff, id, { status, priority, assignToMe, unassign });
    await recordAuditLog({
      adminId: admin.userId,
      adminEmail: admin.email,
      action: "support.conversation.update",
      targetType: "SupportConversation",
      targetId: id,
      previousValue: previous,
      newValue: { status: updated.status, priority: updated.priority, assignedToEmail: updated.assignedToEmail },
      request,
    });
    return NextResponse.json({ conversation: serializeConversation(updated) });
  } catch (error) {
    if (error instanceof SupportError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/admin/support/conversations/${id}:`, error);
    return NextResponse.json({ error: "Failed to process support action." }, { status: 500 });
  }
}
