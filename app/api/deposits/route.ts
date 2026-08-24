import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { createDeposit, getUserDeposits, DepositError } from "@/lib/payments/deposits";
import { generateQrDataUrl } from "@/lib/qr";

const createSchema = z.object({
  currency: z.string().min(1),
  amountUsd: z.number().positive(),
});

export async function GET(request: NextRequest) {
  const session = await verifySession();
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const limit = Number(request.nextUrl.searchParams.get("limit")) || undefined;

  const deposits = await getUserDeposits(session.userId, { status, limit });
  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d._id.toString(),
      payCurrency: d.payCurrency,
      payAddress: d.payAddress,
      payAmount: d.payAmount,
      priceAmountUsd: d.priceAmountUsd,
      status: d.status,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`deposit:${session.userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A currency and amount are required." }, { status: 400 });
  }

  try {
    const deposit = await createDeposit(session.userId, parsed.data.currency, parsed.data.amountUsd);
    const qrCode = await generateQrDataUrl(deposit.payAddress);
    return NextResponse.json(
      {
        deposit: {
          id: deposit._id.toString(),
          payCurrency: deposit.payCurrency,
          payAddress: deposit.payAddress,
          payAmount: deposit.payAmount,
          priceAmountUsd: deposit.priceAmountUsd,
          status: deposit.status,
          expiresAt: deposit.expiresAt,
          qrCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DepositError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("POST /api/deposits:", error);
    return NextResponse.json({ error: "Failed to create deposit." }, { status: 500 });
  }
}
