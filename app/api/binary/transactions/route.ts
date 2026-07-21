import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { TransactionModel } from "@/models/Transaction";

export async function GET(request: Request) {
  const session = await verifySession();
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

  const transactions = await TransactionModel.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      note: t.note,
      createdAt: t.createdAt,
    })),
  });
}
