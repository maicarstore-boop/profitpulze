import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { isAdminRole, hasPermission, type UserRole, type PermissionGroup } from "@/lib/auth/roles";

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const secretKey = process.env.SESSION_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  [key: string]: unknown;
}

async function encrypt(payload: SessionPayload) {
  if (!encodedKey) throw new Error("SESSION_SECRET is not set. Add it to your .env file.");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

async function decrypt(session: string | undefined) {
  if (!session || !encodedKey) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, email: string, role: UserRole = "user") {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ userId, email, role });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Optimistic, non-redirecting session read — safe to call anywhere (layouts, Navbar). */
export const getOptionalSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return decrypt(token);
});

/** Redirects to /login if there is no valid session. Use in protected pages/route handlers. */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getOptionalSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

/**
 * Redirects to /login if unauthenticated, or /dashboard if authenticated but not an
 * admin. Re-checks role and account status against the database rather than trusting
 * the JWT claim alone, since a role/status change should take effect immediately —
 * not just after the next login. Use in every admin page/route handler.
 */
export const requireAdmin = cache(async () => {
  const session = await verifySession();

  const { connectToDatabase } = await import("@/lib/db");
  const { UserModel } = await import("@/models/User");

  await connectToDatabase();
  const user = await UserModel.findById(session.userId).lean();

  if (!user || !isAdminRole(user.role) || user.status !== "active") {
    redirect("/dashboard");
  }

  return { ...session, role: user.role, userDoc: user };
});

/**
 * Gates a specific admin module (e.g. "Trading", "Wallets") rather than just
 * "is any admin". Super Admin always passes. Every other admin role is
 * restricted to DEFAULT_ROLE_PERMISSIONS for that role — a support_agent
 * hitting a Wallets-only route/page is redirected to the Overview page,
 * which every admin role can always see.
 */
export async function requirePermission(group: PermissionGroup) {
  const admin = await requireAdmin();

  if (!hasPermission(admin.role, group)) {
    redirect("/admin");
  }

  return admin;
}
