import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createConversation,
  getUserUnreadCount,
  listUserConversations,
  serializeConversation,
  serializeConversationSummary,
} from "@/lib/support";
import { SUPPORT_CATEGORIES } from "@/models/SupportConversation";

const createSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200),
  category: z.enum(SUPPORT_CATEGORIES),
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

export async function GET() {
  const session = await verifySession();
  const [conversations, unread] = await Promise.all([
    listUserConversations(session.userId),
    getUserUnreadCount(session.userId),
  ]);

  return NextResponse.json({ conversations: conversations.map(serializeConversationSummary), unread });
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`support-create:${session.userId}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const conversation = await createConversation({ userId: session.userId, email: session.email }, parsed.data);
    return NextResponse.json({ conversation: serializeConversation(conversation) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/support/conversations:", error);
    return NextResponse.json({ error: "Failed to start conversation." }, { status: 500 });
  }
}
