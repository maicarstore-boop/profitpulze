import "server-only";
import { connectToDatabase } from "@/lib/db";
import { WithdrawalModel, type WithdrawalHydrated } from "@/models/Withdrawal";
import { UserModel } from "@/models/User";
import {
  lockFunds,
  releaseLockedFunds,
  settleLockedFunds,
  recordTransaction,
  getOrCreateBalance,
  InsufficientFundsError,
} from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import { verifyPassword } from "@/lib/auth/password";
import { findSupportedCurrency } from "@/lib/payments/supported-currencies";
import { isValidAddress } from "@/lib/payments/address-validation";
import { getEstimatedPrice } from "@/lib/payments/nowpayments-client";
import { recordAuditLog } from "@/lib/audit";

export class WithdrawalError extends Error {}
export { InsufficientFundsError };

export const MIN_WITHDRAWAL_USD = 20;
export const MAX_WITHDRAWAL_USD = 25_000;

export interface RequestWithdrawalInput {
  userId: string;
  currencyTicker: string;
  address: string;
  amountUsd: number;
  transactionPassword: string;
}

export async function requestWithdrawal(input: RequestWithdrawalInput) {
  await connectToDatabase();

  const currency = findSupportedCurrency(input.currencyTicker);
  if (!currency) throw new WithdrawalError("Unsupported currency/network.");

  if (input.amountUsd < MIN_WITHDRAWAL_USD || input.amountUsd > MAX_WITHDRAWAL_USD) {
    throw new WithdrawalError(`Withdrawal amount must be between $${MIN_WITHDRAWAL_USD} and $${MAX_WITHDRAWAL_USD}.`);
  }

  if (!isValidAddress(input.address, currency.addressFamily)) {
    throw new WithdrawalError(`That doesn't look like a valid ${currency.symbol} (${currency.network}) address.`);
  }

  const user = await UserModel.findById(input.userId).select("+transactionPasswordHash").lean();
  if (!user) throw new WithdrawalError("User not found.");
  if (!user.transactionPasswordHash) {
    throw new WithdrawalError("Set up a transaction password before requesting a withdrawal.");
  }
  if (!(await verifyPassword(user.transactionPasswordHash, input.transactionPassword))) {
    throw new WithdrawalError("Invalid transaction password.");
  }

  let estimatedCryptoAmount: number | null = null;
  try {
    const estimate = await getEstimatedPrice(input.amountUsd, currency.ticker);
    estimatedCryptoAmount = estimate.estimated_amount;
  } catch {
    estimatedCryptoAmount = null; // shown as "calculating..." in the UI; not fatal to the request
  }

  try {
    await lockFunds(input.userId, input.amountUsd);
  } catch (error) {
    if (error instanceof InsufficientFundsError) throw new WithdrawalError("Insufficient balance.");
    throw error;
  }

  const withdrawal = await WithdrawalModel.create({
    userId: input.userId,
    currency: currency.ticker,
    network: currency.network,
    address: input.address,
    amountUsd: input.amountUsd,
    estimatedCryptoAmount,
    status: "pending",
  });

  await createNotification({
    userId: input.userId,
    type: "withdrawal_submitted",
    title: "Withdrawal requested",
    message: `Your withdrawal of $${input.amountUsd.toFixed(2)} is pending review. You'll be notified once it's approved and sent.`,
    relatedType: "Withdrawal",
    relatedId: withdrawal._id.toString(),
  });

  return withdrawal;
}

async function failWithdrawal(withdrawal: WithdrawalHydrated, reason: string) {
  await releaseLockedFunds(withdrawal.userId, withdrawal.amountUsd);
  withdrawal.status = "failed";
  withdrawal.failureReason = reason;
  await withdrawal.save();
  await createNotification({
    userId: withdrawal.userId,
    type: "withdrawal_failed",
    title: "Withdrawal failed",
    message: `Your withdrawal of $${withdrawal.amountUsd.toFixed(2)} could not be completed and has been returned to your available balance.`,
    relatedType: "Withdrawal",
    relatedId: withdrawal._id.toString(),
  });
}

export async function approveWithdrawal(withdrawalId: string, admin: { userId: string; email: string }, request: Request) {
  await connectToDatabase();
  const withdrawal = await WithdrawalModel.findById(withdrawalId);
  if (!withdrawal || withdrawal.status !== "pending") {
    throw new WithdrawalError("Only pending withdrawals can be approved.");
  }

  withdrawal.status = "approved";
  withdrawal.approvedBy = admin.userId;
  await withdrawal.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "withdrawal.approve",
    targetType: "Withdrawal",
    targetId: withdrawalId,
    previousValue: { status: "pending" },
    newValue: { status: "approved" },
    request,
  });

  await createNotification({
    userId: withdrawal.userId,
    type: "withdrawal_approved",
    title: "Withdrawal approved",
    message: `Your withdrawal of $${withdrawal.amountUsd.toFixed(2)} was approved and will be sent shortly.`,
    relatedType: "Withdrawal",
    relatedId: withdrawal._id.toString(),
  });

  return withdrawal;
}

export async function rejectWithdrawal(
  withdrawalId: string,
  admin: { userId: string; email: string },
  reason: string,
  request: Request
) {
  await connectToDatabase();
  const withdrawal = await WithdrawalModel.findById(withdrawalId);
  if (!withdrawal || withdrawal.status !== "pending") {
    throw new WithdrawalError("Only pending withdrawals can be rejected.");
  }

  await releaseLockedFunds(withdrawal.userId, withdrawal.amountUsd);
  withdrawal.status = "rejected";
  withdrawal.rejectedReason = reason;
  await withdrawal.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "withdrawal.reject",
    targetType: "Withdrawal",
    targetId: withdrawalId,
    previousValue: { status: "pending" },
    newValue: { status: "rejected" },
    reason,
    request,
  });

  await createNotification({
    userId: withdrawal.userId,
    type: "withdrawal_failed",
    title: "Withdrawal rejected",
    message: `Your withdrawal of $${withdrawal.amountUsd.toFixed(2)} was rejected${reason ? `: ${reason}` : "."} Funds have been returned to your available balance.`,
    relatedType: "Withdrawal",
    relatedId: withdrawal._id.toString(),
  });

  return withdrawal;
}

/**
 * Admin confirms they've personally sent the crypto payment from their own wallet.
 * Only valid for "approved" withdrawals — permanently settles the locked funds
 * (they've genuinely left the platform) and finalizes the record.
 */
export async function completeWithdrawal(
  withdrawalId: string,
  admin: { userId: string; email: string },
  request: Request
) {
  await connectToDatabase();
  const withdrawal = await WithdrawalModel.findById(withdrawalId);
  if (!withdrawal || withdrawal.status !== "approved") {
    throw new WithdrawalError("Only approved withdrawals can be marked as completed.");
  }

  await settleLockedFunds(withdrawal.userId, withdrawal.amountUsd);
  const balance = await getOrCreateBalance(withdrawal.userId);
  await recordTransaction({
    userId: withdrawal.userId,
    type: "withdrawal",
    amount: -withdrawal.amountUsd,
    balanceAfter: balance.available,
    referenceType: "Withdrawal",
    referenceId: withdrawal._id.toString(),
    note: `Withdrawal of ${withdrawal.currency.toUpperCase()} sent manually by admin (${admin.email})`,
  });

  withdrawal.status = "completed";
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "withdrawal.complete",
    targetType: "Withdrawal",
    targetId: withdrawalId,
    previousValue: { status: "approved" },
    newValue: { status: "completed" },
    request,
  });

  await createNotification({
    userId: withdrawal.userId,
    type: "withdrawal_completed",
    title: "Withdrawal completed",
    message: `Your withdrawal of $${withdrawal.amountUsd.toFixed(2)} has been sent.`,
    relatedType: "Withdrawal",
    relatedId: withdrawal._id.toString(),
  });

  return withdrawal;
}

/**
 * Admin marks an already-approved withdrawal as failed — e.g. the manual send couldn't
 * go through — releasing the locked funds back to the user's available balance instead
 * of leaving them stuck in limbo.
 */
export async function failApprovedWithdrawal(
  withdrawalId: string,
  admin: { userId: string; email: string },
  reason: string,
  request: Request
) {
  await connectToDatabase();
  const withdrawal = await WithdrawalModel.findById(withdrawalId);
  if (!withdrawal || withdrawal.status !== "approved") {
    throw new WithdrawalError("Only approved withdrawals can be marked as failed.");
  }

  await failWithdrawal(withdrawal, reason || "Marked as failed by admin.");

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "withdrawal.fail",
    targetType: "Withdrawal",
    targetId: withdrawalId,
    previousValue: { status: "approved" },
    newValue: { status: "failed" },
    reason,
    request,
  });

  return withdrawal;
}

export async function getUserWithdrawals(userId: string, opts: { status?: string; limit?: number } = {}) {
  await connectToDatabase();
  const filter: Record<string, unknown> = { userId };
  if (opts.status) filter.status = opts.status;
  return WithdrawalModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(opts.limit ?? 50, 200))
    .lean();
}

export async function getWithdrawalById(id: string, userId: string) {
  await connectToDatabase();
  return WithdrawalModel.findOne({ _id: id, userId }).lean();
}
