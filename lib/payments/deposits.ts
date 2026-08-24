import "server-only";
import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { DepositModel, type DepositStatus } from "@/models/Deposit";
import { adjustBalance, recordTransaction } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import { findSupportedCurrency } from "@/lib/payments/supported-currencies";
import { createPayment, type NowPaymentsPayment } from "@/lib/payments/nowpayments-client";

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

  const previousStatus = deposit.status;
  deposit.status = payload.payment_status as typeof deposit.status;
  deposit.actuallyPaid = payload.actually_paid ?? deposit.actuallyPaid;
  deposit.rawIpnPayload = payload;

  if (previousStatus === "waiting" && payload.payment_status !== "waiting") {
    await createNotification({
      userId: deposit.userId,
      type: "deposit_detected",
      title: "Deposit detected",
      message: `We've detected your ${deposit.payCurrency.toUpperCase()} deposit and are waiting for network confirmations.`,
      relatedType: "Deposit",
      relatedId: deposit._id.toString(),
    });
  }

  if (payload.payment_status === "finished" && !deposit.creditedAt) {
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
    deposit.creditedAt = new Date();

    await createNotification({
      userId: deposit.userId,
      type: "deposit_confirmed",
      title: "Deposit confirmed",
      message: `$${deposit.priceAmountUsd.toFixed(2)} has been credited to your wallet.`,
      relatedType: "Deposit",
      relatedId: deposit._id.toString(),
    });
  }

  await deposit.save();
  return { handled: true as const, deposit };
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
