import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;

  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/forgot-password");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isOperatorRoute = nextUrl.pathname.startsWith("/operator");
  const isChangePassword = nextUrl.pathname === "/change-password";
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isApiHealth = nextUrl.pathname.startsWith("/api/health");

  if (isApiAuth || isApiHealth) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isAdmin = token?.role === "ADMIN";
  const isOperator = token?.role === "OPERATOR";
  const mustChangePassword = token?.mustChangePassword as boolean | undefined;

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", nextUrl));
    return NextResponse.redirect(new URL("/operator", nextUrl));
  }

  if (isLoggedIn && mustChangePassword && !isChangePassword && !isAuthRoute) {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/operator", nextUrl));
  }

  if (isOperatorRoute && !isOperator && !isAdmin) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
