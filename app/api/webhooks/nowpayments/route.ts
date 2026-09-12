import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { WebhookEventModel } from "@/models/WebhookEvent";
import { verifyIpnSignature } from "@/lib/payments/nowpayments-client";
import { handleDepositIpn, type NowPaymentsIpnPayload } from "@/lib/payments/deposits";

/**
 * IPN endpoint for NOWPayments deposit (payment) callbacks. Withdrawals are sent
 * manually by an admin and confirmed in the admin panel, not via NOWPayments payouts,
 * so there's no payout-IPN branch here.
 * Never trusts the payload without a verified signature, and never trusts a client-side
 * confirmation for anything — this is the only place wallet balances move for real funds.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-nowpayments-sig");
  const signatureValid = verifyIpnSignature(rawBody, signature);

  if (!signatureValid) {
    console.warn("Rejected NOWPayments webhook with invalid signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const isPaymentEvent = typeof payload.payment_id !== "undefined" && typeof payload.payment_status === "string";

  const dedupeKey = isPaymentEvent
    ? `payment:${payload.payment_id}:${payload.payment_status}`
    : `unknown:${Date.now()}:${Math.random()}`;

  await connectToDatabase();

  // Idempotency: an identical (id, status) IPN retried by NOWPayments is a guaranteed no-op —
  // we only ever process a given status transition once.
  const existing = await WebhookEventModel.findOne({ dedupeKey }).lean();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const event = await WebhookEventModel.create({
    provider: "nowpayments",
    dedupeKey,
    signatureValid: true,
    rawPayload: payload,
    processed: false,
  });

  try {
    if (isPaymentEvent) {
      await handleDepositIpn(payload as unknown as NowPaymentsIpnPayload);
    } else {
      throw new Error("Unrecognized NOWPayments webhook payload shape.");
    }
    event.processed = true;
    await event.save();
  } catch (error) {
    event.error = error instanceof Error ? error.message : "Unknown error";
    await event.save();
    console.error("Error processing NOWPayments webhook:", error);
    // Still 200 — the signature was valid and the event is durably logged for investigation/replay;
    // returning non-200 would just cause NOWPayments to retry the exact same payload indefinitely.
  }

  return NextResponse.json({ received: true });
}
