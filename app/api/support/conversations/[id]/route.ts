import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserConversation, postUserMessage, serializeConversation, SupportError } from "@/lib/support";

const messageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;

  const conversation = await getUserConversation(session.userId, id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ conversation: serializeConversation(conversation) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;

  if (!checkRateLimit(`support-message:${session.userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const conversation = await postUserMessage({ userId: session.userId, email: session.email }, id, parsed.data.body);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    return NextResponse.json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    if (error instanceof SupportError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/support/conversations/${id}:`, error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
