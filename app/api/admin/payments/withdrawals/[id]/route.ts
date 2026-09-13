import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import {
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  failApprovedWithdrawal,
  WithdrawalError,
} from "@/lib/payments/withdrawals";

const schema = z.object({
  action: z.enum(["approve", "reject", "complete", "fail"]),
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Payments");
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const adminIdentity = { userId: admin.userId, email: admin.email };

  try {
    let withdrawal;
    switch (parsed.data.action) {
      case "approve":
        withdrawal = await approveWithdrawal(id, adminIdentity, request);
        break;
      case "reject":
        withdrawal = await rejectWithdrawal(id, adminIdentity, parsed.data.reason ?? "", request);
        break;
      case "complete":
        withdrawal = await completeWithdrawal(id, adminIdentity, request);
        break;
      case "fail":
        withdrawal = await failApprovedWithdrawal(id, adminIdentity, parsed.data.reason ?? "", request);
        break;
    }

    return NextResponse.json({ withdrawal: { id: withdrawal._id.toString(), status: withdrawal.status } });
  } catch (error) {
    if (error instanceof WithdrawalError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/admin/payments/withdrawals/${id}:`, error);
    return NextResponse.json({ error: "Failed to process withdrawal action." }, { status: 500 });
  }
}
