import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { executeSpotOrder, SpotTradeError } from "@/lib/spot-trading";

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`spot-order:${session.userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const { symbol, side, amount } = (body ?? {}) as Record<string, unknown>;

  if (typeof symbol !== "string" || !symbol.trim()) {
    return NextResponse.json({ error: "A trading pair symbol is required." }, { status: 400 });
  }
  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ error: "Invalid order side." }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  try {
    const order = await executeSpotOrder({ userId: session.userId, symbol, side, amount });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof SpotTradeError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("POST /api/trade/orders:", error);
    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}
