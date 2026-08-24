import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserHoldings } from "@/lib/holdings";

export async function GET() {
  const session = await verifySession();
  const holdings = await getUserHoldings(session.userId);
  return NextResponse.json({ holdings });
}
