import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { confirmDepositManually, DepositError } from "@/lib/payments/deposits";

const schema = z.object({
  action: z.enum(["confirm"]),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("Payments");
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const deposit = await confirmDepositManually(id);
    return NextResponse.json({
      deposit: {
        id: deposit._id.toString(),
        status: deposit.status,
        creditedAt: deposit.creditedAt,
      },
    });
  } catch (error) {
    if (error instanceof DepositError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/admin/payments/deposits/${id}:`, error);
    return NextResponse.json({ error: "Failed to confirm deposit." }, { status: 500 });
  }
}
