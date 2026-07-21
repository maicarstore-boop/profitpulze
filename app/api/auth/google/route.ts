import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, isGoogleConfigured } from "@/lib/auth/google";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", origin));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const redirectUri = `${origin}/api/auth/google/callback`;
  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
