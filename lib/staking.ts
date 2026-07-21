import "server-only";
import { connectToDatabase } from "@/lib/db";
import { StakingPoolModel } from "@/models/StakingPool";
import { StakingPositionModel } from "@/models/StakingPosition";
import { adjustBalance, debitBalance, recordTransaction, InsufficientFundsError } from "@/lib/binary-trading";
import { isMaintenanceMode } from "@/lib/platform-settings";

export const MIN_POOL_STAKE_FLOOR = 1;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365 * MS_PER_DAY;

export class StakingError extends Error {}

export async function getActivePools() {
  await connectToDatabase();
  return StakingPoolModel.find({ active: true }).sort({ type: 1, lockDays: 1 }).lean();
}

/** Simple (non-compounding) interest, matching the public reward calculator's math. */
export function computeAccruedRewards(principal: number, apy: number, startedAt: Date, asOf: Date): number {
  const elapsedMs = Math.max(0, asOf.getTime() - startedAt.getTime());
  return Number((principal * (apy / 100) * (elapsedMs / MS_PER_YEAR)).toFixed(6));
}

export interface OpenPositionInput {
  userId: string;
  poolId: string;
  amount: number;
}

export async function openPosition({ userId, poolId, amount }: OpenPositionInput) {
  await connectToDatabase();

  if (await isMaintenanceMode()) {
    throw new StakingError("Staking is temporarily disabled for maintenance. Please try again shortly.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new StakingError("Enter a valid stake amount.");
  }

  const pool = await StakingPoolModel.findById(poolId).lean();
  if (!pool || !pool.active) {
    throw new StakingError("This staking pool is not available.");
  }
  if (amount < pool.minStake) {
    throw new StakingError(`Minimum stake for this pool is ${pool.minStake} ${pool.symbol}.`);
  }

  const now = new Date();
  const unlocksAt = pool.type === "locked" ? new Date(now.getTime() + pool.lockDays * MS_PER_DAY) : null;

  let balance;
  try {
    balance = await debitBalance(userId, amount);
  } catch (error) {
    if (error instanceof InsufficientFundsError) throw new StakingError("Insufficient balance.");
    throw error;
  }

  const position = await StakingPositionModel.create({
    userId,
    poolId,
    symbol: pool.symbol,
    type: pool.type,
    lockDays: pool.lockDays,
    apy: pool.apy,
    principal: amount,
    startedAt: now,
    unlocksAt,
    status: "active",
  });

  await recordTransaction({
    userId,
    type: "stake_lock",
    amount: -amount,
    balanceAfter: balance.available,
    referenceType: "StakingPosition",
    referenceId: position._id.toString(),
    note: `Staked into ${pool.symbol} ${pool.type === "locked" ? `${pool.lockDays}d locked` : "flexible"} pool`,
  });

  return position;
}

export async function unstakePosition(positionId: string, userId: string) {
  await connectToDatabase();

  const position = await StakingPositionModel.findOne({ _id: positionId, userId });
  if (!position || position.status !== "active") {
    throw new StakingError("This position is not active.");
  }
  if (position.type === "locked" && position.unlocksAt && position.unlocksAt > new Date()) {
    throw new StakingError(`This position is locked until ${position.unlocksAt.toLocaleDateString()}.`);
  }

  const now = new Date();
  const rewards = computeAccruedRewards(position.principal, position.apy, position.startedAt, now);

  const updated = await StakingPositionModel.findOneAndUpdate(
    { _id: positionId, status: "active" },
    { $set: { status: "unstaked", unstakedAt: now, rewardsPaid: rewards } },
    { new: true }
  );
  if (!updated) throw new StakingError("This position was already unstaked.");

  const balance = await adjustBalance(userId, position.principal);

  await recordTransaction({
    userId,
    type: "stake_unlock",
    amount: position.principal,
    balanceAfter: balance.available,
    referenceType: "StakingPosition",
    referenceId: positionId,
    note: `Unstaked principal from ${position.symbol} pool`,
  });

  if (rewards > 0) {
    const balanceAfterRewards = await adjustBalance(userId, rewards);

    await recordTransaction({
      userId,
      type: "stake_reward",
      amount: rewards,
      balanceAfter: balanceAfterRewards.available,
      referenceType: "StakingPosition",
      referenceId: positionId,
      note: `Staking rewards from ${position.symbol} pool (${position.apy}% APY)`,
    });
  }

  return { position: updated, rewards };
}

export async function getUserPositions(userId: string) {
  await connectToDatabase();
  const positions = await StakingPositionModel.find({ userId }).sort({ createdAt: -1 }).lean();
  const now = new Date();

  return positions.map((p) => ({
    ...p,
    accruedRewards:
      p.status === "active" ? computeAccruedRewards(p.principal, p.apy, p.startedAt, now) : p.rewardsPaid,
  }));
}
