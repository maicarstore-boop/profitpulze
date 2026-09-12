import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { requestWithdrawal, getUserWithdrawals, WithdrawalError, InsufficientFundsError } from "@/lib/payments/withdrawals";

const createSchema = z.object({
  currency: z.string().min(1),
  address: z.string().min(1),
  amountUsd: z.number().positive(),
  transactionPassword: z.string().min(6).max(64),
});

export async function GET(request: NextRequest) {
  const session = await verifySession();
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit")) || undefined;

  const withdrawals = await getUserWithdrawals(session.userId, { status, limit });
  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w._id.toString(),
      currency: w.currency,
      network: w.network,
      address: w.address,
      amountUsd: w.amountUsd,
      estimatedCryptoAmount: w.estimatedCryptoAmount,
      status: w.status,
      autoApproved: w.autoApproved,
      createdAt: w.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`withdrawal:${session.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A currency, address, amount, and transaction password are required." }, { status: 400 });
  }

  try {
    const withdrawal = await requestWithdrawal({
      userId: session.userId,
      currencyTicker: parsed.data.currency,
      address: parsed.data.address,
      amountUsd: parsed.data.amountUsd,
      transactionPassword: parsed.data.transactionPassword,
    });
    return NextResponse.json(
      {
        withdrawal: {
          id: withdrawal._id.toString(),
          currency: withdrawal.currency,
          network: withdrawal.network,
          address: withdrawal.address,
          amountUsd: withdrawal.amountUsd,
          status: withdrawal.status,
          autoApproved: withdrawal.autoApproved,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof WithdrawalError || error instanceof InsufficientFundsError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("POST /api/withdrawals:", error);
    return NextResponse.json({ error: "Failed to submit withdrawal request." }, { status: 500 });
  }
}
