import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getWithdrawalById } from "@/lib/payments/withdrawals";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;

  const withdrawal = await getWithdrawalById(id, session.userId);
  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
  }

  return NextResponse.json({
    withdrawal: {
      id: withdrawal._id.toString(),
      currency: withdrawal.currency,
      network: withdrawal.network,
      address: withdrawal.address,
      amountUsd: withdrawal.amountUsd,
      estimatedCryptoAmount: withdrawal.estimatedCryptoAmount,
      status: withdrawal.status,
      autoApproved: withdrawal.autoApproved,
      failureReason: withdrawal.failureReason,
      createdAt: withdrawal.createdAt,
    },
  });
}
