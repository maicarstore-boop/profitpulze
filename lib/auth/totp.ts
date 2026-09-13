import "server-only";
import { generateSecret, generateURI, verify } from "otplib";
import { generateQrDataUrl } from "@/lib/qr";

const ISSUER = "ProfitPulze";

export { generateQrDataUrl };

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export async function verifyTotpToken(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token });
    return result.valid;
  } catch {
    return false;
  }
}
