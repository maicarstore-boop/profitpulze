import "server-only";
import crypto from "node:crypto";
import { paymentsConfig } from "@/lib/payments/config";

export class NowPaymentsError extends Error {}

async function rawFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${paymentsConfig.apiBase}${path}`, {
    ...init,
    headers: {
      "x-api-key": paymentsConfig.apiKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NowPaymentsError(`NOWPayments ${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Retries once on a network-level failure (e.g. Node/undici reusing a keep-alive socket the
 * remote end already closed — surfaces as a bare "fetch failed" TypeError, never a response).
 * Only retries when no response was ever received, so it never double-submits against a request
 * NOWPayments actually processed. HTTP error responses (4xx/5xx) are not retried.
 */
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, init);
  } catch (error) {
    if (error instanceof NowPaymentsError) throw error;
    return rawFetch<T>(path, init);
  }
}

export interface NowPaymentsEstimate {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: number;
}

export async function getEstimatedPrice(amountUsd: number, payCurrency: string): Promise<NowPaymentsEstimate> {
  const params = new URLSearchParams({
    amount: String(amountUsd),
    currency_from: "usd",
    currency_to: payCurrency,
  });
  return apiFetch<NowPaymentsEstimate>(`/estimate?${params.toString()}`);
}

export interface NowPaymentsMinAmount {
  currency_from: string;
  currency_to: string;
  min_amount: number;
  fiat_equivalent?: number;
}

export async function getMinimumPaymentAmount(payCurrency: string): Promise<NowPaymentsMinAmount> {
  const params = new URLSearchParams({
    currency_from: "usd",
    currency_to: payCurrency,
    fiat_equivalent: "usd",
  });
  return apiFetch<NowPaymentsMinAmount>(`/min-amount?${params.toString()}`);
}

export interface CreatePaymentInput {
  priceAmountUsd: number;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
}

export interface NowPaymentsPayment {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  expiration_estimate_date?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<NowPaymentsPayment> {
  return apiFetch<NowPaymentsPayment>("/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: input.priceAmountUsd,
      price_currency: "usd",
      pay_currency: input.payCurrency,
      order_id: input.orderId,
      order_description: input.orderDescription,
      ipn_callback_url: `${paymentsConfig.appBaseUrl}/api/webhooks/nowpayments`,
      // Locks the exchange rate for the payment window so the requested pay_amount doesn't
      // drift with the market. Deliberately NOT using is_fee_paid_by_user: combined with
      // is_fixed_rate (which it requires), it added NOWPayments' fixed-rate volatility margin
      // on top of their fee — ~8% overhead in production, not the ~1% fee alone.
      is_fixed_rate: true,
    }),
  });
}

export async function getPaymentStatus(paymentId: string): Promise<NowPaymentsPayment> {
  return apiFetch<NowPaymentsPayment>(`/payment/${paymentId}`);
}

// Payout (mass withdrawal) endpoints require a separate email/password JWT login on top of
// the API key — cached in-memory with its expiry so we don't re-login on every payout call.
let cachedAuthToken: { token: string; expiresAt: number } | null = null;

async function getPayoutAuthToken(): Promise<string> {
  if (cachedAuthToken && cachedAuthToken.expiresAt > Date.now()) {
    return cachedAuthToken.token;
  }

  const res = await fetch(`${paymentsConfig.apiBase}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: paymentsConfig.payoutEmail, password: paymentsConfig.payoutPassword }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NowPaymentsError(`NOWPayments auth failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { token: string };
  // NOWPayments JWTs are valid ~5 minutes; refresh a little early to be safe.
  cachedAuthToken = { token: data.token, expiresAt: Date.now() + 4 * 60 * 1000 };
  return data.token;
}

export interface CreatePayoutInput {
  address: string;
  currency: string;
  amount: number;
  withdrawalId: string;
}

export interface NowPaymentsPayoutBatch {
  id: string;
  withdrawals: Array<{ id: string; address: string; currency: string; amount: string; status: string }>;
}

export async function createPayout(input: CreatePayoutInput): Promise<NowPaymentsPayoutBatch> {
  const token = await getPayoutAuthToken();
  const res = await fetch(`${paymentsConfig.apiBase}/payout`, {
    method: "POST",
    headers: {
      "x-api-key": paymentsConfig.apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ipn_callback_url: `${paymentsConfig.appBaseUrl}/api/webhooks/nowpayments`,
      withdrawals: [
        {
          address: input.address,
          currency: input.currency,
          amount: input.amount,
          unique_external_id: input.withdrawalId,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NowPaymentsError(`NOWPayments payout failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<NowPaymentsPayoutBatch>;
}

/**
 * Verifies HMAC-SHA512 signature per NOWPayments IPN docs: sort the payload's
 * top-level keys, JSON.stringify the sorted object, HMAC with the IPN secret,
 * compare to the `x-nowpayments-sig` header. Uses a timing-safe comparison so
 * response timing can't leak information about the expected signature.
 */
export function verifyIpnSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const sorted = Object.keys(parsed)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = parsed[key];
      return acc;
    }, {});

  const expected = crypto
    .createHmac("sha512", paymentsConfig.ipnSecret)
    .update(JSON.stringify(sorted))
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
