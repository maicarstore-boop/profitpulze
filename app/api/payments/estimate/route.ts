import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { findSupportedCurrency } from "@/lib/payments/supported-currencies";
import { getEstimatedPrice, NowPaymentsError } from "@/lib/payments/nowpayments-client";

export async function GET(request: NextRequest) {
  await verifySession();

  const amount = Number(request.nextUrl.searchParams.get("amount"));
  const currencyTicker = request.nextUrl.searchParams.get("currency") ?? "";
  const currency = findSupportedCurrency(currencyTicker);

  if (!currency || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "A valid amount and currency are required." }, { status: 400 });
  }

  try {
    const estimate = await getEstimatedPrice(amount, currency.ticker);
    return NextResponse.json({ estimatedAmount: estimate.estimated_amount, currency: currency.ticker });
  } catch (error) {
    if (error instanceof NowPaymentsError) {
      return NextResponse.json({ error: "Could not fetch a price estimate right now." }, { status: 502 });
    }
    throw error;
  }
}
