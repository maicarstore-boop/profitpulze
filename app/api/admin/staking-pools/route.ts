import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { StakingPoolModel } from "@/models/StakingPool";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  await requirePermission("Staking");
  await connectToDatabase();

  const pools = await StakingPoolModel.find().sort({ type: 1, lockDays: 1 }).lean();

  return NextResponse.json({
    pools: pools.map((p) => ({
      id: p._id.toString(),
      symbol: p.symbol,
      type: p.type,
      lockDays: p.lockDays,
      apy: p.apy,
      minStake: p.minStake,
      active: p.active,
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requirePermission("Staking");
  await connectToDatabase();

  const body = await request.json().catch(() => null);
  const symbol = typeof body?.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  const type = body?.type === "locked" ? "locked" : body?.type === "flexible" ? "flexible" : null;
  const lockDays = Number(body?.lockDays) || 0;
  const apy = Number(body?.apy);
  const minStake = Number(body?.minStake);

  if (!symbol || !type || !Number.isFinite(apy) || apy < 0 || !Number.isFinite(minStake) || minStake < 0) {
    return NextResponse.json({ error: "Invalid pool configuration." }, { status: 400 });
  }
  if (type === "locked" && lockDays <= 0) {
    return NextResponse.json({ error: "Locked pools require a lock period greater than 0 days." }, { status: 400 });
  }

  const pool = await StakingPoolModel.create({
    symbol,
    type,
    lockDays: type === "locked" ? lockDays : 0,
    apy,
    minStake,
    active: true,
  });

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "staking_pool.create",
    targetType: "StakingPool",
    targetId: pool._id.toString(),
    newValue: { symbol, type, lockDays: pool.lockDays, apy, minStake },
    request,
  });

  return NextResponse.json({ pool: { id: pool._id.toString(), symbol, type, lockDays: pool.lockDays, apy, minStake, active: true } }, { status: 201 });
}
