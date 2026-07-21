import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { createSession } from "@/lib/auth/session";
import { exchangeGoogleCode, verifyGoogleIdToken, isGoogleConfigured } from "@/lib/auth/google";
import { recordLoginAttempt } from "@/lib/login-log";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const loginUrl = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}`, origin));

  if (!isGoogleConfigured()) {
    return loginUrl("google_not_configured");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (oauthError || !code || !state || !expectedState || state !== expectedState) {
    return loginUrl("google_auth_failed");
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const identity = await verifyGoogleIdToken(tokens.id_token);

    if (!identity.emailVerified) {
      await recordLoginAttempt({ email: identity.email, status: "failed", reason: "Google email unverified", provider: "google", request });
      return loginUrl("google_email_unverified");
    }

    await connectToDatabase();

    const email = identity.email.toLowerCase().trim();
    let user = await UserModel.findOne({ googleId: identity.googleId });

    if (!user) {
      user = await UserModel.findOne({ email });
      if (user) {
        user.googleId = identity.googleId;
        await user.save();
      } else {
        user = await UserModel.create({ email, googleId: identity.googleId });
      }
    }

    if (user.status !== "active") {
      await recordLoginAttempt({ email, userId: user._id.toString(), status: "failed", reason: `Account ${user.status}`, provider: "google", request });
      return loginUrl("account_inactive");
    }

    await createSession(user._id.toString(), user.email, user.role);
    await recordLoginAttempt({ email, userId: user._id.toString(), status: "success", provider: "google", request });

    return NextResponse.redirect(new URL("/dashboard", origin));
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return loginUrl("google_auth_failed");
  }
}
