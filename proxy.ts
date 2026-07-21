import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";

const PROTECTED_ROUTES = ["/dashboard", "/wallet"];
const AUTH_ROUTES = ["/login", "/register"];
const ADMIN_ROUTES = ["/admin"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAuthRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const session = await getOptionalSession();

  if ((isProtected || isAdminRoute) && !session?.userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optimistic check only (trusts the JWT claim) — the admin layout re-verifies
  // role and account status against the database on every request.
  if (isAdminRoute && !isAdminRole(session?.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/wallet/:path*", "/login", "/register", "/admin/:path*"],
};
