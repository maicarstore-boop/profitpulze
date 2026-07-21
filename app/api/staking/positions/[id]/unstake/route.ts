import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { unstakePosition, StakingError } from "@/lib/staking";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;

  try {
    const { position, rewards } = await unstakePosition(id, session.userId);
    return NextResponse.json({
      position: { id: position._id.toString(), status: position.status, rewardsPaid: position.rewardsPaid },
      rewards,
    });
  } catch (error) {
    if (error instanceof StakingError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error(`POST /api/staking/positions/${id}/unstake:`, error);
    return NextResponse.json({ error: "Failed to unstake." }, { status: 500 });
  }
}
