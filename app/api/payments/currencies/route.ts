import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { SUPPORTED_CURRENCIES } from "@/lib/payments/supported-currencies";

export async function GET() {
  await verifySession();
  return NextResponse.json({ currencies: SUPPORTED_CURRENCIES });
}
