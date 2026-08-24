import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { WebhookEventModel } from "@/models/WebhookEvent";

export async function GET(request: Request) {
  await requirePermission("Payments");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const events = await WebhookEventModel.find({}).sort({ createdAt: -1 }).limit(limit).lean();

  return NextResponse.json({
    events: events.map((e) => ({
      id: e._id.toString(),
      provider: e.provider,
      dedupeKey: e.dedupeKey,
      signatureValid: e.signatureValid,
      processed: e.processed,
      error: e.error,
      rawPayload: e.rawPayload,
      createdAt: e.createdAt,
    })),
  });
}
