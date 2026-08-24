import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getOrCreateBalance } from "@/lib/wallet";

export async function GET() {
  const session = await verifySession();
  const balance = await getOrCreateBalance(session.userId);

  return NextResponse.json({
    available: balance.available,
    locked: balance.locked,
    total: balance.available + balance.locked,
    currency: balance.currency,
  });
}
