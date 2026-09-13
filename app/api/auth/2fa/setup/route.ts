import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { generateTotpSecret, buildOtpAuthUrl, generateQrDataUrl } from "@/lib/auth/totp";
import { checkRateLimit } from "@/lib/rate-limit";

/** Generates a new pending secret (not yet enabled — POST /api/auth/2fa/verify confirms it). */
export async function POST() {
  const session = await verifySession();

  if (!checkRateLimit(`2fa-setup:${session.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  await connectToDatabase();
  const secret = generateTotpSecret();
  await UserModel.updateOne({ _id: session.userId }, { $set: { twoFactorSecret: secret, twoFactorEnabled: false } });

  const otpAuthUrl = buildOtpAuthUrl(session.email, secret);
  const qrCode = await generateQrDataUrl(otpAuthUrl);

  return NextResponse.json({ secret, qrCode });
}
