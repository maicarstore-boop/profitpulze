import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { executeConvert, ConvertError } from "@/lib/convert";

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`convert:${session.userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const { from, to, amount } = (body ?? {}) as Record<string, unknown>;

  if (typeof from !== "string" || !from.trim() || typeof to !== "string" || !to.trim()) {
    return NextResponse.json({ error: "From and to assets are required." }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  try {
    const result = await executeConvert(session.userId, from, to, amount);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof ConvertError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("POST /api/convert:", error);
    return NextResponse.json({ error: "Failed to convert." }, { status: 500 });
  }
}
