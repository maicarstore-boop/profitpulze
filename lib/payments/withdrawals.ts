import "server-only";
import { connectToDatabase } from "@/lib/db";
import { WithdrawalModel, type WithdrawalHydrated } from "@/models/Withdrawal";
import { UserModel } from "@/models/User";
import { PlatformSettingsModel, SETTINGS_SINGLETON_KEY } from "@/models/PlatformSettings";
import {
  lockFunds,
  releaseLockedFunds,
  settleLockedFunds,
  recordTransaction,
  getOrCreateBalance,
  InsufficientFundsError,
} from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import { verifyTotpToken } from "@/lib/auth/totp";
import { findSupportedCurrency } from "@/lib/payments/supported-currencies";
import { isValidAddress } from "@/lib/payments/address-validation";
import { getEstimatedPrice, createPayout } from "@/lib/payments/nowpayments-client";
import { recordAuditLog } from "@/lib/audit";

export class WithdrawalError extends Error {}
export { InsufficientFundsError };

export const MIN_WITHDRAWAL_USD = 20;
export const MAX_WITHDRAWAL_USD = 25_000;

async function getAutoApprovalThreshold(): Promise<number> {
  const settings = await PlatformSettingsModel.findOne({ key: SETTINGS_SINGLETON_KEY })
    .select("withdrawalAutoApprovalThresholdUsd")
    .lean();
  return settings?.withdrawalAutoApprovalThresholdUsd ?? 100;
}

export interface RequestWithdrawalInput {
  userId: string;
  currencyTicker: string;
  address: string;
  amountUsd: number;
  totpCode: string;
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

  const user = await UserModel.findById(input.userId).select("+twoFactorSecret").lean();
  if (!user) throw new WithdrawalError("User not found.");
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new WithdrawalError("Enable two-factor authentication before requesting a withdrawal.");
  }
  if (!(await verifyTotpToken(input.totpCode, user.twoFactorSecret))) {
    throw new WithdrawalError("Invalid authentication code.");
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

  const threshold = await getAutoApprovalThreshold();
  const autoApprove = input.amountUsd <= threshold;

  const withdrawal = await WithdrawalModel.create({
    userId: input.userId,
    currency: currency.ticker,
    network: currency.network,
    address: input.address,
    amountUsd: input.amountUsd,
    estimatedCryptoAmount,
    status: autoApprove ? "approved" : "pending",
    autoApproved: autoApprove,
  });

  await createNotification({
    userId: input.userId,
    type: "withdrawal_submitted",
    title: "Withdrawal requested",
    message: autoApprove
      ? `Your withdrawal of $${input.amountUsd.toFixed(2)} was auto-approved and is being processed.`
      : `Your withdrawal of $${input.amountUsd.toFixed(2)} is pending manual review.`,
    relatedType: "Withdrawal",
    relatedId: withdrawal._id.toString(),
  });

  if (autoApprove) {
    await triggerPayout(withdrawal._id.toString());
  }

  return withdrawal;
}

/** Calls out to NOWPayments to actually send funds. Only valid for withdrawals already in "approved" status. */
export async function triggerPayout(withdrawalId: string) {
  await connectToDatabase();
  const withdrawal = await WithdrawalModel.findById(withdrawalId);
  if (!withdrawal || withdrawal.status !== "approved") return;

  try {
    const estimate = await getEstimatedPrice(withdrawal.amountUsd, withdrawal.currency);
    const batch = await createPayout({
      address: withdrawal.address,
      currency: withdrawal.currency,
      amount: estimate.estimated_amount,
      withdrawalId: withdrawal._id.toString(),
    });
    withdrawal.estimatedCryptoAmount = estimate.estimated_amount;
    withdrawal.nowPaymentsPayoutId = batch.id;
    withdrawal.status = "processing";
    await withdrawal.save();
  } catch (error) {
    await failWithdrawal(withdrawal, error instanceof Error ? error.message : "Payout provider error.");
  }
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

  await triggerPayout(withdrawalId);
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

export interface NowPaymentsPayoutIpnPayload {
  id?: string | number;
  batch_withdrawal_id?: string | number;
  status: string;
  [key: string]: unknown;
}

/** Idempotent: only mutates balance/status on a genuine transition into a terminal state. */
export async function handlePayoutIpn(payload: NowPaymentsPayoutIpnPayload) {
  await connectToDatabase();

  const batchId = payload.batch_withdrawal_id ?? payload.id;
  const withdrawal = await WithdrawalModel.findOne({ nowPaymentsPayoutId: String(batchId) });
  if (!withdrawal) {
    return { handled: false as const, reason: "unknown_withdrawal" };
  }

  if (withdrawal.status === "completed" || withdrawal.status === "failed") {
    return { handled: true as const, withdrawal }; // already terminal — no-op
  }

  const status = payload.status;
  if (status === "finished") {
    await settleLockedFunds(withdrawal.userId, withdrawal.amountUsd);
    const balance = await getOrCreateBalance(withdrawal.userId);
    await recordTransaction({
      userId: withdrawal.userId,
      type: "withdrawal",
      amount: -withdrawal.amountUsd,
      balanceAfter: balance.available,
      referenceType: "Withdrawal",
      referenceId: withdrawal._id.toString(),
      note: `Withdrawal of ${withdrawal.currency.toUpperCase()} completed via NOWPayments`,
    });
    withdrawal.status = "completed";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await createNotification({
      userId: withdrawal.userId,
      type: "withdrawal_completed",
      title: "Withdrawal completed",
      message: `Your withdrawal of $${withdrawal.amountUsd.toFixed(2)} has been sent.`,
      relatedType: "Withdrawal",
      relatedId: withdrawal._id.toString(),
    });
  } else if (status === "failed" || status === "rejected") {
    await failWithdrawal(withdrawal, `Payment provider reported status: ${status}`);
  } else {
    withdrawal.status = "processing";
    await withdrawal.save();
  }

  return { handled: true as const, withdrawal };
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
