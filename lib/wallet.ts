import "server-only";
import { connectToDatabase } from "@/lib/db";
import { UserBalanceModel, DEMO_STARTING_BALANCE } from "@/models/UserBalance";
import { TransactionModel, type TransactionType } from "@/models/Transaction";

export class InsufficientFundsError extends Error {}

export async function getOrCreateBalance(userId: string) {
  await connectToDatabase();
  let balance = await UserBalanceModel.findOne({ userId });
  if (!balance) {
    balance = await UserBalanceModel.create({ userId, available: DEMO_STARTING_BALANCE });
  }
  return balance;
}

/**
 * Atomically credits/debits a user's balance via $inc rather than a
 * read-modify-write (`balance.available = x; await balance.save()`), which
 * has a lost-update race under concurrent calls: two operations that both
 * read the same starting value will silently clobber one another, with the
 * second save() winning and the first credit/debit vanishing even though
 * both wrote a Transaction ledger entry claiming it happened. $inc lets
 * MongoDB serialize the increment itself, so concurrent calls always sum
 * correctly regardless of ordering.
 */
export async function adjustBalance(userId: string, delta: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId); // ensures the doc exists (seeded with the demo starting balance) before the $inc below
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId },
    { $inc: { available: Number(delta.toFixed(2)) } },
    { new: true }
  );
  if (!updated) throw new Error(`Failed to adjust balance for user ${userId}`);
  return updated;
}

/**
 * Debits a positive amount atomically, guarded by `available: {$gte: amount}`
 * in the same query as the decrement — so the sufficiency check and the
 * debit are one indivisible operation. Checking balance.available first and
 * debiting after (two separate steps) would let two concurrent debits both
 * pass the check against a stale read and jointly overdraw the account.
 */
export async function debitBalance(userId: string, amount: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId);
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId, available: { $gte: amount } },
    { $inc: { available: -Number(amount.toFixed(2)) } },
    { new: true }
  );
  if (!updated) throw new InsufficientFundsError("Insufficient balance.");
  return updated;
}

/**
 * Moves `amount` from available to locked, atomically and guarded by
 * available >= amount — same indivisible check-and-mutate shape as
 * debitBalance, so concurrent withdrawal requests can't jointly overdraw.
 */
export async function lockFunds(userId: string, amount: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId);
  const rounded = Number(amount.toFixed(2));
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId, available: { $gte: rounded } },
    { $inc: { available: -rounded, locked: rounded } },
    { new: true }
  );
  if (!updated) throw new InsufficientFundsError("Insufficient balance.");
  return updated;
}

/** Releases previously-locked funds back to available (withdrawal rejected/failed). */
export async function releaseLockedFunds(userId: string, amount: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId);
  const rounded = Number(amount.toFixed(2));
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId, locked: { $gte: rounded } },
    { $inc: { locked: -rounded, available: rounded } },
    { new: true }
  );
  if (!updated) throw new Error(`Failed to release locked funds for user ${userId}`);
  return updated;
}

/** Permanently removes previously-locked funds (withdrawal completed — funds already left the platform). */
export async function settleLockedFunds(userId: string, amount: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId);
  const rounded = Number(amount.toFixed(2));
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId, locked: { $gte: rounded } },
    { $inc: { locked: -rounded } },
    { new: true }
  );
  if (!updated) throw new Error(`Failed to settle locked funds for user ${userId}`);
  return updated;
}

export async function recordTransaction(input: {
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
}) {
  await TransactionModel.create(input);
}
