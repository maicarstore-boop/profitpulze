import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getDepositById } from "@/lib/payments/deposits";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;

  const deposit = await getDepositById(id, session.userId);
  if (!deposit) {
    return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  }

  return NextResponse.json({
    deposit: {
      id: deposit._id.toString(),
      payCurrency: deposit.payCurrency,
      payAddress: deposit.payAddress,
      payAmount: deposit.payAmount,
      priceAmountUsd: deposit.priceAmountUsd,
      status: deposit.status,
      expiresAt: deposit.expiresAt,
      createdAt: deposit.createdAt,
    },
  });
}
