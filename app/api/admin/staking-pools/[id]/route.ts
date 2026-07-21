import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { StakingPoolModel } from "@/models/StakingPool";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Staking");
  await connectToDatabase();

  const { id } = await params;
  const pool = await StakingPoolModel.findById(id);
  if (!pool) {
    return NextResponse.json({ error: "Pool not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const update: Record<string, unknown> = {};
  const previous: Record<string, unknown> = {};

  if (body?.apy !== undefined) {
    const apy = Number(body.apy);
    if (!Number.isFinite(apy) || apy < 0) {
      return NextResponse.json({ error: "Invalid APY." }, { status: 400 });
    }
    previous.apy = pool.apy;
    update.apy = apy;
  }
  if (body?.minStake !== undefined) {
    const minStake = Number(body.minStake);
    if (!Number.isFinite(minStake) || minStake < 0) {
      return NextResponse.json({ error: "Invalid minimum stake." }, { status: 400 });
    }
    previous.minStake = pool.minStake;
    update.minStake = minStake;
  }
  if (typeof body?.active === "boolean") {
    previous.active = pool.active;
    update.active = body.active;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  Object.assign(pool, update);
  await pool.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "staking_pool.update",
    targetType: "StakingPool",
    targetId: id,
    previousValue: previous,
    newValue: update,
    request,
  });

  return NextResponse.json({
    pool: { id: pool._id.toString(), symbol: pool.symbol, type: pool.type, lockDays: pool.lockDays, apy: pool.apy, minStake: pool.minStake, active: pool.active },
  });
}
