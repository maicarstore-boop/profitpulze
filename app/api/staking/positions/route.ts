import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { getUserPositions, openPosition, StakingError } from "@/lib/staking";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await verifySession();
  const positions = await getUserPositions(session.userId);

  return NextResponse.json({
    positions: positions.map((p) => ({
      id: p._id.toString(),
      symbol: p.symbol,
      type: p.type,
      lockDays: p.lockDays,
      apy: p.apy,
      principal: p.principal,
      startedAt: p.startedAt,
      unlocksAt: p.unlocksAt,
      status: p.status,
      unstakedAt: p.unstakedAt,
      accruedRewards: p.accruedRewards,
    })),
  });
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!checkRateLimit(`stake:${session.userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const poolId = body?.poolId;
  const amount = Number(body?.amount);

  if (typeof poolId !== "string" || !poolId) {
    return NextResponse.json({ error: "A staking pool is required." }, { status: 400 });
  }

  try {
    const position = await openPosition({ userId: session.userId, poolId, amount });
    return NextResponse.json(
      {
        position: {
          id: position._id.toString(),
          symbol: position.symbol,
          type: position.type,
          lockDays: position.lockDays,
          apy: position.apy,
          principal: position.principal,
          startedAt: position.startedAt,
          unlocksAt: position.unlocksAt,
          status: position.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof StakingError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("POST /api/staking/positions:", error);
    return NextResponse.json({ error: "Failed to open staking position." }, { status: 500 });
  }
}
