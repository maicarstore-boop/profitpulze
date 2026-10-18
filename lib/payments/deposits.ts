import "server-only";
import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { DepositModel, type DepositStatus } from "@/models/Deposit";
import { adjustBalance, recordTransaction } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import { findSupportedCurrency } from "@/lib/payments/supported-currencies";
import { createPayment, getPaymentStatus, type NowPaymentsPayment } from "@/lib/payments/nowpayments-client";

export class DepositError extends Error {}

export const MIN_DEPOSIT_USD = 20;
export const MAX_DEPOSIT_USD = 50_000;

export async function createDeposit(userId: string, payCurrencyTicker: string, priceAmountUsd: number) {
  await connectToDatabase();

  const currency = findSupportedCurrency(payCurrencyTicker);
  if (!currency) {
    throw new DepositError("Unsupported currency/network.");
  }
  if (priceAmountUsd < MIN_DEPOSIT_USD || priceAmountUsd > MAX_DEPOSIT_USD) {
    throw new DepositError(`Deposit amount must be between $${MIN_DEPOSIT_USD} and $${MAX_DEPOSIT_USD}.`);
  }

  const orderId = `dep_${crypto.randomUUID()}`;

  let payment: NowPaymentsPayment;
  try {
    payment = await createPayment({
      priceAmountUsd,
      payCurrency: currency.ticker,
      orderId,
      orderDescription: `ProfitPulze wallet deposit — ${currency.symbol} (${currency.network})`,
    });
  } catch (error) {
    throw new DepositError(error instanceof Error ? error.message : "Failed to create deposit with payment provider.");
  }

  const deposit = await DepositModel.create({
    userId,
    paymentId: payment.payment_id,
    orderId,
    payCurrency: currency.ticker,
    payAddress: payment.pay_address,
    payAmount: payment.pay_amount,
    priceAmountUsd,
    status: (payment.payment_status || "waiting") as DepositStatus,
    expiresAt: payment.expiration_estimate_date ? new Date(payment.expiration_estimate_date) : null,
  });

  return deposit;
}

export interface NowPaymentsIpnPayload {
  payment_id: string | number;
  payment_status: string;
  actually_paid?: number;
  [key: string]: unknown;
}

type DepositDocument = InstanceType<typeof DepositModel>;

const TERMINAL_DEPOSIT_STATUSES = new Set<string>(["finished", "failed", "refunded", "expired"]);

/**
 * Atomically marks a deposit as credited. Returns false if it was already credited, so the
 * wallet is credited at most once even when the IPN, the status sync and an admin manual
 * confirmation race each other.
 */
async function claimDepositCredit(depositId: string) {
  const claimed = await DepositModel.findOneAndUpdate(
    { _id: depositId, creditedAt: null },
    { $set: { creditedAt: new Date() } },
    { new: true }
  );
  return claimed?.creditedAt ?? null;
}

/**
 * Applies a NOWPayments payment status (from a verified IPN or a server-side status lookup)
 * to a deposit, crediting the wallet once the payment is "finished".
 */
async function applyDepositStatus(deposit: DepositDocument, status: string, actuallyPaid?: number) {
  const previousStatus = deposit.status;
  deposit.status = status as typeof deposit.status;
  deposit.actuallyPaid = actuallyPaid ?? deposit.actuallyPaid;

  if (previousStatus === "waiting" && status !== "waiting") {
    await createNotification({
      userId: deposit.userId,
      type: "deposit_detected",
      title: "Deposit detected",
      message: `We've detected your ${deposit.payCurrency.toUpperCase()} deposit and are waiting for network confirmations.`,
      relatedType: "Deposit",
      relatedId: deposit._id.toString(),
    });
  }

  if (status === "finished" && !deposit.creditedAt) {
    const creditedAt = await claimDepositCredit(deposit._id.toString());
    if (creditedAt) {
      deposit.creditedAt = creditedAt;
      const balance = await adjustBalance(deposit.userId, deposit.priceAmountUsd);
      await recordTransaction({
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.priceAmountUsd,
        balanceAfter: balance.available,
        referenceType: "Deposit",
        referenceId: deposit._id.toString(),
        note: `Deposit of ${deposit.payCurrency.toUpperCase()} credited via NOWPayments`,
      });

      await createNotification({
        userId: deposit.userId,
        type: "deposit_confirmed",
        title: "Deposit confirmed",
        message: `$${deposit.priceAmountUsd.toFixed(2)} has been credited to your wallet.`,
        relatedType: "Deposit",
        relatedId: deposit._id.toString(),
      });
    }
  }

  await deposit.save();
}

/**
 * Applies a NOWPayments payment IPN. Idempotent via `creditedAt`: a deposit's balance is
 * credited at most once, no matter how many times the "finished" status IPN is retried or
 * redelivered by NOWPayments.
 */
export async function handleDepositIpn(payload: NowPaymentsIpnPayload) {
  await connectToDatabase();

  const deposit = await DepositModel.findOne({ paymentId: String(payload.payment_id) });
  if (!deposit) {
    return { handled: false as const, reason: "unknown_deposit" };
  }

  deposit.rawIpnPayload = payload;
  await applyDepositStatus(deposit, payload.payment_status, payload.actually_paid);
  return { handled: true as const, deposit };
}

/**
 * Fallback for when the IPN never arrives (e.g. APP_BASE_URL not publicly reachable): asks
 * NOWPayments directly for the payment's status and applies it. The status comes from an
 * authenticated server-to-server call, never from the client, so it's as trustworthy as a
 * signed IPN.
 */
export async function syncDepositStatus(depositId: string, userId: string) {
  await connectToDatabase();

  const deposit = await DepositModel.findOne({ _id: depositId, userId });
  if (!deposit) return null;
  if (TERMINAL_DEPOSIT_STATUSES.has(deposit.status) && (deposit.status !== "finished" || deposit.creditedAt)) {
    return deposit;
  }

  try {
    const payment = await getPaymentStatus(deposit.paymentId);
    if (payment.payment_status && payment.payment_status !== deposit.status) {
      const actuallyPaid = (payment as NowPaymentsPayment & { actually_paid?: number }).actually_paid;
      await applyDepositStatus(deposit, payment.payment_status, actuallyPaid);
    }
  } catch (error) {
    // Fall back to whatever we have stored; the IPN or the next poll can still update it.
    console.error("Failed to sync deposit status from NOWPayments:", error);
  }

  return deposit;
}

export async function confirmDepositManually(depositId: string) {
  await connectToDatabase();

  const deposit = await DepositModel.findById(depositId);
  if (!deposit) {
    throw new DepositError("Deposit not found.");
  }
  if (deposit.creditedAt || deposit.status === "finished") {
    return deposit;
  }
  const creditedAt = await claimDepositCredit(deposit._id.toString());
  if (!creditedAt) {
    return (await DepositModel.findById(depositId)) ?? deposit;
  }

  const balance = await adjustBalance(deposit.userId, deposit.priceAmountUsd);
  await recordTransaction({
    userId: deposit.userId,
    type: "deposit",
    amount: deposit.priceAmountUsd,
    balanceAfter: balance.available,
    referenceType: "Deposit",
    referenceId: deposit._id.toString(),
    note: "Deposit manually confirmed by admin",
  });

  deposit.status = "finished";
  deposit.creditedAt = creditedAt;
  await deposit.save();

  await createNotification({
    userId: deposit.userId,
    type: "deposit_confirmed",
    title: "Deposit confirmed",
    message: `An administrator manually confirmed your $${deposit.priceAmountUsd.toFixed(2)} deposit.`,
    relatedType: "Deposit",
    relatedId: deposit._id.toString(),
  });

  return deposit;
}

export async function getUserDeposits(userId: string, opts: { status?: string; limit?: number } = {}) {
  await connectToDatabase();
  const filter: Record<string, unknown> = { userId };
  if (opts.status) filter.status = opts.status;
  return DepositModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(opts.limit ?? 50, 200))
    .lean();
}

export async function getDepositById(id: string, userId: string) {
  await connectToDatabase();
  return DepositModel.findOne({ _id: id, userId }).lean();
}
