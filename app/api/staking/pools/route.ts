import { NextResponse } from "next/server";
import { getActivePools } from "@/lib/staking";

export async function GET() {
  const pools = await getActivePools();
  return NextResponse.json({
    pools: pools.map((p) => ({
      id: p._id.toString(),
      symbol: p.symbol,
      type: p.type,
      lockDays: p.lockDays,
      apy: p.apy,
      minStake: p.minStake,
    })),
  });
}
